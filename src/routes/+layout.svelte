<script lang="ts">
	import LanguageSwitcher from '#lib/components/LanguageSwitcher.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import SiteNav from '#lib/components/SiteNav.svelte';
	import ReportLink from '#lib/components/ReportLink.svelte';
	import RulesPicker from '#lib/components/RulesPicker.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import IconSearch from '~icons/lucide/search';
	import type { LayoutProps } from './$types';
	import './layout.css';

	let { children }: LayoutProps = $props();
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
		<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
			<a href={href('/')} class="mr-auto flex min-h-11 items-center gap-2 font-bold sm:text-lg">
				<img src="/favicon.svg" alt="" class="size-8" />
				{site.name}
			</a>
			<div class="flex items-center gap-1">
				<SiteNav />
				<RulesPicker />
				<a href={href('/search')} class="btn-ghost" aria-label={m.nav_search()}>
					<IconSearch class="size-5" aria-hidden="true" />
				</a>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- data-pagefind-body: search indexes page content only, never the header and footer. -->
	<main id="main" data-pagefind-body class="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-16">
		{@render children()}
	</main>

	<footer class="border-t border-line print:hidden">
		<div
			class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-ink-soft"
		>
			<div>
				<p>© {new Date().getFullYear()} {site.name}</p>
				{#if site.reviewedBy}<p>{m.reviewed_by({ name: site.reviewedBy })}</p>{/if}
				<p class="flex flex-wrap items-center gap-x-1">
					{m.footer_accuracy()}
					<ReportLink />
				</p>
				<p>
					<a
						class="inline-flex min-h-11 items-center underline hover:text-accent"
						href={href('/settings')}>{m.settings_footer_link()}</a
					>
				</p>
			</div>
			<LanguageSwitcher />
		</div>
	</footer>
</div>
