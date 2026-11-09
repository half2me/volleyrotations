<script lang="ts">
	import SignalFigure from '#lib/components/SignalFigure.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { FLAG_SIGNALS, REFEREE_SIGNALS, type Signal } from '#lib/signals.js';
	import { RULES_PDF } from '#lib/situations.js';

	const lang = $derived(getLocale() as 'en' | 'hu');
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
	<a class="text-accent underline" href="{RULES_PDF}#page=75">{m.signals_source()}</a>
</p>

{#snippet card(s: Signal, n: number)}
	<li class="card flex flex-col gap-4 sm:flex-row">
		<div class="mx-auto w-full max-w-60 shrink-0 sm:mx-0 sm:w-48">
			<SignalFigure signal={s} />
		</div>
		<div class="min-w-0">
			<p class="eyebrow">{n}. · {who(s)}</p>
			<h3 class="mt-1 font-bold">{s.name[lang]}</h3>
			<p class="mt-1">{s.gesture[lang]}</p>
			<p class="mt-1 text-sm text-ink-soft">{s.means[lang]}</p>
			<p class="mt-1 text-sm">
				<a class="text-accent underline" href="{RULES_PDF}#page={s.page}"
					>{m.signals_rule({ rules: s.rules.join(', ') })}</a
				>
			</p>
		</div>
	</li>
{/snippet}

<section class="mt-8" aria-labelledby="referee-heading">
	<h2 id="referee-heading" class="text-2xl font-bold tracking-tight">{m.signals_referees()}</h2>
	<ol class="mt-4 grid gap-3 lg:grid-cols-2">
		{#each REFEREE_SIGNALS as s, i (s.id)}{@render card(s, i + 1)}{/each}
	</ol>
</section>

<section class="mt-12" aria-labelledby="flags-heading">
	<h2 id="flags-heading" class="text-2xl font-bold tracking-tight">{m.signals_flags()}</h2>
	<p class="mt-1 max-w-2xl text-ink-soft">{m.signals_flags_lead()}</p>
	<ol class="mt-4 grid gap-3 lg:grid-cols-2">
		{#each FLAG_SIGNALS as s, i (s.id)}{@render card(s, i + 1)}{/each}
	</ol>
</section>

<p class="mt-8 text-sm text-ink-soft">
	<a class="text-accent underline" href={href('/rules/situations')}>{m.situations_title()}</a> ·
	<a class="text-accent underline" href={href('/rules')}>{m.rules_title()}</a>
</p>
