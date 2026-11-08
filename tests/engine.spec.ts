import { expect, test } from '@playwright/test';
import {
	ATTACKS_FROM,
	byZone,
	DEFAULT_OPTIONS,
	DEFENSE_SYSTEMS,
	formation,
	SET_TO,
	setsAvailable,
	type Options,
	type Phase
} from '../src/lib/volley/formations.ts';
import {
	logCsv,
	longestRuns,
	newMatch,
	rally,
	rotationStats,
	setOver,
	setWinner,
	subOptions,
	subsPerSet,
	substitute,
	timeoutsPerSet
} from '../src/lib/volley/match.ts';
import { ROLE_KIND, ROTATIONS, SYSTEM, SYSTEMS, ZONES } from '../src/lib/volley/model.ts';
import { overlapFaults } from '../src/lib/volley/overlap.ts';

const PHASES: Phase[] = ['receive', 'serve', 'base', 'defense', 'attack', 'cover'];

for (const system of SYSTEMS) {
	for (const formationSize of SYSTEM[system].receiveFormations) {
		for (const libero of [true, false]) {
			test(`${system} ${formationSize}-player receive (libero ${libero}) is legal in every rotation`, () => {
				for (const rotation of ROTATIONS) {
					const placed = formation(
						{ ...DEFAULT_OPTIONS, system, rotation, libero, formation: formationSize },
						'receive'
					);
					const at = byZone(placed);
					expect(overlapFaults(at), `rotation ${rotation}`).toEqual([]);
					expect(new Set(placed.map((p) => p.role)).size).toBe(6);
				}
			});
		}
	}

	test(`${system} serving team is legal under the pre-2025 rule`, () => {
		for (const rotation of ROTATIONS) {
			for (const defense of DEFENSE_SYSTEMS) {
				const placed = formation(
					{ ...DEFAULT_OPTIONS, system, rotation, defense, servingOverlap: true, serving: true },
					'serve'
				);
				const at = byZone(placed);
				expect(overlapFaults(at, [1]), `rotation ${rotation} ${defense}`).toEqual([]);
			}
		}
	});

	test(`${system} every phase keeps all players on or behind the court`, () => {
		for (const rotation of ROTATIONS)
			for (const defense of DEFENSE_SYSTEMS)
				for (const attackFrom of ATTACKS_FROM)
					for (const phase of PHASES)
						for (const serving of [true, false]) {
							const placed = formation(
								{ ...DEFAULT_OPTIONS, system, rotation, defense, attackFrom, serving },
								phase
							);
							expect(placed.map((p) => p.zone).sort()).toEqual([...ZONES]);
							for (const p of placed) {
								// Wing hitters start their approach just outside the sidelines.
								expect(p.x).toBeGreaterThanOrEqual(-0.5);
								expect(p.x).toBeLessThanOrEqual(9.5);
								expect(p.y).toBeGreaterThanOrEqual(0);
								expect(p.y).toBeLessThanOrEqual(10.5);
							}
						}
	});
}

test('the setter hides out of the passers’ way in serve receive', () => {
	// Coaches' rule, not the rulebook: a back-row setter waits at the net behind the player in
	// front of them, or along the right sideline from zone 1, never among the passers.
	for (const system of SYSTEMS)
		for (const f of SYSTEM[system].receiveFormations)
			for (const libero of [true, false])
				for (const rotation of ROTATIONS) {
					const placed = formation(
						{ ...DEFAULT_OPTIONS, system, rotation, libero, formation: f },
						'receive'
					);
					const s = placed.find((p) => p.setter)!;
					const where = `${system} ${f}-player rotation ${rotation}: setter at ${s.x.toFixed(1)},${s.y.toFixed(1)}`;
					if ([2, 3, 4].includes(s.zone)) expect(s.y, where).toBeLessThanOrEqual(1.5);
					else expect(s.y <= 2.5 || s.x >= 8.2, where).toBe(true);
				}
});

test('no two players are drawn on the same spot', () => {
	for (const system of SYSTEMS)
		for (const rotation of ROTATIONS)
			for (const serving of [true, false])
				for (const phase of PHASES)
					for (const f of SYSTEM[system].receiveFormations) {
						const placed = formation(
							{ ...DEFAULT_OPTIONS, system, rotation, serving, formation: f },
							phase
						);
						for (const a of placed)
							for (const b of placed)
								if (a !== b)
									expect(
										Math.hypot(a.x - b.x, a.y - b.y),
										`${system} ${phase} rotation ${rotation}: ${a.role} and ${b.role}`
									).toBeGreaterThan(0.9);
					}
});

test('the libero never serves', () => {
	for (const rotation of ROTATIONS) {
		const placed = formation({ ...DEFAULT_OPTIONS, rotation, serving: true }, 'serve');
		expect(placed.find((p) => p.task === 'serve')?.role).not.toBe('L');
	}
});

test('the 5-1 setter sets in every rotation', () => {
	for (const rotation of ROTATIONS) {
		const placed = formation({ ...DEFAULT_OPTIONS, rotation }, 'attack');
		expect(placed.find((p) => p.role === 'S')?.task).toBe('set');
	}
});

