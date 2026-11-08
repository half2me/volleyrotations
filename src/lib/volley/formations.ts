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
	type RotationNo,
	type Situation,
	type Slot,
	type Zone
} from './model.js';
import { makeLegal, overlapFaults } from './overlap.js';

export type DefenseSystem = 'perimeter' | 'rotational' | 'middle-up';
export const DEFENSE_SYSTEMS: readonly DefenseSystem[] = ['perimeter', 'rotational', 'middle-up'];

/** Where the opponent attacks from, named from their side: their outside hits at our right. */
export type AttackFrom = 'outside' | 'middle' | 'opposite';
export const ATTACKS_FROM: readonly AttackFrom[] = ['outside', 'middle', 'opposite'];

/**
 * The moments of a rally the tools show. Receiving: `receive` then `attack`. Serving: `serve`,
 * `base` (after the serve hit, waiting for their attack), `defense`, then `attack` (transition).
 */
export type Phase = 'receive' | 'serve' | 'base' | 'defense' | 'attack' | 'cover';
export const RECEIVE_PHASES: readonly Phase[] = ['receive', 'attack', 'cover'];
export const SERVE_PHASES: readonly Phase[] = ['serve', 'base', 'defense', 'attack', 'cover'];

/**
 * What the opponent sends over in the defense moment: a full attack, a down ball (hit or tipped
 * without a jump, so the blockers stay down) or a free ball (an easy ball they could not attack).
 */
export type Incoming = 'attack' | 'down' | 'free';
export const INCOMING: readonly Incoming[] = ['attack', 'down', 'free'];

/** Where the setter sets in the coverage moment: a front-row attack from the left, middle or right. */
export type SetTo = 'left' | 'middle' | 'right';
export const SET_TO: readonly SetTo[] = ['left', 'middle', 'right'];

export type Task =
	| 'serve'
	| 'pass'
	| 'hide'
	| 'set'
	| 'block'
	| 'dig'
	| 'tip'
	| 'attack'
	| 'cover'
	| 'base'
	| 'stay';

export type Placed = OnCourt & {
	x: number;
	y: number;
	task: Task;
	/** Where the player heads next, drawn as a dashed run (the setter to the target, a hitter's approach). */
	run?: Point;
	setter: boolean;
	/** Attacks from the side they stood on in serve receive instead of switching. */
	noSwitch?: boolean;
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
	/**
	 * After serve receive, a front-row outside who passed on the right attacks from there instead
	 * of switching to the left (most often in rotation 1). False: everyone switches.
	 */
	keepSides?: boolean;
	/** A team's receive formation for particular rotations, overriding `formation`. */
	formationBy?: Partial<Record<RotationNo, ReceiveFormation>>;
	/** A team's own receive positions per rotation, by zone. Used only while they are legal. */
	custom?: Partial<Record<RotationNo, Partial<Record<Zone, Point>>>>;
	incoming?: Incoming;
	setTo?: SetTo;
	/** In transition: the setter played the first ball, so someone else sets. */
	setterDug?: boolean;
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
	// sideline instead, so the zone 2 player can still pass. A setter in zone 4 stacks in the
	// front-left corner with the zone 3 player, who stays with them so the front-row outside
	// can pass on the left.
	// When that zone 3 player is itself an outside (a lineup with the middle following the
	// setter), they pass instead: the setter only has to stay to their left.
	const setterZone = court.find((p) => p.role === setter)!.zone;
	const zone3Outside = ROLE_KIND[court.find((p) => p.zone === 3)!.role] === 'outside';
	const shield =
		setterZone === 6 ? 3 : setterZone === 5 ? 4 : setterZone === 4 && !zone3Outside ? 3 : undefined;
	const others = court.filter((p) => p.role !== setter && p.zone !== shield);
	if (formation === 5 || system === '6-6') return others;
	const core = others.filter((p) => {
		const kind = ROLE_KIND[p.role];
		return kind === 'outside' || kind === 'libero' || (kind === 'middle' && !isFront(p.zone));
	});
	// Extra passers: whoever plays opposite the setter, then a front-row middle. They also fill
	// in when an outside is the one shielding the setter.
	const extra = others.filter((p) => !core.includes(p)).sort((a, b) => extraRank(a) - extraRank(b));
	return [...core, ...extra].slice(0, formation);
}

