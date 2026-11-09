<script lang="ts">
	import Court from '#lib/components/court/Court.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import PlayerToken from '#lib/components/court/PlayerToken.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { byZone } from '#lib/volley/formations.js';
	import {
		attackFromName,
		explain,
		phaseName,
		roleName,
		roleShort,
		rotationLabel,
		slotName,
		taskName,
		zoneRef,
		systemName,
		roleInSentence,
		roleRef
	} from '#lib/volley/labels.js';
	import {
		ZONE_CENTRE,
		ZONES,
		lineupOf,
		setterOf,
		zonesInRotation,
		type RotationNo,
		type Zone
	} from '#lib/volley/model.js';
	import { overlapFaults } from '#lib/volley/overlap.js';
	import { isCorrect, type Question } from '#lib/volley/quiz.js';
	import type { Snippet } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
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

	/** Each zone's area in court metres, to shade the zones of a zone question once answered. */
	const ZONE_AREA: Record<Zone, { x: number; y: number; h: number }> = {
		4: { x: 0, y: 0, h: 3 },
		3: { x: 3, y: 0, h: 3 },
		2: { x: 6, y: 0, h: 3 },
		5: { x: 0, y: 3, h: 6 },
		6: { x: 3, y: 3, h: 6 },
		1: { x: 6, y: 3, h: 6 }
	};

	/**
	 * A court point as a position over the Court diagram, whose viewBox starts at (-1, -1.3) and is
	 * 11 m wide and 12.3 m tall while it draws the service zone.
	 */
	const onDiagram = (x: number, y: number) =>
		`left: ${((x + 1) / 11) * 100}%; top: ${((y + 1.3) / 12.3) * 100}%`;

	/**
	 * Once a zone question is answered, the rotation drawn steps from 1 up to the one asked, so the
	 * reader watches every player move one zone clockwise per rotation. `replays` restarts it.
	 */
	let step = $state(1);
	let replays = $state(0);
	$effect(() => {
		if (q.kind !== 'zone' || chosen === undefined) return;
		void replays;
		const target = q.o.rotation;
		if (prefersReducedMotion.current) {
			step = target;
			return;
		}
		let n = 1;
		step = n;
		if (target === 1) return;
		const timer = setInterval(() => {
			step = ++n;
			if (n >= target) clearInterval(timer);
		}, 1100);
		return () => clearInterval(timer);
	});

	/** The six players of a zone question: in the rotation asked, or once answered, the one drawn. */
	const zonePlayers = $derived.by(() => {
		if (q.kind !== 'zone') return [];
		const rotation = (chosen === undefined ? q.o.rotation : step) as RotationNo;
		const zones = zonesInRotation(q.o.system, rotation, q.o.order);
		const setter = setterOf(q.o.system, rotation);
		return lineupOf(q.o.system, q.o.order).map((role) => {
			const zone = ZONES.find((z) => zones[z] === role)!;
			return { role, zone, setter: role === setter, ...ZONE_CENTRE[zone] };
		});
	});

	/** Why the right spot is right, after a wrong answer to a spot question. */
	const spotWhy = $derived.by(() => {
		if (q.kind !== 'spot' || correct !== false) return undefined;
		const you = q.placed.find((p) => p.role === q.role);
		if (!you) return undefined;
		const slot = slotName(you.slot);
		const lead =
			q.phase === 'receive'
				? you.task === 'pass'
					? m.quiz_why_pass()
					: m.quiz_why_hide()
				: (q.o.system === '6-6' ? m.quiz_why_slot_66 : m.quiz_why_slot)({
						slot,
						task: taskName(you.task).toLocaleLowerCase(m.number_locale())
					});
		// The first tip is the general front- or back-row rule, which says nothing about the spot,
		// and the base tip repeats the slot the lead already names.
		const baseTip = m.tip_base({ slot });
		const tips = explain(q.o, q.phase, q.placed, q.role)
			.tips.slice(1)
			.filter((t) => t !== baseTip);
		return { lead, tips };
	});

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
			<div class="relative">
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
				<!-- Buttons laid over the markers let the court itself answer, while the SVG stays one image. -->
				{#if chosen === undefined}
					{#each q.choices as c, i (i)}
						<button
							type="button"
							class="absolute size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full hover:bg-accent/20"
							style={onDiagram(c.x, c.y)}
							aria-label={m.quiz_spot_marker({ letter: LETTERS[i] })}
							onclick={() => onanswer(i)}
						></button>
					{/each}
				{/if}
			</div>
		{:else if q.kind === 'legal'}
			<FormationCourt placed={q.placed} runs={false} label={m.quiz_court_label()} />
		{:else}
			{@const answered = chosen !== undefined}
			{@const wrongZone = answered && chosen !== q.answer ? ZONE_AREA[chosen as Zone] : undefined}
			{@const rightZone = ZONE_AREA[q.answer]}
			<Court label={m.quiz_court_label()}>
				{#if wrongZone}
					<rect
						x={wrongZone.x}
						y={wrongZone.y}
						width="3"
						height={wrongZone.h}
						class="fill-bad opacity-20"
					/>
				{/if}
				{#if answered}
					<rect
						x={rightZone.x}
						y={rightZone.y}
						width="3"
						height={rightZone.h}
						class="fill-accent opacity-30"
					/>
				{/if}
				{#each zonePlayers as p (p.role)}
					<PlayerToken
						x={p.x}
						y={p.y}
						label={answered ? roleShort(p.role) : ''}
						title={answered ? roleName(p.role) : undefined}
						you={answered && p.role === q.role}
						setter={answered && p.setter}
					/>
				{/each}
			</Court>
			{#if answered}
				<div class="mt-2 flex flex-wrap items-center justify-between gap-2">
					<p class="font-semibold" aria-hidden="true">{m.rotation_n({ n: step })}</p>
					{#if q.o.rotation > 1}
						<button type="button" class="chip" onclick={() => replays++}>{m.quiz_replay()}</button>
					{/if}
				</div>
			{/if}
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
						'animate-reveal mt-6 flex items-center gap-2 text-xl font-bold',
						correct ? 'text-good' : 'text-bad'
					]}
				>
					{#if correct}<IconCheck class="size-6" aria-hidden="true" />{m.quiz_right()}
					{:else}<IconX class="size-6" aria-hidden="true" />{m.quiz_wrong()}{/if}
				</p>
				<p class="mt-2">
					{#if q.kind === 'spot'}
						{m.quiz_spot_explain({ letter: LETTERS[q.answer] })}
						{#if spotWhy}{spotWhy.lead}{/if}
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
						{@const start = lineupOf(q.o.system, q.o.order).indexOf(q.role) + 1}
						{m.quiz_zone_explain({ role: roleInSentence(q.role), zone: zoneRef(q.answer) })}
						{q.o.rotation === 1
							? m.quiz_zone_why_first({ role: roleRef(q.role), zone: zoneRef(q.answer) })
							: m.quiz_zone_why({
									role: roleRef(q.role),
									start: zoneRef(start),
									n: q.o.rotation,
									zone: zoneRef(q.answer)
								})}
					{/if}
				</p>
				{#if spotWhy?.tips.length}
					<ul class="mt-2 list-disc space-y-1 ps-5 text-ink-soft">
						{#each spotWhy.tips as tip (tip)}<li>{tip}</li>{/each}
					</ul>
				{/if}
				{@render after?.()}
			{/if}
		</div>
	</section>
</div>
