/**
 * The official referee hand signals (FIVB rules 2025–2028, Diagram 11) and line judge flag
 * signals (Diagram 12). Names and gestures follow the rulebook; `page` is the page of the rules
 * PDF that shows the signal. The figure is a simple sketch: the text is what to go by.
 *
 * A figure faces the reader. Arm angles are degrees from hanging straight down: 90 is out to the
 * side, 180 straight up, and negative angles point across the body.
 */
type Text = { en: string; hu: string };

export type Arm = { upper: number; fore: number };
export type Side = -1 | 1;
export type Prop =
	'yellow' | 'red' | 'both-cards' | 'net' | 'flag-down' | 'flag-up' | 'flag-wave' | 'line';
export type Motion = 'sweep' | 'spin' | 'circle' | 'up' | 'down' | 'brush';

/** What a hand does: open palm, pointing finger, fist, thumb up, fingers counted, or holding something. */
export type Hand =
	| 'open'
	| 'point'
	| 'fist'
	| 'thumb'
	| 'two'
	| 'four'
	| 'five'
	| 'yellow'
	| 'red'
	| 'both-cards'
	| 'flag';

export type Signal = {
	id: string;
	name: Text;
	gesture: Text;
	/** What it tells players. */
	means: Text;
	rules: string[];
	page: number;
	/** The referees who show it: first, second, or both. */
	who: 'first' | 'both' | 'line';
	left: Arm;
	right: Arm;
	/**
	 * Where the arms start when the figure acts the signal out; arms hanging down when left out.
	 * A signal with a repeated movement, such as rolling the forearms, swings between the two.
	 */
	from?: { left?: Arm; right?: Arm };
	/** Keep repeating the movement rather than showing the signal once and holding it. */
	repeat?: boolean;
	/**
	 * How the hands travel from the starting pose: along an arc of the joints (the default, as when
	 * raising an arm), or in a straight line, for a hand that sweeps across at one height. Joint
	 * arcs would drop such a hand towards the hip halfway through.
	 */
	path?: 'arc' | 'line';
	/**
	 * Which side of the hand the thumb is on, as the reader sees the hand with its fingers pointing
	 * down: -1 the reader's left, 1 the right. Left out, each hand is drawn palm to the reader, so
	 * the thumb is away from the body (the referee's right hand: -1, left hand: 1). A palm facing
	 * up or towards the body, or a forearm turned across the chest, puts it on the other side.
	 * `thumbsFrom` is the starting pose's; the thumb rolls across as the forearm turns.
	 */
	thumbs?: { left?: Side; right?: Side };
	thumbsFrom?: { left?: Side; right?: Side };
	/** The hands, open palms when left out. */
	hands?: { left?: Hand; right?: Hand };
	/**
	 * A hand held at its own angle rather than in line with the forearm, in degrees: 0 fingers
	 * down, 180 up, 90 pointing to the reader's left. For a palm laid flat on the other hand.
	 */
	tilt?: { left?: number; right?: number };
	props?: Prop[];
	motion?: Motion;
	/** Fingers shown on the raised hand(s), drawn as a number. */
	fingers?: string;
};

const DOWN: Arm = { upper: 8, fore: 8 };