const extraRank = (p: OnCourt) =>
	ROLE_KIND[p.role] === 'opposite' || ROLE_KIND[p.role] === 'setter' ? 0 : 1;

function permutations<T>(items: T[]): T[][] {
	if (items.length <= 1) return [items];
	return items.flatMap((item, i) =>
		permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
	);
}

const ZONE_X: Record<Zone, number> = { 4: 1.2, 5: 1.2, 3: 4.5, 6: 4.5, 2: 7.8, 1: 7.8 };

function receive(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	const placed = autoReceive(o, court, setter);
	const custom = o.custom?.[o.rotation];
	if (!custom || !ZONES.every((z) => custom[z])) return placed;
	const at = custom as Record<Zone, Point>;
	if (overlapFaults(at).length > 0) return placed;
	return placed.map((p) => ({ ...p, x: at[p.zone].x, y: at[p.zone].y }));
}

/** The receive formation size a rotation uses. */
export const formationOf = (o: Options): ReceiveFormation => {
	const f = o.formationBy?.[o.rotation] ?? o.formation;
	return SYSTEM[o.system].receiveFormations.includes(f) ? f : SYSTEM[o.system].receiveFormations[0];
};

/**
 * The search below tries every order of the passers, which is slow enough to notice when a page
 * draws all six rotations, so results are kept: the answer depends only on these inputs.
 */
const receiveCache = new Map<string, Placed[]>();

function autoReceive(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	const key = JSON.stringify([o.system, formationOf(o), setter, court]);
	const hit = receiveCache.get(key);
	if (hit) return hit.map((p) => ({ ...p }));
	const placed = searchReceive(o, court, setter);
	if (receiveCache.size > 300) receiveCache.clear();
	receiveCache.set(key, placed);
	return placed.map((p) => ({ ...p }));
}

