import { Persisted } from '#lib/persisted.svelte.js';
import { teamPlaybook, type Team } from '#lib/teams.svelte.js';
import { DEFAULT_OPTIONS, type Options } from '#lib/volley/formations.js';
import { leagueOf, type LeagueId } from '#lib/volley/leagues.js';
import type { RoleId } from '#lib/volley/model.js';

export type ExplorerPrefs = Options & {
	role: RoleId;
	league: LeagueId;
	/** The saved team whose playbook the explorer and quiz follow, if any. */
	team?: string;
};

/** The explorer's choices, shared with the quiz so both start from the reader's own setup. */
export const explorerPrefs = new Persisted<ExplorerPrefs>('vr:explorer', {
	...DEFAULT_OPTIONS,
	role: 'OH1',
	league: 'fivb'
});

/**
 * The options the formation engine gets: the chosen team's playbook when one is chosen, else the
 * reader's own settings, with the league deciding what the rules allow.
 */
export function effectiveOptions(p: ExplorerPrefs, team?: Team): Options {
	if (team) return { ...p, ...teamPlaybook(team) };
	const league = leagueOf(p.league);
	return {
		...p,
		servingOverlap: league.servingOverlap,
		liberoServesFor: league.liberoServes && p.libero ? p.liberoServesFor : undefined
	};
}
