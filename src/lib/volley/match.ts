import { leagueOf, type LeagueId } from './leagues.js';
import {
	isFront,
	rolesOf,
	setterZoneOf,
	zoneOf,
	type RoleId,
	type RotationNo,
	type SystemId
} from './model.js';

/**
 * A match as the tracker keeps it. Indoor scoring follows FIVB rules 6.1–6.3: rally point, sets
 * to 25 (the fifth to 15) won by two, best of five; substitutions follow rule 15.6. Beach scoring
 * follows the FIVB beach rules 6.2–6.3: sets to 21 (the third to 15) won by two, best of three.
 */
export type Sport = 'indoor' | 'beach';
export const SPORTS: readonly Sport[] = ['indoor', 'beach'];

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
	/** Every rally in order, for the statistics. Matches saved before beach support are indoor. */
	log: RallyRecord[];
	sport?: Sport;
	/**
	 * Beach only: which of our two players served first this set, and who served last. Rule 12.2.2
	 * of the beach rules: when we win the serve back, the player who did not serve last time serves.
	 */
	beach?: { first: 0 | 1; last?: 0 | 1 };
	/**
	 * The opponents' rotation, numbered like ours from the zone the coach saw their setter in and
	 * advanced on their sideouts. Absent when the coach has not entered it, as in older saved matches.
	 */
	oppRotation?: RotationNo;
};

/** One rally: the set it was in, our rotation, whether we served, and whether we won it. */
export type RallyRecord = {
	set: number;
	rotation: RotationNo;
	serving: boolean;
	won: boolean;
	/** Beach only: which of our players served, on our serve. */
	server?: 0 | 1;
	/** Optional detail a coach adds in the detailed mode. */
	detail?: RallyDetail;
};

/**
 * How a rally ended, from our side. Points we won: a kill, an ace, a block, or an opponent error.
 * Points we lost: our attack, serve or other error, our attack blocked, or their winner.
 */
export type Outcome =
	| 'kill'
	| 'ace'
	| 'block'
	| 'opp-error'
	| 'attack-error'
	| 'serve-error'
	| 'blocked'
	| 'error'
	| 'opp-point';

export const WIN_OUTCOMES: readonly Outcome[] = ['kill', 'ace', 'block', 'opp-error'];
export const LOSS_OUTCOMES: readonly Outcome[] = [
	'attack-error',
	'serve-error',
	'blocked',
	'error',
	'opp-point'
];
/** Outcomes that name one of our players. */
export const PLAYER_OUTCOMES: readonly Outcome[] = [
	'kill',
	'ace',
	'block',
	'attack-error',
	'serve-error',
	'blocked',
	'error'
];

/** A serve-receive pass graded 0–3: 3 lets the setter run every option, 0 is an ace or a shank. */
export type PassRating = 0 | 1 | 2 | 3;

/**
 * A player, as the tracker knows them: a starting position (`OH1`, `L`…) or a bench player by
 * index (`b2`), so a substitute keeps their own stats.
 */
export type PlayerKey = string;

export type RallyDetail = {
	how?: Outcome;
	by?: PlayerKey;
	pass?: { by: PlayerKey; rating: PassRating };
};

/** Sets needed to win the match: best of five indoors, best of three on the beach. */
export const setsToWin = (sport: Sport = 'indoor') => (sport === 'beach' ? 2 : 3);

export const subsPerSet = (state: Pick<MatchState, 'league' | 'sport'>) =>
	state.sport === 'beach' ? 0 : leagueOf(state.league).subsPerSet;
/** Beach rule 15.4.1: one time-out per team per set. */
export const timeoutsPerSet = (state: Pick<MatchState, 'league' | 'sport'>) =>
	state.sport === 'beach' ? 1 : leagueOf(state.league).timeoutsPerSet;

