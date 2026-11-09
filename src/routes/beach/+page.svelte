<script lang="ts">
	import PartnerSignal, { type HandSign } from '#lib/components/PartnerSignal.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import CourtDiagram from '#lib/components/equipment/CourtDiagram.svelte';
	import { BEACH_RULES_PDF, DIFFERENCES, RULES_PDF } from '#lib/beach.js';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import type { Sport } from '#lib/volley/match.js';

	$effect(() => explorerPrefs.load());
	const lang = $derived(getLocale() as 'en' | 'hu');
	let view: Sport = $state('beach');

	const SIGNALS: {
		id: string;
		left: HandSign;
		right: HandSign;
		name: () => string;
		means: () => string;
	}[] = [
		{ id: 'fixed', left: 'one', right: 'two', name: m.partner_fixed, means: m.partner_fixed_means },
		{
			id: 'agreed',
			left: 'fist',
			right: 'open',
			name: m.partner_agreed,
			means: m.partner_agreed_means
		}
	];
	const n = (v: number) => v.toLocaleString(m.number_locale());
</script>

<Seo
	title="{m.beach_title()} · {site.name}"
	description={m.beach_description()}
	path="/beach"
	schema="Article"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.beach_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.beach_lead()}</p>

{#if explorerPrefs.current.sport !== 'beach'}
	<div class="mt-4" data-pagefind-ignore>
		<button
			type="button"
			class="btn-secondary"
			onclick={() =>
				explorerPrefs.set({ ...explorerPrefs.current, sport: 'beach', rulesChosen: true })}
			>{m.beach_make_default()}</button
		>
	</div>
{:else}
	<p class="mt-4 text-sm text-ink-soft" data-pagefind-ignore>{m.beach_is_default()}</p>
{/if}

<section class="mt-10" aria-labelledby="size-heading">
	<h2 id="size-heading" class="text-2xl font-bold tracking-tight">{m.beach_size_title()}</h2>
	<p class="mt-1 max-w-2xl text-ink-soft">{m.beach_size_lead()}</p>
	<div class="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<figure class="card">
			<div
				class="flex flex-wrap gap-1.5"
				role="group"
				aria-label={m.sport_label()}
				data-pagefind-ignore
			>
				{#each [{ id: 'beach', label: m.sport_beach() }, { id: 'indoor', label: m.sport_indoor() }] as const as s (s.id)}
					<button
						type="button"
						class="chip"
						aria-pressed={view === s.id}
						onclick={() => (view = s.id)}>{s.label}</button
					>
				{/each}
			</div>
			<div class="mt-3"><CourtDiagram sport={view} /></div>
			<figcaption class="mt-2 text-sm text-ink-soft">{m.beach_size_caption()}</figcaption>
		</figure>
		<ul class="space-y-2">
			<li class="card">
				<p class="text-3xl font-bold tabular-nums">128 m²</p>
				<p class="text-sm text-ink-soft">{m.beach_area_beach()}</p>
			</li>
			<li class="card">
				<p class="text-3xl font-bold tabular-nums">162 m²</p>
				<p class="text-sm text-ink-soft">{m.beach_area_indoor()}</p>
			</li>
			<li class="card">
				<p class="text-3xl font-bold tabular-nums">{n(32)} / {n(13.5)} m²</p>
				<p class="text-sm text-ink-soft">{m.beach_area_each()}</p>
			</li>
		</ul>
	</div>
</section>

<section class="mt-12" aria-labelledby="diff-heading">
	<h2 id="diff-heading" class="text-2xl font-bold tracking-tight">{m.beach_diff_title()}</h2>
	<p class="mt-1 max-w-2xl text-ink-soft">{m.beach_diff_lead()}</p>
	<ul class="mt-4 space-y-3">
		{#each DIFFERENCES as d (d.id)}
			<li class="card">
				<h3 class="font-bold">{d.topic[lang]}</h3>
				<div class="mt-2 grid gap-3 sm:grid-cols-2">
					<div class="border-l-4 border-court-front pl-3">
						<p class="eyebrow">{m.sport_indoor()}</p>
						<p class="mt-1">{d.indoor[lang]}</p>
						{#if d.indoorRule}
							<a class="text-sm text-accent underline" href="{RULES_PDF}#page={d.indoorRule.page}"
								>{m.beach_rule_indoor({ rule: d.indoorRule.rule })}</a
							>
						{/if}
					</div>
					<div class="border-l-4 border-sand-deep pl-3">
						<p class="eyebrow">{m.sport_beach()}</p>
						<p class="mt-1">{d.beach[lang]}</p>
						{#if d.beachRule}
							<a
								class="text-sm text-accent underline"
								href="{BEACH_RULES_PDF}#page={d.beachRule.page}"
								>{m.beach_rule_beach({ rule: d.beachRule.rule })}</a
							>
						{/if}
					</div>
				</div>
			</li>
		{/each}
	</ul>
	<p class="mt-4 max-w-2xl text-sm text-ink-soft">{m.beach_same()}</p>
</section>

<section class="mt-12" aria-labelledby="signals-heading">
	<h2 id="signals-heading" class="text-2xl font-bold tracking-tight">{m.partner_title()}</h2>
	<p class="mt-1 max-w-2xl text-ink-soft">{m.partner_lead()}</p>
	<ul class="mt-3 max-w-2xl list-disc space-y-1 pl-5">
		<li>{m.partner_one()}</li>
		<li>{m.partner_two()}</li>
	</ul>
	<ul class="mt-4 grid gap-3 sm:grid-cols-2">
		{#each SIGNALS as s (s.id)}
			<li class="card">
				<div class="mx-auto max-w-56">
					<PartnerSignal left={s.left} right={s.right} label={s.name()} />
				</div>
				<h3 class="mt-2 font-bold">{s.name()}</h3>
				<p class="mt-1 text-sm">{s.means()}</p>
			</li>
		{/each}
	</ul>
	<p class="mt-4 max-w-2xl text-sm text-ink-soft">
		{m.partner_note()}
		<a class="text-accent underline" href="https://avp.com/news/hand-signals-101-with-emily-day/"
			>{m.partner_source()}</a
		>
	</p>
</section>

<section class="mt-12" aria-labelledby="tools-heading">
	<h2 id="tools-heading" class="text-2xl font-bold tracking-tight">{m.beach_tools_title()}</h2>
	<ul class="mt-4 grid gap-3 sm:grid-cols-2">
		<li class="card">
			<a class="font-bold text-accent underline" href={href('/match')}>{m.match_title()}</a>
			<p class="mt-1 text-sm">{m.beach_tool_match()}</p>
		</li>
		<li class="card">
			<a class="font-bold text-accent underline" href={href('/equipment')}>{m.equipment_title()}</a>
			<p class="mt-1 text-sm">{m.beach_tool_equipment()}</p>
		</li>
		<li class="card">
			<a class="font-bold text-accent underline" href={href('/guides/beach-to-indoor')}
				>{m.guide_beach_to_indoor()}</a
			>
			<p class="mt-1 text-sm">{m.beach_tool_guide()}</p>
		</li>
		<li class="card">
			<a class="font-bold text-accent underline" href={BEACH_RULES_PDF}
				>{m.equipment_beach_rules()}</a
			>
			<p class="mt-1 text-sm">{m.beach_tool_rules()}</p>
		</li>
	</ul>
</section>
