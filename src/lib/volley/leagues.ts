/**
 * Rule sets that change what the tools show. Each value was checked against the rule set's own
 * book (page links in the guide on leagues); NFHS's book is not public, so its values come from
 * USA Volleyball's published comparison and state-association interpretations.
 */
export type LeagueId =
	'fivb' | 'england' | 'scotland' | 'northern-ireland' | 'hungary' | 'ncaa' | 'nfhs' | 'usav';
export const LEAGUE_IDS: readonly LeagueId[] = [
	'fivb',
	'england',
	'scotland',
	'northern-ireland',
	'hungary',
	'ncaa',
	'nfhs',
	'usav'
];

export type League = {
	/** Whether the serving team must also be in rotational order at the serve. */
	servingOverlap: boolean;
	/** Whether the libero may serve, in one position of the service order. */
	liberoServes: boolean;
	subsPerSet: number;
	timeoutsPerSet: number;
	/**
	 * FIVB rule 15.6: a starter may leave once and come back once, to the same position, for the
	 * player who replaced them. The other rule sets allow more re-entries within the team limit.
	 */
	fivbReentry: boolean;
};

const FIVB: League = {
	servingOverlap: false,
	liberoServes: false,
	subsPerSet: 6,
	timeoutsPerSet: 2,
	fivbReentry: true
};

export const LEAGUES: Record<LeagueId, League> = {
	// The home nations' and Hungary's competitions play the FIVB rules, 7.4 included; their own
	// regulations change only competition matters (see src/lib/rulesets.ts).
	england: FIVB,
	scotland: FIVB,
	'northern-ireland': FIVB,
	hungary: FIVB,
	// FIVB 2025–2028: rules 7.4, 19.3.1.3, 15.1, 15.6.
	fivb: {
		servingOverlap: false,
		liberoServes: false,
		subsPerSet: 6,
		timeoutsPerSet: 2,
		fivbReentry: true
	},
	// NCAA women's 2026–27: rules 10.3.1, 12.1.2.3, 11.3.2 (15 in Division I; 18 in II and III), 11.2.
	ncaa: {
		servingOverlap: true,
		liberoServes: true,
		subsPerSet: 15,
		timeoutsPerSet: 2,
		fivbReentry: false
	},
	// NFHS (US high school): 18 substitutions, libero serves in one position.
	nfhs: {
		servingOverlap: true,
		liberoServes: true,
		subsPerSet: 18,
		timeoutsPerSet: 2,
		fivbReentry: false
	},
	// USA Volleyball 2025–2027 domestic: 7.4, 19.3.1.3b, 15.1 (a competition may lower it to 6).
	usav: {
		servingOverlap: true,
		liberoServes: true,
		subsPerSet: 15,
		timeoutsPerSet: 2,
		fivbReentry: false
	}
};

/** Rule sets grouped by where people play, for the "where do you play?" picker. */
export type RegionId = 'world' | 'uk' | 'hungary' | 'us';
export const REGIONS: readonly { id: RegionId; leagues: readonly LeagueId[] }[] = [
	{ id: 'world', leagues: ['fivb'] },
	{ id: 'uk', leagues: ['england', 'scotland', 'northern-ireland'] },
	{ id: 'hungary', leagues: ['hungary'] },
	{ id: 'us', leagues: ['ncaa', 'nfhs', 'usav'] }
];

export const leagueOf = (id: LeagueId | undefined): League => LEAGUES[id ?? 'fivb'] ?? LEAGUES.fivb;
