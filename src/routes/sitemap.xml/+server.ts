import { site } from '#lib/config.js';
import { href as localPath } from '#lib/i18n.js';
import { pages } from '#lib/pages.js';
import { baseLocale, locales, type Locale } from '#lib/paraglide/runtime.js';
import { execFileSync } from 'node:child_process';

export const prerender = true;

/** The day of the build, which stands in for a page whose history git cannot give. */
const buildDay = new Date().toISOString().slice(0, 10);

/**
 * The files a page is rendered from: its route folder, plus the content folder of a Markdown page
 * and the volleyball model for the rotation pages, which are drawn from it.
 */
function sourcesOf(path: string): string[] {
	const guide = path.match(/^\/(guides|positions)\/(.+)$/);
	if (guide) return [`src/routes/${guide[1]}/[slug]`, `src/lib/content/${guide[1]}/${guide[2]}`];
	if (path.startsWith('/rotations/'))
		return ['src/routes/rotations/[system]/[n]', 'src/lib/volley'];
	return [path === '/' ? 'src/routes/+page.svelte' : `src/routes${path}`];
}

/**
 * When the page last changed, as the date of the last commit touching its sources. The sitemap is
 * prerendered, so this runs in Node at build time; a checkout without history gets the build day.
 */
function lastmod(path: string): string {
	try {
		const day = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...sourcesOf(path)], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();
		return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : buildDay;
	} catch {
		return buildDay;
	}
}

/**
 * One <url> per indexable page per locale, each naming its translations (and the English page as
 * the x-default) so crawlers can pair them.
 */
export function GET() {
	const href = (path: string, locale: Locale) => site.url + localPath(path, locale);

	const urls = pages
		.filter((p) => !('noindex' in p))
		.flatMap(({ path }) => {
			const modified = lastmod(path);
			return locales.map(
				(locale) =>
					`\t<url>\n\t\t<loc>${href(path, locale)}</loc>\n\t\t<lastmod>${modified}</lastmod>\n` +
					locales
						.map(
							(alt) =>
								`\t\t<xhtml:link rel="alternate" hreflang="${alt}" href="${href(path, alt)}"/>\n`
						)
						.join('') +
					`\t\t<xhtml:link rel="alternate" hreflang="x-default" href="${href(path, baseLocale)}"/>\n` +
					`\t</url>`
			);
		});

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
}
