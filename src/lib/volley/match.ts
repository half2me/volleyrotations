import { rolesOf, type RoleId, type RotationNo, type SystemId } from './model.js';

/**
 * A match as the tracker keeps it. Scoring follows FIVB rules 6.1–6.3: rally point, sets to 25
 * (the fifth to 15) won by two, best of five. Substitutions follow rule 15.6.
 */
export type SetScore = { us: number; them: number };

/** Who occupies one starting position this set, and what rule 15.6 still allows there. */
export type SlotSubs = {
	/** Index into the team's bench of the substitute on court, if any. */
	sub?: number;
	starterLeft: boolean;
	starterReturned: boolean;
};

export type MatchState = {
	system: SystemId;
	libero: boolean;
	sets: SetScore[];
	/** Whether we serve the next rally. */
	serving: boolean;
	rotation: RotationNo;
	/** Whether we served first in the current set, to pick the next set's first server (12.1.2). */
	servedFirst: boolean;
	timeouts: { us: number; them: number };
	subs: Partial<Record<RoleId, SlotSubs>>;
	/** Bench players who already came on this set: each may enter only once (15.6.2). */
	usedBench: number[];
	subCount: number;
	finished: boolean;
};

export const SETS_TO_WIN = 3;
export const SUBS_PER_SET = 6;
export const TIMEOUTS_PER_SET = 2;

export function newMatch(o: {
	system: SystemId;
	libero: boolean;
	rotation: RotationNo;
	serving: boolean;
}): MatchState {
	return {
		...o,
		sets: [{ us: 0, them: 0 }],
		servedFirst: o.serving,
		timeouts: { us: 0, them: 0 },
		subs: {},
		usedBench: [],
		subCount: 0,
		finished: false
	};
}

export const nextRotation = (r: RotationNo): RotationNo => ((r % 6) + 1) as RotationNo;

export const setTarget = (setIndex: number) => (setIndex === 4 ? 15 : 25);

export function setsWon(state: MatchState): SetScore {
	const done = state.sets.filter((s, i) => setWinner(s, i) !== undefined);
	return {
		us: done.filter((s, i) => setWinner(s, i) === 'us').length,
		them: done.filter((s, i) => setWinner(s, i) === 'them').length
	};
}

export function setWinner(s: SetScore, index: number): 'us' | 'them' | undefined {
	const target = setTarget(index);
	if (s.us >= target && s.us - s.them >= 2) return 'us';
	if (s.them >= target && s.them - s.us >= 2) return 'them';
	return undefined;
}

/** Whether the current set has been won, waiting for the next one to start. */
export const setOver = (state: MatchState) =>
	setWinner(state.sets[state.sets.length - 1], state.sets.length - 1) !== undefined;

/**
 * Scores one rally. Winning the opponent's serve (a sideout) rotates us one place clockwise
 * before we serve (rule 7.6.2).
 */
export function rally(state: MatchState, winner: 'us' | 'them'): MatchState {
	if (state.finished || setOver(state)) return state;
	const sets = state.sets.map((s, i) =>
		i === state.sets.length - 1 ? { ...s, [winner]: s[winner] + 1 } : s
	);
	const sideout = winner === 'us' && !state.serving;
	const next = {
		...state,
		sets,
		serving: winner === 'us',
		rotation: sideout ? nextRotation(state.rotation) : state.rotation
	};
	const won = setsWon(next);
	return { ...next, finished: won.us === SETS_TO_WIN || won.them === SETS_TO_WIN };
}

/** Starts the next set, from the coach's chosen rotation. Substitutions and time-outs reset. */
export function startSet(state: MatchState, rotation: RotationNo, serving: boolean): MatchState {
	return {
		...state,
		sets: [...state.sets, { us: 0, them: 0 }],
		rotation,
		serving,
		servedFirst: serving,
		timeouts: { us: 0, them: 0 },
		subs: {},
		usedBench: [],
		subCount: 0
	};
}

/**
 * Who serves first in the next set: in sets 2–4 the team that did not serve first in the
 * previous set (rule 12.1.2). The deciding set starts with a new toss (12.1.1).
 */
export const nextSetServing = (state: MatchState) => !state.servedFirst;

export type SubOption = { kind: 'bench'; bench: number } | { kind: 'starter' };

/** What may come on for the player in a starting position now (rule 15.6). */
export function subOptions(state: MatchState, role: RoleId, benchSize: number): SubOption[] {
	if (state.subCount >= SUBS_PER_SET || role === 'L') return [];
	const slot = state.subs[role] ?? { starterLeft: false, starterReturned: false };
	if (slot.sub !== undefined) {
		// A substitute can only be replaced by the starter they came on for, and only once.
		return slot.starterReturned ? [] : [{ kind: 'starter' }];
	}
	if (slot.starterLeft) return [];
	return Array.from({ length: benchSize }, (_, bench) => bench)
		.filter((bench) => !state.usedBench.includes(bench))
		.map((bench) => ({ kind: 'bench', bench }));
}

export function substitute(state: MatchState, role: RoleId, option: SubOption): MatchState {
	const slot = state.subs[role] ?? { starterLeft: false, starterReturned: false };
	const next: SlotSubs =
		option.kind === 'bench'
			? { ...slot, sub: option.bench, starterLeft: true }
			: { ...slot, sub: undefined, starterReturned: true };
	return {
		...state,
		subs: { ...state.subs, [role]: next },
		usedBench: option.kind === 'bench' ? [...state.usedBench, option.bench] : state.usedBench,
		subCount: state.subCount + 1
	};
}

/** The roles that start on court: everyone but the libero. */
export const courtRoles = (state: MatchState) => rolesOf(state.system, false);
