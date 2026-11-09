import { opponent, player, pt, type Diagram, type Text } from '#lib/volley/diagram.js';
import { TARGET } from '#lib/volley/formations.js';
import type { LeagueId } from '#lib/volley/leagues.js';

/**
 * Match situations players argue about, each with the FIVB 2025–2028 ruling. Every ruling was
 * checked against the rule text (and the FIVB Casebook 2025 where it decides the case); `page` is
 * the page of the rules PDF. Differences in other rule sets are listed only where confirmed.
 */
export type Situation = {
	id: string;
	scenario: Text;
	/** Drawn where a place on the court decides the case, never where only the contact does. */
	diagram?: Diagram;
	ruling: Text;
	verdict: 'legal' | 'fault' | 'depends';
	why: Text;
	rules: { n: string; page: number }[];
	elsewhere?: { leagues: LeagueId[]; text: Text }[];
};

export const RULES_PDF =
	'https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf';
export const CASEBOOK_PDF = 'https://inside.cev.eu/media/n40ey4ap/casebook-2025.pdf';

/** Where the opponents' serve comes from: their zone 1, at the far edge of the strip. */
const SERVE = pt(1.8, -1.2);

export const SITUATIONS: Situation[] = [
	{
		id: 'net-touch-block',
		diagram: {
			players: [player('MB1', 4.6, 0.4), opponent('S', 3.8, -0.8), opponent('MB1', 5.4, -0.8)],
			ball: [
				{ from: pt(3.8, -0.8), to: pt(5.4, -0.8) },
				{ from: pt(5.4, -0.8), to: pt(3.0, 5.0) }
			]
		},
		scenario: {
			en: 'A middle blocker jumps to block a quick set, misses the ball, and brushes the net tape between the antennas.',
			hu: 'A center felugrik sáncolni egy gyors labdára, nem éri el a labdát, és a két antenna között hozzáér a háló felső szalagjához.'
		},
		verdict: 'fault',
		ruling: { en: 'Fault by the blocker.', hu: 'A sáncoló hibája.' },
		why: {
			en: 'Touching the net between the antennas while playing the ball is a fault. Playing the ball includes take-off, the attempt and the landing, and a blocker trying to reach the ball counts even without touching it.',
			hu: 'Hiba, ha a játékos labdamegjátszás közben a két antenna között érinti a hálót. A megjátszáshoz tartozik az elrugaszkodás, a kísérlet és a talajfogás is, és a labdát elérni próbáló sáncoló akkor is megjátssza, ha nem ér hozzá.'
		},
		rules: [
			{ n: '11.3.1', page: 33 },
			{ n: '11.4.4', page: 33 }
		],
		elsewhere: [
			{
				leagues: ['nfhs'],
				text: {
					en: 'NFHS: any net contact is a fault, except by loose hair or when the opponents drive the net into a player.',
					hu: 'NFHS: minden hálóérintés hiba, kivéve, ha csak a laza haj ér a hálóhoz, vagy ha az ellenfél üti a hálót a játékosnak.'
				}
			}
		]
	},
	{
		id: 'net-touch-after',
		scenario: {
			en: 'After landing safely from a spike, an attacker turns away and her wrist touches the net. Another time, a ponytail flicks the net during a spike.',
			hu: 'Egy ütő a leütés után biztonságosan földet ér, megfordul, és a csuklója hozzáér a hálóhoz. Máskor egy lófarok súrolja a hálót leütés közben.'
		},
		verdict: 'legal',
		ruling: {
			en: 'Both legal, unless the hair affects play, for example by catching in the net.',
			hu: 'Mindkettő szabályos, hacsak a haj nem befolyásolja a játékot, például beakad a hálóba.'
		},
		why: {
			en: 'The wrist touched the net after the playing action was over. Hair touching the net is a fault only if it affects play (FIVB Casebook 3.27).',
			hu: 'A csukló a megjátszás befejezése után ért a hálóhoz. A haj érintése csak akkor hiba, ha befolyásolja a játékot (FIVB esetgyűjtemény, 3.27).'
		},
		rules: [
			{ n: '11.3.1', page: 33 },
			{ n: '11.4.4', page: 33 }
		],
		elsewhere: [
			{
				leagues: ['nfhs'],
				text: {
					en: 'NFHS treats almost any net contact as a fault, so the wrist touch is a fault there.',
					hu: 'Az NFHS szinte minden hálóérintést hibának tekint, így ott a csukló érintése hiba.'
				}
			}
		]
	},
	{
		id: 'antenna',
		diagram: {
			players: [player('MB1', 8.6, 0.45), player('OH1', -0.4, 0.5), opponent('OH1', 7.6, -0.8)],
			ball: [{ from: pt(7.6, -0.8), to: pt(8.4, -0.1) }]
		},
		scenario: {
			en: 'A blocker grabs the antenna while blocking. Another time, a hitter lands, stumbles and touches the net outside the antenna.',
			hu: 'Egy sáncoló sáncolás közben megfogja az antennát. Máskor egy ütő talajfogás után megbotlik, és az antennán kívül érinti a hálót.'
		},
		verdict: 'depends',
		ruling: {
			en: 'Grabbing the antenna: fault. Touching the net outside the antenna: legal.',
			hu: 'Az antenna megfogása hiba. A háló érintése az antennán kívül szabályos.'
		},
		why: {
			en: 'Touching the antenna while playing the ball interferes with play. Net contact outside the antennas is not a fault unless the player uses it for support to hit the ball.',
			hu: 'Az antenna érintése labdamegjátszás közben a játék zavarása. Az antennákon kívüli hálóérintés nem hiba, hacsak a játékos nem támaszkodik rá a labda megütéséhez.'
		},
		rules: [
			{ n: '11.3.2', page: 33 },
			{ n: '11.4.4', page: 33 }
		]
	},
	{
		id: 'centre-line',
		diagram: {
			players: [player('MB1', 4.5, 0.1), opponent('MB1', 3.6, -0.85), opponent('S', 5.6, -0.85)]
		},
		scenario: {
			en: 'Landing from a block, a player’s foot ends up partly over the centre line with the heel still on it. Another time her whole foot lands in the opponents’ court, and another time her hand does.',
			hu: 'Sáncolásból leérkezve egy játékos lába részben átér a középvonalon, de a sarka még a vonalon van. Máskor az egész lába az ellenfél térfelére érkezik, máskor a keze.'
		},
		verdict: 'depends',
		ruling: {
			en: 'Foot partly over: legal. Whole foot over: fault. Hand over: legal if it does not interfere with the opponents.',
			hu: 'Részben átérő láb: szabályos. Teljesen átérő láb: hiba. Átérő kéz: szabályos, ha nem zavarja az ellenfelet.'
		},
		why: {
			en: 'Part of each foot must stay on or directly above the centre line. Other body parts may touch the opponents’ court as long as they do not interfere with play.',
			hu: 'A lábnak egy része a középvonalon vagy közvetlenül felette kell maradjon. Más testrész érintheti az ellenfél térfelét, ha nem zavarja a játékot.'
		},
		rules: [
			{ n: '11.2.2.1', page: 32 },
			{ n: '11.2.2.2', page: 32 },
			{ n: '11.4.3', page: 33 }
		],
		elsewhere: [
			{
				leagues: ['ncaa'],
				text: {
					en: 'NCAA (from 2026): a whole foot across is a fault; other body parts are allowed if they do not interfere.',
					hu: 'NCAA (2026-tól): a teljesen átérő láb hiba; más testrész megengedett, ha nem zavarja a játékot.'
				}
			},
			{
				leagues: ['usav'],
				text: {
					en: 'USA Volleyball: a whole foot or any other body part may be across, as long as some part is on or above the line and there is no interference or safety hazard.',
					hu: 'USA Volleyball: a teljes láb vagy bármely más testrész is átérhet, ha valamely része a vonalon vagy felette van, és nem zavar vagy veszélyeztet.'
				}
			},
			{
				leagues: ['nfhs'],
				text: {
					en: 'NFHS: only the feet or hands may touch the opponents’ court, with part of them on or above the line; any other body part on the floor across the line is illegal.',
					hu: 'NFHS: csak a láb vagy a kéz érintheti az ellenfél térfelét, és annak egy része a vonalon vagy felette kell legyen; más testrész a vonalon túl a talajon szabálytalan.'
				}
			}
		]
	},
	{
		id: 'outside-antenna',
		diagram: {
			players: [
				player('L', 1.6, 6.2, 'libero'),
				player('OH1', 1.2, 3.2),
				opponent('OPP', 2.2, -0.9)
			],
			moves: [{ from: pt(1.2, 3.2), to: pt(-0.5, -0.9) }],
			ball: [
				{ from: pt(1.6, 6.2), to: pt(-0.6, -1.3) },
				{ from: pt(-0.6, -1.3), to: pt(2.5, 2.5) }
			]
		},
		scenario: {
			en: 'A first-touch dig flies outside the antenna into the opponents’ free zone. A teammate runs round and plays it back over, still outside the antenna.',
			hu: 'Egy első érintésből védett labda az antennán kívül átrepül az ellenfél kifutójába. Egy csapattárs utánafut, és az antennán kívül visszajátssza.'
		},
		verdict: 'legal',
		ruling: {
			en: 'Legal, if it comes back through the space outside the antenna on the same side of the court.',
			hu: 'Szabályos, ha ugyanazon az oldalon, az antennán kívüli téren keresztül tér vissza.'
		},
		why: {
			en: 'A ball from the team’s first hit that crossed through the external space may be played back within the team’s hits. A second or third hit that leaves outside the crossing space is a fault at once. The player must not touch the opponents’ court.',
			hu: 'A csapat első érintéséből a külső áthaladási téren átjutott labda a csapat érintésein belül visszahozható. Ha a második vagy harmadik érintés megy ki az áthaladási téren kívül, az azonnal hiba. A játékos nem érintheti az ellenfél pályáját.'
		},
		rules: [{ n: '10.1.2', page: 31 }],
		elsewhere: [
			{
				leagues: ['nfhs'],
				text: {
					en: 'NFHS: no pursuit. The ball is dead once it has completely crossed the plane of the net outside the antenna.',
					hu: 'NFHS: nincs utánafutás. A labda halott, amint teljesen átért a háló síkján az antennán kívül.'
				}
			},
			{
				leagues: ['ncaa', 'usav'],
				text: {
					en: 'NCAA and USA Volleyball allow it with conditions, such as needing at least 2 m of clearance; NCAA also bars going under the net, net cable or referee stand.',
					hu: 'Az NCAA és a USA Volleyball feltételekkel engedi, például legalább 2 m szabad térrel; az NCAA azt sem engedi, hogy a játékos a háló, a hálókábel vagy a játékvezetői állvány alatt menjen át.'
				}
			}
		]
	},
	{
		id: 'antenna-spike',
		diagram: {
			players: [player('OH1', 0.9, 1.0), opponent('OPP', 1.8, -0.9)],
			ball: [
				{ from: pt(0.9, 1.0), to: pt(0, 0) },
				{ from: pt(0, 0), to: pt(1.0, -1.3) }
			]
		},
		scenario: {
			en: 'A spike clips the antenna and lands in the opponents’ court.',
			hu: 'Egy leütés súrolja az antennát, és az ellenfél pályájára esik.'
		},
		verdict: 'fault',
		ruling: {
			en: 'Out: the attacking team loses the rally.',
			hu: 'Kint: a támadó csapat elveszíti a labdamenetet.'
		},
		why: {
			en: 'The antennas count as outside the court, and the ball must cross between them. A ball that touches only the side band inside the antenna stays in play.',
			hu: 'Az antennák a pályán kívülinek számítanak, a labdának közöttük kell átjutnia. Ha a labda csak az antennán belüli oldalszalagot érinti, játékban marad.'
		},
		rules: [
			{ n: '8.4.3', page: 29 },
			{ n: '10.1.1', page: 31 }
		]
	},
	{
		id: 'block-touch',
		scenario: {
			en: 'The ball touches the block, then the blocking team plays it three more times.',
			hu: 'A labda hozzáér a sánchoz, utána a sáncoló csapat még háromszor megjátssza.'
		},
		verdict: 'legal',
		ruling: { en: 'Legal.', hu: 'Szabályos.' },
		why: {
			en: 'A block touch is not one of the team’s three hits, and the blocker may also take the next hit.',
			hu: 'A sáncérintés nem számít bele a csapat három érintésébe, és a sáncoló is megjátszhatja a következő labdát.'
		},
		rules: [
			{ n: '14.4.1', page: 37 },
			{ n: '14.4.2', page: 37 }
		]
	},
	{
		id: 'reach-over',
		diagram: {
			players: [player('MB1', 7.0, 0.45), opponent('S', 5.4, -0.8), opponent('OH1', 7.9, -1.0)],
			ball: [{ from: pt(5.4, -0.8), to: pt(7.0, -0.35) }]
		},
		scenario: {
			en: 'A blocker reaches over the net and touches the ball before the opponent attacks it. Another time, she reaches over and blocks the ball after their spike.',
			hu: 'Egy sáncoló átnyúl a háló fölött, és hozzáér a labdához, mielőtt az ellenfél megtámadná. Máskor átnyúl, és a leütés után sáncolja a labdát.'
		},
		verdict: 'depends',
		ruling: {
			en: 'Before their attack hit: fault. After their attack hit: legal.',
			hu: 'Az ellenfél támadóérintése előtt: hiba. A támadóérintés után: szabályos.'
		},
		why: {
			en: 'Blockers may reach beyond the net but may not interfere with the opponents’ play before or during their attack hit.',
			hu: 'A sáncoló átnyúlhat a háló fölött, de az ellenfél játékát a támadóérintése előtt és alatt nem zavarhatja.'
		},
		rules: [
			{ n: '14.3', page: 37 },
			{ n: '14.6.1', page: 37 }
		],
		elsewhere: [
			{
				leagues: ['ncaa'],
				text: {
					en: 'NCAA: a block that touches the ball at the same moment as the opponent’s attack hit is a blocking fault. USA Volleyball treats simultaneous contact as no fault.',
					hu: 'NCAA: ha a sánc az ellenfél támadóérintésével egy időben ér a labdához, az sáncolási hiba. A USA Volleyball szerint az egyidejű érintés nem hiba.'
				}
			}
		]
	},
	{
		id: 'back-row-block',
		diagram: {
			players: [
				player('S', 6.3, 0.5),
				{ label: 'S', x: 7.6, y: 4.5, faded: true },
				player('OPP', 1.4, 0.9),
				player('MB1', 4.3, 0.7),
				player('OH1', 7.8, 1.5),
				player('OH2', 1.5, 5.8),
				player('L', 4.5, 7.2, 'libero'),
				opponent('OH1', 3.0, -0.9)
			],
			moves: [{ from: pt(7.6, 4.5), to: pt(6.3, 0.5) }],
			ball: [{ from: pt(3.0, -0.9), to: pt(6.2, -0.2) }]
		},
		scenario: {
			en: 'A back-row setter jumps at the net, reaches above the top of it and touches the opponents’ attack.',
			hu: 'Egy hátsó soros feladó a hálónál felugrik, a háló teteje fölé nyúl, és hozzáér az ellenfél támadásához.'
		},
		verdict: 'fault',
		ruling: { en: 'Fault: an illegal block.', hu: 'Hiba: szabálytalan sánc.' },
		why: {
			en: 'Only front-row players may complete a block. Jumping to block without touching the ball is not a fault.',
			hu: 'Sáncot csak első soros játékos fejezhet be. Ha a labdához nem ér hozzá, a sánckísérlet nem hiba.'
		},
		rules: [
			{ n: '14.1.1', page: 36 },
			{ n: '14.6.2', page: 37 }
		]
	},
	{
		id: 'back-row-attack',
		diagram: {
			players: [
				player('S', TARGET.x, TARGET.y),
				player('OH1', 4.5, 3.0),
				{ label: 'OPP', x: 1.6, y: 4.3, faded: true },
				player('OPP', 1.6, 2.4)
			],
			moves: [{ from: pt(1.6, 4.3), to: pt(1.6, 2.4) }],
			ball: [
				{ from: TARGET, to: pt(4.5, 3.0) },
				{ from: pt(4.5, 3.0), to: pt(2.5, -1.1) }
			]
		},
		scenario: {
			en: 'A back-row player takes off standing on the attack line and spikes a ball that is entirely above the net. Another time she takes off from behind the line and lands in front of it.',
			hu: 'Egy hátsó soros játékos a támadóvonalon állva rugaszkodik el, és leüt egy labdát, amely teljes terjedelmével a háló felett van. Máskor a vonal mögül rugaszkodik el, és előtte fog talajt.'
		},
		verdict: 'depends',
		ruling: {
			en: 'Taking off on the line: fault. Taking off behind it and landing in front: legal.',
			hu: 'A vonalon elrugaszkodva: hiba. Mögüle elrugaszkodva és előtte leérkezve: szabályos.'
		},
		why: {
			en: 'At take-off the back-row attacker’s feet must not touch or cross the attack line. Where they land does not matter. From the front zone, a back-row player may only attack a ball that is partly below the top of the net.',
			hu: 'Elrugaszkodáskor a hátsó soros támadó lába nem érintheti és nem lépheti át a támadóvonalat. Hogy hol fog talajt, nem számít. Az első zónából hátsó soros játékos csak olyan labdát támadhat, amelynek egy része a háló felső széle alatt van.'
		},
		rules: [
			{ n: '13.2.2', page: 36 },
			{ n: '13.3.3', page: 36 }
		]
	},
	{
		id: 'libero-set',
		diagram: {
			players: [player('L', 5.6, 2.2, 'libero'), player('OH1', 1.5, 1.0), player('MB1', 4.0, 0.8)],
			ball: [
				{ from: pt(5.6, 2.2), to: pt(1.5, 1.0) },
				{ from: pt(1.5, 1.0), to: pt(7.5, -1.1) }
			]
		},
		scenario: {
			en: 'The libero, standing in front of the attack line, sets with her fingers, and a hitter spikes the ball while it is entirely above the net.',
			hu: 'A liberó a támadóvonal előtt kosárérintéssel feladja a labdát, és egy ütő leüti, miközben a labda teljes terjedelmével a háló felett van.'
		},
		verdict: 'fault',
		ruling: { en: 'Fault by the attacking team.', hu: 'A támadó csapat hibája.' },
		why: {
			en: 'A finger set by the libero from the front zone may not be attacked while entirely above the net. The same set from behind the line, or a forearm pass, may be attacked freely.',
			hu: 'A liberó első zónából végzett kosárérintéses feladását nem lehet megtámadni, amíg teljes terjedelmével a háló felett van. Ugyanez a vonal mögül vagy alkarral adott labda szabadon támadható.'
		},
		rules: [
			{ n: '13.3.6', page: 36 },
			{ n: '19.3.1.4', page: 45 }
		]
	},
	{
		id: 'libero-attack',
		diagram: {
			players: [
				player('S', TARGET.x, TARGET.y),
				player('L', 4.5, 3.6, 'libero'),
				player('OH1', 1.4, 1.0)
			],
			ball: [
				{ from: TARGET, to: pt(4.5, 3.6) },
				{ from: pt(4.5, 3.6), to: pt(2.5, -1.1) }
			]
		},
		scenario: {
			en: 'The libero jumps from the back court and spikes a ball that is above the net. Another time, the libero joins a block.',
			hu: 'A liberó a hátsó területről felugrik, és leüt egy háló feletti labdát. Máskor beáll sáncolni.'
		},
		verdict: 'fault',
		ruling: {
			en: 'Fault in both cases, even just trying to block.',
			hu: 'Mindkettő hiba, már a sánckísérlet is.'
		},
		why: {
			en: 'The libero may not attack a ball that is entirely above the net from anywhere, and may not block or attempt to block.',
			hu: 'A liberó sehonnan sem támadhat olyan labdát, amely teljes terjedelmével a háló felett van, és nem sáncolhat, sánckísérletben sem vehet részt.'
		},
		rules: [
			{ n: '13.3.5', page: 36 },
			{ n: '19.3.1.2', page: 44 },
			{ n: '19.3.1.3', page: 44 }
		]
	},
	{
		id: 'first-hit-double',
		scenario: {
			en: 'Receiving a hard serve, the ball hits a player’s forearms and then her chest in one movement.',
			hu: 'Egy erős nyitás fogadásakor a labda egyetlen mozdulaton belül a játékos alkarjáról a mellkasára pattan.'
		},
		verdict: 'legal',
		ruling: { en: 'Legal.', hu: 'Szabályos.' },
		why: {
			en: 'On the team’s first hit the ball may touch several parts of the body in succession, as long as it is one action. Catching and throwing it is still a fault.',
			hu: 'A csapat első érintésénél a labda egymás után több testrészt is érinthet, ha az egyetlen mozdulat. A labda megfogása és eldobása így is hiba.'
		},
		rules: [{ n: '9.2.3.2', page: 31 }]
	},
	{
		id: 'catch-four',
		scenario: {
			en: 'A setter holds the ball for a moment and pushes it out. Another time, a team touches the ball four times before it goes over.',
			hu: 'Egy feladó egy pillanatra megtartja a labdát, aztán kitolja. Máskor egy csapat négyszer ér a labdához, mielőtt átküldené.'
		},
		verdict: 'fault',
		ruling: { en: 'Fault in both cases.', hu: 'Mindkettő hiba.' },
		why: {
			en: 'The ball must rebound, not be caught or thrown, and a team has at most three hits (a block touch not counted).',
			hu: 'A labdának el kell pattannia, nem lehet megfogni vagy eldobni, és egy csapat legfeljebb háromszor érintheti (a sáncérintést nem számítva).'
		},
		rules: [
			{ n: '9.1', page: 30 },
			{ n: '9.2.2', page: 30 },
			{ n: '9.3.1', page: 31 },
			{ n: '9.3.3', page: 31 }
		],
		elsewhere: [
			{
				leagues: ['ncaa', 'nfhs', 'usav'],
				text: {
					en: 'NCAA, NFHS and USA Volleyball also allow a double contact in one attempt on the team’s second hit, if a teammate plays the ball next. FIVB has no such exception.',
					hu: 'Az NCAA, az NFHS és a USA Volleyball a csapat második érintésénél is megenged egy kísérleten belüli kettős érintést, ha utána csapattárs játssza meg a labdát. Az FIVB-nél nincs ilyen kivétel.'
				}
			}
		]
	},
	{
		id: 'ceiling',
		scenario: {
			en: 'A free ball hits the ceiling above a team’s own court and comes back down.',
			hu: 'Egy könnyű labda a csapat saját térfele fölött a mennyezetnek ütközik, és visszaesik.'
		},
		verdict: 'fault',
		ruling: {
			en: 'Out: the team that touched it last loses the rally.',
			hu: 'Kint: az a csapat veszíti el a labdamenetet, amelyik utoljára érintette.'
		},
		why: {
			en: 'Under FIVB rules any ball touching the ceiling is out.',
			hu: 'Az FIVB-szabályok szerint minden labda, amely a mennyezethez ér, kint van.'
		},
		rules: [{ n: '8.4.2', page: 29 }],
		elsewhere: [
			{
				leagues: ['ncaa', 'usav'],
				text: {
					en: 'NCAA and USA Volleyball keep a ball in play if it touches a ceiling at least 4.6 m high above the playable area of the team that touched it last.',
					hu: 'Az NCAA és a USA Volleyball szerint a labda játékban marad, ha legalább 4,6 m magas mennyezethez ér az utoljára érintő csapat játékterülete felett.'
				}
			}
		]
	},
	{
		id: 'foot',
		scenario: {
			en: 'A defender saves the ball with her foot.',
			hu: 'Egy védő lábbal menti meg a labdát.'
		},
		verdict: 'legal',
		ruling: { en: 'Legal.', hu: 'Szabályos.' },
		why: {
			en: 'The ball may touch any part of the body.',
			hu: 'A labda bármely testrésszel érinthető.'
		},
		rules: [{ n: '9.2.1', page: 30 }]
	},
	{
		id: 'serve-net',
		diagram: {
			players: [player('OH1', 7.4, 9.0), opponent('OH2', 4.0, -0.9)],
			ball: [
				{ from: pt(7.4, 9.0), to: pt(6.5, 0) },
				{ from: pt(6.5, 0), to: pt(6.0, -1.1) }
			]
		},
		scenario: {
			en: 'A serve clips the top of the net and drops in. Another time the server’s toe touches the end line as she hits the ball.',
			hu: 'Egy nyitás súrolja a háló tetejét, és bepottyan. Máskor a nyitó lábujja a megütés pillanatában az alapvonalhoz ér.'
		},
		verdict: 'depends',
		ruling: {
			en: 'Net serve: legal. Toe on the line: service fault, so the receiving team wins the rally.',
			hu: 'A hálót érintő nyitás: szabályos. Vonalon lévő láb: nyitáshiba, a fogadó csapat nyeri a labdamenetet.'
		},
		why: {
			en: 'A served ball may touch the net as it crosses. At the service hit, or take-off for a jump serve, the server must not touch the court, end line included.',
			hu: 'A nyitott labda átjutás közben érintheti a hálót. A nyitó a megütéskor, illetve felugrásos nyitásnál az elrugaszkodáskor nem érintheti a pályát, az alapvonalat sem.'
		},
		rules: [
			{ n: '10.2', page: 32 },
			{ n: '12.4.3', page: 34 },
			{ n: '12.6.2.1', page: 35 }
		]
	},
	{
		id: 'overlap',
		diagram: {
			players: [
				player('S', 7.4, 1.9),
				player('OH1', 7.6, 2.9),
				player('MB1', 4.5, 1.2),
				player('OPP', 1.4, 1.4),
				player('OH2', 2.0, 5.8),
				player('L', 4.6, 6.4, 'libero')
			],
			ball: [{ from: SERVE, to: pt(4.6, 6.4) }]
		},
		scenario: {
			en: 'At the serve, the receiving team’s player in zone 1 stands completely in front of the player in zone 2.',
			hu: 'Nyitáskor a fogadó csapat 1-es helyen álló játékosa teljesen a 2-es helyen álló előtt áll.'
		},
		verdict: 'fault',
		ruling: {
			en: 'Positional fault by the receiving team: point and serve to the opponents.',
			hu: 'A fogadó csapat állásrendi hibája: pont és nyitásjog az ellenfélnek.'
		},
		why: {
			en: 'Each back-row player must be at least partly further from the net than the front-row player in front of them at the service hit. Since 2025, FIVB checks this only for the receiving team; feet that partly overlap are fine.',
			hu: 'Minden hátsó soros játékosnak a nyitás pillanatában legalább részben távolabb kell lennie a hálótól, mint az előtte álló első soros játékosnak. 2025 óta az FIVB ezt csak a fogadó csapatnál vizsgálja; a részben átfedő lábak megengedettek.'
		},
		rules: [
			{ n: '7.4', page: 27 },
			{ n: '7.5', page: 27 }
		],
		elsewhere: [
			{
				leagues: ['ncaa', 'nfhs', 'usav'],
				text: {
					en: 'NCAA, NFHS and USA Volleyball still check the serving team’s order too (the server excepted).',
					hu: 'Az NCAA, az NFHS és a USA Volleyball a nyitó csapat állásrendjét is ellenőrzi (a nyitó kivételével).'
				}
			}
		]
	},
	{
		id: 'screen',
		scenario: {
			en: 'As her teammate serves, a front-row player of the serving team raises her hands above her head.',
			hu: 'Miközben a társa nyit, a nyitó csapat egyik első soros játékosa a feje fölé emeli a kezét.'
		},
		verdict: 'fault',
		ruling: {
			en: 'Fault (screening): the serve goes to the opponents.',
			hu: 'Hiba (takarás): pont és nyitásjog az ellenfélnek.'
		},
		why: {
			en: 'Since 2025, players of the serving team may not raise their hands above their heads until the served ball has crossed the net, wherever they stand.',
			hu: '2025 óta a nyitó csapat játékosai, bárhol álljanak, nem emelhetik a kezüket a fejük fölé, amíg a nyitott labda át nem jut a hálón.'
		},
		rules: [
			{ n: '12.5.3', page: 35 },
			{ n: '12.6.2.3', page: 35 }
		],
		elsewhere: [
			{
				leagues: ['ncaa', 'nfhs', 'usav'],
				text: {
					en: 'NCAA adopted the same hands-above-head rule in 2026; NFHS and USA Volleyball have it too.',
					hu: 'Az NCAA 2026-ban vezette be ugyanezt a szabályt; az NFHS-nél és a USA Volleyballnál is megvan.'
				}
			}
		]
	},
	{
		id: 'attack-serve',
		diagram: {
			players: [player('OH1', 4.5, 2.2), player('OH2', 2.0, 5.8), player('L', 4.6, 6.4, 'libero')],
			ball: [
				{ from: SERVE, to: pt(4.5, 2.2) },
				{ from: pt(4.5, 2.2), to: pt(7.0, -1.1) }
			]
		},
		scenario: {
			en: 'A front-row receiver, standing in front of the attack line, spikes the incoming serve while it is entirely above the net.',
			hu: 'Egy első soros fogadó a támadóvonal előtt állva leüti az érkező nyitást, miközben az teljes terjedelmével a háló felett van.'
		},
		verdict: 'fault',
		ruling: { en: 'Fault by the receiving team.', hu: 'A fogadó csapat hibája.' },
		why: {
			en: 'It is a fault to complete an attack hit on the opponents’ serve when the ball is in the front zone and entirely higher than the top of the net. Attacking it while it is behind the attack line, or partly below the top of the net, is legal. Blocking a serve is always a fault.',
			hu: 'Hiba az ellenfél nyitását megtámadni, ha a labda az első zónában van, és teljes terjedelmével a háló felső széle fölött van. Ha a labda a támadóvonal mögött van, vagy egy része a háló felső széle alatt van, szabályos. A nyitást sáncolni mindig hiba.'
		},
		rules: [
			{ n: '13.3.4', page: 36 },
			{ n: '14.5', page: 37 }
		],
		elsewhere: [
			{
				leagues: ['nfhs'],
				text: {
					en: 'NFHS forbids attacking a serve that is entirely above the net from anywhere on the court.',
					hu: 'Az NFHS a pálya bármely pontjáról tiltja a teljes terjedelmével a háló felett lévő nyitás megtámadását.'
				}
			}
		]
	}
];
