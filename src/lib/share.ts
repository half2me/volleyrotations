import type { Team } from '#lib/teams.svelte.js';
import { LEAGUE_IDS } from '#lib/volley/leagues.js';

/**
 * Teams travel in the URL fragment (`#team=…`), which never reaches the server: the static site
 * has none, and the link works offline once the site is cached.
 */
const PREFIX = 'team=';

const toBase64Url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

const fromBase64Url = (s: string) =>
	Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export function shareFragment(team: Team): string {
	const { id: _id, ...rest } = team;
	return PREFIX + toBase64Url(new TextEncoder().encode(JSON.stringify(rest)));
}

/** The team in a fragment, with a fresh id, or undefined when there is none or it is unreadable. */
export function teamFromFragment(hash: string): Team | undefined {
	const raw = hash.replace(/^#/, '');
	if (!raw.startsWith(PREFIX)) return undefined;
	try {
		const data = JSON.parse(new TextDecoder().decode(fromBase64Url(raw.slice(PREFIX.length))));
		if (!data || typeof data !== 'object' || typeof data.name !== 'string') return undefined;
		if (!['5-1', '6-2', '4-2', '6-6'].includes(data.system)) return undefined;
		const one = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
			allowed.includes(value as T) ? (value as T) : fallback;
		return {
			...data,
			players: data.players && typeof data.players === 'object' ? data.players : {},
			bench: Array.isArray(data.bench) ? data.bench : [],
			libero: data.libero !== false,
			formation: one(data.formation, [3, 4, 5] as const, 3),
			defense: one(data.defense, ['perimeter', 'rotational', 'middle-up'] as const, 'perimeter'),
			start: one(data.start, [1, 2, 3, 4, 5, 6] as const, 1),
			league: one(data.league, LEAGUE_IDS, 'fivb'),
			order: one(data.order, ['oh-first', 'mb-first'] as const, 'oh-first'),
			liberoZone: one(data.liberoZone, [5, 6] as const, 5),
			custom: cleanCustom(data.custom),
			id: Math.random().toString(36).slice(2, 10)
		} as Team;
	} catch {
		return undefined;
	}
}

const onCourt = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 9;

/** Keeps only complete, numeric receive positions: anything else falls back to the computed ones. */
function cleanCustom(custom: unknown): Team['custom'] {
	if (!custom || typeof custom !== 'object') return undefined;
	const out: NonNullable<Team['custom']> = {};
	for (const [r, zones] of Object.entries(custom)) {
		if (!['1', '2', '3', '4', '5', '6'].includes(r) || !zones || typeof zones !== 'object')
			continue;
		const z = zones as Record<string, { x?: unknown; y?: unknown }>;
		const ok = ['1', '2', '3', '4', '5', '6'].every((k) => onCourt(z[k]?.x) && onCourt(z[k]?.y));
		if (ok) out[Number(r) as 1] = zones as NonNullable<Team['custom']>[1];
	}
	return out;
}
