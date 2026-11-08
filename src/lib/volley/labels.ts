import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import type {
	AttackFrom,
	DefenseSystem,
	Incoming,
	Phase,
	Placed,
	SetTo,
	Task
} from './formations.js';
import { leagueOf, type LeagueId } from './leagues.js';
import {
	COLUMN_PAIRS,
	ROLE_KIND,
	ROW_ORDER,
	isFront,
	setterOf,
	zoneOf,
	type RoleId,
	type RotationNo,
	type Slot,
	type SystemId,
	type Zone
} from './model.js';

const LETTERS: Partial<Record<RoleId, string>> = {
	P1: 'A',
	P2: 'B',
	P3: 'C',
	P4: 'D',
	P5: 'E',
	P6: 'F'
};

const HU_SUFFIX: Record<number, string> = { 1: 'es', 2: 'es', 3: 'as', 4: 'es', 5: 'ös', 6: 'os' };

/**
 * A zone number as it reads inside a sentence. Hungarian attaches a suffix that depends on the
 * number ("3-as zóna", "5-ös zóna"), which a message template cannot pick by itself.
 */
export const zoneRef = (zone: number): string =>
	getLocale() === 'hu' ? `${zone}-${HU_SUFFIX[zone] ?? 'es'}` : String(zone);

/** A system's name as the locale writes it: "5-1" in English, "5:1" in Hungarian. */
export const systemName = (system: SystemId): string =>
	getLocale() === 'hu' ? system.replace('-', ':') : system;

/** The few characters drawn on a player token. */
export function roleShort(role: RoleId): string {
	const letter = LETTERS[role];
	if (letter) return letter;
	const short: Record<string, () => string> = {
		S: m.short_s,
		S1: m.short_s1,
		S2: m.short_s2,
		OH1: m.short_oh1,
		OH2: m.short_oh2,
		MB1: m.short_mb1,
		MB2: m.short_mb2,
		OPP: m.short_opp,
		L: m.short_l
	};
	return short[role]();
}

/**
 * A role's name for use inside a sentence. Hungarian role names are common nouns, written in
 * lower case unless they start the sentence ("a feladó", not "a Feladó").
 */
export const roleInSentence = (role: RoleId): string => {
	const name = roleName(role);
	return getLocale() === 'hu' ? name.charAt(0).toLowerCase() + name.slice(1) : name;
};

/**
 * A role named inside a sentence, with its article in Hungarian, where the article depends on
 * how the name is spoken: "a feladó", "az 1. center" (egy), "az „E” játékos". English needs none.
 */
export function roleRef(role: RoleId): string {
	const name = roleInSentence(role);
	if (getLocale() !== 'hu') return name;
	const spoken = name
		.replace(/^„(.)”/, '$1')
		.replace(/^1\./, 'egy')
		.replace(/^5\./, 'öt');
	return `${/^[aáeéiíoóöőuúüűAEF]/.test(spoken) ? 'az' : 'a'} ${name}`;
}

/** The first letter in upper case, for a reference that starts a sentence. */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function roleName(role: RoleId): string {
	const letter = LETTERS[role];
	if (letter) return m.role_player({ letter });
	const names: Record<string, () => string> = {
		S: m.role_s,
		S1: m.role_s1,
		S2: m.role_s2,
		OH1: m.role_oh1,
		OH2: m.role_oh2,
		MB1: m.role_mb1,
		MB2: m.role_mb2,
		OPP: m.role_opp,
		L: m.role_l
	};
	return names[role]();
}

export const systemDescription = (s: SystemId) =>
	({
		'5-1': m.system_51_desc,
		'6-2': m.system_62_desc,
		'4-2': m.system_42_desc,
		'6-6': m.system_66_desc
	})[s]();

export const leagueName = (l: LeagueId) =>
	({
		fivb: m.league_fivb,
		ncaa: m.league_ncaa,
		nfhs: m.league_nfhs,
		usav: m.league_usav
	})[l]();

export const phaseName = (p: Phase) =>
	({
		receive: m.phase_receive,
		serve: m.phase_serve,
		base: m.phase_base,
		defense: m.phase_defense,
		attack: m.phase_attack,
		cover: m.phase_cover
	})[p]();