function searchReceive(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	const passing = passers(court, setter, formationOf(o), o.system);
	const spots = RECEIVE_SPOTS[passing.length as ReceiveFormation] ?? RECEIVE_SPOTS[5];
	const idle = court.filter((p) => !passing.includes(p));
	const setterZone = court.find((p) => p.role === setter)!.zone;

	const idleWish = (p: OnCourt): { p: Point; weight: number } => {
		if (p.role === setter) {
			// A front-row setter is already at the net, so they give way sideways to the passers
			// they must stay beside.
			// From zone 4 they stack in the front-left corner with the middle, so the front-row
			// outside can pass on the left, where they attack from.
			if (isFront(p.zone)) return { p: { x: p.zone === 4 ? 0.4 : TARGET.x, y: 0.9 }, weight: 0.25 };
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
			return { p: offNet ? { x: 1.4, y: 2 } : { x: ZONE_X[p.zone], y: 0.9 }, weight: 1 };
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
			// A front-row wing hitter passes on the side they attack from when the rules allow it.
			const attackX = { FL: 1.5, FR: 7.5 }[p.slot as 'FL' | 'FR'];
			if (isFront(p.zone) && attackX !== undefined) cost += 0.6 * Math.abs(spots[i].x - attackX);
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

/** The free-ball spots: the five-player receive line, everyone but the setter passing. */
const FREE_SPOTS = RECEIVE_SPOTS[5];

function defense(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	const from = base(o, court, setter);
	if (o.incoming === 'free') {
		// The setter heads for the target; the others pass, front-row hitters dropping off the net
		// to the short spots so they can still approach. Each takes the spot nearest their base.
		const passing = from.filter((p) => p.role !== setter);
		let best: { cost: number; order: Placed[] } | undefined;
		for (const order of permutations(passing)) {
			const cost = order.reduce(
				(sum, p, i) => sum + (p.x - FREE_SPOTS[i].x) ** 2 + (p.y - FREE_SPOTS[i].y) ** 2,
				0
			);
			if (!best || cost < best.cost - 1e-9) best = { cost, order };
		}
		return from.map((p) => {
			if (p.role === setter) return { ...p, ...TARGET, task: 'set', run: undefined };
			const i = best!.order.indexOf(p);
			return { ...p, ...FREE_SPOTS[i], task: 'pass' };
		});
	}
	if (o.incoming === 'down') {
		// Blockers stay at the net without jumping; the back row stays deep to dig.
		return from.map((p) => {
			if (isFront(p.zone)) return { ...p, y: 1, task: 'stay' };
			const deep = BASE.perimeter[p.slot];
			return { ...p, ...(deep ?? { x: p.x, y: p.y }), task: 'dig' };
		});
	}
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
	// After serve receive, a front-row outside who passed on the right attacks from the right,
	// and the front-row player waiting on the left takes the left: switching would send them
	// across the court during the pass. Many teams play Rotation 1 this way.
	const passed = o.serving ? undefined : receive(o, court, setter);
	const swapSide = (p: OnCourt): Slot | undefined => {
		const at = passed?.find((q) => q.role === p.role);
		if (o.keepSides === false) return undefined;
		if (!at || !isFront(p.zone) || p.role === setter) return undefined;
		const outsideOnRight = (q: Placed) => q.slot === 'FL' && q.task === 'pass' && q.x > 6;
		const rightSideOnLeft = (q: Placed) =>
			q.slot === 'FR' && isFront(q.zone) && q.role !== setter && q.x < 3;
		// Only a pair trades sides: one hitter must still attack from each wing.
		if (!passed!.some(outsideOnRight) || !passed!.some(rightSideOnLeft)) return undefined;
		if (outsideOnRight(at)) return 'FR';
		if (rightSideOnLeft(at)) return 'FL';
		return undefined;
	};
	// A front-row setter who only blocked may still set: a block is not a team contact (14.4.1).
	const setterBack = !isFront(court.find((p) => p.role === setter)!.zone);
	const dug = o.serving && o.setterDug && setterBack ? backupSetter(court, setter) : undefined;
	return court.map((p) => {
		const isSetter = p.role === setter;
		if (dug) {
			// The setter stays where they dug; the libero sets from behind the 3 m line, so the
			// hitter may attack the ball above the net (rule 19.3.1.4), anyone else at the net.
			if (isSetter) {
				const spot = defenseSpot(o.defense, o.attackFrom, p.slot);
				return { ...p, x: spot.x, y: spot.y, setter: false, task: 'dig' };
			}
			if (p === dug) {
				const at = p.role === 'L' ? { x: TARGET.x, y: 3.6 } : TARGET;
				return { ...p, ...at, setter: true, task: 'set' };
			}
		}
		if (isSetter) return { ...p, ...TARGET, setter: true, task: 'set' };
		// A back-row setter who is not setting (4-2) covers from the right back.
		if (ROLE_KIND[p.role] === 'setter' && !isFront(p.zone)) {
			return { ...p, x: 7, y: 5.4, setter: false, task: 'cover' };
		}
		// The libero never attacks and a back-row middle practically never does, so from middle
		// back they cover rather than run a pipe; a back-row outside in zone 5 covers on the left.
		const backMiddle = ROLE_KIND[p.role] === 'middle' && !isFront(p.zone);
		if (p.role === 'L' || backMiddle || (o.system !== '6-6' && p.slot === 'BL')) {
			const spot = p.slot === 'BM' ? { x: 4.5, y: 5.4 } : { x: 2.6, y: 4.8 };
			return { ...p, ...spot, setter: false, task: 'cover' };
		}
		const side = swapSide(p);
		const approach = APPROACH[side ?? p.slot];
		// A back-row setter's partner on the right, and in 6-6 the whole back row, cover.
		if (!approach || (o.system === '6-6' && !isFront(p.zone))) {
			const centre = ZONE_CENTRE[p.zone];
			return { ...p, x: centre.x, y: Math.max(centre.y, 5.2), setter: false, task: 'cover' };
		}
		return {
			...p,
			...approach.from,
			run: approach.to,
			setter: false,
			task: 'attack',
			noSwitch: side !== undefined
		};
	});
}

/** Who sets when the setter dug the first ball: the libero, else a front-row player. */
function backupSetter(court: OnCourt[], setter: RoleId): OnCourt | undefined {
	return (
		court.find((p) => p.role === 'L') ??
		court.find((p) => p.slot === 'FR' && p.role !== setter) ??
		court.find((p) => isFront(p.zone) && p.role !== setter)
	);
}

const HITTER_SLOTS: Record<SetTo, Slot[]> = {
	left: ['FL'],
	middle: ['FM'],
	right: ['FR']
};

const attackSide = (p: Placed): Slot => (p.noSwitch ? swapped(p.slot) : p.slot);

function hitterFor(attackers: Placed[], setTo: SetTo): Placed | undefined {
	for (const slot of HITTER_SLOTS[setTo]) {
		const p = attackers.find((q) => q.task === 'attack' && q.run && attackSide(q) === slot);
		if (p) return p;
	}
	return undefined;
}

/** Whether the setter-dug transition applies: only a back-row setter digs. */
export const setterInBack = (o: Options) =>
	!isFront(
		lineupOnCourt({ ...o, serving: true }).find((p) => p.role === setterOf(o.system, o.rotation))!
			.zone
	);

/** The sets a rotation can offer: a hitter must be attacking from that spot. */
export function setsAvailable(o: Options): SetTo[] {
	const court = lineupOnCourt({ ...o });
	const before = attack(o, court, setterOf(o.system, o.rotation));
	return SET_TO.filter((t) => hitterFor(before, t));
}

/**
 * Coverage after the set: the hitter jumps, and the other five form a cup to catch a ball
 * blocked back. The usual teaching pattern: the three players nearest the hitter close in,
 * the other two cover deep.
 */
function cover(o: Options, court: OnCourt[], setter: RoleId): Placed[] {
	const before = attack(o, court, setter);
	const hitter =
		hitterFor(before, o.setTo ?? 'left') ?? before.find((p) => p.task === 'attack' && p.run);
	if (!hitter?.run) return before;
	const h = hitter.run;
	// The cup faces partly toward the middle of the court, where a ball off the block goes.
	const toCentre = Math.atan2(4.5 - h.x, 4.5 - h.y) / 2;
	const at = (r: number, a: number): Point => ({
		x: Math.min(8.6, Math.max(0.4, h.x + r * Math.sin(toCentre + a))),
		y: Math.min(8.6, Math.max(0.5, h.y + r * Math.cos(toCentre + a)))
	});
	const deg = Math.PI / 180;
	const spots = [
		at(1.7, -50 * deg),
		at(1.7, 0),
		at(1.7, 50 * deg),
		at(4, -25 * deg),
		at(4, 25 * deg)
	];
	const others = before.filter((p) => p !== hitter);
	let best: { cost: number; order: Placed[] } | undefined;
	for (const order of permutations(others)) {
		const cost = order.reduce(
			(sum, p, i) => sum + (p.x - spots[i].x) ** 2 + (p.y - spots[i].y) ** 2,
			0
		);
		if (!best || cost < best.cost - 1e-9) best = { cost, order };
	}
	return before.map((p) => {
		if (p === hitter) return { ...p, ...h, run: undefined, task: 'attack' };
		const i = best!.order.indexOf(p);
		return { ...p, ...spots[i], run: undefined, noSwitch: undefined, task: 'cover' };
	});
}

const swapped = (s: Slot): Slot => (s === 'FL' ? 'FR' : s === 'FR' ? 'FL' : s);

/** Every player's place, task and next run in one moment of a rally. */
export function formation(o: Options, phase: Phase): Placed[] {
	const serving = phase !== 'receive' && ((phase !== 'attack' && phase !== 'cover') || o.serving);
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
		case 'cover':
			return cover(o, court, setter);
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
