<script lang="ts">
	import type { Snippet } from 'svelte';
	import IconInfo from '~icons/lucide/info';

	let { children }: { children: Snippet } = $props();
</script>

<!-- Prose styles stay on inside, so Markdown lists in a callout keep their bullets. -->
<aside class="my-6 flex gap-3 rounded-2xl border border-line bg-surface p-4">
	<IconInfo class="mt-1 size-5 shrink-0 text-accent" aria-hidden="true" />
	<div class="min-w-0 [&>:first-child]:mt-0 [&>:last-child]:mb-0">{@render children()}</div>
</aside>
