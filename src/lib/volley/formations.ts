import {
	isFront,
	lineupOnCourt,
	ROLE_KIND,
	setterOf,
	SYSTEM,
	ZONE_CENTRE,
	ZONES,
	type OnCourt,
	type Point,
	type ReceiveFormation,
	type RoleId,
	type Situation,
	type Slot,
	type Zone
} from './model.js';
import { makeLegal } from './overlap.js';

export type DefenseSystem = 'perimeter' | 'rotational' | 'middle-up';
export const DEFENSE_SYSTEMS: readonly DefenseSystem[] = ['perimeter', 'rotational', 'middle-up'];

/** Where the opponent attacks from, named from their side: their outside hits at our right. */
export type AttackFrom = 'outside' | 'middle' | 'opposite';
export const ATTACKS_FROM: readonly AttackFrom[] = ['outside', 'middle', 'opposite'];

/**
 * The moments of a rally the tools show. Receiving: `receive` then `attack`. Serving: `serve`,
 * `base` (after the serve hit, waiting for their attack), `defense`, then `attack` (transition).
 */
export type Phase = 'receive' | 'serve' | 'base' | 'defense' | 'attack';
export const RECEIVE_PHASES: readonly Phase[] = ['receive', 'attack'];
export const SERVE_PHASES: readonly Phase[] = ['serve', 'base', 'defense', 'attack'];

export type Task =
	'serve' | 'pass' | 'hide' | 'set' | 'block' | 'dig' | 'tip' | 'attack' | 'cover' | 'base';

export type Placed = OnCourt & {
	x: number;
	y: number;
	task: Task;
	/** Where the player heads next, drawn as a dashed run (the setter to the target, a hitter's approach). */
	run?: Point;
	setter: boolean;
};

export type Options = Situation & {
	formation: ReceiveFormation;
	defense: DefenseSystem;
	attackFrom: AttackFrom;
	/**
	 * Rules before 2025 (and some leagues still) also hold the serving team to rotational order.
	 * FIVB 2025–2028 rule 7.4 frees the serving team.
	 */
	servingOverlap: boolean;
};

/** Where the setter sets from: just right of centre, at the net. */
export const TARGET: Point = { x: 5.8, y: 0.8 };
/**
 * Servers may serve from anywhere along the end line. Each serves from in line with the spot they
 * defend, so their run in after the serve is straight.
 */
export const SERVE_DEPTH = 9.9;

const mirror = (p: Point): Point => ({ x: 9 - p.x, y: p.y });

const BASE: Record<DefenseSystem, Record<Slot, Point>> = {
	perimeter: {
		FL: { x: 1.1, y: 1 },
		FM: { x: 4.5, y: 1 },
		FR: { x: 7.9, y: 1 },
		BL: { x: 1.5, y: 6.4 },
		BM: { x: 4.5, y: 7.9 },
		BR: { x: 7.5, y: 6.4 }
	},
	rotational: {
		FL: { x: 1.1, y: 1 },
		FM: { x: 4.5, y: 1 },
		FR: { x: 7.9, y: 1 },
		BL: { x: 1.5, y: 6.4 },
		BM: { x: 4.5, y: 7.6 },
		BR: { x: 7.5, y: 6.4 }
	},
	'middle-up': {
		FL: { x: 1.1, y: 1 },
		FM: { x: 4.5, y: 1 },
		FR: { x: 7.9, y: 1 },
		BL: { x: 1.3, y: 6.8 },
		BM: { x: 4.5, y: 4 },
		BR: { x: 7.7, y: 6.8 }
	}
};

type DefenseSpot = Point & { task: Task };

/**
 * Defense against their outside hitter (hitting at our right) and their middle. Their quick
 * hitter attacks in front of their setter, who sets from their right of centre: our left of
 * centre, so the block against the middle shades that way.
 */
