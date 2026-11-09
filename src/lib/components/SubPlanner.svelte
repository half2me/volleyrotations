<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { memberLabel, type Team } from '#lib/teams.svelte.js';
	import { roleName, rotationLabel } from '#lib/volley/labels.js';
	import { leagueOf } from '#lib/volley/leagues.js';
	import {
		EMPTY_PLAN,
		planFaults,
		planSubCount,
		type PlanFault,
		type SpecialistPlan,
		type SubPlan
	} from '#lib/volley/match.js';
	import {
		ROTATIONS,
		isFront,
		rolesOf,
		zoneOf,
		type RoleId,
		type RotationNo
	} from '#lib/volley/model.js';
	import IconPlus from '~icons/lucide/plus';
	import IconTrash from '~icons/lucide/trash-2';

	/** Where a coach plans a double switch and defensive specialists for the match tracker. */
	let { team, save }: { team: Team; save: (patch: Partial<Team>) => void } = $props();

	const plan = $derived(team.plan ?? EMPTY_PLAN);
	const max = $derived(leagueOf(team.league).subsPerSet);
	const faults = $derived(
		planFaults(plan, { system: team.system, benchSize: team.bench.length, league: team.league })
	);
	const courtRoles = $derived(rolesOf(team.system, false));
	/** Rotations with the 5-1 setter in the front row, where a double switch makes sense. */
	const frontRotations = ROTATIONS.filter((r) => isFront(zoneOf('5-1', r, 'S')!));

	const starter = (role: RoleId) => memberLabel(team.players[role], roleName(role));
	const bench = (i: number) => memberLabel(team.bench[i], m.match_bench_n({ n: i + 1 }));

	function setPlan(next: SubPlan) {
		save({ plan: planSubCount(next) === 0 ? undefined : next });
	}

	function setSpecialist(i: number, patch: Partial<SpecialistPlan>) {
		setPlan({
			...plan,
			specialists: plan.specialists.map((sp, j) => (j === i ? { ...sp, ...patch } : sp))
		});
	}

	function toggleRotation(i: number, r: RotationNo) {
		const sp = plan.specialists[i];
		const rotations = sp.rotations.includes(r)
			? sp.rotations.filter((x) => x !== r)
			: [...sp.rotations, r].sort((a, b) => a - b);
		setSpecialist(i, { rotations });
	}

	/** A bench index not yet in the plan, so a new entry does not clash with an existing one. */
	const freeBench = () => {
		const used = new Set([
			...plan.specialists.map((sp) => sp.bench),
			...(plan.doubleSwitch ? [plan.doubleSwitch.forSetter, plan.doubleSwitch.forOpposite] : [])
		]);
		return team.bench.findIndex((_, i) => !used.has(i));
	};

	function addDoubleSwitch() {
		const a = Math.max(freeBench(), 0);
		const b = team.bench.findIndex((_, i) => i !== a);
		setPlan({
			...plan,
			doubleSwitch: { rotation: 4, forSetter: a, forOpposite: b === -1 ? a : b }
		});
	}

	function addSpecialist() {
		const used = new Set(plan.specialists.map((sp) => sp.for));
		const role = courtRoles.find((r) => !used.has(r) && r !== 'S' && r !== 'OPP') ?? courtRoles[0];
		setPlan({
			...plan,
			specialists: [
				...plan.specialists,
				{ for: role, bench: Math.max(freeBench(), 0), rotations: [] }
			]
		});
	}

	const FAULT: Record<PlanFault, () => string> = {
		'double-switch-system': m.plan_fault_double_switch_system,
		'double-switch-row': m.plan_fault_double_switch_row,
		'same-bench': m.plan_fault_same_bench,
		'missing-bench': m.plan_fault_missing_bench,
		'no-rotations': m.plan_fault_no_rotations,
		'not-contiguous': m.plan_fault_not_contiguous,
		'starter-twice': m.plan_fault_starter_twice,
		'bench-twice': m.plan_fault_bench_twice,
		'too-many': () => m.plan_fault_too_many({ max })
	};
	const id = $props.id();
</script>