test('a sideout rotates the team and gives it the serve', () => {
	let s = newMatch({ system: '5-1', libero: true, rotation: 1, serving: false });
	s = rally(s, 'us');
	expect(s.rotation).toBe(2);
	expect(s.serving).toBe(true);
	s = rally(s, 'us');
	expect(s.rotation).toBe(2);
	s = rally(s, 'them');
	expect(s.serving).toBe(false);
	expect(s.sets[0]).toEqual({ us: 2, them: 1 });
	s = rally(s, 'us');
	expect(s.rotation).toBe(3);
});

test('a set needs 25 points and a two-point lead, the fifth set 15', () => {
	let s = newMatch({ system: '5-1', libero: true, rotation: 1, serving: true });
	for (let i = 0; i < 24; i++) s = rally(rally(s, 'us'), 'them');
	expect(setOver(s)).toBe(false);
	s = rally(s, 'us');
	expect(setOver(s)).toBe(false);
	s = rally(s, 'us');
	expect(setOver(s)).toBe(true);
	expect(setWinner({ us: 15, them: 13 }, 4)).toBe('us');
	expect(setWinner({ us: 15, them: 13 }, 3)).toBeUndefined();
});

test('substitutions follow rule 15.6', () => {
	let s = newMatch({ system: '5-1', libero: true, rotation: 1, serving: true });
	expect(subOptions(s, 'OH1', 2)).toHaveLength(2);
	s = substitute(s, 'OH1', { kind: 'bench', bench: 0 });
	// The substitute can only be replaced by the starter, and bench player 0 is used up.
	expect(subOptions(s, 'OH1', 2)).toEqual([{ kind: 'starter' }]);
	expect(subOptions(s, 'OH2', 2)).toEqual([{ kind: 'bench', bench: 1 }]);
	s = substitute(s, 'OH1', { kind: 'starter' });
	expect(subOptions(s, 'OH1', 2)).toEqual([]);
	expect(s.subCount).toBe(2);
});

const TEAM_VARIANTS: Partial<Options>[] = [
	{ order: 'mb-first' },
	{ liberoZone: 6 },
	{ order: 'mb-first', liberoZone: 6 },
	{ keepSides: false }
];

for (const variant of TEAM_VARIANTS)
	for (const system of SYSTEMS)
		test(`${system} with ${JSON.stringify(variant)} keeps every formation legal, spaced and sensible`, () => {
			for (const f of SYSTEM[system].receiveFormations)
				for (const libero of [true, false])
					for (const rotation of ROTATIONS)
						for (const serving of [true, false])
							for (const phase of PHASES) {
								const o = { ...DEFAULT_OPTIONS, ...variant, system, rotation, libero, serving };
								const placed = formation({ ...o, formation: f }, phase);
								const where = `${JSON.stringify(variant)} ${system} ${f} libero ${libero} ${phase} rotation ${rotation}`;
								expect(new Set(placed.map((p) => p.role)).size, where).toBe(6);
								if (phase === 'receive') {
									expect(overlapFaults(byZone(placed)), where).toEqual([]);
									const s = placed.find((p) => p.setter)!;
									if ([2, 3, 4].includes(s.zone)) expect(s.y, where).toBeLessThanOrEqual(1.5);
									else expect(s.y <= 2.5 || s.x >= 8.2, where).toBe(true);
									// A player shielding the setter does not pass, so a five-player
									// formation can have four.
									const passing = placed.filter((p) => p.task === 'pass').length;
									expect(passing, where).toBeGreaterThanOrEqual(Math.min(f, 3));
									expect(passing, where).toBeLessThanOrEqual(f);
								}
								for (const a of placed)
									for (const b of placed)
										if (a !== b)
											expect(
												Math.hypot(a.x - b.x, a.y - b.y),
												`${where}: ${a.role} ${b.role}`
											).toBeGreaterThan(0.9);
								expect(placed.find((p) => p.role === 'L')?.task ?? 'cover', where).not.toBe(
									'attack'
								);
							}
		});

test('with the middle following the setter, outsides and middles trade places', () => {
	const zones = formation({ ...DEFAULT_OPTIONS, libero: false, order: 'mb-first' }, 'receive');
	const at = (role: string) => zones.find((p) => p.role === role)!.zone;
	expect([at('S'), at('MB1'), at('OH1'), at('OPP'), at('MB2'), at('OH2')]).toEqual([
		1, 2, 3, 4, 5, 6
	]);
});

test('the libero serves only where the league allows it, for the chosen middle', () => {
	for (const rotation of ROTATIONS) {
		const o = { ...DEFAULT_OPTIONS, rotation, serving: true, liberoServesFor: 'MB2' as const };
		const placed = formation(o, 'serve');
		const server = placed.find((p) => p.task === 'serve')!;
		if (server.role === 'L') expect(server.replaces).toBe('MB2');
		else expect(server.role).not.toBe('MB2');
	}
});

