/**
 * Well-known drills from reputable coaching sources, each linked to where it is described. The
 * descriptions are short summaries; the source has the full drill.
 */
type Text = { en: string; hu: string };

export type DrillTopic =
	| 'sideout'
	| 'transition'
	| 'free-ball'
	| 'coverage'
	| 'setter'
	| 'serving'
	| 'beach-receive'
	| 'beach-setting'
	| 'beach-shots'
	| 'beach-block-defence'
	| 'beach-serving'
	| 'beach-games';
export const DRILL_TOPICS: readonly DrillTopic[] = [
	'sideout',
	'transition',
	'free-ball',
	'coverage',
	'setter',
	'serving'
];
export const BEACH_DRILL_TOPICS: readonly DrillTopic[] = [
	'beach-receive',
	'beach-setting',
	'beach-shots',
	'beach-block-defence',
	'beach-serving',
	'beach-games'
];

export type Drill = {
	id: string;
	topic: DrillTopic;
	name: string;
	purpose: Text;
	how: Text;
	source: { label: string; url: string };
};

export const DRILLS: Drill[] = [
	{
		id: 'wash-table',
		topic: 'sideout',
		name: 'Wash table (one-way)',
		purpose: {
			en: 'Sideout efficiency in every rotation, six against six.',
			hu: 'Fogadásból szerzett pontok aránya minden forgásban, hat a hat ellen.'
		},
		how: {
			en: 'One team serves; every serve is followed by a free ball to the receiving team. Five serves per rotation, then swap. The receivers score: both balls won 20%, one 10%, none 0%. The better efficiency wins the rotation.',
			hu: 'Az egyik csapat nyit, minden nyitás után könnyű labda megy a fogadó csapatnak. Forgásonként öt nyitás, aztán csere. A fogadók pontoznak: mindkét labda megnyerve 20%, egy 10%, egyik sem 0%. A jobb arány nyeri a forgást.'
		},
		source: {
			label: 'Gold Medal Squared',
			url: 'https://www.goldmedalsquared.com/volleyball-drills/wash-table---owd'
		}
	},
	{
		id: 'ten-ball-wash',
		topic: 'sideout',
		name: '10-ball wash',
		purpose: {
			en: 'Sideout plus transition in each rotation.',
			hu: 'Fogadásból támadás és ellentámadás minden forgásban.'
		},
		how: {
			en: 'Each side starts five two-ball segments: serve and serve; serve and free ball; serve and transition on the left; serve and transition on the right; serve and a chase ball. Then the other side starts its ten, and both teams rotate.',
			hu: 'Mindkét oldal öt kétlabdás szakaszt indít: nyitás és nyitás; nyitás és könnyű labda; nyitás és ellentámadás balról; nyitás és ellentámadás jobbról; nyitás és utánfutós labda. Utána a másik oldal indítja a maga tíz labdáját, és mindkét csapat forog.'
		},
		source: {
			label: 'AVCA / Coaches Insider',
			url: 'https://coachesinsider.com/volleyball/10-ball-wash-drill'
		}
	},
	{
		id: 'three-ball',
		topic: 'sideout',
		name: 'Three-ball drill',
		purpose: {
			en: 'Getting through every rotation under late-set pressure.',
			hu: 'Minden forgás végigjátszása szoros játszmavég nyomása alatt.'
		},
		how: {
			en: 'The coach picks three situations per rotation and starts the score at 19-19, 22-19 or 19-22. Win two of the three balls for a point, all three for two. Play to 25: win and move to the next rotation, lose and repeat it.',
			hu: 'Az edző forgásonként három helyzetet választ, és 19:19-ről, 22:19-ről vagy 19:22-ről indítja az eredményt. A három labdából kettő megnyerése egy pont, mind a három kettő. 25-ig játszanak: győzelemmel a következő forgás jön, vereséggel ugyanaz ismétlődik.'
		},
		source: {
			label: 'AVCA / Coaches Insider',
			url: 'https://coachesinsider.com/volleyball/three-ball-drill-building-continuity-within-your-rotations-article'
		}
	},
	{
		id: 'six-in-rotation',
		topic: 'sideout',
		name: 'Six-player drill in every rotation',
		purpose: {
			en: 'Error-free serve receive and first attack in each rotation.',
			hu: 'Hibátlan nyitásfogadás és első támadás minden forgásban.'
		},
		how: {
			en: 'Six players line up in rotation 1 with no opponent and receive a serve. Two perfect plays in a row move the team to the next rotation. Then add a free ball and a down ball in each rotation.',
			hu: 'Hat játékos az 1. forgásban felállva, ellenfél nélkül fogad egy nyitást. Két egymást követő tökéletes megoldás után jön a következő forgás. Később minden forgásban jön egy könnyű és egy állásból ütött labda is.'
		},
		source: {
			label: 'The Art of Coaching Volleyball',
			url: 'https://www.theartofcoachingvolleyball.com/107065-2/'
		}
	},
	{
		id: 'bingo-bango-bongo',
		topic: 'free-ball',
		name: 'Bingo-bango-bongo',
		purpose: {
			en: 'Free-ball transition and winning rallies in a row.',
			hu: 'Ellentámadás könnyű labdából, és egymás utáni labdamenetek megnyerése.'
		},
		how: {
			en: 'Coaches on each side take turns sending free balls, six against six. One rally won is bingo, two in a row bango, three bongo; the bongo team then serves for the big point, and wins it to score and rotate.',
			hu: 'A két oldalon álló edzők felváltva küldenek könnyű labdát, hat a hat ellen. Egy megnyert labdamenet bingo, kettő egymás után bango, három bongo; a bongót elérő csapat ezután a nagy pontért nyit, és ha megnyeri, pontot szerez és forog.'
		},
		source: {
			label: 'Coaching Volleyball (John Forman)',
			url: 'https://coachingvb.com/game-bingo-bango-bongo'
		}
	},
	{
		id: 'team-transition',
		topic: 'transition',
		name: 'Team transition',
		purpose: {
			en: 'Reading the opposing setter and moving from base to defense.',
			hu: 'Az ellenfél feladójának olvasása és mozgás alapállásból védekezésbe.'
		},
		how: {
			en: 'One side stands in base defense. The other side sets ten balls to the left or right side and plays them back. The defending side reads each set, moves to its defensive spots, then returns to base.',
			hu: 'Az egyik oldal alapállásban védekezik. A másik oldal tíz labdát ad fel bal vagy jobb oldalra, és visszajátssza. A védekező oldal minden feladást olvas, a védekezési helyére mozog, aztán visszatér alapállásba.'
		},
		source: {
			label: 'The Volleyball Drill Book (Human Kinetics), via Coaches Insider',
			url: 'https://coachesinsider.com/volleyball/transition-drills-article'
		}
	},
	{
		id: 'coverage',
		topic: 'coverage',
		name: 'Coverage drill',
		purpose: {
			en: 'Covering the hitter, so a ball blocked back stays alive.',
			hu: 'Az ütő biztosítása, hogy a visszasáncolt labda játékban maradjon.'
		},
		how: {
			en: 'A coach starts a rally. Straight after each attack, someone across the net tosses a short ball straight back, and the team must already be in its cup around the hitter to play it.',
			hu: 'Az edző labdamenetet indít. Minden támadás után valaki a háló túloldaláról egy rövid labdát dob vissza, és a csapatnak már az ütő körüli biztosításban kell lennie, hogy megjátssza.'
		},
		source: {
			label: 'The Art of Coaching Volleyball (Russ Rose)',
			url: 'https://www.theartofcoachingvolleyball.com/coverage-drill-2/'
		}
	},
	{
		id: 'setter-footwork',
		topic: 'setter',
		name: 'Setter footwork challenge',
		purpose: {
			en: 'The setter’s run to the target from serve-receive spots.',
			hu: 'A feladó útja a feladóhelyre nyitásfogadási helyzetekből.'
		},
		how: {
			en: 'The setter starts from right back, middle back or left front; the coach tosses, the setter sprints to the target, sets to the left and covers. Eight repetitions from each spot.',
			hu: 'A feladó jobb hátulról, középen hátulról vagy bal elölről indul; az edző feldob, a feladó a feladóhelyre sprintel, balra ad fel és biztosít. Minden helyről nyolc ismétlés.'
		},
		source: {
			label: 'The Volleyball Drill Book (Human Kinetics), via Coaches Insider',
			url: 'https://coachesinsider.com/volleyball/setting-drills-article/'
		}
	},
	{
		id: 'serving-ladder',
		topic: 'serving',
		name: 'Serving ladder',
		purpose: {
			en: 'Serving to chosen deep zones under competition.',
			hu: 'Nyitás kijelölt mély zónákba, versenyhelyzetben.'
		},
		how: {
			en: 'Six serves each: two to zone 1, two to zone 6, two to zone 5. Three points for the called zone, one for any other zone in, none for an error. Variant: short zones 2, 3 and 4.',
			hu: 'Mindenkinek hat nyitás: kettő az 1-es, kettő a 6-os, kettő az 5-ös zónába. A megnevezett zónába három pont, más zónába egy, hibáért nulla. Változat: rövid 2-es, 3-as és 4-es zóna.'
		},
		source: {
			label: 'The Volleyball Drill Book (Human Kinetics), via Coaches Insider',
			url: 'https://coachesinsider.com/volleyball/serving-drills-article'
		}
	}
];

