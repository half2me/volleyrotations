import type { LeagueId } from '#lib/volley/leagues.js';

/**
 * What each rule set is based on, its official documents, and where it differs from the FIVB
 * rules, each point with the document it comes from. Checked November 2026; competitions change
 * their regulations every season, so each entry names the edition it was read from.
 */
type Text = { en: string; hu: string };
type Source = { label: string; url: string };
export type Point = { text: Text; source: Source };

export type RuleSet = {
	body: string;
	basis: Text;
	documents: Source[];
	/** Rules of the game that differ from FIVB. */
	differences: Point[];
	/** Competition matters set by the federation, which the FIVB rules leave to organisers. */
	competition: Point[];
};

const FIVB_RULES: Source = {
	label: 'FIVB Official Volleyball Rules 2025–2028',
	url: 'https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf'
};
const NVL: Source = {
	label: 'Volleyball England National Competition Regulations 2026–27',
	url: 'https://www.volleyballengland.org/uploads/docs/26-27%20NVL%20Regulation%20FINAL%20.pdf'
};
const VE_JUNIOR: Source = {
	label: 'Volleyball England Junior National Competition Regulations 2026–27',
	url: 'https://www.volleyballengland.org/uploads/docs/Junior%20Competitions%20Regulations%202026-27.pdf'
};
const SCOT: Source = {
	label: 'Rules of Scottish Volleyball Competitions, 55th edition (2025–26)',
	url: 'https://scottishvolleyball.org/wp-content/uploads/2024/06/Rules-of-Scottish-Volleyball-Competitions-55th-Edition-Approved-by-Board-Aug-25-1.pdf'
};
const NI: Source = {
	label: 'NI Volleyball League Rules 2025–26',
	url: 'https://nivolleyball.com/wp-content/uploads/2025/11/NI-League-Rules-2025-2026.pdf'
};
const MRSZ_RULES: Source = {
	label: 'A röplabdázás hivatalos játékszabályai 2025–2028 (MRSZ)',
	url: 'https://hunvolleyhu.b-cdn.net/wp-content/uploads/A-roplabdazas-hivatalos-jatekszabalyai-2025-2028.pdf'
};
const MRSZ_NB1: Source = {
	label: 'MRSZ Női felnőtt NB I versenykiírás 2026–2027',
	url: 'https://hunvolleyhu.b-cdn.net/wp-content/uploads/Noi-NB-I-Felnott-2026-2027-versenykiiras.pdf'
};
const MRSZ_U14: Source = {
	label: 'MRSZ U14 Országos Mini Bajnokság versenykiírás 2026–2027',
	url: 'https://hunvolleyhu.b-cdn.net/wp-content/uploads/U14-Orszagos-Mini-Bajnoksag-2026-2027-versenykiiras.pdf'
};
const MRSZ_U12: Source = {
	label: 'MRSZ U12 Országos Kismini Bajnokság versenykiírás 2026–2027',
	url: 'https://hunvolleyhu.b-cdn.net/wp-content/uploads/U12-Orszagos-Kismini-bajnoksag-2026-2027-versenykiiras.pdf'
};
const NCAA: Source = {
	label: 'NCAA Women’s Volleyball Rules',
	url: 'https://ncaaorg.s3.amazonaws.com/championships/sports/volleyball/rules/women/PRWVB_RulesBook.pdf'
};
const USAV: Source = {
	label: 'USA Volleyball Indoor Rules 2025–2027',
	url: 'https://usavolleyball.org/wp-content/uploads/2023/03/2025-2027-USAV-Indoor-Rules-Book_FINAL.pdf'
};
const COMPARISON: Source = {
	label: 'NCAA, NFHS and USAV rule comparison (2026)',
	url: 'https://www.whsaa.org/Officials/updates/2026_RuleComparison_NCAA-NFHS-USAV.pdf'
};