export const REFEREE_SIGNALS: Signal[] = [
	{
		id: 'authorise-serve',
		name: { en: 'Authorisation to serve', hu: 'A nyitás engedélyezése' },
		gesture: {
			en: 'One arm starts across the chest and sweeps out to the side, showing the direction of the serve.',
			hu: 'Az egyik kar a mellkas előtt indul, és oldalra lendül, a nyitás irányát mutatva.'
		},
		means: { en: 'The server may serve now.', hu: 'A nyitó most nyithat.' },
		rules: ['12.3'],
		page: 75,
		who: 'first',
		from: { right: { upper: 40, fore: -95 } },
		path: 'line',
		thumbsFrom: { right: 1 },
		left: DOWN,
		right: { upper: 80, fore: 90 },
		motion: 'sweep'
	},
	{
		id: 'team-to-serve',
		name: { en: 'Team to serve', hu: 'A nyitó csapat' },
		gesture: {
			en: 'One arm held straight out to the side at shoulder height, towards the team that will serve.',
			hu: 'Az egyik kar vállmagasságban egyenesen oldalra nyújtva, a nyitó csapat felé.'
		},
		means: {
			en: 'Which team serves next, after every rally.',
			hu: 'Melyik csapat nyit következőnek, minden labdamenet után.'
		},
		rules: ['22.2.3'],
		page: 75,
		who: 'both',
		left: DOWN,
		right: { upper: 90, fore: 90 }
	},
	{
		id: 'change-courts',
		name: { en: 'Change of courts', hu: 'Térfélcsere' },
		gesture: {
			en: 'Forearms held level, one in front of the body and one behind, then turned around the body.',
			hu: 'Az alkarok vízszintesen, az egyik a test előtt, a másik mögötte, majd a test körül elfordítva.'
		},
		means: { en: 'Teams change ends.', hu: 'A csapatok térfelet cserélnek.' },
		rules: ['18.2'],
		page: 75,
		who: 'first',
		path: 'line',
		from: { left: { upper: 20, fore: 60 }, right: { upper: 20, fore: 60 } },
		repeat: true,
		thumbs: { right: 1, left: -1 },
		left: { upper: 20, fore: -80 },
		right: { upper: 20, fore: -80 },
		motion: 'spin'
	},
	{
		id: 'time-out',
		name: { en: 'Time-out', hu: 'Pihenőidő' },
		gesture: {
			en: 'The palm of one hand placed flat on the fingertips of the other, held upright, forming a T; then pointing to the team that asked.',
			hu: 'Az egyik tenyér a másik, függőlegesen tartott kéz ujjhegyein, T betűt formálva; utána a kérő csapat felé mutat.'
		},
		means: { en: 'A team has a time-out.', hu: 'Egy csapat pihenőidőt kapott.' },
		rules: ['15.4.1'],
		page: 75,
		who: 'both',
		tilt: { left: 90, right: 180 },
		left: { upper: 137, fore: -79 },
		right: { upper: -1, fore: -162 }
	},
	{
		id: 'substitution',
		name: { en: 'Substitution', hu: 'Játékoscsere' },
		gesture: {
			en: 'Forearms rolled around each other in front of the chest.',
			hu: 'Az alkarok egymás körül forgatva a mellkas előtt.'
		},
		means: { en: 'A substitution is made.', hu: 'Csere történik.' },
		rules: ['15.5'],
		page: 76,
		who: 'both',
		from: { left: { upper: 25, fore: -100 }, right: { upper: 25, fore: -70 } },
		repeat: true,
		hands: { left: 'fist', right: 'fist' },
		thumbs: { right: 1, left: -1 },
		thumbsFrom: { right: 1, left: -1 },
		left: { upper: 25, fore: -70 },
		right: { upper: 25, fore: -100 },
		motion: 'circle'
	},
	{
		id: 'warning',
		name: { en: 'Misconduct warning', hu: 'Figyelmeztetés sportszerűtlenségért' },
		gesture: { en: 'A yellow card raised overhead.', hu: 'Sárga lap a fej fölé emelve.' },
		means: {
			en: 'A team member is warned; no penalty yet.',
			hu: 'Egy csapattag figyelmeztetést kap; büntetés még nincs.'
		},
		rules: ['21.1', '21.6'],
		page: 76,
		who: 'first',
		hands: { right: 'yellow' },
		left: DOWN,
		right: { upper: 170, fore: 170 },
		props: ['yellow']
	},
	{
		id: 'penalty',
		name: { en: 'Misconduct penalty', hu: 'Büntetés sportszerűtlenségért' },
		gesture: { en: 'A red card raised overhead.', hu: 'Piros lap a fej fölé emelve.' },
		means: {
			en: 'Point and serve to the opponents.',
			hu: 'Pont és nyitásjog az ellenfélnek.'
		},
		rules: ['21.3.1'],
		page: 76,
		who: 'first',
		hands: { right: 'red' },
		left: DOWN,
		right: { upper: 170, fore: 170 },
		props: ['red']
	},
	{
		id: 'expulsion',
		name: { en: 'Expulsion', hu: 'Kiállítás' },
		gesture: {
			en: 'Both cards held together in one raised hand.',
			hu: 'Mindkét lap együtt, egy felemelt kézben.'
		},
		means: {
			en: 'The player leaves the playing area for the rest of the set.',
			hu: 'A játékos a játszma hátralevő részére elhagyja a játékteret.'
		},
		rules: ['21.3.2'],
		page: 76,
		who: 'first',
		hands: { right: 'both-cards' },
		left: DOWN,
		right: { upper: 170, fore: 170 },
		props: ['both-cards']
	},
	{
		id: 'disqualification',
		name: { en: 'Disqualification', hu: 'Kizárás' },
		gesture: {
			en: 'Both arms raised, a red card in one hand and a yellow card in the other.',
			hu: 'Mindkét kar felemelve, az egyik kézben piros, a másikban sárga lap.'
		},
		means: {
			en: 'The player leaves the competition area for the rest of the match.',
			hu: 'A játékos a mérkőzés hátralevő részére elhagyja a versenyterületet.'
		},
		rules: ['21.3.3'],
		page: 77,
		who: 'first',
		hands: { left: 'red', right: 'yellow' },
		left: { upper: 160, fore: 165 },
		right: { upper: 160, fore: 165 },
		props: ['yellow', 'red']
	},
	{
		id: 'end-of-set',
		name: { en: 'End of set or match', hu: 'Játszma vagy mérkőzés vége' },
		gesture: {
			en: 'Forearms crossed in front of the chest, hands open.',
			hu: 'Az alkarok keresztbe téve a mellkas előtt, nyitott tenyérrel.'
		},
		means: { en: 'The set or the match is over.', hu: 'Vége a játszmának vagy a mérkőzésnek.' },
		rules: ['6.2', '6.3'],
		page: 77,
		who: 'both',
		left: { upper: 20, fore: -112 },
		right: { upper: 20, fore: -112 }
	},
	{
		id: 'not-tossed',
		name: { en: 'Ball not tossed or released', hu: 'Fel nem dobott vagy el nem engedett labda' },
		gesture: {
			en: 'An arm stretched forward and lifted, palm up.',
			hu: 'Az egyik kar előrenyújtva és felemelve, tenyérrel felfelé.'
		},
		means: {
			en: 'Service fault: the server hit the ball without tossing or releasing it.',
			hu: 'Nyitáshiba: a nyitó feldobás vagy elengedés nélkül ütötte meg a labdát.'
		},
		rules: ['12.4.1'],
		page: 77,
		who: 'first',
		from: { right: { upper: 20, fore: 30 } },
		thumbs: { right: 1 },
		left: DOWN,
		right: { upper: 60, fore: 120 },
		motion: 'up'
	},
	{
		id: 'delay-serve',
		name: { en: 'Delay in service', hu: 'Késedelmes nyitás' },
		gesture: {
			en: 'Both hands raised with eight fingers spread.',
			hu: 'Mindkét kéz felemelve, nyolc ujj szétterpesztve.'
		},
		means: {
			en: 'The server took longer than 8 seconds after the whistle.',
			hu: 'A nyitó a sípszó után 8 másodpercnél tovább várt.'
		},
		rules: ['12.4.4'],
		page: 77,
		who: 'first',
		hands: { left: 'four', right: 'four' },
		left: { upper: 120, fore: 170 },
		right: { upper: 120, fore: 170 },
		fingers: '4 + 4'
	},
	{
		id: 'block-fault',
		name: { en: 'Blocking fault or screening', hu: 'Sánchiba vagy takarás' },
		gesture: {
			en: 'Both arms raised straight up, palms forward.',
			hu: 'Mindkét kar egyenesen felemelve, tenyérrel előre.'
		},
		means: {
			en: 'An illegal block, such as a back-row player or the libero blocking, or a screen at the serve.',
			hu: 'Szabálytalan sánc, például hátsó soros játékos vagy a liberó sáncol, vagy takarás nyitáskor.'
		},
		rules: ['12.5', '14.6'],
		page: 78,
		who: 'both',
		left: { upper: 172, fore: 172 },
		right: { upper: 172, fore: 172 }
	},
	{
		id: 'position-fault',
		name: { en: 'Positional or rotational fault', hu: 'Állásrendi vagy forgásrendi hiba' },
		gesture: {
			en: 'A forefinger drawing a circle at waist height.',
			hu: 'A mutatóujj kört rajzol derékmagasságban.'
		},
		means: {
			en: 'The receiving team was out of rotational order at the serve, or the wrong player served.',
			hu: 'A fogadó csapat nyitáskor nem állt állásrendben, vagy nem a soron következő játékos nyitott.'
		},
		rules: ['7.5', '7.7'],
		page: 78,
		who: 'both',
		from: { right: { upper: 25, fore: -20 } },
		repeat: true,
		hands: { right: 'point' },
		left: DOWN,
		right: { upper: 20, fore: -60 },
		motion: 'circle'
	},
	{
		id: 'ball-in',
		name: { en: 'Ball in', hu: 'Labda bent' },
		gesture: {
			en: 'Arm and fingers pointing down at the floor on the side where the ball landed.',
			hu: 'A kar és az ujjak lefelé, a padlóra mutatnak azon az oldalon, ahol a labda leért.'
		},
		means: { en: 'The ball landed in the court.', hu: 'A labda a pályán belül ért földet.' },
		rules: ['8.3'],
		page: 78,
		who: 'first',
		left: DOWN,
		right: { upper: 45, fore: 45 },
		props: ['line']
	},
	{
		id: 'ball-out',
		name: { en: 'Ball out', hu: 'Labda kint' },
		gesture: {
			en: 'Both forearms raised upright, hands open, palms towards the body.',
			hu: 'Mindkét alkar függőlegesen felemelve, nyitott tenyérrel a test felé.'
		},
		means: {
			en: 'The ball landed outside, touched an object outside the court, or crossed outside the antennas.',
			hu: 'A labda kint ért földet, pályán kívüli tárgyhoz ért, vagy az antennákon kívül jutott át.'
		},
		rules: ['8.4'],
		page: 78,
		who: 'both',
		thumbs: { right: 1, left: -1 },
		left: { upper: 35, fore: 175 },
		right: { upper: 35, fore: 175 }
	},
	{
		id: 'catch',
		name: { en: 'Catch', hu: 'Megfogott labda' },
		gesture: {
			en: 'A forearm lifted slowly, palm up.',
			hu: 'Az alkar lassan felemelve, tenyérrel felfelé.'
		},
		means: {
			en: 'The ball was caught or thrown instead of hit.',
			hu: 'A labdát megfogták vagy eldobták, nem ütötték.'
		},
		rules: ['9.2.2', '9.3.3'],
		page: 79,
		who: 'first',
		from: { right: { upper: 15, fore: 40 } },
		thumbs: { right: 1 },
		thumbsFrom: { right: 1 },
		left: DOWN,
		right: { upper: 15, fore: 110 },
		motion: 'up'
	},
	{
		id: 'double-contact',
		name: { en: 'Double contact', hu: 'Kettős érintés' },
		gesture: {
			en: 'One hand raised with two fingers spread.',
			hu: 'Az egyik kéz felemelve, két ujj szétterpesztve.'
		},
		means: {
			en: 'A player touched the ball twice in a row (not allowed except on the team’s first hit).',
			hu: 'Egy játékos kétszer egymás után érintette a labdát (a csapat első érintésén kívül tilos).'
		},
		rules: ['9.3.4'],
		page: 79,
		who: 'first',
		hands: { right: 'two' },
		left: DOWN,
		right: { upper: 150, fore: 170 },
		fingers: '2'
	},
	{
		id: 'four-hits',
		name: { en: 'Four hits', hu: 'Négy érintés' },
		gesture: {
			en: 'One hand raised with four fingers spread.',
			hu: 'Az egyik kéz felemelve, négy ujj szétterpesztve.'
		},
		means: {
			en: 'A team touched the ball four times before sending it over.',
			hu: 'Egy csapat négyszer érintette a labdát, mielőtt átküldte.'
		},
		rules: ['9.3.1'],
		page: 79,
		who: 'first',
		hands: { right: 'four' },
		left: DOWN,
		right: { upper: 150, fore: 170 },
		fingers: '4'
	},
	{
		id: 'net-touch',
		name: {
			en: 'Net touched, or serve fails to cross the net',
			hu: 'Hálóérintés, vagy a nyitás nem jut át a hálón'
		},
		gesture: {
			en: 'The hand on the side of the fault points to, or touches, the top of the net.',
			hu: 'A hibázó csapat felőli kézzel a háló tetejére mutat vagy megérinti.'
		},
		means: {
			en: 'A player touched the net while playing the ball, or the serve did not get over.',
			hu: 'Egy játékos labdamegjátszás közben hálót érintett, vagy a nyitás nem jutott át.'
		},
		rules: ['11.4.4', '12.6.2.1'],
		page: 79,
		who: 'both',
		left: DOWN,
		right: { upper: 120, fore: 140 },
		props: ['net']
	},
	{
		id: 'reach-over',
		name: { en: 'Reaching beyond the net', hu: 'Átnyúlás a háló fölött' },
		gesture: {
			en: 'A hand held above the net, palm down.',
			hu: 'Az egyik kéz a háló fölött, tenyérrel lefelé.'
		},
		means: {
			en: 'A player played the ball, or interfered, in the opponents’ space before their attack hit.',
			hu: 'Egy játékos az ellenfél terében játszotta meg a labdát vagy zavart, a támadóérintésük előtt.'
		},
		rules: ['11.4.1', '14.3'],
		page: 80,
		who: 'first',
		left: DOWN,
		right: { upper: 130, fore: 100 },
		props: ['net']
	},
	{
		id: 'attack-fault',
		name: { en: 'Attack hit fault', hu: 'Támadóérintési hiba' },
		gesture: {
			en: 'A forearm raised, then brought down with the hand open.',
			hu: 'Az alkar felemelve, majd nyitott kézzel lefelé mozdítva.'
		},
		means: {
			en: 'An illegal attack on a ball entirely above the net: by a back-row player from the front zone, by the libero, on the opponents’ serve in the front zone, or on a libero’s finger set from the front zone.',
			hu: 'Szabálytalan támadóérintés: hátsó sorköteles játékos az első zónából vagy a liberó támad, támadás az ellenfél nyitására, vagy a liberó első zónában kosárérintéssel adott feladásának megtámadása.'
		},
		rules: ['13.3.3', '13.3.4', '13.3.5', '13.3.6'],
		page: 80,
		who: 'both',
		from: { right: { upper: 30, fore: 170 } },
		left: DOWN,
		right: { upper: 30, fore: 40 },
		motion: 'down'
	},
	{
		id: 'penetration',
		name: {
			en: 'Penetration into the opponents’ court, ball under the net, or foot fault at the serve',
			hu: 'Ellenmezőbe hatolás, a háló alatt áthaladó labda vagy lábhiba nyitáskor'
		},
		gesture: {
			en: 'Pointing down at the centre line, or at the line concerned.',
			hu: 'Lefelé mutat a középvonalra vagy az érintett vonalra.'
		},
		means: {
			en: 'A player crossed the centre line illegally, the ball passed under the net, the server touched the court, or a player was outside the court at the serve.',
			hu: 'Egy játékos szabálytalanul lépett át a középvonalon, a labda a háló alatt ment át, a nyitó a pályát érintette, vagy egy játékos a pályán kívül állt nyitáskor.'
		},
		rules: ['8.4.5', '11.2.2', '12.4.3'],
		page: 80,
		who: 'both',
		hands: { right: 'point' },
		left: DOWN,
		right: { upper: 25, fore: 20 },
		props: ['line']
	},
	{
		id: 'double-fault',
		name: { en: 'Double fault and replay', hu: 'Kettős hiba, a labdamenet újrajátszása' },
		gesture: {
			en: 'Both thumbs raised upright at head height.',
			hu: 'Mindkét hüvelykujj függőlegesen felemelve, fejmagasságban.'
		},
		means: {
			en: 'Both teams faulted at once, or the rally was interrupted: it is replayed.',
			hu: 'A két csapat egyszerre hibázott, vagy a labdamenet megszakadt: megismétlik.'
		},
		rules: ['6.1.2.2', '17.2'],
		page: 80,
		who: 'first',
		hands: { left: 'thumb', right: 'thumb' },
		left: { upper: 40, fore: 170 },
		right: { upper: 40, fore: 170 }
	},
	{
		id: 'ball-touched',
		name: { en: 'Ball touched', hu: 'Érintett labda' },
		gesture: {
			en: 'The palm of one hand brushes the fingertips of the other, which is held upright.',
			hu: 'Az egyik tenyér végigsimít a másik, függőlegesen tartott kéz ujjhegyein.'
		},
		means: {
			en: 'A player touched the ball before it went out, so the touching team loses the rally.',
			hu: 'Egy játékos hozzáért a labdához, mielőtt kiment, így az érintő csapat veszíti el a labdamenetet.'
		},
		rules: ['24.2.2'],
		page: 81,
		who: 'first',
		from: { left: { upper: 140, fore: -50 } },
		repeat: true,
		tilt: { left: 90, right: 180 },
		left: { upper: 137, fore: -79 },
		right: { upper: -1, fore: -162 },
		motion: 'brush'
	},
	{
		id: 'delay',
		name: { en: 'Delay warning or penalty', hu: 'Késleltetés: figyelmeztetés vagy büntetés' },
		gesture: {
			en: 'A card held over the wrist: yellow for a warning, red for a penalty.',
			hu: 'A lappal a csuklójára mutat: sárgával a figyelmeztetés, pirossal a büntetés.'
		},
		means: {
			en: 'A team delayed the game. The first delay is a warning; every later one gives the opponents a point and the serve.',
			hu: 'Egy csapat késleltette a játékot. Az első késleltetés figyelmeztetés, minden további pontot és nyitásjogot ad az ellenfélnek.'
		},
		rules: ['16.2'],
		page: 81,
		who: 'first',
		hands: { left: 'fist', right: 'yellow' },
		left: { upper: 30, fore: -60 },
		right: { upper: 30, fore: -100 },
		props: ['yellow']
	}
];

