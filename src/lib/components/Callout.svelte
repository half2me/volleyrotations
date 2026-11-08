<script lang="ts">
	import type { Snippet } from 'svelte';
	import IconInfo from '~icons/lucide/info';

	let { children }: { children: Snippet } = $props();
</script>

<aside class="not-prose my-6 flex gap-3 rounded-2xl border border-line bg-surface p-4">
	<IconInfo class="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
	<div>{@render children()}</div>
</aside>