const FIVB_BEACH =
	'https://www.fivb.com/wp-content/uploads/2024/03/FIVB_Beachvolley_Drill-Book_EN.pdf';
const fivbDrill = (n: string, page: number) => ({
	label: `FIVB Beach Volleyball Drill-book, drill ${n}`,
	url: `${FIVB_BEACH}#page=${page}`
});

/** Beach drills for pairs and small groups, from the FIVB drill-book and Better at Beach. */
export const BEACH_DRILLS: Drill[] = [
	{
		id: 'plus-three-minus-three',
		topic: 'beach-receive',
		name: 'Plus three, minus three',
		purpose: {
			en: 'Consistent serve receive to a target near the net, under game pressure.',
			hu: 'Megbízható fogadás egy háló közeli célpontra, játékszerű nyomás alatt.'
		},
		how: {
			en: 'Three players: a server behind the end line, a passer, and a catcher near the net. The passer scores a point for a pass the catcher can reach with at most one big step, and for a service error; a bad pass or an ace costs a point. First to 3 wins.',
			hu: 'Három játékos: egy nyitó az alapvonal mögött, egy fogadó, és egy elkapó a háló közelében. A fogadó pontot kap, ha az elkapó legfeljebb egy nagy lépéssel eléri a labdát, és ha a nyitás hibás; rossz fogadásért vagy ászért pontot veszít. Aki előbb ér el 3 pontot, nyer.'
		},
		source: {
			label: 'Better at Beach',
			url: 'https://www.betteratbeach.com/beach-volleyball-drills'
		}
	},
	{
		id: 'four-great-sets',
		topic: 'beach-setting',
		name: '4 great sets',
		purpose: {
			en: 'Setting good and bad passes, and choosing between a bump set and a hand set.',
			hu: 'Jó és rossz fogadások feladása, és a döntés az alkaros és a kosárérintéses feladás között.'
		},
		how: {
			en: 'A coach throws balls to four spots as if they were passes: tight and too far across, perfect, too far off the net, and off the side of the court. The player moves from passing position and sets each one, by hand or bump, facing the target, then gets low, ready to dig a blocked ball. An extra player can attack the set.',
			hu: 'Az edző négy helyre dobja a labdát, mintha fogadás lenne: túl közel a hálóhoz és túl messze oldalra, tökéletesen, túl messze a hálótól, illetve a pályán kívülre oldalt. A játékos a fogadóhelyéről indul, és mindegyiket kosárérintéssel vagy alkarral feladja, a célpont felé fordulva, majd mélyen leguggol, hogy a sáncról visszajövő labdát felvegye. Egy további játékos le is ütheti a feladást.'
		},
		source: fivbDrill('4.7', 68)
	},
	{
		id: 'shot-practice',
		topic: 'beach-shots',
		name: 'Shot practice',
		purpose: {
			en: 'The approach angle and the high arm and hand position for soft shots such as the cut and the line.',
			hu: 'A puha ejtésekhez (rövid átló, egyenes) szükséges nekifutási szög, valamint a magasan tartott kar és kéz.'
		},
		how: {
			en: 'Facing the direction of a normal approach, the player tosses the ball up in front and, with a high arm swing, plays a soft shot into areas the coach marks out, from both sides of the court. The wrist, not a dropped elbow, changes the direction. A hard attack between shots keeps the arm high.',
			hu: 'A játékos a szokásos nekifutás irányába fordulva maga elé dobja a labdát, és magas karlendítéssel puha ejtést játszik az edző által kijelölt területekre, a pálya mindkét oldaláról. Az irányt a csukló változtatja meg, nem a leeresztett könyök. Az ejtések közé iktatott erős leütés segít magasan tartani a kart.'
		},
		source: fivbDrill('5.2', 74)
	},
	{
		id: 'high-line-cut-shot-challenge',
		topic: 'beach-shots',
		name: 'High line and cut shot challenge',
		purpose: {
			en: 'Accurate high line and cut shots into the corners, as a competition.',
			hu: 'Pontos magas egyenes és rövid átlós ejtések a sarkokba, versenyszerűen.'
		},
		how: {
			en: 'Boxes are drawn in the sand in each corner of the court. Two lines of passer-attackers play with a permanent setter; a tosser alternates balls between the lines, and each player passes, then tries to land a cut shot or high line in a box. The first to the agreed score wins.',
			hu: 'A térfél mindegyik sarkában négyzetet rajzolnak a homokba. Két sor fogadó-támadó játszik egy állandó feladóval; a dobó felváltva dob a két sornak, és mindenki fogadás után rövid átlós vagy magas egyenes ejtéssel próbál egy négyzetbe találni. Aki előbb éri el a megbeszélt pontszámot, nyer.'
		},
		source: {
			label: 'Better at Beach',
			url: 'https://betteratbeach.com/blog/attackinginbeachvolleyball'
		}
	},
	{
		id: 'read-the-power-shot',
		topic: 'beach-block-defence',
		name: 'Read the power shot',
		purpose: {
			en: 'Reading the direction of a power attack from the attacker’s approach and body.',
			hu: 'A leütés irányának kiolvasása a támadó nekifutásából és testtartásából.'
		},
		how: {
			en: 'A thrower tosses the ball over the blocker’s back, and the attacker across the net hits it hard in the direction of their body rather than away from the block. The blocker watches the attacker’s body first, then the ball, and tries to block it. The drill-book signals this block with a closed fist.',
			hu: 'A dobó a sáncoló háta fölött átdobja a labdát, a túloldali támadó pedig erővel, a teste irányába üti le, nem a sánc mellé. A sáncoló előbb a támadó testét, aztán a labdát figyeli, és megpróbálja megsáncolni. A gyakorlatgyűjtemény ezt a sáncot ökölbe zárt kézzel jelzi.'
		},
		source: fivbDrill('6.3', 85)
	},
	{
		id: 'retreat-decision-drill',
		topic: 'beach-block-defence',
		name: 'Retreat decision drill',
		purpose: {
			en: 'The blocker’s choice: stay up and block, or pull off the net and defend.',
			hu: 'A sáncoló döntése: a hálónál marad és sáncol, vagy lehúzódik a hálóról és védekezik.'
		},
		how: {
			en: 'The blocker lines up on the attacker across the net, and a player at the net sets a thrown ball either tight or off the net. The blocker reads the set and either blocks or drops off; the attacker hits into the block or down the line to the retreating blocker. A back-court defender can play out the digs.',
			hu: 'A sáncoló a háló túloldalán a támadóval szemben áll, a hálónál álló játékos pedig egy feldobott labdát vagy közel a hálóhoz, vagy attól távolabb ad fel. A sáncoló kiolvassa a feladást, és vagy sáncol, vagy lehúzódik; a támadó a sáncba vagy egyenesen a hátrahúzódó sáncolóra üt. Egy hátsó védő kijátszhatja a felvett labdákat.'
		},
		source: fivbDrill('6.8', 90)
	},
	{
		id: 'chase-line-shot-behind-block',
		topic: 'beach-block-defence',
		name: 'Chase the line shot behind a block',
		purpose: {
			en: 'Digging the hard angle attack and chasing down the soft line shot.',
			hu: 'Az erős átlós leütés felvétele és a puha egyenes ejtés utolérése.'
		},
		how: {
			en: 'From a set at the net, an attacker plays either a hard angle attack or a soft line shot. The defender reads the attacker’s body for clues and digs the angle or chases down the line, and the blocker catches or plays the dig. The rally can be played out.',
			hu: 'A hálónál adott feladásból a támadó vagy erős átlós leütést, vagy puha egyenes ejtést játszik. A védő a támadó testtartásából következtet, felveszi az átlós ütést vagy utoléri az egyenes ejtést, a felvett labdát pedig a sáncoló elkapja vagy kijátssza. A labdamenet végig is játszható.'
		},
		source: fivbDrill('7.8', 101)
	},
	{
		id: 'two-person-defence-transition',
		topic: 'beach-block-defence',
		name: 'Two-person defence drill',
		purpose: {
			en: 'Defence and the transition set, for two players with no one else to train with.',
			hu: 'Mezőnyvédekezés és átmeneti feladás két játékosnak, akik egyedül edzenek.'
		},
		how: {
			en: 'One player attacks off their own toss at their partner, who defends across the net. The attacker then runs under the net and sets the partner’s dig for a transition attack, so the defender must dig high and in front. Intermediate players attack straight at the partner; advanced players attack anywhere on the court.',
			hu: 'Az egyik játékos saját feldobásból üt a háló túloldalán védekező társára, majd átfut a háló alatt, és feladja a társ felvett labdáját egy átmeneti támadáshoz; ezért a védőnek magasra és maga elé kell felvennie a labdát. Középhaladók egyenesen a társra ütnek, haladók a pálya bármely részére.'
		},
		source: fivbDrill('7.10', 103)
	},
	{
		id: 'split-the-passers',
		topic: 'beach-serving',
		name: 'Split the passers',
		purpose: {
			en: 'A float serve that uses the wind to land between the two passers.',
			hu: 'Lebegtetett nyitás, amely a szelet kihasználva a két fogadó közé érkezik.'
		},
		how: {
			en: 'The server aims at one passer’s inside shoulder so that the wind carries the ball back towards the other passer and causes confusion. A float serve works best because it moves more in the wind, and a deeper serve moves more. It can be played as a game of server against passers, as long as the passers do not cheat towards the middle.',
			hu: 'A nyitó az egyik fogadó belső válla felé céloz, hogy a szél a labdát a másik fogadó felé sodorja, és zavart keltsen. A lebegtetett nyitás működik a legjobban, mert azt viszi el leginkább a szél, és a mélyebb nyitás többet mozog. Játszható nyitó a fogadók ellen játékként is, ha a fogadók nem húzódnak előre középre.'
		},
		source: fivbDrill('2.7', 40)
	},
	{
		id: 'monarch-of-the-court',
		topic: 'beach-games',
		name: 'Monarch of the court',
		purpose: {
			en: 'A 2 v 2 game for when more than two pairs share one court.',
			hu: '2 a 2 elleni játék arra az esetre, ha kettőnél több páros osztozik egy pályán.'
		},
		how: {
			en: 'One side of the court is the points side, the other the challenger side. Pairs serve from the challenger side; if the serving pair wins the rally, they cross to the points side. Only the pair on the points side can score: a pair there that wins a rally scores and stays.',
			hu: 'A pálya egyik térfele a pontszerző, a másik a kihívó oldal. A párosok a kihívó oldalról nyitnak; ha a nyitó páros nyeri a labdamenetet, átmegy a pontszerző oldalra. Pontot csak a pontszerző oldalon álló páros szerezhet: ha ott nyer labdamenetet, pontot kap és marad.'
		},
		source: fivbDrill('8.8', 120)
	}
];
