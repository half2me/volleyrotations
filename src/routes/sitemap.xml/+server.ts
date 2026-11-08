import { site } from '#lib/config.js';
import { href as localPath } from '#lib/i18n.js';
import { pages } from '#lib/pages.js';
import { baseLocale, locales, type Locale } from '#lib/paraglide/runtime.js';

export const prerender = true;

/**
 * One <url> per indexable page per locale, each naming its translations (and the English page as
 * the x-default) so crawlers can pair them.
 */
export function GET() {
	const href = (path: string, locale: Locale) => site.url + localPath(path, locale);

	const urls = pages
		.filter((p) => !('noindex' in p))
		.flatMap(({ path }) =>
			locales.map(
				(locale) =>
					`\t<url>\n\t\t<loc>${href(path, locale)}</loc>\n` +
					locales
						.map(
							(alt) =>
								`\t\t<xhtml:link rel="alternate" hreflang="${alt}" href="${href(path, alt)}"/>\n`
						)
						.join('') +
					`\t\t<xhtml:link rel="alternate" hreflang="x-default" href="${href(path, baseLocale)}"/>\n` +
					`\t</url>`
			)
		);

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
}
