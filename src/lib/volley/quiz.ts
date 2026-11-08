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

/**
 * A random question. `role` fixes whose position it asks about; without one, any player in the
 * system. The system and team settings come from `base`.
 */
export function makeQuestion(base: Options, role?: RoleId): Question {
	const rotation = pick(ROTATIONS);
	const kind = pick(['spot', 'spot', 'spot', 'legal', 'zone'] as const);
	const who = role ?? pick(rolesOf(base.system, base.libero));

	if (kind === 'zone') {
		const o = { ...base, rotation };
		const answer = zoneOf(o.system, rotation, who === 'L' ? 'OH1' : who);
		// The libero has no zone of their own, so ask about a regular player instead.
		return { kind, o, role: who === 'L' ? 'OH1' : who, answer: answer! };
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

	const phase = pick<Phase>(['receive', 'receive', 'base', 'defense', 'attack']);
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
