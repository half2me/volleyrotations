import type { ExplorerPrefs } from '#lib/prefs.svelte.js';
import {
	ATTACKS_FROM,
	DEFENSE_SYSTEMS,
	INCOMING,
	SET_TO,
	type Phase
} from '#lib/volley/formations.js';
import { LEAGUE_IDS } from '#lib/volley/leagues.js';
import { LINEUP_ORDERS, ROTATIONS, SYSTEMS, rolesOf } from '#lib/volley/model.js';

/**
 * A view of the explorer in the URL fragment, such as
 * `#system=5-1&rotation=4&serving=0&role=OH1&phase=receive`, so a coach can send a player the
 * exact moment to look at. The fragment never reaches a server.
 */
export type View = Partial<ExplorerPrefs> & { phase?: Phase };

const PHASES: readonly Phase[] = ['receive', 'serve', 'base', 'defense', 'attack', 'cover'];

const KEYS = [
	'system',
	'rotation',
	'serving',
	'role',
	'phase',
	'libero',
	'formation',
	'defense',
	'attackFrom',
	'incoming',
	'setTo',
	'setterDug',
	'league',
	'order',
	'liberoZone',
	'keepSides',
	'liberoServesFor'
] as const;

export function viewFragment(view: View): string {
	const params = new URLSearchParams();
	for (const key of KEYS) {
		const value = view[key];
		if (value === undefined) continue;
		params.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
	}
	return params.toString();
}

/** The view in a fragment, keeping only values the explorer knows; undefined if there is none. */
export function viewFromFragment(hash: string): View | undefined {
	const params = new URLSearchParams(hash.replace(/^#/, ''));
	const system = SYSTEMS.find((s) => s === params.get('system'));
	if (!system) return undefined;
	const one = <T extends string | number>(key: string, allowed: readonly T[]): T | undefined =>
		allowed.find((v) => String(v) === params.get(key));
	const flag = (key: string) =>
		params.get(key) === '1' ? true : params.get(key) === '0' ? false : undefined;
	const view: View = {
		system,
		rotation: one('rotation', ROTATIONS),
		serving: flag('serving'),
		phase: one('phase', PHASES),
		libero: flag('libero'),
		formation: one('formation', [3, 4, 5] as const),
		defense: one('defense', DEFENSE_SYSTEMS),
		attackFrom: one('attackFrom', ATTACKS_FROM),
		incoming: one('incoming', INCOMING),
		setTo: one('setTo', SET_TO),
		setterDug: flag('setterDug'),
		league: one('league', LEAGUE_IDS),
		order: one('order', LINEUP_ORDERS),
		liberoZone: one('liberoZone', [5, 6] as const),
		keepSides: flag('keepSides')
	};
	const roles = rolesOf(system, view.libero ?? true);
	view.role = one('role', roles);
	view.liberoServesFor = one(
		'liberoServesFor',
		roles.filter((r) => r.startsWith('MB'))
	);
	// Leave out what the link did not say, so the reader's own choices stay.
	return Object.fromEntries(Object.entries(view).filter(([, v]) => v !== undefined)) as View;
}
