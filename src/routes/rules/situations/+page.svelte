<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import { CASEBOOK_PDF, RULES_PDF, SITUATIONS } from '#lib/situations.js';
	import { leagueName } from '#lib/volley/labels.js';
	import IconCheck from '~icons/lucide/circle-check';
	import IconX from '~icons/lucide/circle-x';
	import IconScale from '~icons/lucide/scale';

	$effect(() => explorerPrefs.load());
	const league = $derived(explorerPrefs.current.league);
	const lang = $derived(getLocale() as 'en' | 'hu');
	/** The reader's guesses, so a revealed answer can say whether they were right. */
	let guesses: Record<string, 'legal' | 'fault'> = $state({});
	let revealed: Record<string, boolean> = $state({});
</script>

<Seo
	title="{m.situations_title()} · {site.name}"
	description={m.situations_description()}
	path="/rules/situations"
	schema="Article"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.situations_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.situations_lead()}</p>
<p class="mt-3 max-w-2xl text-sm text-ink-soft">
	{m.situations_rules_note({ rules: leagueName(league) })}
	<a class="text-accent underline" href={href('/rules')}>{m.rules_title()}</a>
</p>

<ol class="mt-8 max-w-3xl space-y-4">
	{#each SITUATIONS as s, i (s.id)}
		{@const local = s.elsewhere?.find((e) => e.leagues.includes(league))}
		{@const guess = guesses[s.id]}
		<li class="card">
			<p class="eyebrow">{m.situations_case({ n: i + 1 })}</p>
			<p class="mt-1 text-lg">{s.scenario[lang]}</p>
			{#if !revealed[s.id]}
				<div class="mt-3 flex flex-wrap gap-2" data-pagefind-ignore>
					{#if s.verdict !== 'depends'}
						<button
							type="button"
							class="chip"
							onclick={() => {
								guesses[s.id] = 'legal';
								revealed[s.id] = true;
							}}>{m.quiz_is_legal()}</button
						>
						<button
							type="button"
							class="chip"
							onclick={() => {
								guesses[s.id] = 'fault';
								revealed[s.id] = true;
							}}>{m.situations_fault()}</button
						>
					{/if}
					<button type="button" class="chip" onclick={() => (revealed[s.id] = true)}
						>{m.situations_show()}</button
					>
				</div>
			{/if}
			<div class={revealed[s.id] ? 'mt-3' : 'sr-only'} aria-live="polite">
				{#if revealed[s.id] && guess}
					<p
						class={[
							'flex items-center gap-1.5 font-semibold',
							guess === s.verdict ? 'text-good' : 'text-bad'
						]}
					>
						{#if guess === s.verdict}<IconCheck class="size-5" aria-hidden="true" />{m.quiz_right()}
						{:else}<IconX class="size-5" aria-hidden="true" />{m.quiz_wrong()}{/if}
					</p>
				{/if}
				<p class="mt-1 font-semibold">
					<IconScale class="inline size-4 align-[-2px] text-accent" aria-hidden="true" />
					{s.ruling[lang]}
				</p>
				<p class="mt-1 text-ink-soft">{s.why[lang]}</p>
				<p class="mt-2 text-sm">
					{m.situations_fivb()}
					{#each s.rules as r, j (r.n)}{j ? ', ' : ''}<a
							class="text-accent underline"
							href="{RULES_PDF}#page={r.page}">{r.n}</a
						>{/each}
				</p>
				{#if local}
					<p class="mt-3 rounded-xl border-l-4 border-accent bg-paper px-3 py-2 text-sm">
						<span class="font-semibold">{leagueName(league)}:</span>
						{local.text[lang]}
					</p>
				{/if}
				{#each (s.elsewhere ?? []).filter((e) => e !== local) as e, j (j)}
					<p class="mt-2 text-sm text-ink-soft">{e.text[lang]}</p>
				{/each}
			</div>
		</li>
	{/each}
</ol>

<p class="mt-8 max-w-3xl text-sm text-ink-soft">
	{m.situations_sources()}
	<a class="text-accent underline" href={RULES_PDF}>{m.situations_rules_pdf()}</a>,
	<a class="text-accent underline" href={CASEBOOK_PDF}>{m.situations_casebook()}</a>.
</p>