export const phaseDescription = (p: Phase, serving: boolean, incoming: Incoming = 'attack') =>
	({
		receive: m.phase_receive_desc,
		serve: m.phase_serve_desc,
		base: m.phase_base_desc,
		defense: {
			attack: m.phase_defense_desc,
			down: m.phase_defense_down_desc,
			free: m.phase_defense_free_desc
		}[incoming],
		attack: serving ? m.phase_transition_desc : m.phase_attack_desc,
		cover: m.phase_cover_desc
	})[p]();

export const incomingName = (i: Incoming) =>
	({ attack: m.incoming_attack, down: m.incoming_down, free: m.incoming_free })[i]();

export const setToName = (s: SetTo) =>
	({
		left: m.set_to_left,
		middle: m.set_to_middle,
		right: m.set_to_right
	})[s]();

export const taskName = (t: Task) =>
	({
		serve: m.task_serve,
		pass: m.task_pass,
		hide: m.task_hide,
		set: m.task_set,
		block: m.task_block,
		dig: m.task_dig,
		tip: m.task_tip,
		attack: m.task_attack,
		cover: m.task_cover,
		base: m.task_base,
		stay: m.task_stay
	})[t]();

const taskDetail = (t: Task) =>
	({
		serve: m.task_serve_you,
		pass: m.task_pass_you,
		hide: m.task_hide_you,
		set: m.task_set_you,
		block: m.task_block_you,
		dig: m.task_dig_you,
		tip: m.task_tip_you,
		attack: m.task_attack_you,
		cover: m.task_cover_you,
		base: m.task_base_you,
		stay: m.task_stay_you
	})[t]();

export const slotName = (s: Slot) =>
	({
		FL: m.slot_fl,
		FM: m.slot_fm,
		FR: m.slot_fr,
		BL: m.slot_bl,
		BM: m.slot_bm,
		BR: m.slot_br
	})[s]();

export const defenseName = (d: DefenseSystem) =>
	({
		perimeter: m.defense_perimeter,
		rotational: m.defense_rotational,
		'middle-up': m.defense_middle_up
	})[d]();

export const attackFromName = (a: AttackFrom) =>
	({
		outside: m.attack_from_outside,
		middle: m.attack_from_middle,
		opposite: m.attack_from_opposite
	})[a]();

/** The zone of the player who sets in a rotation: with two setters, the one setting then. */
export const settingZone = (r: RotationNo, system: SystemId) =>
	zoneOf(system, r, setterOf(system, r))!;

export const rotationLabel = (r: RotationNo, system: SystemId) =>
	system === '6-6'
		? m.rotation_n({ n: r })
		: m.rotation_setter({ n: r, zone: zoneRef(settingZone(r, system)) });

/**
 * Who must stand where relative to the reader's player at the serve (rule 7.4.2). `exempt`
 * leaves out the server, whom the rule never compares.
 */
function overlapNeighbours(you: Placed, everyone: Placed[], exempt: Zone[] = []): string[] {
	const at = (z: Zone) => everyone.find((p) => p.zone === z)!;
	const name = (z: Zone) => m.player_in_zone({ name: roleRef(at(z).role), zone: zoneRef(z) });
	const out: string[] = [];
	for (const [front, back] of COLUMN_PAIRS) {
		if (exempt.includes(front) || exempt.includes(back)) continue;
		if (you.zone === back) out.push(m.rel_behind({ who: name(front) }));
		if (you.zone === front) out.push(m.rel_in_front({ who: name(back) }));
	}
	for (const [left, right] of ROW_ORDER) {
		if (exempt.includes(left) || exempt.includes(right)) continue;
		if (you.zone === right) out.push(m.rel_right_of({ who: name(left) }));
		if (you.zone === left) out.push(m.rel_left_of({ who: name(right) }));
	}
	return out;
}

export type Explanation = {
	task: string;
	detail: string;
	tips: string[];
};

/**
 * What the reader's player does in this moment, as a headline, a sentence and a few tips. The
 * reader may be off court: a middle while the libero plays for them, or the libero while their
 * middle serves.
 */
