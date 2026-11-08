import { byZone, formation, type Options, type Phase, type Placed } from './formations.js';
import {
	ROTATIONS,
	ZONES,
	rolesOf,
	zoneOf,
	type Point,
	type RoleId,
	type RotationNo,
	type Zone
} from './model.js';
import { overlapFaults } from './overlap.js';

export type SpotQuestion = {
	kind: 'spot';
	o: Options;
	phase: Phase;
	role: RoleId;
	/** Everyone, including the reader's player at the right answer. */
	placed: Placed[];
	choices: Point[];
	answer: number;
};

export type LegalQuestion = {
	kind: 'legal';
	o: Options;
	placed: Placed[];
	legal: boolean;
};

export type ZoneQuestion = {
	kind: 'zone';
	o: Options;
	role: RoleId;
	answer: Zone;
};

export type Question = SpotQuestion | LegalQuestion | ZoneQuestion;

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const shuffle = <T>(items: T[]): T[] => items.sort(() => Math.random() - 0.5);
const far = (a: Point, b: Point, d: number) => Math.hypot(a.x - b.x, a.y - b.y) >= d;

/** What a question tests, so a missed one can come back: its kind, rotation and moment. */
export type Topic = { kind: Question['kind']; rotation: RotationNo; phase?: Phase };

export const topicKey = (t: Topic) => [t.kind, t.rotation, t.phase].filter(Boolean).join(':');

export function topicOf(q: Question): Topic {
	return { kind: q.kind, rotation: q.o.rotation, phase: q.kind === 'spot' ? q.phase : undefined };
}

function parseTopic(key: string): Topic {
	const [kind, rotation, phase] = key.split(':');
	return {
		kind: kind as Topic['kind'],
		rotation: Number(rotation) as RotationNo,
		phase: phase as Phase | undefined
	};
}

/**
 * Picks a topic to revisit, or none. `misses` counts recent misses per topic key; the more a
 * reader has missed, the more often a missed topic comes back, up to every other question.
 */
export function revisit(misses: Record<string, number>): Topic | undefined {
	const entries = Object.entries(misses).filter(([, n]) => n > 0);
	const total = entries.reduce((sum, [, n]) => sum + n, 0);
	if (!total || Math.random() >= Math.min(0.5, total * 0.15)) return undefined;
	let r = Math.random() * total;
	for (const [key, n] of entries) {
		r -= n;
		if (r < 0) return parseTopic(key);
	}
	return undefined;
}

/** The miss counts after an answer: a miss adds one (up to three), a right answer takes one off. */
export function recordAnswer(
	misses: Record<string, number>,
	topic: Topic,
	right: boolean
): Record<string, number> {
	const key = topicKey(topic);
	const n = Math.max(0, Math.min(3, (misses[key] ?? 0) + (right ? -1 : 1)));
	const out = { ...misses };
	if (n) out[key] = n;
	else delete out[key];
	return out;
}

/**
 * A random question. `role` fixes whose position it asks about; without one, any player in the
 * system. The system and team settings come from `base`. `focus` asks again about a topic the
 * reader missed.
 */
export function makeQuestion(base: Options, role?: RoleId, focus?: Topic): Question {
	const rotation = focus?.rotation ?? pick(ROTATIONS);
	// The libero has no rotational zone of their own, so they get no zone questions.
	const kind =
		focus && !(focus.kind === 'zone' && role === 'L')
			? focus.kind
			: pick(
					role === 'L'
						? (['spot', 'spot', 'legal'] as const)
						: (['spot', 'spot', 'spot', 'legal', 'zone'] as const)
				);
	const who = role ?? pick(rolesOf(base.system, base.libero));

	if (kind === 'zone') {
		const o = { ...base, rotation };
		// Picked at random, the libero is swapped for a player who has a zone.
		const asked = who === 'L' ? 'OH1' : who;
		return { kind, o, role: asked, answer: zoneOf(o.system, rotation, asked, o.order)! };
	}

	if (kind === 'legal') {
		const o = { ...base, rotation, serving: false };
		const placed = formation(o, 'receive');
		if (Math.random() < 0.4) return { kind, o, placed, legal: true };
		const positions = byZone(placed);
		for (let tries = 0; tries < 20; tries++) {
			const [a, b] = shuffle([...ZONES]);
			const swapped = { ...positions, [a]: positions[b], [b]: positions[a] };
			if (overlapFaults(swapped).length > 0) {
				return {
					kind,
					o,
					legal: false,
					placed: placed.map((p) => ({ ...p, ...swapped[p.zone] }))
				};
			}
		}
		return { kind, o, placed, legal: true };
	}

	const phase = focus?.phase ?? pick<Phase>(['receive', 'receive', 'base', 'defense', 'attack']);
	const o: Options = {
		...base,
		rotation,
		serving: phase !== 'receive' && (phase !== 'attack' || Math.random() < 0.5),
		attackFrom: pick(['outside', 'middle', 'opposite'] as const)
	};
	const placed = formation(o, phase);
	const you = placed.find((p) => p.role === who);
	if (!you) return makeQuestion(base, role);

	// Wrong answers: where the same player stands in other rotations and moments, the mix-ups a
	// player actually makes. Kept apart from each other and from teammates so each is a clear spot.
	const pool: Point[] = shuffle(
		ROTATIONS.flatMap((r) =>
			(['receive', 'base', 'defense', 'attack'] as Phase[]).flatMap((ph) =>
				formation({ ...o, rotation: r as RotationNo }, ph).filter((p) => p.role === who)
			)
		)
	).map(({ x, y }) => ({ x, y }));
	const teammates = placed.filter((p) => p !== you);
	const choices: Point[] = [{ x: you.x, y: you.y }];
	for (const p of pool) {
		if (choices.length === 4) break;
		if (choices.every((c) => far(c, p, 1.6)) && teammates.every((t) => far(t, p, 1.1)))
			choices.push(p);
	}
	// When the player's other spots are all crowded, pad with open floor.
	for (let tries = 0; choices.length < 4 && tries < 200; tries++) {
		const p = { x: 0.8 + Math.random() * 7.4, y: 0.8 + Math.random() * 7.6 };
		if (choices.every((c) => far(c, p, 1.6)) && teammates.every((t) => far(t, p, 1.1)))
			choices.push(p);
	}
	shuffle(choices);
	const answer = choices.findIndex((c) => c.x === you.x && c.y === you.y);
	return { kind: 'spot', o, phase, role: who, placed, choices, answer };
}
