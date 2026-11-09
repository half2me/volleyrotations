<script lang="ts">
	import Court from '#lib/components/court/Court.svelte';
	import PlayerToken from '#lib/components/court/PlayerToken.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { byZone, DEFAULT_OPTIONS, formation } from '#lib/volley/formations.js';
	import {
		roleName,
		roleRef,
		roleShort,
		rotationLabel,
		systemName,
		zoneRef
	} from '#lib/volley/labels.js';
	import {
		COLUMN_PAIRS,
		lineupOnCourt,
		ROW_ORDER,
		setterOf,
		type Point,
		type RoleId,
		type RotationNo,
		type SystemId,
		type Zone
	} from '#lib/volley/model.js';
	import { overlapFaults } from '#lib/volley/overlap.js';
	import IconCheck from '~icons/lucide/circle-check';
	import IconX from '~icons/lucide/circle-x';
	import GuideFigure from './GuideFigure.svelte';

	/**
	 * The receiving team at the moment of the serve with the rule 7.4 relations drawn between
	 * neighbours, as the overlap trainer does, but still. It starts from the computed 3-player
	 * receive; `moves` puts named zones elsewhere, which is how a guide shows a fault.
	 */
	let {
		system = '5-1',
		rotation = 1,
		moves = {},
		you,
		caption
	}: {
		system?: SystemId;
		rotation?: RotationNo;
		/** Positions in metres that replace the computed ones, by rotational zone. */
		moves?: Partial<Record<Zone, Point>>;
		/** The player the text is about, ringed on the court. */
		you?: RoleId;
		caption: string;
	} = $props();

	const options = $derived({
		...DEFAULT_OPTIONS,
		system,
		rotation,
		formation: system === '6-6' ? (5 as const) : (3 as const)
	});
	const court = $derived(lineupOnCourt(options));
	const positions = $derived({ ...byZone(formation(options, 'receive')), ...moves });
	const faults = $derived(overlapFaults(positions));
	const setter = $derived(setterOf(system, rotation));

	const relations = [...COLUMN_PAIRS, ...ROW_ORDER];
	const broken = (a: Zone, b: Zone) => faults.some((f) => f.a === a && f.b === b);
	const atFault = (z: Zone) => faults.some((f) => f.a === z || f.b === z);
	const who = (z: Zone) => {
		const p = court.find((c) => c.zone === z)!;
		return m.player_in_zone({ name: roleRef(p.role), zone: zoneRef(z) });
	};
</script>

<GuideFigure {caption}>
	<Court
		label={m.figure_overlap_label({
			rotation: rotationLabel(rotation, system),
			system: systemName(system)
		})}
		serviceZone={false}
	>
		{#each relations as [a, b] (`${a}-${b}`)}
			<line
				x1={positions[a].x}
				y1={positions[a].y}
				x2={positions[b].x}
				y2={positions[b].y}
				class={broken(a, b) ? 'stroke-bad' : 'stroke-good'}
				stroke-width={broken(a, b) ? 0.12 : 0.06}
				stroke-dasharray={broken(a, b) ? undefined : '0.2 0.15'}
			/>
		{/each}
		{#each court as p (p.zone)}
			{@const at = positions[p.zone]}
			<PlayerToken
				x={at.x}
				y={at.y}
				label={roleShort(p.role)}
				title={roleName(p.role)}
				kind={p.role === 'L' ? 'libero' : 'team'}
				you={p.role === you}
				setter={p.role === setter}
			/>
			{#if atFault(p.zone)}
				<circle cx={at.x} cy={at.y} r="0.6" class="fill-none stroke-bad" stroke-width="0.12" />
			{/if}
			<!-- The rotational zone, which is what the rule compares, next to each token. -->
			<text
				x={at.x}
				y={at.y + 0.9}
				text-anchor="middle"
				dominant-baseline="middle"
				font-size="0.36"
				font-weight="700"
				class="fill-ink"
				aria-hidden="true">{p.zone}</text
			>
		{/each}
	</Court>
	{#if faults.length === 0}
		<p class="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-good">
			<IconCheck class="size-5 shrink-0" aria-hidden="true" />
			{m.overlap_legal()}
		</p>
	{:else}
		<p class="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-bad">
			<IconX class="size-5 shrink-0" aria-hidden="true" />
			{m.overlap_fault_count({ count: faults.length })}
		</p>
		<ul class="not-prose mt-1 space-y-1 text-center text-sm text-ink-soft">
			{#each faults as f (`${f.a}-${f.b}`)}
				<li>
					{f.kind === 'depth'
						? m.fault_depth({ back: who(f.b), front: who(f.a) })
						: m.fault_side({ left: who(f.a), right: who(f.b) })}
				</li>
			{/each}
		</ul>
	{/if}
</GuideFigure>
