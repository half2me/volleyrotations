import { expect, test } from '@playwright/test';
import {
	ATTACKS_FROM,
	DEFAULT_OPTIONS,
	DEFENSE_SYSTEMS,
	byZone,
	formation,
	type Phase
} from '../src/lib/volley/formations.ts';
import {
	newMatch,
	rally,
	setOver,
	setWinner,
	subOptions,
	substitute
} from '../src/lib/volley/match.ts';
import { ROTATIONS, SYSTEM, SYSTEMS, ZONES } from '../src/lib/volley/model.ts';
import { overlapFaults } from '../src/lib/volley/overlap.ts';

const PHASES: Phase[] = ['receive', 'serve', 'base', 'defense', 'attack'];

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
								expect(p.x).toBeGreaterThanOrEqual(0);
								expect(p.x).toBeLessThanOrEqual(9);
								expect(p.y).toBeGreaterThanOrEqual(0);
								expect(p.y).toBeLessThanOrEqual(10.5);
							}
						}
	});
}

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