export const FLAG_SIGNALS: Signal[] = [
	{
		id: 'flag-in',
		name: { en: 'Ball in', hu: 'Labda bent' },
		gesture: { en: 'Flag pointed down.', hu: 'A zászló lefelé mutat.' },
		means: { en: 'The ball landed in.', hu: 'A labda bent ért földet.' },
		rules: ['8.3'],
		page: 82,
		who: 'line',
		hands: { right: 'flag' },
		left: DOWN,
		right: { upper: 30, fore: 25 },
		props: ['flag-down']
	},
	{
		id: 'flag-out',
		name: { en: 'Ball out', hu: 'Labda kint' },
		gesture: { en: 'Flag raised upright.', hu: 'A zászló függőlegesen felemelve.' },
		means: { en: 'The ball landed out.', hu: 'A labda kint ért földet.' },
		rules: ['8.4.1'],
		page: 82,
		who: 'line',
		hands: { right: 'flag' },
		left: DOWN,
		right: { upper: 170, fore: 170 },
		props: ['flag-up']
	},
	{
		id: 'flag-touched',
		name: { en: 'Ball touched', hu: 'Érintett labda' },
		gesture: {
			en: 'Flag raised, with the palm of the free hand touching its top.',
			hu: 'A zászló felemelve, a szabad kéz tenyere a tetejét érinti.'
		},
		means: {
			en: 'The receiving team touched the ball before it went out.',
			hu: 'A fogadó csapat hozzáért a labdához, mielőtt kiment.'
		},
		rules: ['29.2.1.2'],
		page: 82,
		who: 'line',
		hands: { right: 'flag' },
		path: 'line',
		tilt: { left: 90 },
		left: { upper: -85, fore: -145 },
		right: { upper: -8, fore: 115 },
		props: ['flag-up']
	},
	{
		id: 'flag-antenna',
		name: {
			en: 'Antenna, outside object or foot fault',
			hu: 'Antenna, külső tárgy vagy lábhiba'
		},
		gesture: {
			en: 'Flag waved over the head, then pointed at the antenna or the line concerned.',
			hu: 'A zászló a fej fölött meglengetve, majd az antennára vagy az érintett vonalra mutatva.'
		},
		means: {
			en: 'The ball crossed outside the antenna or touched an object outside the court, or the server stepped on the line.',
			hu: 'A labda az antennán kívül ment át vagy pályán kívüli tárgyhoz ért, vagy a nyitó a vonalra lépett.'
		},
		rules: ['8.4.3', '12.4.3'],
		page: 82,
		who: 'line',
		from: { right: { upper: 150, fore: 200 } },
		repeat: true,
		hands: { right: 'flag' },
		left: DOWN,
		right: { upper: 170, fore: 170 },
		props: ['flag-wave']
	},
	{
		id: 'flag-unsure',
		name: { en: 'Judgement impossible', hu: 'Nem tudta megítélni' },
		gesture: {
			en: 'Both arms and hands raised and crossed in front of the chest.',
			hu: 'Mindkét kar és kéz felemelve, keresztben a mellkas előtt.'
		},
		means: {
			en: 'The line judge could not see the ball land.',
			hu: 'A vonalbíró nem látta, hol ért földet a labda.'
		},
		rules: ['30.2'],
		page: 83,
		who: 'line',
		left: { upper: 20, fore: -112 },
		right: { upper: 20, fore: -112 }
	}
];