const DEFENSE: Record<DefenseSystem, Record<'outside' | 'middle', Record<Slot, DefenseSpot>>> = {
	perimeter: {
		outside: {
			FR: { x: 7.7, y: 0.5, task: 'block' },
			FM: { x: 6.8, y: 0.5, task: 'block' },
			FL: { x: 2, y: 3.3, task: 'dig' },
			BR: { x: 8.2, y: 5.8, task: 'dig' },
			BM: { x: 5.6, y: 8.4, task: 'dig' },
			BL: { x: 1.4, y: 6.2, task: 'dig' }
		},
		middle: {
			FM: { x: 3.9, y: 0.5, task: 'block' },
			FL: { x: 1.8, y: 3, task: 'dig' },
			FR: { x: 7.2, y: 3, task: 'dig' },
			BL: { x: 1.4, y: 6, task: 'dig' },
			BM: { x: 4.5, y: 8.3, task: 'dig' },
			BR: { x: 7.6, y: 6, task: 'dig' }
		}
	},
	rotational: {
		outside: {
			FR: { x: 7.7, y: 0.5, task: 'block' },
			FM: { x: 6.8, y: 0.5, task: 'block' },
			FL: { x: 1.4, y: 4.4, task: 'dig' },
			BR: { x: 7.3, y: 3.3, task: 'tip' },
			BM: { x: 8.1, y: 7.4, task: 'dig' },
			BL: { x: 3.4, y: 7.7, task: 'dig' }
		},
		middle: {
			FM: { x: 3.9, y: 0.5, task: 'block' },
			FL: { x: 1.8, y: 3, task: 'dig' },
			FR: { x: 7.2, y: 3, task: 'dig' },
			BL: { x: 1.4, y: 6, task: 'dig' },
			BM: { x: 4.5, y: 8.3, task: 'dig' },
			BR: { x: 7.6, y: 6, task: 'dig' }
		}
	},
	'middle-up': {
		outside: {
			FR: { x: 7.7, y: 0.5, task: 'block' },
			FM: { x: 6.8, y: 0.5, task: 'block' },
			FL: { x: 1.8, y: 3.4, task: 'dig' },
			BM: { x: 6.3, y: 3.1, task: 'tip' },
			BR: { x: 8.2, y: 7.4, task: 'dig' },
			BL: { x: 1.5, y: 7.2, task: 'dig' }
		},
		middle: {
			FM: { x: 3.9, y: 0.5, task: 'block' },
			BM: { x: 3.9, y: 3.4, task: 'tip' },
			FL: { x: 1.5, y: 2.8, task: 'dig' },
			FR: { x: 7.5, y: 2.8, task: 'dig' },
			BL: { x: 1.3, y: 6.6, task: 'dig' },
			BR: { x: 7.7, y: 6.6, task: 'dig' }
		}
	}
};

const MIRRORED_SLOT: Record<Slot, Slot> = {
	FL: 'FR',
	FM: 'FM',
	FR: 'FL',
	BL: 'BR',
	BM: 'BM',
	BR: 'BL'
};

function defenseSpot(system: DefenseSystem, from: AttackFrom, slot: Slot): DefenseSpot {
	if (from === 'opposite') {
		// Their opposite hits at our left: the mirror image of defending their outside.
		const spot = DEFENSE[system].outside[MIRRORED_SLOT[slot]];
		return { ...mirror(spot), task: spot.task };
	}
	return DEFENSE[system][from][slot];
}

/** Receive spots for each formation, left to right. */
const RECEIVE_SPOTS: Record<ReceiveFormation, Point[]> = {
	3: [
		{ x: 1.6, y: 6.4 },
		{ x: 4.5, y: 6.8 },
		{ x: 7.4, y: 6.4 }
	],
	4: [
		{ x: 1.3, y: 5.6 },
		{ x: 3.4, y: 6.7 },
		{ x: 5.6, y: 6.7 },
		{ x: 7.7, y: 5.6 }
	],
	5: [
		{ x: 1.4, y: 4.6 },
		{ x: 4.5, y: 4.9 },
		{ x: 7.6, y: 4.6 },
		{ x: 3, y: 7.4 },
		{ x: 6, y: 7.4 }
	]
};

