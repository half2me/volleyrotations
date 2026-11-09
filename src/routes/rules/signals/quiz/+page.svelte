<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SignalFigure from '#lib/components/SignalFigure.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { Persisted } from '#lib/persisted.svelte.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import { makeSignalQuestion, type SignalQuestion } from '#lib/signal-quiz.js';
	import {
		BEACH_FLAG_SIGNALS,
		BEACH_REFEREE_SIGNALS,
		BEACH_RULES_PDF,
		FLAG_SIGNALS,
		REFEREE_SIGNALS,
		type Signal
	} from '#lib/signals.js';
	import { RULES_PDF } from '#lib/situations.js';
	import type { Sport } from '#lib/volley/match.js';
	import IconArrowRight from '~icons/lucide/arrow-right';
	import IconCheck from '~icons/lucide/circle-check';
	import IconLightbulb from '~icons/lucide/lightbulb';
	import IconX from '~icons/lucide/circle-x';

	const score = new Persisted('vr:signals', { streak: 0, best: 0, correct: 0, answered: 0 });

	$effect(() => {
		explorerPrefs.load();
		score.load();
	});

	const lang = $derived(getLocale() as 'en' | 'hu');
	// Starts on the reader's sport; switching here does not change the site-wide choice.
	let sport: Sport = $derived(explorerPrefs.current.sport ?? 'indoor');
	const beach = $derived(sport === 'beach');
	const pdf = $derived(beach ? BEACH_RULES_PDF : RULES_PDF);
	const sets = $derived(
		beach ? [BEACH_REFEREE_SIGNALS, BEACH_FLAG_SIGNALS] : [REFEREE_SIGNALS, FLAG_SIGNALS]
	);
	const who = (s: Signal) =>
		s.who === 'first' ? m.signals_first() : s.who === 'both' ? m.signals_both() : m.signals_line();

	// Questions are random, so they are drawn in the browser only: a prerendered one would not
	// match what hydration draws.
	let question: SignalQuestion | undefined = $state();
	let chosen: number | undefined = $state();
	let hint = $state(false);
	const correct = $derived(
		chosen === undefined || !question ? undefined : chosen === question.answer
	);

	function next() {
		chosen = undefined;
		hint = false;
		question = makeSignalQuestion(sets, question?.signal.id);
	}

	$effect(() => {
		if (explorerPrefs.loaded && !question) next();
	});

	function answer(choice: number) {
		if (chosen !== undefined || !question) return;
		chosen = choice;
		const s = score.current;
		const right = choice === question.answer;
		score.set({
			answered: s.answered + 1,
			correct: s.correct + (right ? 1 : 0),
			streak: right ? s.streak + 1 : 0,
			best: Math.max(s.best, right ? s.streak + 1 : 0)
		});
	}
</script>

<Seo
	title="{m.signals_quiz_title()} · {site.name}"
	description={m.signals_quiz_description()}
	path="/rules/signals/quiz"
	schema="WebApplication"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.signals_quiz_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.signals_quiz_lead()}</p>

<div class="mt-6 flex flex-wrap items-end justify-between gap-4" data-pagefind-ignore>
	<ChipGroup
		legend={m.sport_label()}
		options={[
			{ value: 'indoor', label: m.sport_indoor() },
			{ value: 'beach', label: m.sport_beach() }
		]}
		bind:value={
			() => sport,
			(value) => {
				sport = value;
				next();
			}
		}
	/>
	<dl class="flex flex-wrap gap-2 text-center">
		<div class="card px-3 py-2">
			<dt class="eyebrow">{m.quiz_streak()}</dt>
			<dd class="text-2xl font-bold">{score.current.streak}</dd>
		</div>
		<div class="card px-3 py-2">
			<dt class="eyebrow">{m.quiz_best()}</dt>
			<dd class="text-2xl font-bold">{score.current.best}</dd>
		</div>
		<div class="card px-3 py-2">
			<dt class="eyebrow">{m.quiz_score()}</dt>
			<dd class="text-2xl font-bold">{score.current.correct}/{score.current.answered}</dd>
		</div>
	</dl>
</div>

<div class="mt-6" data-pagefind-ignore>
	{#if question}
		{@const q = question}
		<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
			<div class="card mx-auto w-full max-w-80 lg:mx-0">
				{#key q.signal.id}<SignalFigure signal={q.signal} />{/key}
			</div>

			<section class="min-w-0">
				<p class="eyebrow">{m.quiz_question()}</p>
				<h2 class="mt-1 text-xl font-bold sm:text-2xl">{m.signals_quiz_prompt()}</h2>

				{#if chosen === undefined}
					<button
						type="button"
						class="btn-ghost mt-2 -ml-3"
						aria-expanded={hint}
						aria-controls="signal-hint"
						onclick={() => (hint = !hint)}
					>
						<IconLightbulb class="size-4" aria-hidden="true" />{m.signals_quiz_hint()}
					</button>
					<p id="signal-hint" class="mt-1 max-w-prose text-ink-soft" hidden={!hint}>
						{q.signal.gesture[lang]}
					</p>
				{/if}

				<div class="mt-5 grid gap-2 sm:grid-cols-2">
					{#each q.options as o, i (o.id)}
						<button
							type="button"
							class={[
								'chip h-auto rounded-2xl py-2 text-base',
								chosen !== undefined && i === q.answer && 'border-good',
								chosen === i && i !== q.answer && 'border-bad'
							]}
							aria-pressed={chosen === i}
							disabled={chosen !== undefined}
							onclick={() => answer(i)}>{o.name[lang]}</button
						>
					{/each}
				</div>

				<div aria-live="polite">
					{#if correct !== undefined}
						<p
							class={[
								'animate-reveal mt-6 flex items-center gap-2 text-xl font-bold',
								correct ? 'text-good' : 'text-bad'
							]}
						>
							{#if correct}<IconCheck class="size-6" aria-hidden="true" />{m.quiz_right()}
							{:else}<IconX class="size-6" aria-hidden="true" />{m.quiz_wrong()}{/if}
						</p>
						{#if !correct}
							<p class="mt-1 font-semibold">
								{m.beach_quiz_answer({ answer: q.signal.name[lang] })}
							</p>
						{/if}
						<p class="eyebrow mt-4">{who(q.signal)}</p>
						<p class="mt-1">{q.signal.gesture[lang]}</p>
						<p class="mt-1 text-ink-soft">{q.signal.means[lang]}</p>
						<p class="mt-1 text-sm">
							<a class="text-accent underline" href="{pdf}#page={q.signal.page}"
								>{q.signal.rules.length
									? m.signals_rule({ rules: q.signal.rules.join(', ') })
									: m.signals_diagram()}</a
							>
						</p>
						<button type="button" class="btn-primary mt-5" onclick={next}>
							{m.quiz_next()}<IconArrowRight class="size-4" aria-hidden="true" />
						</button>
					{/if}
				</div>
			</section>
		</div>
	{:else}
		<p class="text-ink-soft">{m.quiz_loading()}</p>
	{/if}
</div>

<p class="mt-8 text-sm text-ink-soft">
	<a class="text-accent underline" href={href('/rules/signals')}>{m.signals_title()}</a> ·
	<a class="text-accent underline" href={href('/quiz')}>{m.quiz_title()}</a> ·
	<a class="text-accent underline" href={href('/rules')}>{m.rules_title()}</a>
</p>
