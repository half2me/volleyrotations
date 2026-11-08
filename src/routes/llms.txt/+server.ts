import { site } from '#lib/config.js';
import { pageLabel } from '#lib/page-labels.js';
import { pages } from '#lib/pages.js';
import { m } from '#lib/paraglide/messages.js';
import { baseLocale } from '#lib/paraglide/runtime.js';

export const prerender = true;

/** A markdown map of the site for AI crawlers (llmstxt.org), in the base locale. */
export function GET() {
	const options = { locale: baseLocale };
	const body = `# ${site.name}

> ${m.home_description({}, options)}

## Pages

${pages.map((p) => `- [${pageLabel[p.path]()}](${site.url}${p.path})`).join('\n')}
`;
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