/**
 * The beach referee signals (FIVB Beach Volleyball Rules 2025–2028, Diagram 9) and flag signals
 * (Diagram 10), in the rulebook's order. Most gestures are the indoor ones, so each entry reuses
 * the indoor figure and replaces what differs: rules, page, who shows it, and the meaning on sand.
 * Beach has no substitution signal, and the delay in service is five fingers, not eight.
 */
const indoor = (id: string) => [...REFEREE_SIGNALS, ...FLAG_SIGNALS].find((s) => s.id === id)!;
const onSand = (id: string, change: Partial<Signal>): Signal => ({ ...indoor(id), ...change });

export const BEACH_RULES_PDF =
	'https://www.fivb.com/wp-content/uploads/2025/02/FIVB-BeachVolleyball_Rules2025_2028-EN-v01.pdf';

export const BEACH_REFEREE_SIGNALS: Signal[] = [
	onSand('authorise-serve', { rules: ['12.3'], page: 58, who: 'first' }),
	onSand('team-to-serve', { rules: ['12.3'], page: 58, who: 'both' }),
	onSand('change-courts', {
		rules: ['18.2'],
		page: 58,
		who: 'both',
		means: {
			en: 'Teams switch sides: every 7 points played in sets 1 and 2, every 5 in set 3.',
			hu: 'A csapatok térfelet cserélnek: az 1. és 2. játszmában minden 7 lejátszott pont után, a 3. játszmában 5 után.'
		}
	}),
	onSand('time-out', { rules: ['15'], page: 58, who: 'both' }),
	onSand('warning', { rules: ['20.1', '20.5'], page: 59, who: 'first' }),
	onSand('penalty', { rules: ['20.3.1', '20.5'], page: 59, who: 'first' }),
	onSand('expulsion', {
		rules: ['20.3.2', '20.5'],
		page: 59,
		who: 'first',
		means: {
			en: 'The player must leave the playing area, and with only two players the team is declared incomplete for the set.',
			hu: 'A játékosnak el kell hagynia a játékteret, és mivel csak ketten vannak, a csapatot hiányosnak nyilvánítják a játszmára.'
		}
	}),
	onSand('disqualification', {
		rules: ['20.3.3', '20.5'],
		page: 59,
		who: 'first',
		means: {
			en: 'The player must leave the playing area, and the team is declared incomplete for the match.',
			hu: 'A játékosnak el kell hagynia a játékteret, és a csapatot hiányosnak nyilvánítják a mérkőzésre.'
		}
	}),
	onSand('end-of-set', { rules: ['6.2', '6.3'], page: 60, who: 'first' }),
	onSand('not-tossed', { rules: ['12.4.1'], page: 60, who: 'first' }),
	onSand('delay-serve', {
		rules: ['12.4.4'],
		page: 60,
		who: 'first',
		gesture: {
			en: 'One hand raised with five fingers spread.',
			hu: 'Az egyik kéz felemelve, öt ujj szétterpesztve.'
		},
		means: {
			en: 'The server took longer than 5 seconds after the whistle.',
			hu: 'A nyitó a sípszó után 5 másodpercnél tovább várt.'
		},
		hands: { right: 'five' },
		left: { upper: 8, fore: 8 },
		right: { upper: 120, fore: 170 },
		fingers: '5'
	}),
	onSand('block-fault', {
		rules: ['12.5', '14.5', '14.6.3'],
		page: 60,
		who: 'first',
		means: {
			en: 'A player blocked the serve, blocked illegally, or screened the server.',
			hu: 'Egy játékos sáncolta a nyitást, szabálytalanul sáncolt, vagy eltakarta a nyitót.'
		}
	}),
	onSand('position-fault', {
		rules: ['7.7.1', '12.6.1.1'],
		page: 61,
		who: 'both',
		means: {
			en: 'On the beach this means the wrong player served: there are no positions to fault, only the serve order.',
			hu: 'Strandon ez azt jelenti, hogy nem a soron következő játékos nyitott: kötött helyek nincsenek, csak a nyitási sorrend.'
		}
	}),
	onSand('ball-in', { rules: ['8.3'], page: 61, who: 'both' }),
	onSand('ball-out', { rules: ['8.4'], page: 61, who: 'both' }),
	onSand('catch', { rules: ['9.3.3'], page: 61, who: 'first' }),
	onSand('double-contact', {
		rules: ['9.3.4'],
		page: 62,
		who: 'both',
		means: {
			en: 'A player touched the ball twice in a row. On the team’s first hit it is allowed in one action, but not with an overhand finger pass.',
			hu: 'Egy játékos kétszer egymás után érintette a labdát. A csapat első érintésénél egy mozdulaton belül megengedett, de kosárérintéssel nem.'
		}
	}),
	onSand('four-hits', {
		rules: ['9.3.1'],
		page: 62,
		who: 'first',
		means: {
			en: 'A team touched the ball four times before sending it over. On the beach a block touch counts as one of the three.',
			hu: 'Egy csapat négyszer érintette a labdát, mielőtt átjátszotta. Strandon a sáncérintés is beleszámít a háromba.'
		}
	}),
	onSand('net-touch', { rules: ['11.4.3', '12.6.2.1'], page: 62, who: 'both' }),
	onSand('reach-over', { rules: ['11.4.1', '13.2.1'], page: 62, who: 'first' }),
	onSand('attack-fault', {
		rules: ['13.2.3', '13.2.4', '13.2.5'],
		page: 63,
		who: 'first',
		means: {
			en: 'An illegal attack: an open-hand tip, an overhand pass over the net not straight out from the shoulders (unless setting the partner), or an attack on the serve while it is entirely above the net.',
			hu: 'Szabálytalan támadás: nyitott kezes ejtés, a vállak vonalára nem merőleges kosárérintéses átjátszás (kivéve, ha a társának akart feladni), vagy a nyitás leütése, amíg teljes terjedelmével a háló felett van.'
		}
	}),
	onSand('penetration', {
		rules: ['8.4.5', '11.2.1', '12.4.3'],
		page: 63,
		who: 'both',
		name: {
			en: 'Interference under the net, ball under the net, or foot fault at the serve',
			hu: 'Zavarás a háló alatt, labda a háló alatt, vagy lépéshiba nyitáskor'
		},
		gesture: {
			en: 'Pointing at the court under the net, or at the line concerned.',
			hu: 'A háló alatti pályarészre vagy az érintett vonalra mutat.'
		},
		means: {
			en: 'A player crossed under the net and interfered with the opponents, the ball passed completely under the net, or the server touched the court or the ground outside the service zone.',
			hu: 'Egy játékos a háló alatt átjutva zavarta az ellenfelet, a labda teljesen átment a háló alatt, vagy a nyitó a pályát vagy a nyitási zónán kívüli talajt érintette.'
		}
	}),
	onSand('double-fault', { rules: ['6.1.2.2', '12.4.5'], page: 63, who: 'both' }),
	onSand('ball-touched', {
		rules: ['14.6.4'],
		page: 63,
		who: 'first',
		means: {
			en: 'The ball went out off a player, for example off the block: that team loses the rally.',
			hu: 'A labda egy játékosról, például a sáncról ment ki: az ő csapata veszíti el a labdamenetet.'
		}
	}),
	onSand('delay', { rules: ['15.5.5', '16.2.2', '16.2.3'], page: 64, who: 'first' })
];

export const BEACH_FLAG_SIGNALS: Signal[] = [
	onSand('flag-in', { rules: ['8.3', '28.2.1.1'], page: 65 }),
	onSand('flag-out', { rules: ['8.4.1', '28.2.1.1'], page: 65 }),
	onSand('flag-touched', {
		rules: ['28.2.1.2'],
		page: 65,
		means: {
			en: 'A player touched the ball before it went out.',
			hu: 'Egy játékos hozzáért a labdához, mielőtt kiment.'
		}
	}),
	onSand('flag-antenna', {
		rules: ['8.4.2', '8.4.3', '8.4.4', '12.4.3'],
		page: 65,
		means: {
			en: 'The ball crossed outside the antenna or touched an object outside the court, or a player made a foot fault at the serve.',
			hu: 'A labda az antennán kívül ment át, vagy a pályán kívüli tárgyat érintett, vagy egy játékos lépéshibát vétett nyitáskor.'
		}
	}),
	onSand('flag-unsure', { rules: [], page: 66 })
];