export function newMatch(o: {
	system: SystemId;
	libero: boolean;
	rotation: RotationNo;
	serving: boolean;
	league?: LeagueId;
	sport?: Sport;
	/** Beach: which of our two players serves first. */
	firstServer?: 0 | 1;
	/** The rotation the opponents start in, when the coach knows where their setter stands. */
	oppRotation?: RotationNo;
}): MatchState {
	const { firstServer, oppRotation, ...rest } = o;
	return {
		...rest,
		...(oppRotation !== undefined && o.sport !== 'beach' ? { oppRotation } : {}),
		...(o.sport === 'beach'
			? { beach: { first: firstServer ?? 0, last: o.serving ? (firstServer ?? 0) : undefined } }
			: {}),
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

/** Points needed to win a set (by two): the deciding set is shorter. */
export const setTarget = (setIndex: number, sport: Sport = 'indoor') =>
	sport === 'beach' ? (setIndex === 2 ? 15 : 21) : setIndex === 4 ? 15 : 25;

export function setsWon(state: MatchState): SetScore {
	const sport = state.sport;
	return {
		us: state.sets.filter((s, i) => setWinner(s, i, sport) === 'us').length,
		them: state.sets.filter((s, i) => setWinner(s, i, sport) === 'them').length
	};
}

export function setWinner(
	s: SetScore,
	index: number,
	sport: Sport = 'indoor'
): 'us' | 'them' | undefined {
	const target = setTarget(index, sport);
	if (s.us >= target && s.us - s.them >= 2) return 'us';
	if (s.them >= target && s.them - s.us >= 2) return 'them';
	return undefined;
}

/** Whether the current set has been won, waiting for the next one to start. */
export const setOver = (state: MatchState) =>
	setWinner(state.sets[state.sets.length - 1], state.sets.length - 1, state.sport) !== undefined;

/**
 * Beach rule 18.2.1: the teams switch sides after every 7 points played in sets 1 and 2, and
 * every 5 in set 3. True when the rally just scored makes a switch due.
 */
export function sideSwitchDue(state: MatchState): boolean {
	if (state.sport !== 'beach') return false;
	const s = state.sets[state.sets.length - 1];
	const played = s.us + s.them;
	return played > 0 && !setOver(state) && played % (state.sets.length === 3 ? 5 : 7) === 0;
}

/**
 * Beach rule 15.4.2: in FIVB World and Official competitions, a 30-second technical time-out when
 * the points played in set 1 or 2 add up to 21. True right after that rally.
 */
export function technicalTimeoutDue(state: MatchState): boolean {
	if (state.sport !== 'beach' || state.sets.length > 2) return false;
	const s = state.sets[state.sets.length - 1];
	return s.us + s.them === 21 && !setOver(state);
}

/** Beach: which of our two players serves while we hold the serve, or would on winning it back. */
export function beachServer(state: MatchState): 0 | 1 {
	const b = state.beach ?? { first: 0 };
	if (state.serving) return b.last ?? b.first;
	return b.last === undefined ? b.first : ((1 - b.last) as 0 | 1);
}

/**
 * Scores one rally. Winning the opponent's serve (a sideout) rotates us one place clockwise
 * before we serve (rule 7.6.2); the opponents rotate the same way when they win our serve.
 */
export function rally(state: MatchState, winner: 'us' | 'them', detail?: RallyDetail): MatchState {
	if (state.finished || setOver(state)) return state;
	const sets = state.sets.map((s, i) =>
		i === state.sets.length - 1 ? { ...s, [winner]: s[winner] + 1 } : s
	);
	const sideout = winner === 'us' && !state.serving;
	const theirSideout = winner === 'them' && state.serving;
	const beach = state.sport === 'beach';
	const record: RallyRecord = {
		set: state.sets.length,
		rotation: state.rotation,
		serving: state.serving,
		won: winner === 'us',
		...(beach && state.serving ? { server: beachServer(state) } : {}),
		...(detail && Object.keys(detail).length ? { detail } : {})
	};
	const next: MatchState = {
		...state,
		log: [...(state.log ?? []), record],
		sets,
		serving: winner === 'us',
		rotation: sideout && !beach ? nextRotation(state.rotation) : state.rotation,
		...(theirSideout && !beach && state.oppRotation !== undefined
			? { oppRotation: nextRotation(state.oppRotation) }
			: {}),
		...(beach && sideout ? { beach: { ...state.beach!, last: beachServer(state) } } : {})
	};
	const won = setsWon(next);
	const need = setsToWin(state.sport);
	return { ...next, finished: won.us === need || won.them === need };
}

/**
 * Starts the next set, from the coach's chosen rotation (or, on the beach, first server: the
 * service order may change between sets). Substitutions and time-outs reset, and the opponents'
 * rotation is unknown again until the coach enters where their setter starts.
 */
export function startSet(
	state: MatchState,
	rotation: RotationNo,
	serving: boolean,
	firstServer: 0 | 1 = 0,
	oppRotation?: RotationNo
): MatchState {
	const { oppRotation: _previous, ...rest } = state;
	return {
		...rest,
		...(oppRotation !== undefined && state.sport !== 'beach' ? { oppRotation } : {}),
		...(state.sport === 'beach'
			? { beach: { first: firstServer, last: serving ? firstServer : undefined } }
			: {}),
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

/** Records where the opponents are, from the zone the coach sees their setter in, or forgets it. */
export function setOpponentRotation(state: MatchState, oppRotation?: RotationNo): MatchState {
	const { oppRotation: _previous, ...rest } = state;
	return oppRotation === undefined ? rest : { ...rest, oppRotation };
}

/** The zone the opponents' setter stands in, when their rotation is known. */
export const oppSetterZone = (state: Pick<MatchState, 'oppRotation'>) =>
	state.oppRotation === undefined ? undefined : setterZoneOf(state.oppRotation);

/**
 * Who serves first in the next set: indoors, in sets 2–4 the team that did not serve first in
 * the previous set (rule 12.1.2); the deciding set starts with a new toss (7.1). On the beach the
 * loser of the first toss chooses in set 2 (beach rule 7.1.2.3), so this is only a default.
 */
export const nextSetServing = (state: MatchState) => !state.servedFirst;

/** Points won on each beach player's serve, out of the rallies they served. */
export function serverStats(log: readonly RallyRecord[]): { served: number; scored: number }[] {
	return ([0, 1] as const).map((p) => {
		const here = log.filter((r) => r.serving && r.server === p);
		return { served: here.length, scored: here.filter((r) => r.won).length };
	});
}

/** Sideouts over all rallies on the opponent's serve. */
export function sideoutTotal(log: readonly RallyRecord[]) {
	const received = log.filter((r) => !r.serving);
	return { received: received.length, sidedOut: received.filter((r) => r.won).length };
}

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

/**
 * A double switch, 5-1 only: when the setter reaches the front row, a hitter comes on for the
 * setter and a second setter for the opposite, so three hitters attack with a back-row setter.
 * The starters return three rotations later, when the setter's spot is back in the back row.
 */
export type DoubleSwitchPlan = {
	/** The rotation it happens in: one with the setter in the front row (4, 5 or 6). */
	rotation: RotationNo;
	/** Bench index of the hitter who comes on for the setter. */
	forSetter: number;
	/** Bench index of the setter who comes on for the opposite. */
	forOpposite: number;
};

/** A back-row specialist who plays a starter's back-row rotations, then gives the spot back. */
export type SpecialistPlan = {
	for: RoleId;
	/** Bench index of the specialist. */
	bench: number;
	rotations: RotationNo[];
};

export type SubPlan = {
	doubleSwitch?: DoubleSwitchPlan;
	specialists: SpecialistPlan[];
};

export const EMPTY_PLAN: SubPlan = { specialists: [] };

export type PlanFault =
	| 'double-switch-system'
	| 'double-switch-row'
	| 'same-bench'
	| 'missing-bench'
	| 'no-rotations'
	| 'not-contiguous'
	| 'starter-twice'
	| 'bench-twice'
	| 'too-many';

/** Substitutions the plan uses in a set: each switch costs the entry and the return. */
export const planSubCount = (plan: SubPlan) =>
	(plan.doubleSwitch ? 4 : 0) + plan.specialists.length * 2;

/** Whether the rotations form one unbroken run in play order, so one entry and one return cover them. */
function contiguous(rotations: readonly RotationNo[]): boolean {
	const set = new Set(rotations);
	if (set.size === 0 || set.size === 6) return false;
	// One run around the ring has exactly one member whose successor lies outside the set.
	return [...set].filter((r) => !set.has(nextRotation(r))).length === 1;
}

/**
 * Why a plan could not be carried out under the team's rules. Rule 15.6 lets a starter leave and
 * return once and a substitute enter once per set, which limits each player to one switch and
 * keeps a specialist's rotations in one run; leagues with freer re-entry only count the total.
 */
export function planFaults(
	plan: SubPlan,
	team: { system: SystemId; benchSize: number; league?: LeagueId }
): PlanFault[] {
	const faults = new Set<PlanFault>();
	const onBench = (b: number) => Number.isInteger(b) && b >= 0 && b < team.benchSize;
	const starters: RoleId[] = [];
	const bench: number[] = [];
	const ds = plan.doubleSwitch;
	if (ds) {
		if (team.system !== '5-1') faults.add('double-switch-system');
		else if (!isFront(zoneOf('5-1', ds.rotation, 'S')!)) faults.add('double-switch-row');
		if (ds.forSetter === ds.forOpposite) faults.add('same-bench');
		if (!onBench(ds.forSetter) || !onBench(ds.forOpposite)) faults.add('missing-bench');
		starters.push('S', 'OPP');
		bench.push(ds.forSetter, ds.forOpposite);
	}
	for (const sp of plan.specialists) {
		if (!onBench(sp.bench)) faults.add('missing-bench');
		if (sp.rotations.length === 0) faults.add('no-rotations');
		else if (!contiguous(sp.rotations)) faults.add('not-contiguous');
		starters.push(sp.for);
		bench.push(sp.bench);
	}
	const rules = leagueOf(team.league);
	if (rules.fivbReentry) {
		if (new Set(starters).size < starters.length) faults.add('starter-twice');
		if (new Set(bench).size < bench.length) faults.add('bench-twice');
	}
	if (planSubCount(plan) > rules.subsPerSet) faults.add('too-many');
	return [...faults];
}

export type PlannedSub = {
	role: RoleId;
	option: SubOption;
	/** Whether a bench player comes on as planned or a starter takes their spot back. */
	kind: 'double-switch' | 'specialist' | 'return';
};

const sameOption = (a: SubOption, b: SubOption) =>
	a.kind === b.kind && (a.kind !== 'bench' || b.kind !== 'bench' || a.bench === b.bench);

/**
 * The substitutions the plan calls for in the current rotation that are still to be made and
 * that the rules allow now: a double switch in its rotation and its reversal once the setter's
 * spot is back in the back row, a specialist on in their rotations and off outside them.
 */
export function plannedSubs(state: MatchState, plan: SubPlan, benchSize: number): PlannedSub[] {
	if (state.sport === 'beach' || state.finished || setOver(state)) return [];
	const out: PlannedSub[] = [];
	const onCourt = (role: RoleId) => state.subs[role]?.sub;
	const push = (role: RoleId, option: SubOption, kind: PlannedSub['kind']) => {
		if (subOptions(state, role, benchSize).some((o) => sameOption(o, option)))
			out.push({ role, option, kind });
	};
	const ds = plan.doubleSwitch;
	if (ds && state.system === '5-1') {
		const setterFront = isFront(zoneOf('5-1', state.rotation, 'S')!);
		for (const [role, bench] of [
			['S', ds.forSetter],
			['OPP', ds.forOpposite]
		] as const) {
			if (state.rotation === ds.rotation && onCourt(role) === undefined)
				push(role, { kind: 'bench', bench }, 'double-switch');
			else if (!setterFront && onCourt(role) === bench) push(role, { kind: 'starter' }, 'return');
		}
	}
	for (const sp of plan.specialists) {
		const due = sp.rotations.includes(state.rotation);
		if (due && onCourt(sp.for) === undefined)
			push(sp.for, { kind: 'bench', bench: sp.bench }, 'specialist');
		else if (!due && onCourt(sp.for) === sp.bench) push(sp.for, { kind: 'starter' }, 'return');
	}
	return out;
}

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

/** Adds to the detail of the last rally, for the "how did it end?" taps after a point. */
export function annotateLast(state: MatchState, patch: RallyDetail): MatchState {
	const log = state.log ?? [];
	if (!log.length) return state;
	const last = log[log.length - 1];
	const detail = { ...last.detail, ...patch };
	return { ...state, log: [...log.slice(0, -1), { ...last, detail }] };
}

export type PlayerStats = {
	kills: number;
	aces: number;
	blocks: number;
	attackErrors: number;
	serveErrors: number;
	blocked: number;
	errors: number;
	passes: number;
	passTotal: number;
};

const emptyStats = (): PlayerStats => ({
	kills: 0,
	aces: 0,
	blocks: 0,
	attackErrors: 0,
	serveErrors: 0,
	blocked: 0,
	errors: 0,
	passes: 0,
	passTotal: 0
});

/** Points won and lost by each player, and their pass ratings, from the rallies with detail. */
export function playerStats(log: readonly RallyRecord[]): Map<PlayerKey, PlayerStats> {
	const out = new Map<PlayerKey, PlayerStats>();
	const of = (key: PlayerKey) => {
		if (!out.has(key)) out.set(key, emptyStats());
		return out.get(key)!;
	};
	const FIELD: Partial<Record<Outcome, keyof PlayerStats>> = {
		kill: 'kills',
		ace: 'aces',
		block: 'blocks',
		'attack-error': 'attackErrors',
		'serve-error': 'serveErrors',
		blocked: 'blocked',
		error: 'errors'
	};
	for (const r of log) {
		const d = r.detail;
		if (!d) continue;
		const field = d.how && FIELD[d.how];
		if (field && d.by) of(d.by)[field]++;
		if (d.pass) {
			const p = of(d.pass.by);
			p.passes++;
			p.passTotal += d.pass.rating;
		}
	}
	return out;
}

/** Team totals by outcome, counting only rallies where the outcome was recorded. */
export function outcomeCounts(log: readonly RallyRecord[]): Partial<Record<Outcome, number>> {
	const out: Partial<Record<Outcome, number>> = {};
	for (const r of log) if (r.detail?.how) out[r.detail.how] = (out[r.detail.how] ?? 0) + 1;
	return out;
}

/** The rally log as CSV, one rally per row with the running score. */
export function logCsv(
	log: readonly RallyRecord[],
	playerName: (key: PlayerKey) => string = (k) => k
): string {
	const rows = ['set,rally,rotation,serving,won,us,them,how,player,passer,pass,server'];
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
		const d = r.detail;
		const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
		rows.push(
			[
				r.set,
				n,
				r.rotation,
				r.serving ? 1 : 0,
				r.won ? 1 : 0,
				score.us,
				score.them,
				d?.how ?? '',
				d?.by ? cell(playerName(d.by)) : '',
				d?.pass ? cell(playerName(d.pass.by)) : '',
				d?.pass?.rating ?? '',
				r.server !== undefined ? cell(playerName(`p${r.server}`)) : ''
			].join(',')
		);
	}
	return rows.join('\n') + '\n';
}
