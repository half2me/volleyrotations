<script lang="ts">
	import IndoorOnlyNotice from '#lib/components/IndoorOnlyNotice.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { guideLabel } from '#lib/page-labels.js';
	import type { GuideSlug } from '#lib/pages.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Persisted } from '#lib/persisted.svelte.js';
	import IconBook from '~icons/lucide/book-open';
	import IconCheck from '~icons/lucide/check';
	import IconPlay from '~icons/lucide/mouse-pointer-click';

	/** Which steps the reader has ticked off, kept in their browser. */
	const progress = new Persisted<{ done: string[] }>('vr:learn', { done: [] });
	$effect(() => progress.load());

	type Step = {
		id: string;
		guide?: GuideSlug;
		tool?: string;
		toolLabel?: () => string;
		text: () => string;
	};
	type Stage = { title: () => string; lead: () => string; steps: Step[] };

	const STAGES: Stage[] = [
		{
			title: m.learn_stage_1,
			lead: m.learn_stage_1_lead,
			steps: [
				{ id: 'positions', guide: 'positions', text: m.learn_positions },
				{ id: 'rotations', guide: 'rotations', text: m.learn_rotations },
				{
					id: 'explorer-receive',
					tool: '/explorer',
					toolLabel: m.nav_explorer,
					text: m.learn_explorer_receive
				}
			]
		},
		{
			title: m.learn_stage_2,
			lead: m.learn_stage_2_lead,
			steps: [
				{ id: 'overlap', guide: 'overlap', text: m.learn_overlap },
				{
					id: 'overlap-trainer',
					tool: '/overlap',
					toolLabel: m.nav_overlap,
					text: m.learn_overlap_trainer
				},
				{ id: 'serve-receive', guide: 'serve-receive', text: m.learn_serve_receive }
			]
		},
		{
			title: m.learn_stage_3,
			lead: m.learn_stage_3_lead,
			steps: [
				{ id: 'systems', guide: 'systems', text: m.learn_systems },
				{ id: 'defense', guide: 'defense', text: m.learn_defense },
				{ id: 'coverage', guide: 'coverage', text: m.learn_coverage },
				{ id: 'libero', guide: 'libero', text: m.learn_libero },
				{ id: 'quiz', tool: '/quiz', toolLabel: m.nav_quiz, text: m.learn_quiz },
				{
					id: 'situations',
					tool: '/rules/situations',
					toolLabel: m.situations_title,
					text: m.learn_situations
				},
				{
					id: 'signals',
					tool: '/rules/signals',
					toolLabel: m.signals_title,
					text: m.learn_signals
				},
				{
					id: 'signals-quiz',
					tool: '/rules/signals/quiz',
					toolLabel: m.signals_quiz_title,
					text: m.learn_signals_quiz
				}
			]
		},
		{
			title: m.learn_stage_4,
			lead: m.learn_stage_4_lead,
			steps: [
				{ id: 'rules', tool: '/rules', toolLabel: m.rules_title, text: m.learn_rules },
				{ id: 'leagues', guide: 'leagues', text: m.learn_leagues },
				{ id: 'substitutions', guide: 'substitutions', text: m.learn_substitutions },
				{ id: 'lineup', tool: '/lineup', toolLabel: m.nav_lineup, text: m.learn_lineup },
				{ id: 'match', tool: '/match', toolLabel: m.nav_match, text: m.learn_match },
				{ id: 'drills', tool: '/drills', toolLabel: m.drills_title, text: m.learn_drills },
				{ id: 'scoring', guide: 'scoring', text: m.learn_scoring }
			]
		}
	];

	const total = STAGES.reduce((n, s) => n + s.steps.length, 0);
	const done = $derived(new Set(progress.current.done));

	function toggle(id: string) {
		const next = new Set(done);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		progress.set({ done: [...next] });
	}
</script>

<Seo
	title="{m.learn_title()} · {site.name}"
	description={m.learn_description()}
	path="/learn"
	schema="Article"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.learn_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.learn_lead()}</p>
<IndoorOnlyNotice />
<div class="mt-4 max-w-md" data-pagefind-ignore>
	<p class="font-semibold" aria-live="polite">{m.learn_progress({ done: done.size, total })}</p>
	<div class="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
		<div
			class="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-500"
			style="width: {(100 * done.size) / total}%"
		></div>
	</div>
</div>

<ol class="mt-8 max-w-3xl space-y-10">
	{#each STAGES as stage, i (i)}
		<li>
			<h2 class="text-2xl font-bold tracking-tight">
				<span class="text-accent">{i + 1}.</span>
				{stage.title()}
			</h2>
			<p class="mt-1 text-ink-soft">{stage.lead()}</p>
			<ul class="mt-4 space-y-3">
				{#each stage.steps as step (step.id)}
					{@const ticked = done.has(step.id)}
					<li
						class={[
							'card flex flex-wrap items-start gap-3 sm:flex-nowrap',
							ticked && 'border-good'
						]}
					>
						<div class="min-w-0 flex-1">
							<a
								class="inline-flex min-h-11 items-center gap-2 font-semibold text-accent underline"
								href={href(step.guide ? `/guides/${step.guide}` : step.tool!)}
							>
								{#if step.guide}
									<IconBook class="size-4 shrink-0" aria-hidden="true" />{guideLabel[step.guide]()}
								{:else}
									<IconPlay class="size-4 shrink-0" aria-hidden="true" />{step.toolLabel!()}
								{/if}
							</a>
							<p class="text-ink-soft">{step.text()}</p>
						</div>
						<button
							type="button"
							class={ticked ? 'btn-primary' : 'btn-secondary'}
							aria-pressed={ticked}
							onclick={() => toggle(step.id)}
							data-pagefind-ignore
						>
							<IconCheck class="size-4" aria-hidden="true" />
							{ticked ? m.learn_done() : m.learn_mark()}
						</button>
					</li>
				{/each}
			</ul>
		</li>
	{/each}
</ol>
