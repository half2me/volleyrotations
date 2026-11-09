<script lang="ts">
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import { leagueName, leagueShort, regionName } from '#lib/volley/labels.js';
	import { REGIONS, type LeagueId } from '#lib/volley/leagues.js';
	import { Popover } from 'bits-ui';
	import IconCheck from '~icons/lucide/check';
	import IconGlobe from '~icons/lucide/globe';

	/**
	 * "Where do you play?": the rule set every tool starts from. A team's own playbook can still
	 * name another.
	 */
	$effect(() => explorerPrefs.load());
	const current = $derived(explorerPrefs.current.league);
	let open = $state(false);

	function pick(league: LeagueId) {
		explorerPrefs.set({ ...explorerPrefs.current, league, rulesChosen: true });
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class="btn-ghost"
		aria-label={m.rules_picker_label({ rules: leagueName(current) })}
	>
		<IconGlobe class="size-5" aria-hidden="true" />
		<span class="text-sm font-medium" aria-hidden="true">{leagueShort(current)}</span>
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			sideOffset={8}
			align="end"
			collisionPadding={12}
			class="z-50 w-72 rounded-2xl border border-line bg-surface p-3 shadow-lg"
		>
			<p class="px-1 font-semibold">{m.rules_picker_title()}</p>
			<p class="px-1 text-sm text-ink-soft">{m.rules_picker_help()}</p>
			{#each REGIONS as region (region.id)}
				<p class="eyebrow mt-3 px-1">{regionName(region.id)}</p>
				<ul>
					{#each region.leagues as league (league)}
						<li>
							<button
								type="button"
								class="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-ink hover:bg-line/50"
								aria-pressed={league === current}
								onclick={() => pick(league)}
							>
								{leagueName(league)}
								{#if league === current}<IconCheck
										class="size-4 text-accent"
										aria-hidden="true"
									/>{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/each}
			<a
				href={href('/rules')}
				onclick={() => (open = false)}
				class="mt-3 flex min-h-11 items-center px-1 text-sm font-medium text-accent underline"
				>{m.rules_picker_compare()}</a
			>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