const SERVING_ORDER: Text = {
	en: 'The serving team must also be in rotational order at the serve (the server excepted). FIVB checks only the receiving team.',
	hu: 'A nyitó csapatnak is állásrendben kell állnia a nyitáskor (a nyitó kivételével). Az FIVB csak a fogadó csapatot ellenőrzi.'
};
const LIBERO_SERVES: Text = {
	en: 'The libero may serve, in one position of the service order. FIVB does not allow it.',
	hu: 'A liberó nyithat, a nyitási sorrend egy helyén. Az FIVB ezt nem engedi.'
};
const SECOND_HIT: Text = {
	en: 'A double contact in one attempt on the team’s second hit is allowed if a teammate plays the ball next.',
	hu: 'A csapat második érintésénél egy kísérleten belüli kettős érintés megengedett, ha utána csapattárs játssza meg a labdát.'
};

export const RULE_SETS: Record<LeagueId, RuleSet> = {
	fivb: {
		body: 'FIVB',
		basis: {
			en: 'The international rules, used at world and continental level and as the base of most national competitions.',
			hu: 'A nemzetközi szabályok, amelyeket világ- és kontinensszinten használnak, és a legtöbb nemzeti verseny alapjául szolgálnak.'
		},
		documents: [
			FIVB_RULES,
			{
				label: 'FIVB rules page',
				url: 'https://www.fivb.com/volleyball/the-game/official-volleyball-rules/'
			},
			{ label: 'FIVB Casebook 2025', url: 'https://inside.cev.eu/media/n40ey4ap/casebook-2025.pdf' }
		],
		differences: [],
		competition: []
	},
	england: {
		body: 'Volleyball England',
		basis: {
			en: 'Plays the FIVB rules: the National Volleyball League (NVL) regulations say the rules of the game are those issued by the FIVB. Its rules FAQ for 2025–26 confirms that the serving team may stand anywhere at the serve.',
			hu: 'Az FIVB-szabályok szerint játszik: a National Volleyball League (NVL) versenyszabályzata szerint a játékszabályok az FIVB által kiadottak; a 2025–26-os szabály-GYIK megerősíti, hogy a nyitó csapat nyitáskor bárhol állhat.'
		},
		documents: [
			NVL,
			VE_JUNIOR,
			{
				label: 'Volleyball England rules FAQ 2025–26',
				url: 'https://www.volleyballengland.org/uploads/docs/FAQ%2025-26%20Season%20-%20Rules%20and%20Regulations%20v2%20Dec%2025.pdf'
			},
			FIVB_RULES
		],
		differences: [],
		competition: [
			{
				text: {
					en: 'NVL matches: best of five sets; up to 12 players plus up to 2 liberos on the team sheet.',
					hu: 'NVL-mérkőzések: öt játszmára, három nyert játszmáig; a jegyzőkönyvben legfeljebb 12 játékos és legfeljebb 2 liberó.'
				},
				source: NVL
			},
			{
				text: {
					en: 'Junior net heights (girls / boys): U14 2.17 / 2.24 m, U15–U16 2.24 / 2.35 m, U17–U18 2.24 / 2.43 m. Tier 1 junior matches are best of three (25, 25, 15).',
					hu: 'Utánpótlás hálómagasság (lányok / fiúk): U14 2,17 / 2,24 m, U15–U16 2,24 / 2,35 m, U17–U18 2,24 / 2,43 m. Az első szintű utánpótlás-mérkőzések két nyert játszmáig tartanak (25, 25, 15).'
				},
				source: VE_JUNIOR
			},
			{
				text: {
					en: 'Volley 4’s (U14 tier 2): four against four on a badminton-size court, usually three timed sets of about 8 minutes, and a rotation after three serves in a row.',
					hu: 'Volley 4’s (U14, második szint): négy a négy ellen tollaslabdapálya méretű pályán, általában három, nagyjából 8 perces játszma, és forgás három egymást követő nyitás után.'
				},
				source: VE_JUNIOR
			}
		]
	},
	scotland: {
		body: 'Scottish Volleyball',
		basis: {
			en: 'Plays the FIVB rules unless the Scottish competition rules say otherwise; they change only competition matters.',
			hu: 'Az FIVB-szabályok szerint játszik, hacsak a skót versenyszabályok másként nem rendelkeznek; ezek csak versenyügyeket módosítanak.'
		},
		documents: [SCOT, FIVB_RULES],
		differences: [],
		competition: [
			{
				text: {
					en: 'Scottish Volleyball League: best of five sets. Junior league: three sets to 21.',
					hu: 'Skót bajnokság: öt játszmára, három nyert játszmáig. Utánpótlás-bajnokság: három játszma 21 pontig.'
				},
				source: SCOT
			},
			{
				text: {
					en: 'Junior net heights: U19 and U17 men 2.43 m, U15 men 2.24 m, all women 2.24 m. A squad of 13 or 14 must include two liberos.',
					hu: 'Utánpótlás hálómagasság: U19 és U17 férfi 2,43 m, U15 férfi 2,24 m, minden női korosztály 2,24 m. 13 vagy 14 fős keretben két liberó kötelező.'
				},
				source: SCOT
			}
		]
	},
	'northern-ireland': {
		body: 'Volleyball Northern Ireland',
		basis: {
			en: 'The NI league rules refer to the rules of the game without changing them, so the FIVB rules apply.',
			hu: 'Az északír bajnokság szabályai a játékszabályokra hivatkoznak, azokat nem módosítják, így az FIVB-szabályok érvényesek.'
		},
		documents: [NI, FIVB_RULES],
		differences: [],
		competition: [
			{
				text: {
					en: 'League matches: best of five sets.',
					hu: 'Bajnoki mérkőzések: öt játszmára, három nyert játszmáig.'
				},
				source: NI
			}
		]
	},
	hungary: {
		body: 'Magyar Röplabda Szövetség (MRSZ)',
		basis: {
			en: 'Plays the FIVB rules in the federation’s official Hungarian translation, including the 2025 serving-team rule.',
			hu: 'Az FIVB-szabályok szerint játszik, a szövetség hivatalos magyar fordításában, a nyitó csapatra vonatkozó 2025-ös szabállyal együtt.'
		},
		documents: [
			MRSZ_RULES,
			{
				label: 'Játékvezetői irányelvek és instrukciók 2025 (MRSZ)',
				url: 'https://hunvolleyhu.b-cdn.net/wp-content/uploads/Jatekvezetoi-iranyelvek-es-instrukciok-2025.pdf'
			},
			MRSZ_NB1,
			{
				label: 'MRSZ Férfi felnőtt NB I versenykiírás 2026–2027',
				url: 'https://hunvolleyhu.b-cdn.net/wp-content/uploads/Ferfi-NB-I-Felnott-2026-2027-versenykiiras.pdf'
			}
		],
		differences: [
			{
				text: {
					en: 'With 13 players on the scoresheet a team may name one or two liberos, and two with 14. In FIVB’s own senior competitions a team with more than 12 players must name two.',
					hu: '13 játékossal a jegyzőkönyvben egy vagy két liberó nevezhető, 14 játékossal kettő. Az FIVB saját felnőtt versenyein 12-nél több játékos esetén kettő kötelező.'
				},
				source: MRSZ_NB1
			}
		],
		competition: [
			{
				text: {
					en: 'Women’s NB I: at least four Hungarian players (five for reserve teams) must be on court in every rally.',
					hu: 'Női NB I: minden labdamenetben legalább négy (fiókcsapatoknál öt) magyar játékosnak kell a pályán lennie.'
				},
				source: MRSZ_NB1
			},
			{
				text: {
					en: 'U14 mini: four against four on a 14 × 7 m court, net 2.20 m (boys) / 2.17 m (girls), with a forced rotation after a run of serves.',
					hu: 'U14 mini: négy a négy ellen 14 × 7 m-es pályán, 2,20 m-es (fiúk) / 2,17 m-es (lányok) hálóval, nyitássorozat utáni kötelező forgással.'
				},
				source: MRSZ_U14
			},
			{
				text: {
					en: 'U12 kismini: three against three on a 12 × 6 m court, net 2.15 m (boys) / 2.10 m (girls), at least two contacts per side and no spiking (tips, blocks and jump sets are allowed).',
					hu: 'U12 kismini: három a három ellen 12 × 6 m-es pályán, 2,15 m-es (fiúk) / 2,10 m-es (lányok) hálóval, oldalanként legalább két érintéssel, leütés nélkül (ejtés, sánc és légikosár megengedett).'
				},
				source: MRSZ_U12
			}
		]
	},
	ncaa: {
		body: 'NCAA',
		basis: {
			en: 'US college volleyball has its own rulebook, close to FIVB on most points.',
			hu: 'Az amerikai egyetemi röplabdának saját szabálykönyve van, amely a legtöbb ponton közel áll az FIVB-hez.'
		},
		documents: [NCAA, COMPARISON],
		differences: [
			{ text: SERVING_ORDER, source: NCAA },
			{ text: LIBERO_SERVES, source: NCAA },
			{
				text: {
					en: 'Up to 15 substitutions per set in Division I (18 in Divisions II and III), with unlimited entries within that limit.',
					hu: 'Játszmánként legfeljebb 15 csere a Division I-ben (18 a Division II-ben és III-ban), ezen belül korlátlan visszacseréléssel.'
				},
				source: NCAA
			},
			{
				text: {
					en: 'Time-outs last 75 seconds by default.',
					hu: 'A pihenőidő alapesetben 75 másodperc.'
				},
				source: NCAA
			},
			{ text: SECOND_HIT, source: COMPARISON },
			{
				text: {
					en: 'A ball touching a ceiling at least 4.6 m high above the playable area of the team that touched it can stay in play.',
					hu: 'A labda játékban maradhat, ha legalább 4,6 m magas mennyezethez ér az őt érintő csapat játékterülete felett.'
				},
				source: COMPARISON
			}
		],
		competition: []
	},
	nfhs: {
		body: 'NFHS',
		basis: {
			en: 'US high-school volleyball has its own rulebook, which is not published openly; these points come from the national comparison of the US rule codes.',
			hu: 'Az amerikai középiskolai röplabdának saját, nem nyilvános szabálykönyve van; ezek a pontok az amerikai szabályrendszerek országos összehasonlításából származnak.'
		},
		documents: [COMPARISON],
		differences: [
			{ text: SERVING_ORDER, source: COMPARISON },
			{ text: LIBERO_SERVES, source: COMPARISON },
			{
				text: {
					en: 'Up to 18 substitutions per set.',
					hu: 'Játszmánként legfeljebb 18 csere.'
				},
				source: COMPARISON
			},
			{
				text: {
					en: 'Almost any contact with the net is a fault, not only while playing the ball.',
					hu: 'Szinte minden hálóérintés hiba, nem csak a labda megjátszása közben.'
				},
				source: COMPARISON
			},
			{
				text: {
					en: 'A serve that is entirely above the net may not be attacked from anywhere on the court.',
					hu: 'A teljes terjedelmével a háló felett lévő nyitást a pálya egyetlen pontjáról sem szabad megtámadni.'
				},
				source: COMPARISON
			},
			{ text: SECOND_HIT, source: COMPARISON }
		],
		competition: []
	},
	usav: {
		body: 'USA Volleyball',
		basis: {
			en: 'USA Volleyball publishes the FIVB rules with its own domestic changes.',
			hu: 'A USA Volleyball az FIVB-szabályokat saját hazai módosításaival adja ki.'
		},
		documents: [USAV, COMPARISON],
		differences: [
			{ text: SERVING_ORDER, source: USAV },
			{ text: LIBERO_SERVES, source: USAV },
			{
				text: {
					en: 'Up to 15 substitutions per set (a competition may lower it to 6).',
					hu: 'Játszmánként legfeljebb 15 csere (a verseny 6-ra csökkentheti).'
				},
				source: USAV
			},
			{ text: SECOND_HIT, source: COMPARISON },
			{
				text: {
					en: 'A ball touching a ceiling at least 4.6 m high above the playable area of the team that touched it can stay in play.',
					hu: 'A labda játékban maradhat, ha legalább 4,6 m magas mennyezethez ér az őt érintő csapat játékterülete felett.'
				},
				source: COMPARISON
			}
		],
		competition: []
	}
};
