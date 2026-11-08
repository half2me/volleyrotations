<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { explorerPrefs as prefs, type ExplorerPrefs } from '#lib/prefs.svelte.js';
	import {
		ATTACKS_FROM,
		DEFENSE_SYSTEMS,
		RECEIVE_PHASES,
		SERVE_PHASES,
		formation,
		formationsFor
	} from '#lib/volley/formations.js';
	import {
		attackFromName,
		defenseName,
		explain,
		phaseDescription,
		phaseName,
		roleName,
		rotationLabel,
		settingZone,
		slotName,
		systemDescription,
		zoneRef,
		systemName,
		roleInSentence
	} from '#lib/volley/labels.js';
	import {
		ROTATIONS,
		SYSTEMS,
		isFront,
		rolesOf,
		zoneOf,
		type RotationNo
	} from '#lib/volley/model.js';
	import IconChevronLeft from '~icons/lucide/chevron-left';
	import IconChevronRight from '~icons/lucide/chevron-right';
	import IconPause from '~icons/lucide/pause';
	import IconPlay from '~icons/lucide/play';
	import IconSettings from '~icons/lucide/settings-2';

	$effect(() => prefs.load());

	const o = $derived(prefs.current);
	const update = (patch: Partial<ExplorerPrefs>) => prefs.set({ ...prefs.current, ...patch });

	const roles = $derived(rolesOf(o.system, o.libero));
	const role = $derived(roles.includes(o.role) ? o.role : roles[0]);
	const formations = $derived(formationsFor(o));
	const options = $derived({
		...o,
		formation: formations.includes(o.formation) ? o.formation : formations[0]
	});

	const phases = $derived(o.serving ? SERVE_PHASES : RECEIVE_PHASES);
	let step = $state(0);
	const phase = $derived(phases[Math.min(step, phases.length - 1)]);

	const placed = $derived(formation(options, phase));
	const previous = $derived(step > 0 ? formation(options, phases[step - 1]) : undefined);
	const explanation = $derived(explain(options, phase, placed, role));
	const you = $derived(placed.find((p) => p.role === role));
	const passerCount = $derived(placed.filter((p) => p.task === 'pass').length);
	const yourZone = $derived(
		role === 'L' ? placed.find((p) => p.role === 'L')?.zone : zoneOf(o.system, o.rotation, role)
	);

	let playing = $state(false);
	$effect(() => {
		if (!playing) return;
		const timer = setInterval(() => {
			if (step < phases.length - 1) step++;
			else playing = false;
		}, 2200);
		return () => clearInterval(timer);
	});

	function go(delta: number) {
		playing = false;
		step = Math.max(0, Math.min(phases.length - 1, step + delta));
	}

	const courtLabel = $derived(
		m.court_label({
			phase: phaseName(phase),
			rotation: rotationLabel(o.rotation, o.system),
			you: roleInSentence(role)
		})
	);
</script>

<Seo
	title="{m.explorer_title()} · {site.name}"
	description={m.explorer_description()}
	path="/explorer"
	schema="WebApplication"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.explorer_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.explorer_lead()}</p>

<div class="mt-8 grid gap-4 lg:grid-cols-2" data-pagefind-ignore>
	<ChipGroup
		legend={m.label_system()}
		options={SYSTEMS.map((s) => ({ value: s, label: systemName(s) }))}
		bind:value={() => o.system, (system) => update({ system })}
	/>
	<ChipGroup
		legend={m.label_role()}
		options={roles.map((r) => ({ value: r, label: roleName(r) }))}
		bind:value={() => role, (r) => update({ role: r })}
	/>
	<ChipGroup
		legend={m.label_situation()}
		options={[
			{ value: false, label: m.we_receive() },
			{ value: true, label: m.we_serve() }
		]}
		bind:value={
			() => o.serving,
			(serving) => {
				step = 0;
				playing = false;
				update({ serving });
			}
		}
	/>
	<ChipGroup
		legend={m.label_rotation()}
		options={ROTATIONS.map((r) => ({
			value: r,
			label: String(r),
			hint: o.system === '6-6' ? undefined : m.setter_zone_short({ zone: settingZone(r, o.system) })
		}))}
		bind:value={() => o.rotation, (rotation: RotationNo) => update({ rotation })}
	/>
