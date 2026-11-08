<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { href } from '#lib/i18n.js';
	import { getLocale, locales } from '#lib/paraglide/runtime.js';

	/** Each language's name in that language, so a reader can find their own. */
	const names: Record<(typeof locales)[number], string> = { en: 'English', hu: 'Magyar' };
</script>

<!-- Plain links rather than a menu: the prerender crawler follows them, and that is how every
     non-default locale's pages get built. `data-sveltekit-reload` because message functions are
     not reactive: a client-side navigation would keep the old language's strings on screen. -->
<nav aria-label={m.language()} class="flex items-center gap-1 text-sm">
	{#each locales as locale (locale)}
		<a
			href={href(page.url.pathname, locale)}
			hreflang={locale}
			lang={locale}
			data-sveltekit-reload
			aria-current={locale === getLocale() ? 'true' : undefined}
			class="btn-ghost aria-[current]:font-semibold aria-[current]:text-ink"
		>
			{names[locale]}
		</a>
	{/each}
</nav>
