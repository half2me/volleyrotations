import { localizeHref, type Locale } from '#lib/paraglide/runtime.js';

/**
 * A page's path in a locale (the current one by default). Use this for every internal link,
 * rather than `localizeHref` directly.
 *
 * Paraglide localizes the homepage to `/hu/`, but adapter-static writes it as `hu.html`, which
 * Cloudflare serves at `/hu` and redirects `/hu/` to. A link or canonical URL with the slash
 * costs a redirect on every click, so it is stripped here.
 */
export function href(path: string, locale?: Locale): string {
	const localized = localizeHref(path, locale ? { locale } : undefined);
	return localized.length > 1 ? localized.replace(/\/$/, '') : localized;
}
