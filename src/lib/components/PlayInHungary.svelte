<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import IconExternal from '~icons/lucide/external-link';
	import IconMapPin from '~icons/lucide/map-pin';

	/**
	 * Where to find volleyball and beach volleyball events to join in Hungary. The listings site
	 * has a Hungarian edition (mostszabad.hu) and an English one (isopenat.com) with the same
	 * sport filters; the reader's own sport comes first.
	 */
	$effect(() => explorerPrefs.load());
	const hu = $derived(getLocale() === 'hu');
	const links = $derived.by(() => {
		const indoor = {
			label: m.play_indoor(),
			url: hu ? 'https://mostszabad.hu/events/roplabda' : 'https://isopenat.com/events/volleyball'
		};
		const beach = {
			label: m.play_beach(),
			url: hu
				? 'https://mostszabad.hu/events/strandroplabda'
				: 'https://isopenat.com/events/beach-volleyball'
		};
		return explorerPrefs.current.sport === 'beach' ? [beach, indoor] : [indoor, beach];
	});
</script>

<aside class="card flex flex-col gap-3 sm:flex-row sm:items-center" aria-labelledby="play-heading">
	<IconMapPin class="size-6 shrink-0 text-accent" aria-hidden="true" />
	<div class="min-w-0 flex-1">
		<h2 id="play-heading" class="font-bold">{m.play_title()}</h2>
		<p class="mt-1 text-sm text-ink-soft">
			{m.play_text({ site: hu ? 'mostszabad.hu' : 'isopenat.com' })}
		</p>
	</div>
	<div class="flex shrink-0 flex-wrap gap-2">
		{#each links as l (l.url)}
			<a class="btn-secondary" href={l.url}>
				{l.label}<IconExternal class="size-4" aria-hidden="true" />
			</a>
		{/each}
	</div>
</aside>
