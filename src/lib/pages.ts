/**
 * Every indexable page, by its base-locale path. The header nav, the sitemap, llms.txt and the
 * Playwright suite all read this list, so a page missing from it is reachable but invisible to
 * crawlers and untested. Its label goes in `page-labels.ts`.
 *
 * Kept free of Paraglide imports: those compile to Vite virtual modules, which Playwright cannot
 * load.
 */
export const pages = [
	{ path: '/', inNav: true },
	{ path: '/about', inNav: true },
	{ path: '/search', inNav: false }
] as const;

export type PagePath = (typeof pages)[number]['path'];