/** Who passes: the outsides and the libero (or the back-row middle), then more as needed. */
function passers(
	court: OnCourt[],
	setter: RoleId,
	formation: ReceiveFormation,
	system: Situation['system']
): OnCourt[] {
	// A back-row setter in zone 6 or 5 hides right behind the front-row player in front of them,
	// at the net, so that player does not pass: if they did, the setter would have to stand
	// behind them in the middle of the passers. From zone 1 the setter hides along the right
	// sideline instead, so the zone 2 player can still pass.
	const setterZone = court.find((p) => p.role === setter)!.zone;
	const shield = setterZone === 6 ? 3 : setterZone === 5 ? 4 : undefined;
	const others = court.filter((p) => p.role !== setter && p.zone !== shield);
	if (formation === 5 || system === '6-6') return others;
	const core = others.filter((p) => {
		const kind = ROLE_KIND[p.role];
		return kind === 'outside' || kind === 'libero' || (kind === 'middle' && !isFront(p.zone));
	});
	if (formation === 3) return core;
	// The fourth passer is whoever plays opposite the setter.
	const fourth = others.find(
		(p) => !core.includes(p) && (ROLE_KIND[p.role] === 'opposite' || ROLE_KIND[p.role] === 'setter')
	);
	return fourth ? [...core, fourth] : core;
}

function permutations<T>(items: T[]): T[][] {
	if (items.length <= 1) return [items];
	return items.flatMap((item, i) =>
		permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
	);
}

const ZONE_X: Record<Zone, number> = { 4: 1.2, 5: 1.2, 3: 4.5, 6: 4.5, 2: 7.8, 1: 7.8 };

function receive(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	const passing = passers(court, setter, o.formation, o.system);
	const spots = RECEIVE_SPOTS[passing.length as ReceiveFormation] ?? RECEIVE_SPOTS[5];
	const idle = court.filter((p) => !passing.includes(p));
	const setterZone = court.find((p) => p.role === setter)!.zone;

	const idleWish = (p: OnCourt): { p: Point; weight: number } => {
		if (p.role === setter) {
			// A front-row setter is already at the net, so they give way sideways to the passers
			// they must stay beside.
			if (isFront(p.zone)) return { p: { x: TARGET.x, y: 0.9 }, weight: 0.25 };
			// From zone 1, along the right sideline behind the zone 2 player; from 6 or 5, at the
			// net behind the player shielding them.
			return p.zone === 1
				? { p: { x: 8.6, y: 1.6 }, weight: 0.4 }
				: { p: { x: TARGET.x, y: 1.6 }, weight: 0.4 };
		}
		if (isFront(p.zone)) {
			// Non-passing hitters wait at the net. With the setter in zone 4, the zone 3 player
			// waits a step off it, so the setter's run along the net to the target is clear.
			const offNet = p.zone === 3 && setterZone === 4;
			return { p: { x: ZONE_X[p.zone], y: offNet ? 2 : 0.9 }, weight: 1 };
		}
		// Back-row non-passers wait deep, out of the passers' way and their line of sight: in the
		// right corner, where an opposite attacks from, unless their zone keeps them left.
		const DEEP_X: Record<number, number> = { 1: 8.3, 6: 7, 5: 1.2 };
		return { p: { x: DEEP_X[p.zone], y: 8.5 }, weight: 0.8 };
	};

	let best: { cost: number; at: Record<Zone, Point> } | undefined;
	for (const order of permutations(passing)) {
		const wish = {} as Record<Zone, Point>;
		const weights: Partial<Record<Zone, number>> = {};
		order.forEach((p, i) => {
			wish[p.zone] = spots[i];
			weights[p.zone] = 3;
		});
		for (const p of idle) {
			const w = idleWish(p);
			wish[p.zone] = w.p;
			weights[p.zone] = w.weight;
		}
		const at = makeLegal(wish, weights);
		let cost = 0;
		for (const z of ZONES) {
			const dx = at[z].x - wish[z].x;
			const dy = at[z].y - wish[z].y;
			cost += (dx * dx + dy * dy) * (weights[z] ?? 1);
		}
		order.forEach((p, i) => {
			// Prefer the libero in the middle of a three-player line, where most serves go.
			if (p.role === 'L' && spots.length === 3 && i !== 1) cost += 0.6;
			// Front-row passers take the short spots and back-row passers the deep ones, so they
			// stay in their own row's order and front-row hitters are close to their approach.
			cost += 0.15 * (isFront(p.zone) ? spots[i].y : 9 - spots[i].y);
		});
		if (!best || cost < best.cost - 1e-9) best = { cost, at };
	}

	return court.map((p) => {
		const at = best!.at[p.zone];
		const isSetter = p.role === setter;
		return {
			...p,
			...at,
			setter: isSetter,
			task: passing.includes(p) ? 'pass' : isSetter ? 'set' : 'hide',
			run: isSetter ? TARGET : undefined
		};
	});
}

