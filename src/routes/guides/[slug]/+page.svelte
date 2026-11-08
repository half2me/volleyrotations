<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { localizedMarkdown } from '#lib/content.js';
	import { href } from '#lib/i18n.js';
	import { guideLabel } from '#lib/page-labels.js';
	import { guides } from '#lib/pages.js';
	import { m } from '#lib/paraglide/messages.js';
	import IconArrowLeft from '~icons/lucide/arrow-left';
	import IconArrowRight from '~icons/lucide/arrow-right';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The glob must be a literal, so it takes every guide; the route picks one by slug.
	const all = import.meta.glob('/src/lib/content/guides/*/*.md', { eager: true });
	const guide = $derived(
		localizedMarkdown(
			Object.fromEntries(
				Object.entries(all).filter(([path]) => path.includes(`/guides/${data.slug}/`))
			)
		)
	);
	const index = $derived(guides.indexOf(data.slug));
	const prev = $derived(guides[index - 1]);
	const next = $derived(guides[index + 1]);
</script>

<Seo
	title="{guide.metadata.title} · {site.name}"
	description={guide.metadata.description}
	path="/guides/{data.slug}"
	type="article"
/>

<a href={href('/guides')} class="btn-ghost mb-4 -ml-3" data-pagefind-ignore>
	<IconArrowLeft class="size-4" aria-hidden="true" />
	{m.all_guides()}
</a>

<article class="prose-site">
	<guide.default />
</article>

<nav
	aria-label={m.more_guides()}
	class="mt-12 grid max-w-prose gap-3 border-t border-line pt-6 sm:grid-cols-2"
	data-pagefind-ignore
>
	{#if prev}
		<a href={href(`/guides/${prev}`)} class="card hover:border-accent">
			<span class="eyebrow">{m.previous_guide()}</span>
			<span class="mt-1 block font-semibold">{guideLabel[prev]()}</span>
		</a>
	{/if}
	{#if next}
		<a href={href(`/guides/${next}`)} class="card text-right hover:border-accent sm:col-start-2">
			<span class="eyebrow">{m.next_guide()}</span>
			<span class="mt-1 flex items-center justify-end gap-1 font-semibold"
				>{guideLabel[next]()}<IconArrowRight class="size-4" aria-hidden="true" /></span
			>
		</a>
	{/if}
</nav>
