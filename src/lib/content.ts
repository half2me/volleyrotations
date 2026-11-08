import { baseLocale, getLocale } from '#lib/paraglide/runtime.js';
import type { Component } from 'svelte';

export type MarkdownPage = {
	default: Component;
	metadata: { title: string; description: string };
};

/**
 * Picks the current locale's file out of a `src/lib/content/<page>/<locale>.md` set, falling back
 * to the base locale so an untranslated page still renders.
 *
 * Pass `import.meta.glob('./<page>/*.md', { eager: true })` from the route: the glob has to be a
 * literal in the importing file, which is why this takes the result rather than a page name.
 */
export function localizedMarkdown(files: Record<string, unknown>): MarkdownPage {
	const byLocale = (locale: string) =>
		Object.entries(files).find(([path]) => path.endsWith(`/${locale}.md`))?.[1] as
			MarkdownPage | undefined;
	const file = byLocale(getLocale()) ?? byLocale(baseLocale);
	if (!file) throw new Error(`No ${baseLocale}.md among ${Object.keys(files).join(', ')}`);
	return file;
}
