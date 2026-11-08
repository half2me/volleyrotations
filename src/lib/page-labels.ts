import type { GuideSlug, PagePath } from '#lib/pages.js';
import { m } from '#lib/paraglide/messages.js';

/** Each guide's short name for menus and cards; the page itself uses its Markdown `title`. */
export const guideLabel: Record<GuideSlug, () => string> = {
	positions: m.guide_positions,
	rotations: m.guide_rotations,
	overlap: m.guide_overlap,
	systems: m.guide_systems,
	'serve-receive': m.guide_serve_receive,
	defense: m.guide_defense,
	libero: m.guide_libero,
	substitutions: m.guide_substitutions,
	'beach-to-indoor': m.guide_beach_to_indoor,
	glossary: m.guide_glossary
};

/** Each page's name in the current locale. Typed by `PagePath`, so a new page needs one. */
export const pageLabel: Record<PagePath, () => string> = {
	'/': m.nav_home,
	'/explorer': m.nav_explorer,
	'/overlap': m.nav_overlap,
	'/quiz': m.nav_quiz,
	'/lineup': m.nav_lineup,
	'/match': m.nav_match,
	'/guides': m.nav_guides,
	'/guides/positions': guideLabel.positions,
	'/guides/rotations': guideLabel.rotations,
	'/guides/overlap': guideLabel.overlap,
	'/guides/systems': guideLabel.systems,
	'/guides/serve-receive': guideLabel['serve-receive'],
	'/guides/defense': guideLabel.defense,
	'/guides/libero': guideLabel.libero,
	'/guides/substitutions': guideLabel.substitutions,
	'/guides/beach-to-indoor': guideLabel['beach-to-indoor'],
	'/guides/glossary': guideLabel.glossary,
	'/search': m.nav_search
};
