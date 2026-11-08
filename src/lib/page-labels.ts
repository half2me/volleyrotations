import type { PagePath } from '#lib/pages.js';
import { m } from '#lib/paraglide/messages.js';

/** Each page's name in the current locale. Typed by `PagePath`, so a new page needs one. */
export const pageLabel: Record<PagePath, () => string> = {
	'/': m.nav_home,
	'/about': m.nav_about,
	'/search': m.nav_search
};
