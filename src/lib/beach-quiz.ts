/**
 * Beach rules quiz: each question has one right answer, checked against the FIVB Beach Volleyball
 * Rules 2025–2028; `page` is the PDF page of the rule.
 */
type Text = { en: string; hu: string };

export type BeachQuestion = {
	id: string;
	question: Text;
	options: Text[];
	/** Index of the right option. */
	answer: number;
	why: Text;
	rule: { n: string; page: number };
};

const t = (en: string, hu: string): Text => ({ en, hu });
const YES = t('Yes', 'Igen');
const NO = t('No', 'Nem');
const LEGAL = t('Legal', 'Szabályos');
const FAULT = t('Fault', 'Hiba');

export const BEACH_QUESTIONS: BeachQuestion[] = [
	{
		id: 'set-length',
		question: t(
			'How many points win the first set of a beach match?',
			'Hány pont kell egy strandmérkőzés első játszmájának megnyeréséhez?'
		),
		options: [t('15', '15'), t('21', '21'), t('25', '25')],
		answer: 1,
		why: t(
			'Sets 1 and 2 go to 21 points with a two-point lead; there is no cap.',
			'Az 1. és 2. játszma 21 pontig tart, két pont különbséggel; felső határ nincs.'
		),
		rule: { n: '6.2', page: 22 }
	},
	{
		id: 'deciding-set',
		question: t(
			'The match is one set all. How long is the third set?',
			'Egy-egy a játszmaarány. Meddig tart a harmadik játszma?'
		),
		options: [
			t('15 points', '15 pontig'),
			t('21 points', '21 pontig'),
			t('25 points', '25 pontig')
		],
		answer: 0,
		why: t(
			'A match is best of three, and the deciding third set goes to 15 with a two-point lead.',
			'A mérkőzés két nyert játszmáig tart, a döntő harmadik játszma 15 pontig, két pont különbséggel.'
		),
		rule: { n: '6.3', page: 22 }
	},
	{
		id: 'switch',
		question: t(
			'When do teams switch sides in the first set?',
			'Mikor cserélnek térfelet a csapatok az első játszmában?'
		),
		options: [
			t('Only at the end of the set', 'Csak a játszma végén'),
			t('Every 5 points played', 'Minden 5 lejátszott pont után'),
			t('Every 7 points played', 'Minden 7 lejátszott pont után')
		],
		answer: 2,
		why: t(
			'Teams switch after every 7 points played in sets 1 and 2, and every 5 in set 3, straight away.',
			'Az 1. és 2. játszmában minden 7, a 3. játszmában minden 5 lejátszott pont után azonnal térfelet cserélnek.'
		),
		rule: { n: '18.2.1', page: 35 }
	},
	{
		id: 'timeouts',
		question: t(
			'How many time-outs may each team ask for in a set?',
			'Hány pihenőidőt kérhet egy csapat játszmánként?'
		),
		options: [t('One', 'Egyet'), t('Two', 'Kettőt'), t('None', 'Egyet sem')],
		answer: 0,
		why: t(
			'Each team has one 30-second time-out per set. FIVB World and Official competitions add a technical time-out at 21 points played in sets 1 and 2.',
			'Minden csapatnak játszmánként egy 30 másodperces pihenőideje van. FIVB világ- és hivatalos versenyeken az 1. és 2. játszmában ezen felül technikai pihenőidő van 21 lejátszott pontnál.'
		),
		rule: { n: '15.1', page: 32 }
	},
	{
		id: 'block-hits',
		question: t(
			'Your blocker touches the attack and the ball stays on your side. How many more hits does your team have?',
			'A sáncolód hozzáér a leütéshez, és a labda a ti oldalatokon marad. Hány érintésetek maradt?'
		),
		options: [t('One', 'Egy'), t('Two', 'Kettő'), t('Three', 'Három')],
		answer: 1,
		why: t(
			'On the beach a block touch counts as a team hit, so two more follow. Indoors it would be three.',
			'Strandon a sáncérintés csapatérintésnek számít, így még kettő következik. Teremben három lenne.'
		),
		rule: { n: '14.4.1', page: 31 }
	},
	{
		id: 'blocker-again',
		question: t(
			'After touching the ball at the block, may the blocker play the next ball?',
			'A sáncérintés után megjátszhatja-e a sáncoló a következő labdát?'
		),
		options: [YES, NO],
		answer: 0,
		why: t(
			'Any player may make the first hit after the block, including the one who touched it.',
			'A sánc utáni első érintést bármelyik játékos megteheti, az is, aki a sáncban érintette a labdát.'
		),
		rule: { n: '14.4.2', page: 31 }
	},
	{
		id: 'open-tip',
		question: t(
			'An attacker tips the ball over the block with soft, open fingers, like an indoor tip.',
			'Az ütő puha, nyitott ujjakkal ejti át a labdát a sánc fölött, ahogy teremben szokás.'
		),
		options: [LEGAL, FAULT],
		answer: 1,
		why: t(
			'An attack with an open-handed finger action is a fault on the beach.',
			'Strandon hiba, ha a támadást nyitott kézzel, ujjakkal végzik.'
		),
		rule: { n: '13.2.3', page: 30 }
	},
	{
		id: 'cobra',
		question: t(
			'An attacker pokes the ball over with rigid fingertips held together (a “cobra”).',
			'Az ütő merev, összezárt ujjhegyekkel böki át a labdát („cobra”).'
		),
		options: [LEGAL, FAULT],
		answer: 0,
		why: t(
			'The rule forbids open-handed finger attacks and fingertips that are not rigid and together. Rigid fingertips held together are allowed.',
			'A szabály a nyitott kezes, ujjakkal végzett támadást és a nem merev, nem összezárt ujjhegyeket tiltja. A merev, összezárt ujjhegyek megengedettek.'
		),
		rule: { n: '13.2.3', page: 30 }
	},
	{
		id: 'set-over',
		question: t(
			'A player sends the third ball over with a hand set, aiming it sideways across her body into the opponents’ court.',
			'Egy játékos kosárérintéssel játssza át a harmadik labdát, oldalra, a teste előtt keresztben az ellenfél térfelére.'
		),
		options: [LEGAL, FAULT],
		answer: 1,
		why: t(
			'An overhand pass over the net must travel at right angles to the line of the shoulders, unless the player was trying to set her partner.',
			'A hálón át kosárérintéssel játszott labdának a vállak vonalára merőlegesen kell haladnia, kivéve, ha a játékos a társának próbált feladni.'
		),
		rule: { n: '13.2.5', page: 30 }
	},
	{
		id: 'serve-order',
		question: t(
			'Anna served, you lost the rally, then won the serve back. Who serves now?',
			'Anna nyitott, elvesztettétek a labdamenetet, aztán visszaszereztétek a nyitásjogot. Ki nyit most?'
		),
		options: [
			t('Anna again', 'Megint Anna'),
			t('Her partner, who did not serve last time', 'A társa, aki legutóbb nem nyitott'),
			t('Either of them', 'Bármelyikük')
		],
		answer: 1,
		why: t(
			'When the receiving team wins the rally, it gains the serve and the player who did not serve last time serves.',
			'Ha a fogadó csapat nyeri a labdamenetet, megszerzi a nyitásjogot, és az a játékos nyit, aki legutóbb nem.'
		),
		rule: { n: '12.2.2.2', page: 28 }
	},
	{
		id: 'serve-time',
		question: t(
			'How long does the server have after the whistle?',
			'Mennyi ideje van a nyitónak a sípszó után?'
		),
		options: [
			t('5 seconds', '5 másodperc'),
			t('8 seconds', '8 másodperc'),
			t('12 seconds', '12 másodperc')
		],
		answer: 0,
		why: t(
			'On the beach the server has 5 seconds; indoors it is 8.',
			'Strandon a nyitónak 5 másodperce van, teremben 8.'
		),
		rule: { n: '12.4.4', page: 29 }
	},
	{
		id: 'hands-up',
		question: t(
			'While her partner serves, a player stands at the net with both hands raised above her head.',
			'Miközben a társa nyit, egy játékos a hálónál áll, mindkét kezét a feje fölé emelve.'
		),
		options: [LEGAL, FAULT],
		answer: 1,
		why: t(
			'Players of the serving team may not raise their hands above their heads during the serve until the ball has passed the net.',
			'A nyitó csapat játékosai nyitás közben nem emelhetik a kezüket a fejük fölé, amíg a labda át nem jutott a hálón.'
		),
		rule: { n: '12.5.3', page: 29 }
	},
	{
		id: 'overhand-receive',
		question: t(
			'A player receives a float serve overhand with her fingers, and the ball touches her hands one after the other in one action.',
			'Egy játékos kosárérintéssel fogad egy lebegtetett nyitást, és a labda egy mozdulaton belül egymás után éri a két kezét.'
		),
		options: [LEGAL, FAULT],
		answer: 1,
		why: t(
			'On the first hit, consecutive contacts in one action are allowed, but not when the ball is played overhand with the fingers. Indoors this would be legal.',
			'Az első érintésnél az egy mozdulaton belüli egymás utáni érintések megengedettek, de kosárérintésnél nem. Teremben ez szabályos lenne.'
		),
		rule: { n: '9.2.2.2', page: 26 }
	},
	{
		id: 'under-net',
		question: t(
			'Chasing a ball, a player runs under the net into the opponents’ court but does not get in their way.',
			'Egy játékos a labda után futva a háló alatt átfut az ellenfél térfelére, de nem zavarja őket.'
		),
		options: [LEGAL, FAULT],
		answer: 0,
		why: t(
			'There is no centre line on the beach: a player may enter the opponents’ space, court or free zone as long as they do not interfere with play.',
			'Strandon nincs középvonal: a játékos beléphet az ellenfél terébe, térfelére vagy szabad területére, ha nem zavarja a játékot.'
		),
		rule: { n: '11.2.1', page: 27 }
	},
	{
		id: 'coaching',
		question: t(
			'At an FIVB World Tour match, may a coach in the stands give the players instructions during the match?',
			'FIVB világversenyen adhat-e utasítást a lelátón ülő edző a játékosoknak a mérkőzés alatt?'
		),
		options: [YES, NO],
		answer: 1,
		why: t(
			'At FIVB World and Official competitions players may not receive outside assistance or coaching during the match. Some age-group events allow it.',
			'FIVB világ- és hivatalos versenyeken a játékosok a mérkőzés alatt nem kaphatnak külső segítséget vagy edzői utasítást. Egyes korosztályos versenyeken megengedett.'
		),
		rule: { n: '4.1.4', page: 18 }
	},
	{
		id: 'injury',
		question: t(
			'How long may an injured player take to recover?',
			'Mennyi ideje van egy sérült játékosnak a felépülésre?'
		),
		options: [
			t('1 minute', '1 perc'),
			t('5 minutes', '5 perc'),
			t('As long as needed', 'Amennyi kell')
		],
		answer: 1,
		why: t(
			'An injured player gets at most 5 minutes. If they cannot carry on, the team is declared incomplete.',
			'A sérült játékosnak legfeljebb 5 perce van. Ha nem tudja folytatni, a csapatot hiányosnak nyilvánítják.'
		),
		rule: { n: '17.1.2', page: 34 }
	}
];
