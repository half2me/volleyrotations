import type { RuleRef } from '#lib/beach.js';
import type { Sport } from '#lib/volley/match.js';

/**
 * Court, net and ball specifications from the FIVB rulebooks (2025–2028), indoor and beach, each
 * with the rule and the PDF page it comes from.
 */
type Text = { en: string; hu: string };
export type Fact = { label: Text; value: Text; rule: RuleRef };

export type Spec = {
	/** Court length and width in metres. */
	court: { length: number; width: number };
	/** Free zone: the minimum, and at FIVB World and Official competitions. */
	freeZone: { min: number; fivb: Text };
	/**
	 * Senior net heights in metres, and the net's length: the shortest and longest the rules allow,
	 * in metres, with the same as text.
	 */
	net: { men: number; women: number; span: [number, number]; length: Text; bands: Text };
	/** How far outside the side lines the posts stand, in metres. */
	posts: [number, number];
	ball: { circumference: [number, number]; weight: [number, number]; pressure: [number, number] };
	facts: { court: Fact[]; net: Fact[]; ball: Fact[] };
};

const t = (en: string, hu: string): Text => ({ en, hu });

export const SPECS: Record<Sport, Spec> = {
	indoor: {
		court: { length: 18, width: 9 },
		freeZone: {
			min: 3,
			fivb: t(
				'5 m from the side lines, 6.5 m from the end lines',
				'az oldalvonalaktól 5 m, az alapvonalaktól 6,5 m'
			)
		},
		net: {
			men: 2.43,
			women: 2.24,
			span: [9.5, 10],
			length: t('9.50–10 m', '9,50–10 m'),
			bands: t('top band 7 cm, bottom band 5 cm', 'felső szalag 7 cm, alsó szalag 5 cm')
		},
		posts: [0.5, 1],
		ball: { circumference: [65, 67], weight: [260, 280], pressure: [0.3, 0.325] },
		facts: {
			court: [
				{
					label: t('Court', 'Pálya'),
					value: t('18 × 9 m, two 9 × 9 m halves', '18 × 9 m, két 9 × 9 m-es térfél'),
					rule: { rule: '1.1', page: 14 }
				},
				{
					label: t('Free zone', 'Kifutó'),
					value: t(
						'At least 3 m on every side. FIVB World and Official competitions: 5 m from the side lines, 6.5 m from the end lines.',
						'Minden oldalon legalább 3 m. FIVB világ- és hivatalos versenyeken az oldalvonalaktól 5 m, az alapvonalaktól 6,5 m.'
					),
					rule: { rule: '1.1', page: 14 }
				},
				{
					label: t('Free playing space', 'Szabad játéktér'),
					value: t(
						'At least 7 m high (12.5 m at FIVB events)',
						'Legalább 7 m magas (FIVB-eseményen 12,5 m)'
					),
					rule: { rule: '1.1', page: 14 }
				},
				{
					label: t('Lines', 'Vonalak'),
					value: t(
						'5 cm wide and part of the court they mark. A centre line under the net and an attack line 3 m from it on each side.',
						'5 cm szélesek, és a pályához tartoznak. Középvonal a háló alatt, és mindkét oldalon tőle 3 m-re támadóvonal.'
					),
					rule: { rule: '1.3', page: 15 }
				},
				{
					label: t('Service zone', 'Nyitási zóna'),
					value: t(
						'9 m wide behind each end line, as deep as the free zone',
						'9 m széles sáv az alapvonalak mögött, a kifutó széléig'
					),
					rule: { rule: '1.4.2', page: 15 }
				}
			],
			net: [
				{
					label: t('Height', 'Magasság'),
					value: t(
						'Men 2.43 m, women 2.24 m, measured at the middle of the court',
						'Férfiak 2,43 m, nők 2,24 m, a pálya közepén mérve'
					),
					rule: { rule: '2.1', page: 16 }
				},
				{
					label: t('Net', 'Háló'),
					value: t(
						'1 m wide, 9.50–10 m long, black 10 cm square mesh; white top band 7 cm, bottom band 5 cm',
						'1 m széles, 9,50–10 m hosszú, fekete, 10 cm-es négyzethálós; fehér felső szalag 7 cm, alsó szalag 5 cm'
					),
					rule: { rule: '2.2', page: 17 }
				},
				{
					label: t('Side bands and antennae', 'Oldalszalagok és antennák'),
					value: t(
						'White side bands 5 cm × 1 m above each side line. Antennae 1.80 m long, 10 mm thick, rising 80 cm above the net, striped every 10 cm.',
						'Fehér, 5 cm × 1 m-es oldalszalag minden oldalvonal fölött. Az antennák 1,80 m hosszúak, 10 mm vastagok, 80 cm-rel nyúlnak a háló fölé, 10 cm-enként csíkozva.'
					),
					rule: { rule: '2.3–2.4', page: 17 }
				},
				{
					label: t('Posts', 'Oszlopok'),
					value: t(
						'2.55 m high, 0.50–1.00 m outside the side lines (1 m at FIVB events)',
						'2,55 m magasak, az oldalvonalakon kívül 0,50–1,00 m-re (FIVB-eseményen 1 m-re)'
					),
					rule: { rule: '2.5', page: 17 }
				}
			],
			ball: [
				{
					label: t('Circumference', 'Kerület'),
					value: t('65–67 cm', '65–67 cm'),
					rule: { rule: '3.1', page: 18 }
				},
				{
					label: t('Weight', 'Tömeg'),
					value: t('260–280 g', '260–280 g'),
					rule: { rule: '3.1', page: 18 }
				},
				{
					label: t('Pressure', 'Belső nyomás'),
					value: t(
						'0.300–0.325 kg/cm² (294.3–318.8 mbar, 4.26–4.61 psi)',
						'0,300–0,325 kg/cm² (294,3–318,8 mbar, 4,26–4,61 psi)'
					),
					rule: { rule: '3.1', page: 18 }
				},
				{
					label: t('Cover', 'Borítás'),
					value: t(
						'Flexible leather or synthetic leather, one light colour or a combination of colours',
						'Rugalmas bőr vagy műbőr, egy világos szín vagy színek kombinációja'
					),
					rule: { rule: '3.1', page: 18 }
				}
			]
		}
	},
	beach: {
		court: { length: 16, width: 8 },
		freeZone: {
			min: 3,
			fivb: t('5–6 m on every side', 'minden oldalon 5–6 m')
		},
		net: {
			men: 2.43,
			women: 2.24,
			span: [8, 8.5],
			length: t('8.5 m (8 m allowed at FIVB events)', '8,5 m (FIVB-eseményen 8 m is lehet)'),
			bands: t('top and bottom bands 7–10 cm', 'felső és alsó szalag 7–10 cm')
		},
		posts: [0.7, 1],
		ball: { circumference: [66, 68], weight: [260, 280], pressure: [0.175, 0.225] },
		facts: {
			court: [
				{
					label: t('Court', 'Pálya'),
					value: t('16 × 8 m, two 8 × 8 m halves', '16 × 8 m, két 8 × 8 m-es térfél'),
					rule: { rule: '1.1', page: 14 }
				},
				{
					label: t('Free zone', 'Kifutó'),
					value: t(
						'At least 3 m on every side. FIVB World and Official competitions: 5–6 m.',
						'Minden oldalon legalább 3 m. FIVB világ- és hivatalos versenyeken 5–6 m.'
					),
					rule: { rule: '1.1', page: 14 }
				},
				{
					label: t('Sand', 'Homok'),
					value: t(
						'Levelled, as flat and uniform as possible, free of rocks and shells. At least 40 cm deep at FIVB events.',
						'Elegyengetett, a lehető legsimább és legegyenletesebb, kövektől és kagylóktól mentes. FIVB-eseményen legalább 40 cm mély.'
					),
					rule: { rule: '1.2', page: 14 }
				},
				{
					label: t('Lines', 'Vonalak'),
					value: t(
						'5 cm wide, preferably ribbons of a resistant material. No centre line and no attack line.',
						'5 cm szélesek, lehetőleg tartós anyagú szalagból. Nincs középvonal és nincs támadóvonal.'
					),
					rule: { rule: '1.3', page: 15 }
				},
				{
					label: t('Service zone', 'Nyitási zóna'),
					value: t(
						'8 m wide behind each end line, as deep as the free zone',
						'8 m széles sáv az alapvonalak mögött, a kifutó széléig'
					),
					rule: { rule: '1.4.1', page: 15 }
				}
			],
			net: [
				{
					label: t('Height', 'Magasság'),
					value: t(
						'Men 2.43 m, women 2.24 m. Age groups, for both sexes: 16 and under 2.24 m, 14 and under 2.12 m, 12 and under 2.00 m.',
						'Férfiak 2,43 m, nők 2,24 m. Korosztályonként, mindkét nemnek: 16 éves korig 2,24 m, 14 éves korig 2,12 m, 12 éves korig 2,00 m.'
					),
					rule: { rule: '2.1', page: 15 }
				},
				{
					label: t('Net', 'Háló'),
					value: t(
						'1 m wide, 8.5 m long (8 m allowed at FIVB events), 10 cm square mesh; top and bottom bands 7–10 cm',
						'1 m széles, 8,5 m hosszú (FIVB-eseményen 8 m is lehet), 10 cm-es négyzethálós; felső és alsó szalag 7–10 cm'
					),
					rule: { rule: '2.2', page: 16 }
				},
				{
					label: t('Side bands and antennae', 'Oldalszalagok és antennák'),
					value: t(
						'Side bands 5 cm × 1 m above each side line. Antennae 1.80 m long, 10 mm thick, rising 80 cm above the net, striped every 10 cm.',
						'5 cm × 1 m-es oldalszalag minden oldalvonal fölött. Az antennák 1,80 m hosszúak, 10 mm vastagok, 80 cm-rel nyúlnak a háló fölé, 10 cm-enként csíkozva.'
					),
					rule: { rule: '2.3–2.4', page: 16 }
				},
				{
					label: t('Posts', 'Oszlopok'),
					value: t(
						'2.55 m high, padded, 0.70–1.00 m outside the side lines (1 m at FIVB events)',
						'2,55 m magasak, párnázottak, az oldalvonalakon kívül 0,70–1,00 m-re (FIVB-eseményen 1 m-re)'
					),
					rule: { rule: '2.5', page: 17 }
				}
			],
			ball: [
				{
					label: t('Circumference', 'Kerület'),
					value: t('66–68 cm', '66–68 cm'),
					rule: { rule: '3.1', page: 17 }
				},
				{
					label: t('Weight', 'Tömeg'),
					value: t('260–280 g', '260–280 g'),
					rule: { rule: '3.1', page: 17 }
				},
				{
					label: t('Pressure', 'Belső nyomás'),
					value: t(
						'0.175–0.225 kg/cm² (171–221 mbar; about 2.5–3.2 psi)',
						'0,175–0,225 kg/cm² (171–221 mbar; nagyjából 2,5–3,2 psi)'
					),
					rule: { rule: '3.1', page: 17 }
				},
				{
					label: t('Cover', 'Borítás'),
					value: t(
						'Flexible leather, synthetic leather or similar that does not soak up moisture, since matches can be played in the rain; one light colour or a combination of colours',
						'Rugalmas bőr, műbőr vagy hasonló anyag, amely nem szívja magába a nedvességet, mert szabadtéren, esőben is játszanak; egy világos szín vagy színek kombinációja'
					),
					rule: { rule: '3.1', page: 17 }
				}
			]
		}
	}
};

/** Net heights the net diagram can show; the age groups are from the beach rules (2.1.1). */
export const NET_CATEGORIES = [
	{ id: 'men', height: 2.43, beachOnly: false },
	{ id: 'women', height: 2.24, beachOnly: false },
	{ id: 'u16', height: 2.24, beachOnly: true },
	{ id: 'u14', height: 2.12, beachOnly: true },
	{ id: 'u12', height: 2.0, beachOnly: true }
] as const;
export type NetCategory = (typeof NET_CATEGORIES)[number]['id'];
