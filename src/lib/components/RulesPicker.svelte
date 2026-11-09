<script lang="ts">
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import { leagueName, leagueShort, regionName } from '#lib/volley/labels.js';
	import { REGIONS, type LeagueId } from '#lib/volley/leagues.js';
	import type { Sport } from '#lib/volley/match.js';
	import { Popover } from 'bits-ui';
	import IconCheck from '~icons/lucide/check';
	import IconGlobe from '~icons/lucide/globe';
	import IconSun from '~icons/lucide/sun';

	/**
	 * "Where do you play?": the sport and rule set every tool starts from. A team's own playbook
	 * can still name another league. Beach has one rule set, so the indoor leagues are hidden.
	 */
	$effect(() => explorerPrefs.load());
	const current = $derived(explorerPrefs.current.league);
	const beach = $derived(explorerPrefs.current.sport === 'beach');
	let open = $state(false);

	function pick(league: LeagueId) {
		explorerPrefs.set({ ...explorerPrefs.current, league, rulesChosen: true });
		open = false;
	}

	function setSport(sport: Sport) {
		explorerPrefs.set({ ...explorerPrefs.current, sport, rulesChosen: true });
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class="btn-ghost"
		aria-label={m.rules_picker_label({
			rules: beach ? m.beach_rules_name() : leagueName(current)
		})}
	>
		{#if beach}
			<IconSun class="size-5" aria-hidden="true" />
		{:else}
			<IconGlobe class="size-5" aria-hidden="true" />
		{/if}
		<span class="text-sm font-medium" aria-hidden="true"
			>{beach ? m.sport_beach_short() : leagueShort(current)}</span
		>
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			sideOffset={8}
			align="end"
			collisionPadding={12}
			class="z-50 max-h-[80dvh] w-72 overflow-y-auto rounded-2xl border border-line bg-surface p-3 shadow-lg"
		>
			<p class="px-1 font-semibold">{m.rules_picker_title()}</p>
			<div class="mt-2 grid grid-cols-2 gap-1.5" role="group" aria-label={m.sport_label()}>
				{#each [{ id: 'indoor', label: m.sport_indoor() }, { id: 'beach', label: m.sport_beach() }] as const as s (s.id)}
					<button
						type="button"
						class="chip justify-center"
						aria-pressed={(s.id === 'beach') === beach}
						onclick={() => setSport(s.id)}>{s.label}</button
					>
				{/each}
			</div>
			{#if beach}
				<p class="mt-3 px-1 text-sm text-ink-soft">{m.sport_beach_help()}</p>
				<a
					href={href('/beach')}
					onclick={() => (open = false)}
					class="mt-2 flex min-h-11 items-center px-1 text-sm font-medium text-accent underline"
					>{m.beach_title()}</a
				>
			{:else}
				<p class="mt-3 px-1 text-sm text-ink-soft">{m.rules_picker_help()}</p>
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
			{/if}
			<a
				href={href('/equipment')}
				onclick={() => (open = false)}
				class="flex min-h-11 items-center px-1 text-sm font-medium text-accent underline"
				>{m.equipment_title()}</a
			>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
