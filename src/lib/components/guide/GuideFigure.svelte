<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A court diagram inside a Markdown guide: narrow enough to sit in the prose column, with a
	 * caption under it. The diagram itself is kept out of the search index, because its
	 * screen-reader table would otherwise fill search results with player positions.
	 */
	let {
		caption,
		wide = false,
		children
	}: {
		caption: string;
		/** Span the whole prose column instead of a single court's width. */
		wide?: boolean;
		children: Snippet;
	} = $props();
</script>

<figure class={['mx-auto my-8 w-full', wide ? 'max-w-none' : 'max-w-80']}>
	<div data-pagefind-ignore>{@render children()}</div>
	<figcaption class="mt-2 text-center text-sm text-ink-soft">{caption}</figcaption>
</figure>
