import { Persisted } from '#lib/persisted.svelte.js';
import type { DefenseSystem, Options } from '#lib/volley/formations.js';
import { leagueOf, type LeagueId } from '#lib/volley/leagues.js';
import type { SubPlan } from '#lib/volley/match.js';
import type {
	LiberoZone,
	LineupOrder,
	Point,
	ReceiveFormation,
	RoleId,
	RotationNo,
	SystemId,
	Zone
} from '#lib/volley/model.js';

export type Member = { name: string; number: string };

export type Team = {
	id: string;
	name: string;
	system: SystemId;
	libero: boolean;
	formation: ReceiveFormation;
	defense: DefenseSystem;
	/** The rotation the team starts the set in. */
	start: RotationNo;
	players: Partial<Record<RoleId, Member>>;
	bench: Member[];
	/** Playbook choices; older saved teams lack them and get the defaults. */
	league?: LeagueId;
	order?: LineupOrder;
	liberoZone?: LiberoZone;
	keepSides?: boolean;
	liberoServesFor?: RoleId;
	formationBy?: Partial<Record<RotationNo, ReceiveFormation>>;
	custom?: Partial<Record<RotationNo, Partial<Record<Zone, Point>>>>;
	/** Planned substitutions for the match tracker; teams saved before the planner have none. */
	plan?: SubPlan;
};

/** The playbook settings every choice a team makes, for the formation engine. */
export type Playbook = Pick<
	Options,
	| 'system'
	| 'libero'
	| 'formation'
	| 'defense'
	| 'order'
	| 'liberoZone'
	| 'keepSides'
	| 'liberoServesFor'
	| 'formationBy'
	| 'custom'
	| 'servingOverlap'
>;

/** A team's playbook, with the league deciding what the rules allow. */
export function teamPlaybook(team: Team): Playbook {
	const league = leagueOf(team.league);
	return {
		system: team.system,
		libero: team.libero,
		formation: team.formation,
		defense: team.defense,
		order: team.order,
		liberoZone: team.liberoZone,
		keepSides: team.keepSides,
		liberoServesFor: league.liberoServes && team.libero ? team.liberoServesFor : undefined,
		formationBy: team.formationBy,
		custom: team.custom,
		servingOverlap: league.servingOverlap
	};
}

export const newTeam = (name: string): Team => ({
	id: Math.random().toString(36).slice(2, 10),
	name,
	system: '5-1',
	libero: true,
	formation: 3,
	defense: 'perimeter',
	start: 1,
	players: {},
	bench: [],
	league: 'fivb'
});

/** Every team the reader has set up, kept in their browser, and which one is open. */
export const teams = new Persisted<{ list: Team[]; active?: string }>('vr:teams', { list: [] });

/** The short label for a player's token: their shirt number, else nothing. */
export const numberOf = (team: Team, role: RoleId) =>
	team.players[role]?.number?.trim() || undefined;

/** A player's name with their number, or the fallback (usually the role's name). */
export function memberLabel(member: Member | undefined, fallback: string): string {
	const name = member?.name.trim();
	const number = member?.number.trim();
	if (name && number) return `#${number} ${name}`;
	return name || (number ? `#${number}` : fallback);
}