</div>
<p class="mt-3 text-sm text-ink-soft" data-pagefind-ignore>{systemDescription(o.system)}</p>

<details class="card mt-4" data-pagefind-ignore>
	<summary class="flex min-h-11 cursor-pointer items-center gap-2 font-medium">
		<IconSettings class="size-5" aria-hidden="true" />
		{m.settings()}
	</summary>
	<div class="mt-4 grid gap-5 sm:grid-cols-2">
		{#if formations.length > 1}
			<ChipGroup
				legend={m.label_formation()}
				options={formations.map((f) => ({ value: f, label: m.formation_n({ n: f }) }))}
				bind:value={() => options.formation, (formation) => update({ formation })}
			/>
		{/if}
		<ChipGroup
			legend={m.label_defense()}
			options={DEFENSE_SYSTEMS.map((d) => ({ value: d, label: defenseName(d) }))}
			bind:value={() => o.defense, (defense) => update({ defense })}
		/>
		{#if o.system !== '6-6'}
			<ChipGroup
				legend={m.label_libero()}
				options={[
					{ value: true, label: m.yes() },
					{ value: false, label: m.no() }
				]}
				bind:value={() => o.libero, (libero) => update({ libero })}
			/>
		{/if}
		<div>
			<ChipGroup
				legend={m.label_serving_rule()}
				options={[
					{ value: false, label: m.rule_2025() },
					{ value: true, label: m.rule_old() }
				]}
				bind:value={() => o.servingOverlap, (servingOverlap) => update({ servingOverlap })}
			/>
			<p class="mt-2 text-sm text-ink-soft">{m.serving_rule_help()}</p>
		</div>
	</div>
</details>

<div class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
	<div class="lg:sticky lg:top-4">
		<nav aria-label={m.label_phase()} class="mb-3 flex items-center gap-2" data-pagefind-ignore>
			<button
				type="button"
				class="btn-ghost"
				onclick={() => go(-1)}
				disabled={step === 0}
				aria-label={m.previous_phase()}
			>
				<IconChevronLeft class="size-5" aria-hidden="true" />
			</button>
			<ol class="flex flex-1 flex-wrap justify-center gap-1">
				{#each phases as p, i (p)}
					<li>
						<button
							type="button"
							class="chip"
							aria-pressed={i === step}
							onclick={() => {
								playing = false;
								step = i;
							}}>{phaseName(p)}</button
						>
					</li>
				{/each}
			</ol>
			<button
				type="button"
				class="btn-ghost"
				onclick={() => go(1)}
				disabled={step === phases.length - 1}
				aria-label={m.next_phase()}
			>
				<IconChevronRight class="size-5" aria-hidden="true" />
			</button>
		</nav>

		<FormationCourt {placed} {previous} you={role} area label={courtLabel} />

		<div class="mt-3 flex flex-wrap items-center justify-between gap-2" data-pagefind-ignore>
			<button
				type="button"
				class="btn-secondary"
				onclick={() => {
					if (!playing && step === phases.length - 1) step = 0;
					playing = !playing;
				}}
			>
				{#if playing}
					<IconPause class="size-4" aria-hidden="true" />{m.pause()}
				{:else}
					<IconPlay class="size-4" aria-hidden="true" />{m.play()}
				{/if}
			</button>
			<ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
				<li class="flex items-center gap-1.5">
					<span class="size-3 rounded-full bg-accent"></span>{m.legend_you()}
				</li>
				<li class="flex items-center gap-1.5">
					<span class="size-3 rounded-full bg-libero"></span>{m.role_l()}
				</li>
				<li class="flex items-center gap-1.5">
					<svg viewBox="-0.25 -0.25 0.5 0.5" class="size-3" aria-hidden="true">
						<circle r="0.2" class="fill-paper stroke-ink" stroke-width="0.06" />
					</svg>{m.legend_setter()}
				</li>
				<li class="flex items-center gap-1.5">
					<span class="h-0 w-4 border-t-2 border-dashed border-ink-soft"></span>{m.legend_run()}
				</li>
			</ul>
		</div>

		{#if phase === 'receive' && passerCount < options.formation && o.system !== '6-6'}
			<p class="card mt-3 text-sm">{m.passers_fewer({ n: passerCount })}</p>
		{/if}

		{#if phase === 'defense'}
			<div class="mt-4" data-pagefind-ignore>
				<ChipGroup
					legend={m.label_attack_from()}
					options={ATTACKS_FROM.map((a) => ({ value: a, label: attackFromName(a) }))}
					bind:value={() => o.attackFrom, (attackFrom) => update({ attackFrom })}
				/>
			</div>
		{/if}
	</div>

	<section aria-live="polite" class="min-w-0">
		<p class="eyebrow">{phaseName(phase)} · {rotationLabel(o.rotation, o.system)}</p>
		<h2 class="mt-1 text-2xl font-bold tracking-tight">{explanation.task}</h2>
		<p class="mt-1 text-ink-soft">{phaseDescription(phase, o.serving)}</p>

		<dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
			<div class="card">
				<dt class="eyebrow">{m.your_zone()}</dt>
				<dd class="mt-1 text-2xl font-bold">{yourZone ?? '–'}</dd>
			</div>
			<div class="card">
				<dt class="eyebrow">{m.your_row()}</dt>
				<dd class="mt-1 text-lg font-semibold">
					{yourZone ? (isFront(yourZone) ? m.row_front() : m.row_back()) : '–'}
				</dd>
			</div>
			{#if you && o.system !== '6-6'}
				<div class="card col-span-2 sm:col-span-1">
					<dt class="eyebrow">{m.your_spot()}</dt>
					<dd class="mt-1 text-lg font-semibold">{slotName(you.slot)}</dd>
				</div>
			{/if}
		</dl>

		<p class="mt-5 text-lg">{explanation.detail}</p>
		<details class="mt-4" open>
			<summary class="flex min-h-11 cursor-pointer items-center font-semibold">
				{m.more_detail()}
			</summary>
			<ul class="mt-2 list-disc space-y-2 pl-5">
				{#each explanation.tips as tip (tip)}
					<li>{tip}</li>
				{/each}
			</ul>
		</details>
		<p class="mt-6 text-sm text-ink-soft">
			{m.learn_more()}
			<a class="text-accent underline" href={href('/guides/rotations')}
				>{m.guide_rotations_link()}</a
			>,
			<a class="text-accent underline" href={href('/guides/overlap')}>{m.guide_overlap_link()}</a>,
			<a class="text-accent underline" href={href('/guides/defense')}>{m.guide_defense_link()}</a>.
		</p>
	</section>
</div>

<section class="mt-12" data-pagefind-ignore>
	<h2 class="text-2xl font-bold tracking-tight">{m.all_rotations({ phase: phaseName(phase) })}</h2>
	<p class="mt-1 text-ink-soft">{m.all_rotations_lead()}</p>
	<ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
		{#each ROTATIONS as r (r)}
			{@const at = formation({ ...options, rotation: r }, phase)}
			{@const z = role === 'L' ? at.find((p) => p.role === 'L')?.zone : zoneOf(o.system, r, role)}
			<li>
				<button
					type="button"
					class="card block w-full p-2 text-left transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:ring-2 aria-pressed:ring-accent"
					aria-pressed={r === o.rotation}
					onclick={() => update({ rotation: r })}
				>
					<span class="block px-1 pb-1 text-sm font-semibold">{rotationLabel(r, o.system)}</span>
					<FormationCourt
						placed={at}
						you={role}
						runs={false}
						zones={false}
						label={m.court_label({
							phase: phaseName(phase),
							rotation: rotationLabel(r, o.system),
							you: roleInSentence(role)
						})}
					/>
					<span class="block px-1 pt-1 text-xs text-ink-soft">
						{z
							? m.zone_row({ zone: zoneRef(z), row: isFront(z) ? m.row_front() : m.row_back() })
							: m.off_court()}
					</span>
				</button>
			</li>
		{/each}
	</ul>
</section>
