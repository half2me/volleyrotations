<script lang="ts">
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { DEFAULT_OPTIONS, formation, type Options, type Phase } from '#lib/volley/formations.js';
	import { phaseName, rotationLabel, systemName } from '#lib/volley/labels.js';
	import { ROTATIONS, type RoleId, type SystemId } from '#lib/volley/model.js';
	import GuideFigure from './GuideFigure.svelte';

	/** All six rotations of a system side by side, each as a small court. */
	let {
		system = '5-1',
		phase = 'receive',
		you,
		caption,
		...options
	}: {
		system?: SystemId;
		phase?: Phase;
		/** The player the text is about, ringed on every court. */
		you?: RoleId;
		caption: string;
	} & Partial<Omit<Options, 'system' | 'rotation'>> = $props();

	const courts = $derived(
		ROTATIONS.map((rotation) => ({
			rotation,
			placed: formation({ ...DEFAULT_OPTIONS, ...options, system, rotation }, phase)
		}))
	);
</script>

<GuideFigure {caption} wide>
	<div
		role="group"
		aria-label={m.figure_rotations_label({ system: systemName(system), phase: phaseName(phase) })}
		class="not-prose grid grid-cols-2 gap-3 sm:grid-cols-3"
	>
		{#each courts as { rotation, placed } (rotation)}
			<div class="card p-2">
				<p class="px-1 pb-1 text-sm font-semibold">{rotationLabel(rotation, system)}</p>
				<FormationCourt
					{placed}
					{you}
					runs={false}
					label="{phaseName(phase)}, {rotationLabel(rotation, system)}"
				/>
			</div>
		{/each}
	</div>
</GuideFigure>
