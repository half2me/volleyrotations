/**
 * The volleyball model every tool shares: zones, systems, roles and who stands where in each
 * rotation. Coordinates are metres on our half of the court, seen from behind our own end line:
 * x runs 0–9 from the left sideline to the right, y runs 0–9 from the net to the end line.
 *
 * Kept free of Paraglide and Svelte imports so the Playwright suite can load it directly.
 */

export type Zone = 1 | 2 | 3 | 4 | 5 | 6;
export const ZONES: readonly Zone[] = [1, 2, 3, 4, 5, 6];
export const FRONT_ZONES: readonly Zone[] = [4, 3, 2];
export const BACK_ZONES: readonly Zone[] = [5, 6, 1];

export type Point = { x: number; y: number };

export const COURT = { width: 9, depth: 9, attackLine: 3 } as const;

/** The centre of each zone, used wherever a player has no better place to be. */
export const ZONE_CENTRE: Record<Zone, Point> = {
	4: { x: 1.5, y: 1.5 },
	3: { x: 4.5, y: 1.5 },
	2: { x: 7.5, y: 1.5 },
	5: { x: 1.5, y: 6 },
	6: { x: 4.5, y: 6 },
	1: { x: 7.5, y: 6 }
};

export const isFront = (zone: Zone) => zone === 2 || zone === 3 || zone === 4;

/** Rule 7.4.2.1: each back-row zone is paired with the front-row zone in front of it. */
export const COLUMN_PAIRS: readonly [front: Zone, back: Zone][] = [
	[4, 5],
	[3, 6],
	[2, 1]
];

/** Rule 7.4.2.2: within a row, left to right. */
export const ROW_ORDER: readonly [left: Zone, right: Zone][] = [
	[4, 3],
	[3, 2],
	[5, 6],
	[6, 1]
];

export type SystemId = '5-1' | '6-2' | '4-2' | '6-6';
export const SYSTEMS: readonly SystemId[] = ['5-1', '6-2', '4-2', '6-6'];

export type RoleId =
	| 'S'
	| 'S1'
	| 'S2'
	| 'OH1'
	| 'OH2'
	| 'MB1'
	| 'MB2'
	| 'OPP'
	| 'P1'
	| 'P2'
	| 'P3'
	| 'P4'
	| 'P5'
	| 'P6'
	| 'L';

/** What a role does, independent of the system's labels. */
export type RoleKind = 'setter' | 'outside' | 'middle' | 'opposite' | 'libero' | 'all-round';

export const ROLE_KIND: Record<RoleId, RoleKind> = {
	S: 'setter',
	S1: 'setter',
	S2: 'setter',
	OH1: 'outside',
	OH2: 'outside',
	MB1: 'middle',
	MB2: 'middle',
	OPP: 'opposite',
	P1: 'all-round',
	P2: 'all-round',
	P3: 'all-round',
	P4: 'all-round',
	P5: 'all-round',
	P6: 'all-round',
	L: 'libero'
};

export type SystemDef = {
	id: SystemId;
	/** Roles standing in zones 1–6 in rotation 1 (index 0 is zone 1). */
	lineup: readonly RoleId[];
	/** Whether a libero normally plays in this system. */
	libero: boolean;
	/** Which of two setters sets: the one in the back row (6-2) or the front row (4-2). */
	setterRow?: 'front' | 'back';
	receiveFormations: readonly ReceiveFormation[];
};

export type ReceiveFormation = 3 | 4 | 5;

export const SYSTEM: Record<SystemId, SystemDef> = {
	'5-1': {
		id: '5-1',
		lineup: ['S', 'OH1', 'MB1', 'OPP', 'OH2', 'MB2'],
		libero: true,
		receiveFormations: [3, 4, 5]
	},
	'6-2': {
		id: '6-2',
		lineup: ['S1', 'OH1', 'MB1', 'S2', 'OH2', 'MB2'],
		libero: true,
		setterRow: 'back',
		receiveFormations: [3, 4, 5]
	},
	'4-2': {
		id: '4-2',
		lineup: ['S1', 'OH1', 'MB1', 'S2', 'OH2', 'MB2'],
		libero: true,
		setterRow: 'front',
		receiveFormations: [3, 4, 5]
	},
	'6-6': {
		id: '6-6',
		lineup: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
		libero: false,
		receiveFormations: [5]
	}
};

/** Roles a player can pick in a system, in the order the picker shows them. */
export function rolesOf(system: SystemId, libero: boolean): RoleId[] {
	const def = SYSTEM[system];
	const order: RoleId[] =
		system === '6-6'
			? [...def.lineup]
			: system === '5-1'
				? ['S', 'OPP', 'OH1', 'OH2', 'MB1', 'MB2']
				: ['S1', 'S2', 'OH1', 'OH2', 'MB1', 'MB2'];
	return libero && def.libero ? [...order, 'L'] : order;
}

/**
 * Rotations are numbered in play order, starting with the first setter (or player 1) serving
 * from zone 1: rotation 2 has them in zone 6, rotation 3 in zone 5, and so on.
 */
export type RotationNo = 1 | 2 | 3 | 4 | 5 | 6;
export const ROTATIONS: readonly RotationNo[] = [1, 2, 3, 4, 5, 6];

/** Rule 7.6.2: one clockwise step moves zone 2 to 1, 1 to 6, 6 to 5 and so on. */
export const rotateZone = (zone: Zone, steps = 1): Zone =>
	(((((zone - 1 - steps) % 6) + 6) % 6) + 1) as Zone;

