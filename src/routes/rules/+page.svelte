<script lang="ts">
	import LeagueSelect from '#lib/components/LeagueSelect.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import { RULE_SETS } from '#lib/rulesets.js';
	import { leagueName, regionName } from '#lib/volley/labels.js';
	import { LEAGUES, REGIONS } from '#lib/volley/leagues.js';
	import IconArrowRight from '~icons/lucide/arrow-right';
	import IconExternal from '~icons/lucide/external-link';

	$effect(() => explorerPrefs.load());
	const league = $derived(explorerPrefs.current.league);
	const set = $derived(RULE_SETS[league]);
	const lang = $derived(getLocale() as 'en' | 'hu');

	const more = [
		{ path: '/rules/situations', title: m.situations_title, text: m.situations_description },
		{ path: '/rules/signals', title: m.signals_title, text: m.signals_description },
		{ path: '/guides/scoring', title: m.guide_scoring, text: m.guide_scoring_summary },
		{ path: '/guides/leagues', title: m.guide_leagues, text: m.guide_leagues_summary },
		{ path: '/guides/sitting', title: m.guide_sitting, text: m.guide_sitting_summary },
		{ path: '/beach', title: m.beach_title, text: m.beach_description },
		{ path: '/equipment', title: m.equipment_title, text: m.equipment_description }
	] as const;
	const yesNo = (v: boolean) => (v ? m.yes() : m.no());
</script>

<Seo
	title="{m.rules_title()} · {site.name}"
	description={m.rules_description()}
	path="/rules"
	schema="Article"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.rules_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.rules_lead()}</p>

<div class="mt-8 max-w-sm" data-pagefind-ignore>
	<LeagueSelect
		bind:value={
			() => league,
			(l) => explorerPrefs.set({ ...explorerPrefs.current, league: l, rulesChosen: true })
		}
	/>
</div>

<section class="card mt-6 max-w-3xl" aria-labelledby="set-heading" data-pagefind-ignore>
	<h2 id="set-heading" class="text-2xl font-bold tracking-tight">{leagueName(league)}</h2>
	<p class="mt-2">{set.basis[lang]}</p>

	<h3 class="mt-5 font-semibold">{m.rules_differences()}</h3>
	{#if league === 'fivb'}
		<p class="mt-1 text-ink-soft">{m.rules_is_baseline()}</p>
	{:else if set.differences.length === 0}
		<p class="mt-1 text-ink-soft">{m.rules_no_differences()}</p>
	{:else}
		<ul class="mt-2 space-y-2">
			{#each set.differences as d, i (i)}
				<li class="rounded-xl border-l-4 border-accent bg-paper px-3 py-2">
					{d.text[lang]}
					<a class="text-sm text-accent underline" href={d.source.url}>{d.source.label}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if set.competition.length}
		<h3 class="mt-5 font-semibold">{m.rules_competition()}</h3>
		<ul class="mt-2 list-disc space-y-2 pl-5">
			{#each set.competition as c, i (i)}
				<li>
					{c.text[lang]}
					<a class="text-sm text-accent underline" href={c.source.url}>{c.source.label}</a>
				</li>
			{/each}
		</ul>
	{/if}

	<h3 class="mt-5 font-semibold">{m.rules_documents()}</h3>
	<ul class="mt-2 space-y-1">
		{#each set.documents as doc (doc.url)}
			<li>
				<a class="inline-flex min-h-11 items-center gap-1.5 text-accent underline" href={doc.url}>
					<IconExternal class="size-4 shrink-0" aria-hidden="true" />{doc.label}
				</a>
			</li>
		{/each}
	</ul>
	{#if league === 'england' || league === 'scotland' || league === 'northern-ireland'}
		<p class="mt-3 text-sm text-ink-soft">{m.rules_uk_note()}</p>
	{/if}
</section>

<section class="mt-12" aria-labelledby="compare-heading">
	<h2 id="compare-heading" class="text-2xl font-bold tracking-tight">{m.rules_compare()}</h2>
	<p class="mt-1 max-w-2xl text-ink-soft">{m.rules_compare_lead()}</p>
	<div class="mt-4">
		<table class="w-full table-fixed border-collapse text-sm break-words">
			<thead>
				<tr class="text-left text-ink-soft">
					<th scope="col" class="py-2 pr-3 font-medium">{m.label_league()}</th>
					<th scope="col" class="py-2 pr-3 font-medium">{m.rules_col_serving()}</th>
					<th scope="col" class="py-2 pr-3 font-medium">{m.rules_col_libero()}</th>
					<th scope="col" class="py-2 pr-3 font-medium">{m.rules_col_subs()}</th>
					<th scope="col" class="py-2 font-medium">{m.rules_col_timeouts()}</th>
				</tr>
			</thead>
			{#each REGIONS as region (region.id)}
				<tbody>
					<tr>
						<th colspan="5" scope="colgroup" class="eyebrow pt-4 pb-1 text-left">
							{regionName(region.id)}
						</th>
					</tr>
					{#each region.leagues as l (l)}
						{@const v = LEAGUES[l]}
						<tr class={['border-t border-line', l === league && 'bg-accent/10 font-semibold']}>
							<th scope="row" class="py-2 pr-3 text-left font-medium">{leagueName(l)}</th>
							<td class="py-2 pr-3">{yesNo(v.servingOverlap)}</td>
							<td class="py-2 pr-3">{yesNo(v.liberoServes)}</td>
							<td class="py-2 pr-3 tabular-nums">{v.subsPerSet}</td>
							<td class="py-2 tabular-nums">{v.timeoutsPerSet}</td>
						</tr>
					{/each}
				</tbody>
			{/each}
		</table>
	</div>
</section>

<section class="mt-12" aria-labelledby="more-heading">
	<h2 id="more-heading" class="text-2xl font-bold tracking-tight">{m.rules_more()}</h2>
	<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each more as item (item.path)}
			<li>
				<a href={href(item.path)} class="card flex h-full flex-col hover:border-accent">
					<span class="flex items-center gap-1 font-semibold"
						>{item.title()}<IconArrowRight class="size-4" aria-hidden="true" /></span
					>
					<span class="mt-1 text-sm text-ink-soft">{item.text()}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
