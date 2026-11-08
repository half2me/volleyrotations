<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import DragCourt from '#lib/components/court/DragCourt.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { teamPlaybook, type Team } from '#lib/teams.svelte.js';
	import { DEFAULT_OPTIONS, byZone, formation, formationOf } from '#lib/volley/formations.js';
	import { leagueName, roleName, rotationLabel, roleRef, zoneRef } from '#lib/volley/labels.js';
	import { LEAGUE_IDS, leagueOf } from '#lib/volley/leagues.js';
	import {
		LINEUP_ORDERS,
		ROLE_KIND,
		ROTATIONS,
		SYSTEM,
		rolesOf,
		type Point,
		type RoleId,
		type RotationNo,
		type Zone
	} from '#lib/volley/model.js';
	import { overlapFaults } from '#lib/volley/overlap.js';
	import IconCheck from '~icons/lucide/circle-check';
	import IconRotate from '~icons/lucide/rotate-ccw';
	import IconSave from '~icons/lucide/save';
	import IconX from '~icons/lucide/circle-x';

	/** A team's playbook: the league, the lineup choices and its own serve-receive positions. */
	let {
		team,
		save,
		names
	}: {
		team: Team;
		save: (patch: Partial<Team>) => void;
		names: Partial<Record<RoleId, string>>;
	} = $props();

	const league = $derived(leagueOf(team.league));
	const middles = $derived(rolesOf(team.system, false).filter((r) => ROLE_KIND[r] === 'middle'));

	let rotation: RotationNo = $state(1);
	const options = $derived({ ...DEFAULT_OPTIONS, ...teamPlaybook(team), rotation });
	const placed = $derived(formation(options, 'receive'));
	const court = $derived(
		placed.map(({ role, zone, slot, replaces }) => ({ role, zone, slot, replaces }))
	);
	const saved = $derived(team.custom?.[rotation]);

	// A new rotation, formation or saved layout starts the draft again from what the team uses.
	let draft: Record<Zone, Point> = $derived(byZone(placed));

	const faults = $derived(overlapFaults(draft));
	const changed = $derived(
		Object.entries(draft).some(([z, p]) => {
			const q = placed.find((pl) => pl.zone === Number(z));
			return !q || Math.hypot(q.x - p.x, q.y - p.y) > 0.01;
		})
	);
	const who = (z: Zone) => {
		const p = placed.find((c) => c.zone === z)!;
		return m.player_in_zone({ name: roleRef(p.role), zone: zoneRef(z) });
	};

	function savePositions() {
		if (faults.length) return;
		const round = (n: number) => Math.round(n * 100) / 100;
		const at = Object.fromEntries(
			Object.entries(draft).map(([z, p]) => [z, { x: round(p.x), y: round(p.y) }])
		) as Record<Zone, Point>;
		save({ custom: { ...team.custom, [rotation]: at } });
	}

	function resetPositions() {
		const custom = { ...team.custom };
		delete custom[rotation];
		save({ custom });
	}

	function setFormation(f: 3 | 4 | 5) {
		// Positions saved for another formation would put the wrong players in the passing line.
		const custom = { ...team.custom };
		delete custom[rotation];
		save({ formationBy: { ...team.formationBy, [rotation]: f }, custom });
	}
</script>

