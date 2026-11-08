import { Persisted } from '#lib/persisted.svelte.js';
import type { DefenseSystem } from '#lib/volley/formations.js';
import type { ReceiveFormation, RoleId, RotationNo, SystemId } from '#lib/volley/model.js';

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
};

export const newTeam = (name: string): Team => ({
	id: Math.random().toString(36).slice(2, 10),
	name,
	system: '5-1',
	libero: true,
	formation: 3,
	defense: 'perimeter',
	start: 1,
	players: {},
	bench: []
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
