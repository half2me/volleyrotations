<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { BEACH_QUESTIONS } from '#lib/beach-quiz.js';
	import { BEACH_RULES_PDF } from '#lib/beach.js';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import IconCheck from '~icons/lucide/circle-check';
	import IconRotate from '~icons/lucide/rotate-ccw';
	import IconX from '~icons/lucide/circle-x';

	const lang = $derived(getLocale() as 'en' | 'hu');
	/** The option the reader picked for each question; answering reveals the explanation. */
	let picked: Record<string, number> = $state({});
	const answered = $derived(Object.keys(picked).length);
	const right = $derived(BEACH_QUESTIONS.filter((q) => picked[q.id] === q.answer).length);
	const done = $derived(answered === BEACH_QUESTIONS.length);
</script>

<Seo
	title="{m.beach_quiz_title()} · {site.name}"
	description={m.beach_quiz_description()}
	path="/beach/quiz"
	schema="WebApplication"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.beach_quiz_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.beach_quiz_lead()}</p>

<p class="mt-4 font-semibold" aria-live="polite" data-pagefind-ignore>
	{#if answered}{m.beach_quiz_score({
			right,
			answered,
			total: BEACH_QUESTIONS.length
		})}{/if}
</p>

<ol class="mt-4 max-w-3xl space-y-4">
	{#each BEACH_QUESTIONS as q, i (q.id)}
		{@const choice = picked[q.id]}
		<li class="card">
			<p class="eyebrow">{m.beach_quiz_n({ n: i + 1, total: BEACH_QUESTIONS.length })}</p>
			<p class="mt-1 text-lg">{q.question[lang]}</p>
			<div class="mt-3 flex flex-wrap gap-2" data-pagefind-ignore>
				{#each q.options as o, j (j)}
					<button
						type="button"
						class={[
							'chip',
							choice !== undefined && j === q.answer && 'border-good',
							choice === j && j !== q.answer && 'border-bad'
						]}
						aria-pressed={choice === j}
						disabled={choice !== undefined}
						onclick={() => (picked[q.id] = j)}>{o[lang]}</button
					>
				{/each}
			</div>
			<div class={choice !== undefined ? 'animate-reveal mt-3' : 'sr-only'} aria-live="polite">
				{#if choice !== undefined}
					<p
						class={[
							'flex items-center gap-1.5 font-semibold',
							choice === q.answer ? 'text-good' : 'text-bad'
						]}
					>
						{#if choice === q.answer}<IconCheck class="size-5" aria-hidden="true" />{m.quiz_right()}
						{:else}<IconX class="size-5" aria-hidden="true" />{m.quiz_wrong()}
							{m.beach_quiz_answer({ answer: q.options[q.answer][lang] })}{/if}
					</p>
					<p class="mt-1 text-ink-soft">{q.why[lang]}</p>
					<p class="mt-2 text-sm">
						<a class="text-accent underline" href="{BEACH_RULES_PDF}#page={q.rule.page}"
							>{m.beach_rule_beach({ rule: q.rule.n })}</a
						>
					</p>
				{/if}
			</div>
		</li>
	{/each}
</ol>

{#if done}
	<div class="card mt-6 max-w-3xl" data-pagefind-ignore>
		<p class="text-xl font-bold">
			{m.beach_quiz_done({ right, total: BEACH_QUESTIONS.length })}
		</p>
		<button type="button" class="btn-secondary mt-3" onclick={() => (picked = {})}>
			<IconRotate class="size-4" aria-hidden="true" />{m.beach_quiz_again()}
		</button>
	</div>
{/if}

<p class="mt-8 max-w-3xl text-sm text-ink-soft">
	<a class="text-accent underline" href={href('/beach')}>{m.beach_title()}</a> ·
	<a class="text-accent underline" href={href('/guides/indoor-to-beach')}
		>{m.guide_indoor_to_beach()}</a
	>
	·
	<a class="text-accent underline" href={href('/rules/situations')}>{m.situations_title()}</a>
</p>