<section class="card space-y-5" aria-labelledby="playbook-heading">
	<div>
		<h2 id="playbook-heading" class="text-xl font-bold">{m.playbook_title()}</h2>
		<p class="mt-1 text-sm text-ink-soft">{m.playbook_help()}</p>
	</div>
	<div>
		<ChipGroup
			legend={m.label_league()}
			options={LEAGUE_IDS.map((l) => ({ value: l, label: leagueName(l) }))}
			bind:value={() => team.league ?? 'fivb', (l) => save({ league: l })}
		/>
		<p class="mt-2 text-sm text-ink-soft">{m.league_help()}</p>
	</div>
	{#if team.system !== '6-6'}
		<div class="grid gap-5 sm:grid-cols-2">
			<div>
				<ChipGroup
					legend={m.label_order()}
					options={LINEUP_ORDERS.map((v) => ({
						value: v,
						label: v === 'oh-first' ? m.order_oh_first() : m.order_mb_first()
					}))}
					bind:value={
						() => team.order ?? 'oh-first',
						(order) => save({ order, custom: undefined, liberoServesFor: undefined })
					}
				/>
				<p class="mt-2 text-sm text-ink-soft">{m.order_help()}</p>
			</div>
			<ChipGroup
				legend={m.label_libero_zone()}
				options={[
					{ value: 5, label: m.libero_zone_5() },
					{ value: 6, label: m.libero_zone_6() }
				]}
				bind:value={() => team.liberoZone ?? 5, (liberoZone) => save({ liberoZone })}
			/>
			<div>
				<ChipGroup
					legend={m.label_keep_sides()}
					options={[
						{ value: true, label: m.keep_sides_yes() },
						{ value: false, label: m.keep_sides_no() }
					]}
					bind:value={() => team.keepSides ?? true, (keepSides) => save({ keepSides })}
				/>
				<p class="mt-2 text-sm text-ink-soft">{m.keep_sides_help()}</p>
			</div>
			{#if team.libero && league.liberoServes}
				<ChipGroup
					legend={m.label_libero_serves()}
					options={[
						{ value: '', label: m.libero_serves_none() },
						...middles.map((r) => ({ value: r, label: roleName(r) }))
					]}
					bind:value={
						() => team.liberoServesFor ?? '',
						(r) => save({ liberoServesFor: (r || undefined) as RoleId | undefined })
					}
				/>
			{/if}
		</div>
	{/if}

	<div class="border-t border-line pt-5">
		<h3 class="font-semibold">{m.playbook_receive()}</h3>
		<p class="mt-1 text-sm text-ink-soft">{m.playbook_receive_help()}</p>
		<div class="mt-3 grid gap-4 sm:grid-cols-2">
			<ChipGroup
				legend={m.label_rotation()}
				options={ROTATIONS.map((r) => ({
					value: r,
					label: team.custom?.[r] ? `${r}*` : String(r)
				}))}
				bind:value={() => rotation, (r) => (rotation = r)}
			/>
			{#if SYSTEM[team.system].receiveFormations.length > 1}
				<ChipGroup
					legend={m.label_formation()}
					options={SYSTEM[team.system].receiveFormations.map((f) => ({
						value: f,
						label: m.formation_n({ n: f })
					}))}
					bind:value={() => formationOf(options), setFormation}
				/>
			{/if}
		</div>
		<div class="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,20rem)_1fr]">
			<div>
				<DragCourt
					{court}
					bind:positions={draft}
					{faults}
					{names}
					keysId="playbook-keys"
					label={m.overlap_court_label({ rotation: rotationLabel(rotation, team.system) })}
				/>
				<p id="playbook-keys" class="mt-2 text-sm text-ink-soft">{m.overlap_keys()}</p>
			</div>
			<div aria-live="polite">
				{#if faults.length === 0}
					<p class="flex items-center gap-2 font-semibold text-good">
						<IconCheck class="size-5" aria-hidden="true" />{m.overlap_legal()}
					</p>
				{:else}
					<p class="flex items-center gap-2 font-semibold text-bad">
						<IconX class="size-5" aria-hidden="true" />{m.overlap_fault_count({
							count: faults.length
						})}
					</p>
					<ul class="mt-2 space-y-1 text-sm">
						{#each faults as f (`${f.a}-${f.b}`)}
							<li>
								{f.kind === 'depth'
									? m.fault_depth({ back: who(f.b), front: who(f.a) })
									: m.fault_side({ left: who(f.a), right: who(f.b) })}
							</li>
						{/each}
					</ul>
				{/if}
				<p class="mt-2 text-sm text-ink-soft">
					{saved ? m.playbook_custom() : m.playbook_suggested()}
				</p>
				<div class="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						class="btn-primary"
						disabled={faults.length > 0 || !changed}
						onclick={savePositions}
					>
						<IconSave class="size-4" aria-hidden="true" />{m.playbook_save()}
					</button>
					<button
						type="button"
						class="btn-secondary"
						disabled={!saved && !changed}
						onclick={resetPositions}
					>
						<IconRotate class="size-4" aria-hidden="true" />{m.playbook_reset()}
					</button>
				</div>
			</div>
		</div>
	</div>
</section>