function base(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	return court.map((p) => ({
		...p,
		...BASE[o.defense][p.slot],
		setter: p.role === setter,
		task: 'base'
	}));
}

function serve(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	const placed = base(o, court, setter);
	const server = placed.find((p) => p.zone === 1)!;
	const legal = o.servingOverlap
		? makeLegal(
				Object.fromEntries(placed.map((p) => [p.zone, { x: p.x, y: p.y }])) as Record<Zone, Point>,
				{},
				[1]
			)
		: undefined;
	return placed.map((p) => {
		if (p === server) {
			const spot = BASE[o.defense][p.slot];
			const from = { x: Math.min(8, Math.max(1, spot.x)), y: SERVE_DEPTH };
			return { ...p, ...from, task: 'serve', run: spot };
		}
		if (!legal) return p;
		const at = legal[p.zone];
		const moved = Math.hypot(at.x - p.x, at.y - p.y) > 0.05;
		return { ...p, ...at, run: moved ? { x: p.x, y: p.y } : undefined };
	});
}

function defense(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	return court.map((p) => {
		const spot = defenseSpot(o.defense, o.attackFrom, p.slot);
		return { ...p, x: spot.x, y: spot.y, task: spot.task, setter: p.role === setter };
	});
}

/** Approach starts and where each hitter jumps. Wing hitters start from outside the sidelines. */
const APPROACH: Partial<Record<Slot, { from: Point; to: Point }>> = {
	FL: { from: { x: -0.3, y: 3.6 }, to: { x: 1, y: 0.9 } },
	FM: { from: { x: 4.4, y: 2.8 }, to: { x: 5, y: 0.9 } },
	FR: { from: { x: 9.3, y: 3.6 }, to: { x: 8, y: 0.9 } },
	BM: { from: { x: 4.5, y: 6 }, to: { x: 4.5, y: 3.6 } },
	BR: { from: { x: 8, y: 6.4 }, to: { x: 7.8, y: 3.7 } }
};

function attack(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	return court.map((p) => {
		const isSetter = p.role === setter;
		if (isSetter) return { ...p, ...TARGET, setter: true, task: 'set' };
		// A back-row setter who is not setting (4-2) covers from the right back.
		if (ROLE_KIND[p.role] === 'setter' && !isFront(p.zone)) {
			return { ...p, x: 7, y: 5.4, setter: false, task: 'cover' };
		}
		if (p.role === 'L' || (o.system !== '6-6' && p.slot === 'BL')) {
			return { ...p, x: 2.6, y: 4.8, setter: false, task: 'cover' };
		}
		// A back-row setter's partner on the right, and in 6-6 the whole back row, cover.
		const approach = APPROACH[p.slot];
		if (!approach || (o.system === '6-6' && !isFront(p.zone))) {
			const centre = ZONE_CENTRE[p.zone];
			return { ...p, x: centre.x, y: Math.max(centre.y, 5.2), setter: false, task: 'cover' };
		}
		return { ...p, ...approach.from, run: approach.to, setter: false, task: 'attack' };
	});
}

/** Every player's place, task and next run in one moment of a rally. */
export function formation(o: Options, phase: Phase): Placed[] {
	const serving = phase !== 'receive' && (phase !== 'attack' || o.serving);
	const court = lineupOnCourt({ ...o, serving });
	const setter = setterOf(o.system, o.rotation);
	switch (phase) {
		case 'receive':
			return receive(o, court, setter);
		case 'serve':
			return serve(o, court, setter);
		case 'base':
			return base(o, court, setter);
		case 'defense':
			return defense(o, court, setter);
		case 'attack':
			return attack(o, court, setter);
	}
}

export const DEFAULT_OPTIONS: Options = {
	system: '5-1',
	rotation: 1,
	serving: false,
	libero: true,
	formation: 3,
	defense: 'perimeter',
	attackFrom: 'outside',
	servingOverlap: false
};

/** The receive formations a system offers with the current libero choice. */
export function formationsFor(o: Pick<Options, 'system'>): readonly ReceiveFormation[] {
	return SYSTEM[o.system].receiveFormations;
}

/** Positions keyed by rotational zone, the shape the overlap check takes. */
export const byZone = (placed: readonly Placed[]): Record<Zone, Point> =>
	Object.fromEntries(placed.map((p) => [p.zone, { x: p.x, y: p.y }])) as Record<Zone, Point>;