export function explain(
	o: {
		system: SystemId;
		serving: boolean;
		servingOverlap: boolean;
		libero: boolean;
		league?: LeagueId;
		incoming?: Incoming;
		setterDug?: boolean;
	},
	phase: Phase,
	placed: Placed[],
	role: RoleId
): Explanation {
	const you = placed.find((p) => p.role === role);
	const liberoMayServe = leagueOf(o.league).liberoServes;
	if (!you) {
		if (role === 'L') {
			const middle = placed.find((p) => ROLE_KIND[p.role] === 'middle' && !isFront(p.zone));
			return {
				task: m.off_court(),
				detail: (liberoMayServe ? m.libero_off_serving_league : m.libero_off_serving)({
					middle: middle ? roleInSentence(middle.role) : ''
				}),
				tips: [m.tip_libero_rules()]
			};
		}
		const libero = placed.find((p) => p.replaces === role);
		return {
			task: m.off_court(),
			detail: libero ? m.middle_off({ zone: zoneRef(libero.zone) }) : m.off_court(),
			tips: [m.tip_libero_rules()]
		};
	}

	const tips: string[] = [];
	const front = isFront(you.zone);
	tips.push(
		front
			? m.tip_front_row()
			: you.role === 'L'
				? liberoMayServe
					? m.tip_libero_back_league()
					: m.tip_libero_back()
				: m.tip_back_row()
	);

	if (you.role === 'L' && you.replaces) {
		tips.push(m.tip_libero_replaces({ middle: roleInSentence(you.replaces) }));
	}
	if (phase === 'receive') {
		tips.push(m.tip_overlap({ list: overlapNeighbours(you, placed).join('; ') }));
		if (you.setter && !front) tips.push(m.tip_setter_penetrate());
		if (you.setter && front) tips.push(m.tip_setter_front());
		if (you.task === 'hide') tips.push(m.tip_hide());
	}
	if (phase === 'serve') {
		if (you.task === 'serve') {
			tips.push(m.tip_server({ slot: slotName(you.slot) }));
			if (you.role === 'L' && you.replaces)
				tips.push(m.tip_libero_serves({ middle: roleInSentence(you.replaces) }));
			if (ROLE_KIND[you.role] === 'middle' && o.libero && o.system !== '6-6')
				tips.push(liberoMayServe ? m.tip_middle_serves_league() : m.tip_middle_serves());
		} else if (o.servingOverlap) {
			const list = overlapNeighbours(you, placed, [1]);
			if (list.length) tips.push(m.tip_serving_overlap({ list: list.join('; ') }));
			if (you.run) tips.push(m.tip_switch({ slot: slotName(you.slot) }));
		} else {
			tips.push(m.tip_serving_free());
		}
	}
	if (phase === 'base' && o.system !== '6-6') tips.push(m.tip_base({ slot: slotName(you.slot) }));
	if (phase === 'defense' && o.incoming === 'free') {
		if (you.task === 'pass' && front) tips.push(m.tip_free_front());
		tips.push(m.tip_free_call());
	}
	if (phase === 'defense' && o.incoming === 'down') tips.push(m.tip_down());
	if (phase === 'cover') {
		tips.push(you.task === 'attack' ? m.tip_cover_hitter() : m.tip_cover_pattern());
	}
	if (phase === 'attack' && o.serving && o.setterDug) {
		if (you.task === 'dig' && ROLE_KIND[you.role] === 'setter') tips.push(m.tip_setter_dug());
		if (you.setter && you.role === 'L') tips.push(m.tip_backup_libero());
		else if (you.setter && ROLE_KIND[you.role] !== 'setter') tips.push(m.tip_backup_front());
	}
	if (phase === 'attack') {
		if (you.task === 'attack' && !front) {
			tips.push(you.slot === 'BM' ? m.tip_pipe() : m.tip_back_attack());
		}
		if (you.setter && front && !(o.serving && o.setterDug)) tips.push(m.tip_setter_front());
		if (o.system === '6-6' && you.setter) tips.push(m.tip_66_setter());
		if (you.noSwitch) tips.push(m.tip_no_switch());
		if (o.serving && !o.setterDug) tips.push(m.tip_transition_simplified());
	}
	return { task: taskName(you.task), detail: taskDetail(you.task), tips };
}
