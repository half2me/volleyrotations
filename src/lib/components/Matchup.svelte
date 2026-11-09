<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { roleName, roleShort, rotationLabel, settingZone, zoneRef } from '#lib/volley/labels.js';
	import { oppSetterZone, type MatchState } from '#lib/volley/match.js';
	import {
		FRONT_ZONES,
		isFront,
		rotateZone,
		rotationWithSetterIn,
		type RotationNo,
		type Zone
	} from '#lib/volley/model.js';

	/**
	 * Our rotation against the opponents': both front rows, with each setter marked. Their players
	 * are known by the zone they stand in, or by the names the coach enters in service order.
	 */
	let {
		match,
		ours,
		names = [],
		onRotation,
		onNames
	}: {
		match: MatchState;
		/** Who stands in each of our zones now. */
		ours: { zone: Zone; label: string; setter: boolean }[];
		/** Their players in service order, the setter first; empty strings for the unknown. */
		names?: string[];
		onRotation: (rotation: RotationNo | undefined) => void;
		onNames: (names: string[]) => void;
	} = $props();

	const theirSetterZone = $derived(oppSetterZone(match));
	const ourSetterZone = $derived(settingZone(match.rotation, match.system));

	/** The service-order slot (0 is the setter) standing in a zone of theirs now. */
	const slotIn = (zone: Zone, rotation: RotationNo) =>
		[0, 1, 2, 3, 4, 5].find((i) => rotateZone((i + 1) as Zone, rotation - 1) === zone)!;

	const theirs = $derived(
		match.oppRotation === undefined
			? []
			: [...FRONT_ZONES].reverse().map((zone) => {
					const slot = slotIn(zone, match.oppRotation!);
					return {
						zone,
						label: names[slot]?.trim() || (slot === 0 ? roleShort('S') : '—'),
						setter: slot === 0
					};
				})
	);
	const ourFront = $derived(
		FRONT_ZONES.map((z) => ours.find((p) => p.zone === z)!).filter(Boolean)
	);

	const slots = [0, 1, 2, 3, 4, 5];
	const slotLabel = (slot: number) =>
		slot === 0 ? roleName('S') : m.matchup_slot({ n: slot + 1 });

	function setName(slot: number, value: string) {
		const next = slots.map((i) => (i === slot ? value : (names[i] ?? '')));
		onNames(next);
	}

	const zoneChoices = [
		{ value: 0, label: m.opp_unknown() },
		...([1, 2, 3, 4, 5, 6] as Zone[]).map((z) => ({ value: z, label: String(z) }))
	];
</script>

{#snippet row(players: { zone: Zone; label: string; setter: boolean }[])}
	<ol class="grid grid-cols-3 gap-1.5">
		{#each players as p (p.zone)}
			<li
				class="min-w-0 rounded-xl border px-1.5 py-1.5 text-center {p.setter
					? 'border-accent'
					: 'border-line'}"
			>
				<span class="block text-xs text-ink-soft">{m.zone_n({ zone: zoneRef(p.zone) })}</span>
				<span class="block truncate text-sm font-semibold">{p.label}</span>
				{#if p.setter}<span class="block text-xs text-accent">{roleName('S')}</span>{/if}
			</li>
		{/each}
	</ol>
{/snippet}

<section class="card mt-4 min-w-0" aria-labelledby="matchup-heading">
	<h2 id="matchup-heading" class="font-bold">{m.matchup_title()}</h2>
	<div class="mt-3 space-y-4">
		<div>
			<p class="eyebrow mb-1.5">
				{m.matchup_us()} · {rotationLabel(match.rotation, match.system)}
			</p>
			{@render row(ourFront)}
			{#if match.system !== '6-6'}
				<p class="mt-1.5 text-xs text-ink-soft">
					{isFront(ourSetterZone)
						? m.matchup_setter_front({ zone: zoneRef(ourSetterZone) })
						: m.matchup_setter_back({ zone: zoneRef(ourSetterZone) })}
				</p>
			{/if}
		</div>
		<div>
			<p class="eyebrow mb-1.5">
				{m.matchup_them()}{#if match.oppRotation !== undefined}{' · '}{rotationLabel(
						match.oppRotation,
						'5-1'
					)}{/if}
			</p>
			{#if match.oppRotation !== undefined && theirSetterZone !== undefined}
				{@render row(theirs)}
				<p class="mt-1.5 text-xs text-ink-soft">
					{isFront(theirSetterZone)
						? m.matchup_setter_front({ zone: zoneRef(theirSetterZone) })
						: m.matchup_setter_back({ zone: zoneRef(theirSetterZone) })}
				</p>
			{:else}
				<p class="text-sm text-ink-soft">{m.matchup_unknown()}</p>
			{/if}
		</div>
		<ChipGroup
			legend={m.opp_setter_zone()}
			options={zoneChoices}
			bind:value={
				() => theirSetterZone ?? 0,
				(zone) => onRotation(zone ? rotationWithSetterIn(zone as Zone) : undefined)
			}
		/>
		<details class="group">
			<summary
				class="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium select-none"
			>
				<span class="transition-transform group-open:rotate-90" aria-hidden="true">›</span>
				{m.matchup_names()}
			</summary>
			<p class="mt-1 text-xs text-ink-soft">{m.matchup_names_help()}</p>
			<ul class="mt-2 space-y-2">
				{#each slots as slot (slot)}
					<li class="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-2">
						<label for="opp-slot-{slot}" class="truncate text-sm">{slotLabel(slot)}</label>
						<input
							id="opp-slot-{slot}"
							class="field"
							value={names[slot] ?? ''}
							onchange={(e) => setName(slot, e.currentTarget.value)}
						/>
					</li>
				{/each}
			</ul>
		</details>
	</div>
</section>
