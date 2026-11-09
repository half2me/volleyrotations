<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import BallDiagram from '#lib/components/equipment/BallDiagram.svelte';
	import CourtDiagram from '#lib/components/equipment/CourtDiagram.svelte';
	import NetDiagram from '#lib/components/equipment/NetDiagram.svelte';
	import { BEACH_RULES_PDF, RULES_PDF } from '#lib/beach.js';
	import { site } from '#lib/config.js';
	import { NET_CATEGORIES, SPECS, type Fact, type NetCategory } from '#lib/equipment.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import type { Sport } from '#lib/volley/match.js';

	$effect(() => explorerPrefs.load());
	const lang = $derived(getLocale() as 'en' | 'hu');

	// Starts on the reader's sport; switching here does not change the site-wide choice.
	let sport: Sport = $derived(explorerPrefs.current.sport ?? 'indoor');
	let category: NetCategory = $state('men');
	const categories = $derived(NET_CATEGORIES.filter((c) => sport === 'beach' || !c.beachOnly));
	const net = $derived((categories.find((c) => c.id === category) ?? categories[0]).height);
	const spec = $derived(SPECS[sport]);
	const pdf = $derived(sport === 'beach' ? BEACH_RULES_PDF : RULES_PDF);

	const categoryName: Record<NetCategory, () => string> = {
		men: m.net_men,
		women: m.net_women,
		u16: m.net_u16,
		u14: m.net_u14,
		u12: m.net_u12
	};
</script>

<Seo
	title="{m.equipment_title()} · {site.name}"
	description={m.equipment_description()}
	path="/equipment"
	schema="Article"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.equipment_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.equipment_lead()}</p>

<div class="mt-6" data-pagefind-ignore>
	<ChipGroup
		legend={m.sport_label()}
		options={[
			{ value: 'indoor', label: m.sport_indoor() },
			{ value: 'beach', label: m.sport_beach() }
		]}
		bind:value={sport}
	/>
</div>

{#snippet facts(list: Fact[])}
	<dl class="mt-4 space-y-3">
		{#each list as f (f.label.en)}
			<div>
				<dt class="font-semibold">{f.label[lang]}</dt>
				<dd class="text-ink-soft">
					{f.value[lang]}
					<a class="text-sm whitespace-nowrap text-accent underline" href="{pdf}#page={f.rule.page}"
						>{m.signals_rule({ rules: f.rule.rule })}</a
					>
				</dd>
			</div>
		{/each}
	</dl>
{/snippet}

<section class="mt-10" aria-labelledby="court-heading">
	<h2 id="court-heading" class="text-2xl font-bold tracking-tight">{m.equipment_court()}</h2>
	<div class="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<figure class="card">
			<CourtDiagram {sport} />
			<figcaption class="mt-2 text-sm text-ink-soft">
				{sport === 'beach' ? m.equipment_court_caption_beach() : m.equipment_court_caption_indoor()}
			</figcaption>
		</figure>
		{@render facts(spec.facts.court)}
	</div>
</section>

<section class="mt-12" aria-labelledby="net-heading">
	<h2 id="net-heading" class="text-2xl font-bold tracking-tight">{m.equipment_net_title()}</h2>
	<div class="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<figure class="card">
			<div data-pagefind-ignore>
				<ChipGroup
					legend={m.net_category()}
					options={categories.map((c) => ({ value: c.id, label: categoryName[c.id]() }))}
					bind:value={
						() => (categories.some((c) => c.id === category) ? category : 'men'),
						(c) => (category = c)
					}
				/>
			</div>
			<div class="mt-4">
				<NetDiagram {sport} height={net} />
			</div>
			<figcaption class="mt-2 text-sm text-ink-soft">
				{sport === 'beach' ? m.equipment_net_caption_beach() : m.equipment_net_caption_indoor()}
			</figcaption>
		</figure>
		{@render facts(spec.facts.net)}
	</div>
</section>

<section class="mt-12" aria-labelledby="ball-heading">
	<h2 id="ball-heading" class="text-2xl font-bold tracking-tight">{m.equipment_ball()}</h2>
	<div class="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<figure class="card">
			<BallDiagram {sport} />
			<figcaption class="mt-2 text-sm text-ink-soft">{m.equipment_ball_caption()}</figcaption>
		</figure>
		{@render facts(spec.facts.ball)}
	</div>
</section>

<p class="mt-10 text-sm text-ink-soft">
	{m.equipment_sources()}
	<a class="text-accent underline" href={RULES_PDF}>{m.equipment_indoor_rules()}</a> ·
	<a class="text-accent underline" href={BEACH_RULES_PDF}>{m.equipment_beach_rules()}</a> ·
	<a class="text-accent underline" href={href('/beach')}>{m.beach_title()}</a>
</p>
