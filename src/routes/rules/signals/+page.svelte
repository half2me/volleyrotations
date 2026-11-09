<script lang="ts">
	import SignalFigure from '#lib/components/SignalFigure.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import {
		BEACH_FLAG_SIGNALS,
		BEACH_REFEREE_SIGNALS,
		BEACH_RULES_PDF,
		FLAG_SIGNALS,
		REFEREE_SIGNALS,
		type Signal
	} from '#lib/signals.js';
	import type { Sport } from '#lib/volley/match.js';
	import { RULES_PDF } from '#lib/situations.js';

	const lang = $derived(getLocale() as 'en' | 'hu');
	$effect(() => explorerPrefs.load());
	// Starts on the reader's sport; switching here does not change the site-wide choice.
	let sport: Sport = $derived(explorerPrefs.current.sport ?? 'indoor');
	const beach = $derived(sport === 'beach');
	const pdf = $derived(beach ? BEACH_RULES_PDF : RULES_PDF);
	const referee = $derived(beach ? BEACH_REFEREE_SIGNALS : REFEREE_SIGNALS);
	const flags = $derived(beach ? BEACH_FLAG_SIGNALS : FLAG_SIGNALS);
	const who = (s: Signal) =>
		s.who === 'first' ? m.signals_first() : s.who === 'both' ? m.signals_both() : m.signals_line();
</script>

<Seo
	title="{m.signals_title()} · {site.name}"
	description={m.signals_description()}
	path="/rules/signals"
	schema="Article"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.signals_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.signals_lead()}</p>
<p class="mt-3 max-w-2xl text-sm text-ink-soft">
	{m.signals_order()}
	<a class="text-accent underline" href="{pdf}#page={beach ? 58 : 75}"
		>{beach ? m.signals_source_beach() : m.signals_source()}</a
	>
</p>
<div class="mt-6" data-pagefind-ignore>
	<ChipGroup
		legend={m.sport_label()}
		options={[
			{ value: 'indoor', label: m.sport_indoor() },
			{ value: 'beach', label: m.sport_beach() }
		]}
		bind:value={sport}
	/>
	{#if beach}<p class="mt-2 max-w-2xl text-sm text-ink-soft">{m.signals_beach_note()}</p>{/if}
</div>

{#snippet card(s: Signal, n: number)}
	<li class="card flex flex-col gap-4 sm:flex-row">
		<div class="mx-auto w-full max-w-64 shrink-0 sm:mx-0 sm:w-56">
			<SignalFigure signal={s} />
		</div>
		<div class="min-w-0">
			<p class="eyebrow">{n}. · {who(s)}</p>
			<h3 class="mt-1 font-bold">{s.name[lang]}</h3>
			<p class="mt-1">{s.gesture[lang]}</p>
			<p class="mt-1 text-sm text-ink-soft">{s.means[lang]}</p>
			<p class="mt-1 text-sm">
				<a class="text-accent underline" href="{pdf}#page={s.page}"
					>{s.rules.length ? m.signals_rule({ rules: s.rules.join(', ') }) : m.signals_diagram()}</a
				>
			</p>
		</div>
	</li>
{/snippet}

<section class="mt-8" aria-labelledby="referee-heading">
	<h2 id="referee-heading" class="text-2xl font-bold tracking-tight">{m.signals_referees()}</h2>
	<ol class="mt-4 grid gap-3 lg:grid-cols-2">
		{#each referee as s, i (s.id)}{@render card(s, i + 1)}{/each}
	</ol>
</section>

<section class="mt-12" aria-labelledby="flags-heading">
	<h2 id="flags-heading" class="text-2xl font-bold tracking-tight">{m.signals_flags()}</h2>
	<p class="mt-1 max-w-2xl text-ink-soft">{m.signals_flags_lead()}</p>
	<ol class="mt-4 grid gap-3 lg:grid-cols-2">
		{#each flags as s, i (s.id)}{@render card(s, i + 1)}{/each}
	</ol>
</section>

<p class="mt-8 text-sm text-ink-soft">
	<a class="text-accent underline" href={href('/rules/situations')}>{m.situations_title()}</a> ·
	<a class="text-accent underline" href={href('/rules')}>{m.rules_title()}</a>
</p>
