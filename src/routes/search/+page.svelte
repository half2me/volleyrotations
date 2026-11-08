<script lang="ts">
	import { dev } from '$app/env';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { m } from '#lib/paraglide/messages.js';

	// The index lives at /pagefind/, written by `pagefind --site build` after `vite build`, so it
	// exists only in a built site (`pnpm build && pnpm preview`), never under `pnpm dev`.
	let container: HTMLElement;

	$effect(() => {
		if (dev) return;
		const css = Object.assign(document.createElement('link'), {
			rel: 'stylesheet',
			href: '/pagefind/pagefind-ui.css'
		});
		const script = Object.assign(document.createElement('script'), {
			src: '/pagefind/pagefind-ui.js',
			onload: () => {
				// Pagefind reads <html lang> and searches that language's index only.
				new (window as unknown as { PagefindUI: new (o: object) => unknown }).PagefindUI({
					element: container,
					showSubResults: true,
					showImages: false,
					autofocus: true
				});
			}
		});
		document.head.append(css, script);
		return () => {
			css.remove();
			script.remove();
		};
	});
</script>

<Seo title="{m.nav_search()} · {site.name}" description={m.search_description()} path="/search" />

<h1 class="text-3xl font-bold tracking-tight">{m.nav_search()}</h1>
{#if dev}
	<p class="mt-4 text-ink-soft">{m.search_dev_notice()}</p>
{/if}
<div bind:this={container} class="search mt-6" data-pagefind-ignore></div>

<style>
	.search {
		--pagefind-ui-primary: var(--color-accent);
		--pagefind-ui-text: var(--color-ink);
		--pagefind-ui-background: var(--color-surface);
		--pagefind-ui-border: var(--color-line);
		--pagefind-ui-tag: var(--color-line);
		--pagefind-ui-font: var(--font-sans);
		--pagefind-ui-border-radius: 1rem;
	}
</style>