/** The zone of the first setter in a rotation, which is how coaches often name rotations. */
export const setterZoneOf = (rotation: RotationNo): Zone => rotateZone(1, rotation - 1);

/**
 * Who follows the setter in the service order: the usual lineup has an outside hitter there
 * ("outside first"); some teams put a middle there instead, which swaps every outside with the
 * middle beside them. The setters and opposite keep their places either way.
 */
export type LineupOrder = 'oh-first' | 'mb-first';
export const LINEUP_ORDERS: readonly LineupOrder[] = ['oh-first', 'mb-first'];

const MB_FIRST: Partial<Record<RoleId, RoleId>> = {
	OH1: 'MB1',
	MB1: 'OH1',
	OH2: 'MB2',
	MB2: 'OH2'
};

/** The roles in zones 1–6 in rotation 1 (index 0 is zone 1). */
export function lineupOf(system: SystemId, order: LineupOrder = 'oh-first'): readonly RoleId[] {
	const lineup = SYSTEM[system].lineup;
	return order === 'mb-first' ? lineup.map((r) => MB_FIRST[r] ?? r) : lineup;
}

/** Which role stands in each zone in a rotation, before any libero replacement. */
export function zonesInRotation(
	system: SystemId,
	rotation: RotationNo,
	order: LineupOrder = 'oh-first'
): Record<Zone, RoleId> {
	const lineup = lineupOf(system, order);
	const out = {} as Record<Zone, RoleId>;
	lineup.forEach((role, i) => {
		out[rotateZone((i + 1) as Zone, rotation - 1)] = role;
	});
	return out;
}

/** The role's zone in a rotation. */
export function zoneOf(
	system: SystemId,
	rotation: RotationNo,
	role: RoleId,
	order: LineupOrder = 'oh-first'
): Zone | undefined {
	const zones = zonesInRotation(system, rotation, order);
	return ZONES.find((z) => zones[z] === role);
}

/** The player who sets in this rotation. */
export function setterOf(system: SystemId, rotation: RotationNo): RoleId {
	const zones = zonesInRotation(system, rotation);
	if (system === '5-1') return 'S';
	if (system === '6-6') return zones[3];
	const s1Front = isFront(zoneOf(system, rotation, 'S1')!);
	const wantFront = SYSTEM[system].setterRow === 'front';
	return s1Front === wantFront ? 'S1' : 'S2';
}

/**
 * After the serve, players switch to the spot of their speciality. The court is split into six
 * slots: front left/middle/right and back left/middle/right.
 */
export type Slot = 'FL' | 'FM' | 'FR' | 'BL' | 'BM' | 'BR';

const ZONE_SLOT: Record<Zone, Slot> = { 4: 'FL', 3: 'FM', 2: 'FR', 5: 'BL', 6: 'BM', 1: 'BR' };

/**
 * Where the libero (or a back-row middle) defends: left back (zone 5) or middle back (zone 6).
 * The back-row outside takes the other spot.
 */
export type LiberoZone = 5 | 6;

export function slotOf(
	system: SystemId,
	zone: Zone,
	role: RoleId,
	liberoZone: LiberoZone = 5
): Slot {
	if (system === '6-6') return ZONE_SLOT[zone];
	const front = isFront(zone);
	switch (ROLE_KIND[role]) {
		case 'outside':
			return front ? 'FL' : liberoZone === 6 ? 'BL' : 'BM';
		case 'middle':
		case 'libero':
			return front ? 'FM' : liberoZone === 6 ? 'BM' : 'BL';
		default:
			// Setters and opposites play on the right.
			return front ? 'FR' : 'BR';
	}
}

/** One player on court in a rotation. `role` is who is there, `zone` their rotational spot. */
export type OnCourt = {
	role: RoleId;
	zone: Zone;
	slot: Slot;
	/** The middle a libero stands in for. */
	replaces?: RoleId;
};

export type Situation = {
	system: SystemId;
	rotation: RotationNo;
	/** Whether our team serves (true) or receives (false). */
	serving: boolean;
	libero: boolean;
	order?: LineupOrder;
	liberoZone?: LiberoZone;
	/**
	 * The middle the libero also serves for, where the league allows a libero to serve in one
	 * position of the service order. FIVB rules never allow it.
	 */
	liberoServesFor?: RoleId;
};

/**
 * The six players on court. The libero takes the back-row middle's place, except when that
 * middle serves: under FIVB rules the libero cannot serve (rule 19.3.1.3). Leagues that let the
 * libero serve in one position set `liberoServesFor`.
 */
export function lineupOnCourt({
	system,
	rotation,
	serving,
	libero,
	order,
	liberoZone,
	liberoServesFor
}: Situation): OnCourt[] {
	const zones = zonesInRotation(system, rotation, order);
	const useLibero = libero && SYSTEM[system].libero;
	return ZONES.map((zone) => {
		const role = zones[zone];
		const slot = slotOf(system, zone, role, liberoZone);
		const middleInBack = ROLE_KIND[role] === 'middle' && !isFront(zone);
		const middleServes = serving && zone === 1 && liberoServesFor !== role;
		if (useLibero && middleInBack && !middleServes) {
			return { role: 'L', zone, slot, replaces: role };
		}
		return { role, zone, slot };
	});
}
