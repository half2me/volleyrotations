<script lang="ts">
	import Court from '#lib/components/court/Court.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import PlayerToken from '#lib/components/court/PlayerToken.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { byZone } from '#lib/volley/formations.js';
	import {
		attackFromName,
		phaseName,
		roleShort,
		rotationLabel,
		zoneRef,
		systemName,
		roleInSentence,
		roleRef
	} from '#lib/volley/labels.js';
	import { ZONES, type Zone } from '#lib/volley/model.js';
	import { overlapFaults } from '#lib/volley/overlap.js';
	import { isCorrect, type Question } from '#lib/volley/quiz.js';
	import type { Snippet } from 'svelte';
	import IconCheck from '~icons/lucide/circle-check';
	import IconX from '~icons/lucide/circle-x';

	/**
	 * One quiz question: the court, the prompt, the answer buttons and, once answered, whether it
	 * was right and why. `after` goes under the explanation, such as a "next question" button.
	 */
	let {
		question: q,
		chosen,
		onanswer,
		after
	}: {
		question: Question;
		chosen: number | undefined;
		onanswer: (choice: number) => void;
		after?: Snippet;
	} = $props();

	const LETTERS = ['A', 'B', 'C', 'D'];
	const correct = $derived(chosen === undefined ? undefined : isCorrect(q, chosen));

	const prompt = $derived.by(() => {
		const rotation = rotationLabel(q.o.rotation, q.o.system);
		if (q.kind === 'zone')
			// The plain rotation number: the usual label names the setter's zone, which would give
			// the answer away when the question is about the setter.
			return m.quiz_zone_prompt({
				role: roleInSentence(q.role),
				rotation: m.rotation_n({ n: q.o.rotation }),
				system: systemName(q.o.system)
			});
		if (q.kind === 'legal')
			return m.quiz_legal_prompt({ rotation, system: systemName(q.o.system) });
		const moment =
			q.phase === 'defense'
				? `${phaseName(q.phase)} (${attackFromName(q.o.attackFrom)})`
				: q.phase === 'receive'
					? m.quiz_moment_receive()
					: `${phaseName(q.phase)}, ${q.o.serving ? m.we_serve() : m.we_receive()}`;
		return m.quiz_spot_prompt({
			role: roleInSentence(q.role),
			moment,
			rotation,
			system: systemName(q.o.system)
		});
	});
</script>

<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
	<div>
		{#if q.kind === 'spot'}
			{@const shown = chosen === undefined ? q.placed.filter((p) => p.role !== q.role) : q.placed}
			<Court label={m.quiz_court_label()}>
				{#each shown as p (p.role)}
					<PlayerToken
						x={p.x}
						y={p.y}
						label={roleShort(p.role)}
						kind={p.role === 'L' ? 'libero' : 'team'}
						you={chosen !== undefined && p.role === q.role}
					/>
				{/each}
				{#each q.choices as c, i (i)}
					{@const state =
						chosen === undefined
							? 'open'
							: i === q.answer
								? 'right'
								: i === chosen
									? 'wrong'
									: 'other'}
					{#if state !== 'right'}
						<g transform="translate({c.x} {c.y})" class={state === 'other' ? 'opacity-30' : ''}>
							<circle
								r="0.46"
								class={state === 'wrong' ? 'fill-bad/20 stroke-bad' : 'fill-surface stroke-accent'}
								stroke-width="0.08"
								stroke-dasharray="0.18 0.1"
							/>
							<text
								text-anchor="middle"
								dominant-baseline="central"
								font-size="0.44"
								font-weight="700"
								class={state === 'wrong' ? 'fill-bad' : 'fill-ink'}>{LETTERS[i]}</text
							>
						</g>
					{/if}
				{/each}
			</Court>
		{:else if q.kind === 'legal'}
			<FormationCourt placed={q.placed} runs={false} label={m.quiz_court_label()} />
		{:else}
			<FormationCourt placed={[]} label={m.quiz_court_label()} />
		{/if}
	</div>

	<section class="min-w-0">
		<p class="eyebrow">{m.quiz_question()}</p>
		<h2 class="mt-1 text-xl font-bold sm:text-2xl">{prompt}</h2>

		<div class="mt-5 flex flex-wrap gap-2">
			{#if q.kind === 'spot'}
				{#each q.choices as _, i (i)}
					<button
						type="button"
						class="chip min-w-14 text-lg"
						aria-pressed={chosen === i}
						disabled={chosen !== undefined}
						onclick={() => onanswer(i)}>{LETTERS[i]}</button
					>
				{/each}
			{:else if q.kind === 'legal'}
				<button
					type="button"
					class="chip"
					aria-pressed={chosen === 1}
					disabled={chosen !== undefined}
					onclick={() => onanswer(1)}>{m.quiz_is_legal()}</button
				>
				<button
					type="button"
					class="chip"
					aria-pressed={chosen === 0}
					disabled={chosen !== undefined}
					onclick={() => onanswer(0)}>{m.quiz_is_fault()}</button
				>
			{:else}
				{#each ZONES as z (z)}
					<button
						type="button"
						class="chip min-w-14 text-lg"
						aria-pressed={chosen === z}
						disabled={chosen !== undefined}
						onclick={() => onanswer(z)}>{z}</button
					>
				{/each}
			{/if}
		</div>

		<div aria-live="polite">
			{#if correct !== undefined}
				<p
					class={[
						'mt-6 flex items-center gap-2 text-xl font-bold',
						correct ? 'text-good' : 'text-bad'
					]}
				>
					{#if correct}<IconCheck class="size-6" aria-hidden="true" />{m.quiz_right()}
					{:else}<IconX class="size-6" aria-hidden="true" />{m.quiz_wrong()}{/if}
				</p>
				<p class="mt-2">
					{#if q.kind === 'spot'}
						{m.quiz_spot_explain({ letter: LETTERS[q.answer] })}
					{:else if q.kind === 'legal'}
						{@const faults = overlapFaults(byZone(q.placed))}
						{#if q.legal}
							{m.quiz_legal_explain()}
						{:else}
							{@const f = faults[0]}
							{@const name = (z: Zone) => {
								const p = q.placed.find((pl) => pl.zone === z)!;
								return m.player_in_zone({ name: roleRef(p.role), zone: zoneRef(z) });
							}}
							{f.kind === 'depth'
								? m.fault_depth({ back: name(f.b), front: name(f.a) })
								: m.fault_side({ left: name(f.a), right: name(f.b) })}
						{/if}
					{:else}
						{m.quiz_zone_explain({ role: roleInSentence(q.role), zone: zoneRef(q.answer) })}
					{/if}
				</p>
				{@render after?.()}
			{/if}
		</div>
	</section>
</div>
