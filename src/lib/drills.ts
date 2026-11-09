/**
 * Well-known drills from reputable coaching sources, each linked to where it is described. The
 * descriptions are short summaries; the source has the full drill.
 */
type Text = { en: string; hu: string };

export type DrillTopic = 'sideout' | 'transition' | 'free-ball' | 'coverage' | 'setter' | 'serving';
export const DRILL_TOPICS: readonly DrillTopic[] = [
	'sideout',
	'transition',
	'free-ball',
	'coverage',
	'setter',
	'serving'
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