{#snippet benchSelect(label: string, value: number, onchange: (i: number) => void)}
	<label class="block min-w-0">
		<span class="eyebrow">{label}</span>
		<select class="field mt-1" {value} onchange={(e) => onchange(Number(e.currentTarget.value))}>
			{#each team.bench as _, i (i)}
				<option value={i}>{bench(i)}</option>
			{/each}
		</select>
	</label>
{/snippet}

<section class="card" aria-labelledby="{id}-heading">
	<h2 id="{id}-heading" class="text-xl font-bold">{m.plan_title()}</h2>
	<p class="mt-1 text-sm text-ink-soft">{m.plan_help()}</p>

	<h3 class="mt-5 font-semibold">{m.plan_double_switch()}</h3>
	<p class="mt-1 text-sm text-ink-soft">{m.plan_double_switch_help()}</p>
	{#if plan.doubleSwitch}
		{@const ds = plan.doubleSwitch}
		<div class="mt-3 space-y-3">
			<ChipGroup
				legend={m.plan_ds_rotation()}
				options={frontRotations.map((r) => ({ value: r, label: rotationLabel(r, '5-1') }))}
				bind:value={
					() => ds.rotation, (rotation) => setPlan({ ...plan, doubleSwitch: { ...ds, rotation } })
				}
			/>
			<div class="grid gap-3 sm:grid-cols-2">
				{@render benchSelect(m.plan_for({ name: starter('S') }), ds.forSetter, (forSetter) =>
					setPlan({ ...plan, doubleSwitch: { ...ds, forSetter } })
				)}
				{@render benchSelect(m.plan_for({ name: starter('OPP') }), ds.forOpposite, (forOpposite) =>
					setPlan({ ...plan, doubleSwitch: { ...ds, forOpposite } })
				)}
			</div>
			<button
				type="button"
				class="btn-secondary"
				onclick={() => setPlan({ ...plan, doubleSwitch: undefined })}
			>
				<IconTrash class="size-4" aria-hidden="true" />{m.plan_remove()}
			</button>
		</div>
	{:else if team.system !== '5-1'}
		<p class="mt-2 text-sm">{m.plan_double_switch_only_51()}</p>
	{:else if team.bench.length < 2}
		<p class="mt-2 text-sm">{m.plan_no_bench()}</p>
	{:else}
		<button type="button" class="btn-secondary mt-3" onclick={addDoubleSwitch}>
			<IconPlus class="size-4" aria-hidden="true" />{m.plan_enable()}
		</button>
	{/if}

	<h3 class="mt-6 font-semibold">{m.plan_specialists()}</h3>
	<p class="mt-1 text-sm text-ink-soft">{m.plan_specialists_help()}</p>
	<ul class="mt-3 space-y-4">
		{#each plan.specialists as sp, i (i)}
			<li class="rounded-xl border border-line p-3">
				<div class="grid gap-3 sm:grid-cols-2">
					<label class="block min-w-0">
						<span class="eyebrow">{m.plan_player_out()}</span>
						<select
							class="field mt-1"
							value={sp.for}
							onchange={(e) => setSpecialist(i, { for: e.currentTarget.value as RoleId })}
						>
							{#each courtRoles as role (role)}
								<option value={role}>{starter(role)}</option>
							{/each}
						</select>
					</label>
					{@render benchSelect(m.plan_player_in(), sp.bench, (bench) =>
						setSpecialist(i, { bench })
					)}
				</div>
				<fieldset class="mt-3">
					<legend class="eyebrow mb-2">{m.plan_rotations()}</legend>
					<div class="flex flex-wrap gap-2">
						{#each ROTATIONS as r (r)}
							<label class="chip" title={rotationLabel(r, team.system)}>
								<input
									type="checkbox"
									class="sr-only"
									checked={sp.rotations.includes(r)}
									onchange={() => toggleRotation(i, r)}
								/>
								{r}
							</label>
						{/each}
					</div>
				</fieldset>
				<button
					type="button"
					class="btn-ghost mt-2 -ml-3"
					onclick={() =>
						setPlan({ ...plan, specialists: plan.specialists.filter((_, j) => j !== i) })}
				>
					<IconTrash class="size-4" aria-hidden="true" />{m.plan_remove()}
				</button>
			</li>
		{/each}
	</ul>
	{#if team.bench.length === 0}
		<p class="mt-2 text-sm">{m.plan_no_bench()}</p>
	{:else}
		<button type="button" class="btn-secondary mt-3" onclick={addSpecialist}>
			<IconPlus class="size-4" aria-hidden="true" />{m.plan_add_specialist()}
		</button>
	{/if}

	<p class="mt-4 text-sm {planSubCount(plan) > max ? 'font-semibold' : 'text-ink-soft'}">
		{m.plan_count({ used: planSubCount(plan), max })}
	</p>
	{#if faults.length}
		<ul class="mt-2 space-y-1 text-sm" aria-live="polite">
			{#each faults as f (f)}
				<li class="flex gap-2">
					<span class="text-accent" aria-hidden="true">!</span><span>{FAULT[f]()}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
