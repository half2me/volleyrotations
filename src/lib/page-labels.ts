import type { GuideSlug, PagePath, PositionSlug } from '#lib/pages.js';
import { m } from '#lib/paraglide/messages.js';

/** Each guide's short name for menus and cards; the page itself uses its Markdown `title`. */
export const guideLabel: Record<GuideSlug, () => string> = {
	positions: m.guide_positions,
	rotations: m.guide_rotations,
	overlap: m.guide_overlap,
	systems: m.guide_systems,
	'serve-receive': m.guide_serve_receive,
	defense: m.guide_defense,
	coverage: m.guide_coverage,
	libero: m.guide_libero,
	substitutions: m.guide_substitutions,
	leagues: m.guide_leagues,
	scoring: m.guide_scoring,
	sitting: m.guide_sitting,
	'beach-to-indoor': m.guide_beach_to_indoor,
	glossary: m.guide_glossary
};

/** Each position page's short name. */
export const positionLabel: Record<PositionSlug, () => string> = {
	setter: m.role_s,
	'outside-hitter': m.position_outside,
	'middle-blocker': m.position_middle,
	opposite: m.role_opp,
	libero: m.role_l
};

/** Each page's name in the current locale. Typed by `PagePath`, so a new page needs one. */
export const pageLabel: Record<PagePath, () => string> = {
	'/': m.nav_home,
	'/learn': m.nav_learn,
	'/explorer': m.nav_explorer,
	'/overlap': m.nav_overlap,
	'/quiz': m.nav_quiz,
	'/lineup': m.nav_lineup,
	'/match': m.nav_match,
	'/rules': m.nav_rules,
	'/drills': m.drills_title,
	'/rules/situations': m.situations_title,
	'/rules/signals': m.signals_title,
	'/beach': m.beach_title,
	'/equipment': m.equipment_title,
	'/guides': m.nav_guides,
	'/guides/positions': guideLabel.positions,
	'/guides/rotations': guideLabel.rotations,
	'/guides/overlap': guideLabel.overlap,
	'/guides/systems': guideLabel.systems,
	'/guides/serve-receive': guideLabel['serve-receive'],
	'/guides/defense': guideLabel.defense,
	'/guides/coverage': guideLabel.coverage,
	'/guides/libero': guideLabel.libero,
	'/guides/substitutions': guideLabel.substitutions,
	'/guides/leagues': guideLabel.leagues,
	'/guides/scoring': guideLabel.scoring,
	'/guides/sitting': guideLabel.sitting,
	'/guides/beach-to-indoor': guideLabel['beach-to-indoor'],
	'/guides/glossary': guideLabel.glossary,
	'/positions/setter': positionLabel.setter,
	'/positions/outside-hitter': positionLabel['outside-hitter'],
	'/positions/middle-blocker': positionLabel['middle-blocker'],
	'/positions/opposite': positionLabel.opposite,
	'/positions/libero': positionLabel.libero,
	'/search': m.nav_search
};
