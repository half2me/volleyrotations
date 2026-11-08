import settings from '../project.inlang/settings.json' with { type: 'json' };
import { pages } from '../src/lib/pages.ts';

/** Every page in every locale, as the URL a reader would visit. */
export const routes = pages.flatMap(({ path }) =>
	settings.locales.map((locale) => {
		if (locale === settings.baseLocale) return path;
		return path === '/' ? `/${locale}` : `/${locale}${path}`;
	})
);
