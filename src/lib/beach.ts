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
			en: 'Six on court, and up to 12 players on the score sheet (14 at senior FIVB events), up to two of them liberos.',
			hu: 'Hatan vannak a pályán, a jegyzőkönyvben legfeljebb 12 játékos szerepelhet (felnőtt FIVB-eseményen 14), köztük legfeljebb két liberó.'
		},
		beach: {
			en: 'Two players, and only two: no substitutes and no libero.',
			hu: 'Két játékos, és csak kettő: nincs cserejátékos és nincs liberó.'
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
		beachRule: { rule: '1.1–1.3', page: 14 }
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
			hu: 'Három nyert játszmáig: a játszmák 25 pontig, az ötödik 15-ig tart, mindegyik két pont különbséggel.'
		},
		beach: {
			en: 'Best of three sets: sets to 21, the third to 15, each won by two points.',
			hu: 'Két nyert játszmáig: a játszmák 21 pontig, a harmadik 15-ig tart, mindegyik két pont különbséggel.'
		},
		indoorRule: { rule: '6.2–6.3', page: 24 },
		beachRule: { rule: '6.2–6.3', page: 22 }
	},
	{
		id: 'sides',
		topic: { en: 'Changing sides', hu: 'Térfélcsere' },
		indoor: {
			en: 'After each set except before the deciding set (a new toss decides the sides), and in the deciding set once the leading team reaches 8 points.',
			hu: 'Minden játszma után, kivéve a döntő játszma előtt (ott új sorsolás dönt), a döntő játszmában pedig akkor, amikor a vezető csapat eléri a 8 pontot.'
		},
		beach: {
			en: 'Every 7 points played in sets 1 and 2, and every 5 in set 3, so that both teams share the wind and sun.',
			hu: 'Az első két játszmában minden hét lejátszott pont után, a harmadikban minden öt után, hogy a szél és a nap mindkét csapatot egyformán érje.'
		},
		indoorRule: { rule: '18.2', page: 43 },
		beachRule: { rule: '18.2.1', page: 35 }
	},
	{
		id: 'timeouts',
		topic: { en: 'Time-outs', hu: 'Pihenőidők' },
		indoor: {
			en: 'Two per team per set, 30 seconds each.',
			hu: 'Csapatonként és játszmánként kettő, egyenként 30 másodperc.'
		},
		beach: {
			en: 'One per team per set, 30 seconds. At FIVB World and Official competitions there is also a 30-second technical time-out in sets 1 and 2, when the two teams’ points add up to 21.',
			hu: 'Csapatonként és játszmánként egy, 30 másodperc. FIVB világ- és hivatalos versenyeken az első két játszmában ezen felül 30 másodperces technikai pihenőidő is jár, amikor a két csapat pontjainak összege 21.'
		},
		indoorRule: { rule: '15.1, 15.4.1', page: 38 },
		beachRule: { rule: '15.1, 15.4', page: 32 }
	},
	{
		id: 'positions',
		topic: { en: 'Positions and rotation', hu: 'Posztok és forgás' },
		indoor: {
			en: 'Players rotate, and the receiving team must stand in rotational order when the ball is served: the overlap rule. The serving team may stand anywhere in its own court.',
			hu: 'A játékosok forognak, és a fogadó csapatnak a nyitás pillanatában a forgási sorrendben kell állnia, különben állásrendi hibát vét. A nyitó csapat a saját térfelén bárhol állhat.'
		},
		beach: {
			en: 'No fixed positions and no overlap faults. Only the serve order is fixed: when the team wins the serve back, the player who did not serve last time serves.',
			hu: 'Nincsenek kötött helyek és nincs állásrendi hiba. Csak a nyitási sorrend kötött: amikor a csapat visszaszerzi a nyitásjogot, az a játékos nyit, aki legutóbb nem nyitott.'
		},
		indoorRule: { rule: '7.4', page: 27 },
		beachRule: { rule: '7.4–7.6, 12.2', page: 23 }
	},
	{
		id: 'serve',
		topic: { en: 'Serve time', hu: 'Nyitási idő' },
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
			en: 'Completing an attack with an open-handed finger action is a fault; fingertips must be rigid and held together. Players tip with stiff fingertips or with their knuckles instead.',
			hu: 'Hiba, ha a játékos nyitott kézzel, ujjakkal irányítva fejezi be a támadást; az ujjhegyeknek merevnek és összezártnak kell lenniük. Ejteni ezért merev ujjhegyekkel vagy behajlított ujjakkal, ujjpercekkel szokás.'
		},
		beachRule: { rule: '13.2.3', page: 30 }
	},
	{
		id: 'overhand',
		topic: { en: 'Setting over the net', hu: 'Kosárérintés a hálón át' },
		indoor: {
			en: 'Players may set the ball over the net in any direction.',
			hu: 'Kosárérintéssel bármely irányba át lehet játszani a labdát a hálón.'
		},
		beach: {
			en: 'An overhand pass sent over the net as an attack must travel at right angles to the line of the shoulders, unless the player was trying to set their partner.',
			hu: 'Kosárérintéssel a hálón át csak a vállak vonalára merőlegesen lehet támadni, kivéve, ha a játékos a társának akart feladni.'
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
			en: 'Consecutive contacts in one action are allowed on the first hit, but not when it is played overhand with the fingers. When digging a hard-driven ball, an overhand finger contact may last a moment longer.',
			hu: 'Az első érintésnél az egy mozdulaton belüli egymás utáni érintések megengedettek, de kosárérintésnél nem. Erősen ütött labda védésekor a kosárérintés egy pillanatig tovább tarthat.'
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
			hu: 'Nincs középvonal: a játékos átmehet az ellenfél térfelére, ha nem zavarja az ellenfél játékát.'
		},
		indoorRule: { rule: '11.2.2', page: 32 },
		beachRule: { rule: '11.2.1', page: 27 }
	},
	{
		id: 'coaching',
		topic: { en: 'Coaching', hu: 'Edzői irányítás' },
		indoor: {
			en: 'The coach directs the team from the bench and calls time-outs and substitutions.',
			hu: 'Az edző a kispadról irányít, ő kér pihenőidőt és cserét.'
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
 * Net heights by age group, from the beach rules (2.1.1). The indoor rules give only the senior
 * heights; age-group indoor nets are set by each federation.
 */
export const NET_HEIGHTS = [
	{ id: 'men', height: 2.43 },
	{ id: 'women', height: 2.24 },
	{ id: 'u16', height: 2.24 },
	{ id: 'u14', height: 2.12 },
	{ id: 'u12', height: 2.0 }
] as const;
