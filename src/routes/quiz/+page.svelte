<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import Court from '#lib/components/court/Court.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import PlayerToken from '#lib/components/court/PlayerToken.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Persisted } from '#lib/persisted.svelte.js';
	import { effectiveOptions, explorerPrefs } from '#lib/prefs.svelte.js';
	import { teams } from '#lib/teams.svelte.js';
	import { byZone } from '#lib/volley/formations.js';
	import {
		attackFromName,
		phaseName,
		roleName,
		roleShort,
		rotationLabel,
		zoneRef,
		systemName,
		roleInSentence,
		roleRef
	} from '#lib/volley/labels.js';
	import { ZONES, rolesOf, type Zone } from '#lib/volley/model.js';
	import { overlapFaults } from '#lib/volley/overlap.js';
	import { makeQuestion, recordAnswer, revisit, topicOf, type Question } from '#lib/volley/quiz.js';
	import IconArrowRight from '~icons/lucide/arrow-right';
	import IconCheck from '~icons/lucide/circle-check';
	import IconX from '~icons/lucide/circle-x';

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

	const correct = $derived.by(() => {
		if (!question || chosen === undefined) return undefined;
		if (question.kind === 'spot') return chosen === question.answer;
		if (question.kind === 'legal') return (chosen === 1) === question.legal;
		return chosen === question.answer;
	});

	function answer(choice: number) {
		if (chosen !== undefined || !question) return;
		chosen = choice;
		const s = score.current;
		const right = correct!;
		score.set({
			...s,
			answered: s.answered + 1,
			correct: s.correct + (right ? 1 : 0),
			streak: right ? s.streak + 1 : 0,
			best: Math.max(s.best, right ? s.streak + 1 : 0),
			misses: recordAnswer(s.misses ?? {}, topicOf(question), right)
		});
	}

	const LETTERS = ['A', 'B', 'C', 'D'];

	const prompt = $derived.by(() => {
		const q = question;
		if (!q) return '';
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

<Seo
	title="{m.quiz_title()} · {site.name}"
	description={m.quiz_description()}
	path="/quiz"
	schema="WebApplication"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.quiz_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.quiz_lead()}</p>

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
	{m.quiz_revisit_note({ n: Object.keys(score.current.misses ?? {}).length })}
</p>

<div class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]" data-pagefind-ignore>
	{#if question}
		{@const q = question}
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
									class={state === 'wrong'
										? 'fill-bad/20 stroke-bad'
										: 'fill-surface stroke-accent'}
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
							onclick={() => answer(i)}>{LETTERS[i]}</button
						>
					{/each}
				{:else if q.kind === 'legal'}
					<button
						type="button"
						class="chip"
						aria-pressed={chosen === 1}
						disabled={chosen !== undefined}
						onclick={() => answer(1)}>{m.quiz_is_legal()}</button
					>
					<button
						type="button"
						class="chip"
						aria-pressed={chosen === 0}
						disabled={chosen !== undefined}
						onclick={() => answer(0)}>{m.quiz_is_fault()}</button
					>
				{:else}
					{#each ZONES as z (z)}
						<button
							type="button"
							class="chip min-w-14 text-lg"
							aria-pressed={chosen === z}
							disabled={chosen !== undefined}
							onclick={() => answer(z)}>{z}</button
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
					<button type="button" class="btn-primary mt-5" onclick={next}>
						{m.quiz_next()}<IconArrowRight class="size-4" aria-hidden="true" />
					</button>
				{/if}
			</div>
		</section>
	{:else}
		<p class="text-ink-soft">{m.quiz_loading()}</p>
	{/if}
</div>
