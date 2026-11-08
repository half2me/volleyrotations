/**
 * Light/dark choice, kept in the reader's browser.
 *
 * The no-flash script in app.html stamps `<html data-theme>` before first paint; this store
 * mirrors that attribute so the toggle shows the right icon, and persists an explicit choice.
 * Browser-only: call `load()` from an `$effect` or a handler, never during prerender.
 */

/** Must match the key the no-flash script in app.html reads. */
const THEME_KEY = 'site:theme';

/** Browser-chrome colour per theme; keep in step with `--color-paper` in layout.css. */
const THEME_COLOR = { light: '#f8f9fb', dark: '#15171c' } as const;

export type ThemeName = keyof typeof THEME_COLOR;

class Theme {
	current: ThemeName = $state('light');

	load() {
		const name = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
		this.current = name;
		this.#paintChrome(name);
	}

	toggle() {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}

	set(name: ThemeName) {
		this.current = name;
		document.documentElement.dataset.theme = name;
		try {
			localStorage.setItem(THEME_KEY, name);
		} catch {
			// Storage disabled or full: the choice lasts for this page view only.
		}
		this.#paintChrome(name);
	}

	#paintChrome(name: ThemeName) {
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[name]);
	}
}

export const theme = new Theme();
