/**
 * Every indexable page, by its base-locale path. The header nav, the sitemap, llms.txt and the
 * Playwright suite all read this list, so a page missing from it is reachable but invisible to
 * crawlers and untested. Its label goes in `page-labels.ts`.
 *
 * Kept free of Paraglide imports: those compile to Vite virtual modules, which Playwright cannot
 * load.
 */

/** Guide slugs, in reading order. Each has `src/lib/content/guides/<slug>/<locale>.md`. */
export const guides = [
	'positions',
	'rotations',
	'overlap',
	'systems',
	'serve-receive',
	'defense',
	'libero',
	'substitutions',
	'beach-to-indoor',
	'glossary'
] as const;

export type GuideSlug = (typeof guides)[number];

export const pages = [
	{ path: '/', inNav: false },
	{ path: '/explorer', inNav: true },
	{ path: '/overlap', inNav: true },
	{ path: '/quiz', inNav: true },
	{ path: '/lineup', inNav: true },
	{ path: '/match', inNav: true },
	{ path: '/guides', inNav: true },
	...guides.map((slug) => ({ path: `/guides/${slug}` as const, inNav: false })),
	{ path: '/search', inNav: false }
] as const;

export type PagePath = (typeof pages)[number]['path'];