test('a team’s own receive positions are used only while they are legal', () => {
	const auto = formation(DEFAULT_OPTIONS, 'receive');
	const custom = byZone(auto);
	custom[6] = { x: custom[6].x + 0.3, y: custom[6].y };
	const used = formation({ ...DEFAULT_OPTIONS, custom: { 1: custom } }, 'receive');
	expect(byZone(used)[6]).toEqual(custom[6]);
	const illegal = { ...custom, 1: custom[2], 2: custom[1] };
	const ignored = formation({ ...DEFAULT_OPTIONS, custom: { 1: illegal } }, 'receive');
	expect(byZone(ignored)).toEqual(byZone(auto));
});

test('rotation statistics count sideouts and points on serve', () => {
	let s = newMatch({ system: '5-1', libero: true, rotation: 1, serving: false });
	s = rally(s, 'them'); // receiving in rotation 1, lost
	s = rally(s, 'us'); // sideout in rotation 1, now serving in rotation 2
	s = rally(s, 'us'); // point on serve in rotation 2
	s = rally(s, 'us');
	const stats = rotationStats(s.log);
	expect(stats[0]).toMatchObject({ received: 2, sidedOut: 1, served: 0 });
	expect(stats[1]).toMatchObject({ served: 2, scored: 2, received: 0 });
	expect(longestRuns(s.log)).toEqual({ us: 3, them: 1 });
	expect(logCsv(s.log).trim().split('\n')).toHaveLength(5);
});

test('league limits drive substitutions and time-outs', () => {
	const fivb = newMatch({ system: '5-1', libero: true, rotation: 1, serving: true });
	const ncaa = newMatch({
		system: '5-1',
		libero: true,
		rotation: 1,
		serving: true,
		league: 'ncaa'
	});
	expect(subsPerSet(fivb)).toBe(6);
	expect(subsPerSet(ncaa)).toBe(15);
	expect(timeoutsPerSet(ncaa)).toBe(2);
	// FIVB: a starter who came back cannot leave again; NCAA counts only the total.
	let f = substitute(fivb, 'OH1', { kind: 'bench', bench: 0 });
	f = substitute(f, 'OH1', { kind: 'starter' });
	expect(subOptions(f, 'OH1', 2)).toEqual([]);
	let n = substitute(ncaa, 'OH1', { kind: 'bench', bench: 0 });
	n = substitute(n, 'OH1', { kind: 'starter' });
	expect(subOptions(n, 'OH1', 2)).toHaveLength(2);
});

test('free balls, down balls, coverage and a setter dig are spaced and follow the rules', () => {
	const variants: Partial<Options>[] = [
		{ incoming: 'free' },
		{ incoming: 'down' },
		{ setterDug: true },
		...SET_TO.map((setTo) => ({ setTo }))
	];
	for (const variant of variants)
		for (const system of SYSTEMS)
			for (const rotation of ROTATIONS)
				for (const libero of [true, false])
					for (const serving of [true, false])
						for (const phase of ['defense', 'attack', 'cover'] as Phase[]) {
							const o = { ...DEFAULT_OPTIONS, ...variant, system, rotation, libero, serving };
							const placed = formation(o, phase);
							const where = `${JSON.stringify(variant)} ${system} ${phase} rotation ${rotation} libero ${libero}`;
							expect(new Set(placed.map((p) => p.role)).size, where).toBe(6);
							for (const a of placed)
								for (const b of placed)
									if (a !== b)
										expect(
											Math.hypot(a.x - b.x, a.y - b.y),
											`${where}: ${a.role} ${b.role}`
										).toBeGreaterThan(0.9);
							const l = placed.find((p) => p.role === 'L');
							expect(l?.task, where).not.toBe('attack');
							// A libero who sets does it from behind the 3 m line (rule 19.3.1.4).
							if (l?.setter && phase === 'attack') expect(l.y, where).toBeGreaterThanOrEqual(3);
							expect(placed.filter((p) => p.setter).length, where).toBe(1);
							if (phase === 'cover') {
								expect(placed.filter((p) => p.task === 'attack').length, where).toBe(1);
								expect(placed.filter((p) => p.task === 'cover').length, where).toBe(5);
							}
							if (phase === 'defense' && o.incoming === 'free')
								expect(placed.filter((p) => p.task === 'pass').length, where).toBe(5);
						}
});

test('the cover moment attacks with the hitter the reader chose', () => {
	for (const rotation of ROTATIONS) {
		const o = { ...DEFAULT_OPTIONS, rotation };
		for (const setTo of setsAvailable(o)) {
			const hitter = formation({ ...o, setTo }, 'cover').find((p) => p.task === 'attack')!;
			if (setTo === 'middle') expect(ROLE_KIND[hitter.role], `${rotation} ${setTo}`).toBe('middle');
			if (setTo === 'right') expect(hitter.x).toBeGreaterThan(6);
			if (setTo === 'left') expect(hitter.x).toBeLessThan(3);
		}
	}
});
