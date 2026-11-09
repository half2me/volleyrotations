<script lang="ts">
	import IndoorOnlyNotice from '#lib/components/IndoorOnlyNotice.svelte';
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import QuizQuestion from '#lib/components/QuizQuestion.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Persisted } from '#lib/persisted.svelte.js';
	import { effectiveOptions, explorerPrefs } from '#lib/prefs.svelte.js';
	import { teams } from '#lib/teams.svelte.js';
	import { roleName, systemName } from '#lib/volley/labels.js';
	import { rolesOf } from '#lib/volley/model.js';
	import {
		isCorrect,
		makeQuestion,
		recordAnswer,
		revisit,
		topicOf,
		type Question
	} from '#lib/volley/quiz.js';
	import IconArrowRight from '~icons/lucide/arrow-right';

	const score = new Persisted('vr:quiz', {
		streak: 0,
		best: 0,
		correct: 0,
		answered: 0,
		mine: true,
		/** Recent misses per topic, so missed questions come back more often. */
		misses: {} as Record<string, number>
	});

	$effect(() => {
		explorerPrefs.load();
		teams.load();
		score.load();
	});

	const team = $derived(teams.current.list.find((t) => t.id === explorerPrefs.current.team));
	const prefs = $derived({
		...explorerPrefs.current,
		...effectiveOptions(explorerPrefs.current, team)
	});
	const myRole = $derived(
		rolesOf(prefs.system, prefs.libero).includes(prefs.role) ? prefs.role : undefined
	);

	// Questions are random, so the first one is made in the browser only: a prerendered one would
	// not match what hydration draws.
	let question: Question | undefined = $state();
	let chosen: number | undefined = $state();

	function next() {
		chosen = undefined;
		question = makeQuestion(
			prefs,
			score.current.mine ? myRole : undefined,
			revisit(score.current.misses ?? {})
		);
	}

	$effect(() => {
		if (explorerPrefs.loaded && score.loaded && !question) next();
	});

	function answer(choice: number) {
		if (chosen !== undefined || !question) return;
		chosen = choice;
		const s = score.current;
		const right = isCorrect(question, choice);
		score.set({
			...s,
			answered: s.answered + 1,
			correct: s.correct + (right ? 1 : 0),
			streak: right ? s.streak + 1 : 0,
			best: Math.max(s.best, right ? s.streak + 1 : 0),
			misses: recordAnswer(s.misses ?? {}, topicOf(question), right)
		});
	}
</script>

<Seo
	title="{m.quiz_title()} · {site.name}"
	description={m.quiz_description()}
	path="/quiz"
	schema="WebApplication"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.quiz_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.quiz_lead()}</p>
<IndoorOnlyNotice quiz />

<div class="mt-6 flex flex-wrap items-end justify-between gap-4" data-pagefind-ignore>
	<ChipGroup
		legend={m.quiz_about()}
		options={[
			{ value: true, label: myRole ? m.quiz_mine({ role: roleName(myRole) }) : m.quiz_mine_none() },
			{ value: false, label: m.quiz_everyone() }
		]}
		bind:value={
			() => score.current.mine,
			(mine) => {
				score.set({ ...score.current, mine });
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
<p class="mt-2 text-sm text-ink-soft">
	{m.quiz_settings_note({ system: systemName(prefs.system) })}
	<a class="text-accent underline" href={href('/explorer')}>{m.explorer_title()}</a>
</p>
<p class="mt-1 text-sm text-ink-soft">
	<a class="text-accent underline" href={href('/rules/signals/quiz')}>{m.signals_quiz_link()}</a>
</p>
<p class="mt-1 text-sm text-ink-soft">
	{m.quiz_revisit_note({ n: Object.keys(score.current.misses ?? {}).length })}
</p>

<div class="mt-6" data-pagefind-ignore>
	{#if question}
		<QuizQuestion {question} {chosen} onanswer={answer}>
			{#snippet after()}
				<button type="button" class="btn-primary mt-5" onclick={next}>
					{m.quiz_next()}<IconArrowRight class="size-4" aria-hidden="true" />
				</button>
			{/snippet}
		</QuizQuestion>
	{:else}
		<p class="text-ink-soft">{m.quiz_loading()}</p>
	{/if}
</div>
