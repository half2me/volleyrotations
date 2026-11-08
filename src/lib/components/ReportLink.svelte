<script lang="ts">
	import { page } from '$app/state';
	import { site } from '#lib/config.js';
	import { m } from '#lib/paraglide/messages.js';
	import { reportUrl } from '#lib/report.js';
	import IconFlag from '~icons/lucide/flag';

	/** "Report a mistake", opening an issue that names the page and what the reader saw. */
	let { context = [] }: { context?: string[] } = $props();

	const url = $derived(reportUrl(`${site.url}${page.url.pathname}`, context));
</script>

<a
	class="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-soft underline hover:text-accent"
	href={url}
	target="_blank"
	rel="noopener"
>
	<IconFlag class="size-4" aria-hidden="true" />{m.report_mistake()}
</a>
