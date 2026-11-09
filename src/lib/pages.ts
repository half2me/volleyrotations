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
	'coverage',
	'libero',
	'substitutions',
	'leagues',
	'scoring',
	'sitting',
	'beach-to-indoor',
	'glossary'
] as const;

export type GuideSlug = (typeof guides)[number];

/** One page per playing position, each with `src/lib/content/positions/<slug>/<locale>.md`. */
export const positionPages = [
	'setter',
	'outside-hitter',
	'middle-blocker',
	'opposite',
	'libero'
] as const;

export type PositionSlug = (typeof positionPages)[number];

export const pages = [
	{ path: '/', inNav: false },
	{ path: '/learn', inNav: true },
	{ path: '/explorer', inNav: true },
	{ path: '/overlap', inNav: true },
	{ path: '/quiz', inNav: true },
	{ path: '/lineup', inNav: true },
	{ path: '/match', inNav: true },
	{ path: '/rules', inNav: true },
	{ path: '/drills', inNav: false },
	{ path: '/rules/situations', inNav: false },
	{ path: '/rules/signals', inNav: false },
	{ path: '/guides', inNav: true },
	...guides.map((slug) => ({ path: `/guides/${slug}` as const, inNav: false })),
	...positionPages.map((slug) => ({ path: `/positions/${slug}` as const, inNav: false })),
	// Search results are not content of their own, so the page is kept out of search engines.
	{ path: '/search', inNav: false, noindex: true }
] as const;

export type PagePath = (typeof pages)[number]['path'];

/**
 * Where a page's social preview image lives under static/, as `pnpm og` writes it:
 * `/og/<locale>/<path with slashes as dashes>.png`, `home` for the homepage.
 */
export const ogImagePath = (path: string, locale: string) =>
	`/og/${locale}/${path === '/' ? 'home' : path.slice(1).replaceAll('/', '-')}.png`;
