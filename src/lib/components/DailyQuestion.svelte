<script lang="ts">
	import QuizQuestion from '#lib/components/QuizQuestion.svelte';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Persisted } from '#lib/persisted.svelte.js';
	import { DEFAULT_OPTIONS } from '#lib/volley/formations.js';
	import { daySeed, isCorrect, makeQuestion, seeded, type Question } from '#lib/volley/quiz.js';
	import IconFlame from '~icons/lucide/flame';

	/**
	 * The question of the day: the same 5-1 question for everyone on a calendar day, with a
	 * streak of days answered in a row kept in the reader's browser.
	 */
	const daily = new Persisted<{
		/** The last day answered, as YYYY-MM-DD in the reader's time zone. */
		day?: string;
		choice?: number;
		right?: boolean;
		streak: number;
		best: number;
	}>('vr:daily', { streak: 0, best: 0 });

	const dayOf = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

	// The day comes from the reader's clock, so the question is only made in the browser.
	let today: string | undefined = $state();
	let question: Question | undefined = $state();
	$effect(() => {
		daily.load();
		today = dayOf(new Date());
		question = makeQuestion(DEFAULT_OPTIONS, undefined, undefined, seeded(daySeed(today)));
	});

	const chosen = $derived(daily.current.day === today ? daily.current.choice : undefined);
	/** A streak counts while the last answer was today or yesterday. */
	const streak = $derived.by(() => {
		if (!today || !daily.current.day) return 0;
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		return daily.current.day === today || daily.current.day === dayOf(yesterday)
			? daily.current.streak
			: 0;
	});

	function answer(choice: number) {
		if (!question || !today || chosen !== undefined) return;
		const streakNow = streak + 1;
		daily.set({
			day: today,
			choice,
			right: isCorrect(question, choice),
			streak: streakNow,
			best: Math.max(daily.current.best, streakNow)
		});
	}
</script>

<section aria-labelledby="daily-heading" data-pagefind-ignore>
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 id="daily-heading" class="text-2xl font-bold tracking-tight">{m.daily_title()}</h2>
			<p class="mt-1 text-ink-soft">{m.daily_lead()}</p>
		</div>
		{#if streak > 0}
			<p class="flex items-center gap-1.5 font-semibold" aria-live="polite">
				<IconFlame class="size-5 text-accent" aria-hidden="true" />
				{m.daily_streak({ n: streak })}
			</p>
		{/if}
	</div>
	<div class="card mt-4">
		{#if question}
			<QuizQuestion {question} {chosen} onanswer={answer}>
				{#snippet after()}
					<p class="mt-4 text-ink-soft">{m.daily_come_back()}</p>
					<a href={href('/quiz')} class="btn-primary mt-3">{m.daily_more()}</a>
				{/snippet}
			</QuizQuestion>
		{:else}
			<p class="text-ink-soft">{m.quiz_loading()}</p>
		{/if}
	</div>
</section>
