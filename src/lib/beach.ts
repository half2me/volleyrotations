import { RULES_PDF } from '#lib/situations.js';

/**
 * How beach volleyball differs from indoor, each point with the rule and PDF page in both FIVB
 * rulebooks (2025–2028 editions). Page numbers are PDF pages, for `#page=N` links.
 */
type Text = { en: string; hu: string };
export type RuleRef = { rule: string; page: number };

export const BEACH_RULES_PDF =
	'https://www.fivb.com/wp-content/uploads/2025/02/FIVB-BeachVolleyball_Rules2025_2028-EN-v01.pdf';
export { RULES_PDF };

export type Difference = {
	id: string;
	topic: Text;
	indoor: Text;
	beach: Text;
	indoorRule?: RuleRef;
	beachRule?: RuleRef;
};

export const DIFFERENCES: Difference[] = [
	{
		id: 'players',
		topic: { en: 'Players', hu: 'Játékosok' },
		indoor: {
			en: 'Six on court, up to 12 on the score sheet (14 at senior FIVB events), and a libero.',
			hu: 'Hatan a pályán, a jegyzőkönyvben legfeljebb 12 játékos (felnőtt FIVB-eseményen 14), és libero.'
		},
		beach: {
			en: 'Two players, and only two: no substitutes and no libero.',
			hu: 'Két játékos, és csak kettő: nincs cserejátékos és nincs libero.'
		},
		indoorRule: { rule: '4.1.1', page: 19 },
		beachRule: { rule: '4.1.1', page: 18 }
	},
	{
		id: 'court',
		topic: { en: 'Court', hu: 'Pálya' },
		indoor: {
			en: '18 × 9 m on a hard floor, with a centre line and attack lines.',
			hu: '18 × 9 m kemény talajon, középvonallal és támadóvonalakkal.'
		},
		beach: {
			en: '16 × 8 m on sand at least 40 cm deep (FIVB events), with no centre line and no attack line.',
			hu: '16 × 8 m, legalább 40 cm mély homokon (FIVB-eseményen), középvonal és támadóvonal nélkül.'
		},
		indoorRule: { rule: '1.1', page: 14 },
		beachRule: { rule: '1.1, 1.3', page: 14 }
	},
	{
		id: 'ball',
		topic: { en: 'Ball', hu: 'Labda' },
		indoor: {
			en: '65–67 cm round, pumped hard: 0.300–0.325 kg/cm².',
			hu: '65–67 cm kerületű, keményre fújva: 0,300–0,325 kg/cm².'
		},
		beach: {
			en: 'Slightly bigger (66–68 cm) and much softer: 0.175–0.225 kg/cm². Same weight, 260–280 g.',
			hu: 'Kicsit nagyobb (66–68 cm) és jóval puhább: 0,175–0,225 kg/cm². A tömege ugyanaz, 260–280 g.'
		},
		indoorRule: { rule: '3.1', page: 18 },
		beachRule: { rule: '3.1', page: 17 }
	},
	{
		id: 'scoring',
		topic: { en: 'Scoring', hu: 'Pontozás' },
		indoor: {
			en: 'Best of five sets: sets to 25, the fifth to 15, each won by two points.',
			hu: 'Három nyert szettig: a szettek 25 pontig, az ötödik 15-ig tart, két pont különbséggel.'
		},
		beach: {
			en: 'Best of three sets: sets to 21, the third to 15, each won by two points.',
			hu: 'Két nyert szettig: a szettek 21 pontig, a harmadik 15-ig tart, két pont különbséggel.'
		},
		indoorRule: { rule: '6.2–6.3', page: 24 },
		beachRule: { rule: '6.2–6.3', page: 22 }
	},
	{
		id: 'sides',
		topic: { en: 'Changing sides', hu: 'Térfélcsere' },
		indoor: {
			en: 'After each set, and in the deciding set once the leading team reaches 8 points.',
			hu: 'Minden szett után, a döntő szettben pedig, amikor a vezető csapat eléri a 8 pontot.'
		},
		beach: {
			en: 'Every 7 points played in sets 1 and 2, every 5 in set 3, because of wind and sun.',
			hu: 'Az 1. és 2. szettben minden 7 lejátszott pont után, a 3. szettben 5 után, a szél és a nap miatt.'
		},
		indoorRule: { rule: '18.2', page: 43 },
		beachRule: { rule: '18.2.1', page: 35 }
	},
	{
		id: 'timeouts',
		topic: { en: 'Time-outs', hu: 'Időkérések' },
		indoor: {
			en: 'Two per team per set, 30 seconds each.',
			hu: 'Szettenként csapatonként kettő, egyenként 30 másodperc.'
		},
		beach: {
			en: 'One per team per set, 30 seconds. At FIVB World and Official competitions, also a 30-second technical time-out when the points played in set 1 or 2 add up to 21.',
			hu: 'Szettenként csapatonként egy, 30 másodperc. FIVB világ- és hivatalos versenyeken az 1. és 2. szettben ezen felül 30 másodperces technikai időkérés, amikor a lejátszott pontok összege 21.'
		},
		indoorRule: { rule: '15.1, 15.4.1', page: 38 },
		beachRule: { rule: '15.4', page: 32 }
	},
	{
		id: 'positions',
		topic: { en: 'Positions and rotation', hu: 'Posztok és forgás' },
		indoor: {
			en: 'Players rotate and must stand in rotational order when the ball is served: the overlap rule.',
			hu: 'A játékosok forognak, és az adogatás pillanatában a forgási sorrendben kell állniuk (felállási hiba).'
		},
		beach: {
			en: 'No fixed positions and no overlap faults. Only the serve order is fixed: when the team wins the serve back, the player who did not serve last time serves.',
			hu: 'Nincsenek kötött helyek és nincs felállási hiba. Csak az adogatási sorrend kötött: amikor a csapat visszaszerzi az adogatást, az a játékos adogat, aki legutóbb nem.'
		},
		indoorRule: { rule: '7.4', page: 27 },
		beachRule: { rule: '7.4–7.6, 12.2', page: 23 }
	},
	{
		id: 'serve',
		topic: { en: 'Serve time', hu: 'Adogatási idő' },
		indoor: {
			en: '8 seconds after the whistle.',
			hu: 'A sípszó után 8 másodperc.'
		},
		beach: {
			en: '5 seconds after the whistle.',
			hu: 'A sípszó után 5 másodperc.'
		},
		indoorRule: { rule: '12.4.4', page: 34 },
		beachRule: { rule: '12.4.4', page: 29 }
	},
	{
		id: 'block',
		topic: { en: 'The block', hu: 'A sánc' },
		indoor: {
			en: 'A block touch does not count as one of the team’s three hits.',
			hu: 'A sáncérintés nem számít bele a csapat három érintésébe.'
		},
		beach: {
			en: 'A block touch counts as the first of three hits, and the blocker may play the next one.',
			hu: 'A sáncérintés a három érintés közül az első, és a sáncoló játszhatja meg a következőt is.'
		},
		indoorRule: { rule: '14.4.1', page: 37 },
		beachRule: { rule: '14.4', page: 31 }
	},
	{
		id: 'tip',
		topic: { en: 'Tipping', hu: 'Ejtés' },
		indoor: {
			en: 'An open-hand tip over the net is legal.',
			hu: 'A nyitott kezes ejtés a háló fölött szabályos.'
		},
		beach: {
			en: 'An attack with open fingers is a fault. Players poke with rigid, closed fingertips, or roll the ball with the palm or knuckles.',
			hu: 'Nyitott ujjakkal támadni hiba. A játékosok merev, zárt ujjhegyekkel bökik meg a labdát, vagy tenyérrel, ököllel gurítják át.'
		},
		beachRule: { rule: '13.2.3', page: 30 }
	},
	{
		id: 'overhand',
		topic: { en: 'Setting over the net', hu: 'Kosárérintés a hálón át' },
		indoor: {
			en: 'Players may set the ball over the net in any direction.',
			hu: 'A labdát bármely irányba át lehet kosarazni a hálón.'
		},
		beach: {
			en: 'An overhand pass over the net must travel straight out from the line of the shoulders, unless the player was setting their partner.',
			hu: 'A hálón át kosárérintéssel csak a vállak vonalára merőlegesen lehet játszani, hacsak a játékos nem a társának emelt.'
		},
		beachRule: { rule: '13.2.5', page: 30 }
	},
	{
		id: 'first',
		topic: { en: 'First ball', hu: 'Első érintés' },
		indoor: {
			en: 'On the team’s first hit, consecutive contacts in one action are allowed, however the ball is played.',
			hu: 'A csapat első érintésénél az egy mozdulaton belüli egymás utáni érintések megengedettek, bárhogyan játsszák meg a labdát.'
		},
		beach: {
			en: 'Consecutive contacts in one action are allowed on the first hit, but not when it is played overhand with the fingers. Against a hard-driven ball, an overhand finger contact may last a moment longer.',
			hu: 'Az első érintésnél az egy mozdulaton belüli egymás utáni érintések megengedettek, de kosárérintésnél nem. Erős ütésből érkező labdánál a kosárérintés egy pillanatig tovább tarthat.'
		},
		indoorRule: { rule: '9.2.3.2', page: 31 },
		beachRule: { rule: '9.2.2.2, 9.2.2.4', page: 26 }
	},
	{
		id: 'centre',
		topic: { en: 'Under the net', hu: 'A háló alatt' },
		indoor: {
			en: 'A foot may touch the opponent’s court only if part of it stays on or above the centre line.',
			hu: 'A láb csak akkor érhet az ellenfél térfelére, ha egy része a középvonalon vagy fölötte marad.'
		},
		beach: {
			en: 'There is no centre line: a player may cross into the opponent’s court as long as they do not interfere with play.',
			hu: 'Nincs középvonal: a játékos átléphet az ellenfél térfelére, ha nem zavarja a játékot.'
		},
		indoorRule: { rule: '11.2.2', page: 32 },
		beachRule: { rule: '11.2.1', page: 27 }
	},
	{
		id: 'coaching',
		topic: { en: 'Coaching', hu: 'Edzői irányítás' },
		indoor: {
			en: 'The coach directs the team from the bench and calls time-outs and substitutions.',
			hu: 'Az edző a kispadról irányít, ő kér időt és cserét.'
		},
		beach: {
			en: 'No coaching during FIVB World and Official matches: the players decide everything themselves. Age-group events may allow it.',
			hu: 'FIVB világ- és hivatalos versenyeken nincs edzői irányítás a mérkőzés alatt: a játékosok mindenről maguk döntenek. Korosztályos versenyeken engedélyezhetik.'
		},
		indoorRule: { rule: '5.2.3', page: 22 },
		beachRule: { rule: '4.1.4', page: 18 }
	}
];

/**
 * Net heights by age group, from the beach rules (2.1.2). The indoor rules give only the senior
 * heights; age-group indoor nets are set by each federation.
 */
export const NET_HEIGHTS = [
	{ id: 'men', height: 2.43 },
	{ id: 'women', height: 2.24 },
	{ id: 'u16', height: 2.24 },
	{ id: 'u14', height: 2.12 },
	{ id: 'u12', height: 2.0 }
] as const;
