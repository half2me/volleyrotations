import { leagueOf, type LeagueId } from './leagues.js';
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
	/** Decides the substitution and time-out limits; matches saved before leagues mean FIVB. */
	league?: LeagueId;
	/** Every rally in order, for the statistics. */
	log: RallyRecord[];
};

/** One rally: the set it was in, our rotation, whether we served, and whether we won it. */
export type RallyRecord = { set: number; rotation: RotationNo; serving: boolean; won: boolean };

export const SETS_TO_WIN = 3;

export const subsPerSet = (state: Pick<MatchState, 'league'>) => leagueOf(state.league).subsPerSet;
export const timeoutsPerSet = (state: Pick<MatchState, 'league'>) =>
	leagueOf(state.league).timeoutsPerSet;

export function newMatch(o: {
	system: SystemId;
	libero: boolean;
	rotation: RotationNo;
	serving: boolean;
	league?: LeagueId;
}): MatchState {
	return {
		...o,
		sets: [{ us: 0, them: 0 }],
		servedFirst: o.serving,
		timeouts: { us: 0, them: 0 },
		subs: {},
		usedBench: [],
		subCount: 0,
		finished: false,
		log: []
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
	const record: RallyRecord = {
		set: state.sets.length,
		rotation: state.rotation,
		serving: state.serving,
		won: winner === 'us'
	};
	const next = {
		...state,
		log: [...(state.log ?? []), record],
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
 * previous set (rule 12.1.2). The deciding set starts with a new toss (7.1).
 */
export const nextSetServing = (state: MatchState) => !state.servedFirst;

export type SubOption = { kind: 'bench'; bench: number } | { kind: 'starter' };

/**
 * What may come on for the player in a starting position now: under FIVB rule 15.6, or, in
 * leagues that allow more re-entries, anyone not already on court within the team's limit.
 */
export function subOptions(state: MatchState, role: RoleId, benchSize: number): SubOption[] {
	if (state.subCount >= subsPerSet(state) || role === 'L') return [];
	const slot = state.subs[role] ?? { starterLeft: false, starterReturned: false };
	if (!leagueOf(state.league).fivbReentry) {
		const onCourt = Object.values(state.subs).map((s) => s?.sub);
		const bench = Array.from({ length: benchSize }, (_, b) => b)
			.filter((b) => !onCourt.includes(b))
			.map((b): SubOption => ({ kind: 'bench', bench: b }));
		return slot.sub !== undefined ? [{ kind: 'starter' }, ...bench] : bench;
	}
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

export type RotationStats = {
	rotation: RotationNo;
	/** Rallies on the opponent's serve, and how many we won (sideouts). */
	received: number;
	sidedOut: number;
	/** Rallies on our serve, and how many we won (points on serve). */
	served: number;
	scored: number;
};

/** Sideout and point-on-serve counts for each rotation, over the given rallies. */
export function rotationStats(log: readonly RallyRecord[]): RotationStats[] {
	return ([1, 2, 3, 4, 5, 6] as RotationNo[]).map((rotation) => {
		const here = log.filter((r) => r.rotation === rotation);
		const received = here.filter((r) => !r.serving);
		const served = here.filter((r) => r.serving);
		return {
			rotation,
			received: received.length,
			sidedOut: received.filter((r) => r.won).length,
			served: served.length,
			scored: served.filter((r) => r.won).length
		};
	});
}

/** The longest run of consecutive points each team won within one set. */
export function longestRuns(log: readonly RallyRecord[]): { us: number; them: number } {
	const best = { us: 0, them: 0 };
	let run = 0;
	let prev: RallyRecord | undefined;
	for (const r of log) {
		run = prev && prev.set === r.set && prev.won === r.won ? run + 1 : 1;
		const who = r.won ? 'us' : 'them';
		best[who] = Math.max(best[who], run);
		prev = r;
	}
	return best;
}

/** The rally log as CSV, one rally per row with the running score. */
export function logCsv(log: readonly RallyRecord[]): string {
	const rows = ['set,rally,rotation,serving,won,us,them'];
	let score = { us: 0, them: 0 };
	let set = 0;
	let n = 0;
	for (const r of log) {
		if (r.set !== set) {
			set = r.set;
			score = { us: 0, them: 0 };
			n = 0;
		}
		n++;
		score[r.won ? 'us' : 'them']++;
		rows.push(
			[r.set, n, r.rotation, r.serving ? 1 : 0, r.won ? 1 : 0, score.us, score.them].join(',')
		);
	}
	return rows.join('\n') + '\n';
}
