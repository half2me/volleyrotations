<script lang="ts">
	import { page } from '$app/state';
	import LanguageSwitcher from '#lib/components/LanguageSwitcher.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { pageLabel } from '#lib/page-labels.js';
	import { pages } from '#lib/pages.js';
	import { m } from '#lib/paraglide/messages.js';
	import { deLocalizeHref } from '#lib/paraglide/runtime.js';
	import IconSearch from '~icons/lucide/search';
	import type { LayoutProps } from './$types';
	import './layout.css';

	let { children }: LayoutProps = $props();

	const current = $derived(deLocalizeHref(page.url.pathname));
</script>

<svelte:head>
	{#if site.cfBeaconToken}
		<script
			defer
			src="https://static.cloudflareinsights.com/beacon.min.js"
			data-cf-beacon={JSON.stringify({ token: site.cfBeaconToken })}
		></script>
	{/if}
</svelte:head>

<a
	href="#main"
	class="sr-only rounded-full bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
>
	{m.skip_to_content()}
</a>

<div class="flex min-h-dvh flex-col">
	<header class="border-b border-line print:hidden">
		<div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
			<a href={href('/')} class="mr-auto text-lg font-semibold">{site.name}</a>
			<nav aria-label={m.nav_main()} class="flex items-center gap-1">
				{#each pages.filter((p) => p.inNav) as p (p.path)}
					<a
						href={href(p.path)}
						aria-current={current === p.path ? 'page' : undefined}
						class="btn-ghost aria-[current]:text-ink">{pageLabel[p.path]()}</a
					>
				{/each}
				<a href={href('/search')} class="btn-ghost" aria-label={m.nav_search()}>
					<IconSearch class="size-5" aria-hidden="true" />
				</a>
				<ThemeToggle />
			</nav>
		</div>
	</header>

	<!-- data-pagefind-body: search indexes page content only, never the header and footer. -->
	<main id="main" data-pagefind-body class="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-16">
		{@render children()}
	</main>

	<footer class="border-t border-line print:hidden">
		<div
			class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-ink-soft"
		>
			<p>© {new Date().getFullYear()} {site.name}</p>
			<LanguageSwitcher />
		</div>
	</footer>
</div>
