<script lang="ts">
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { DEFAULT_OPTIONS, formation, type Options, type Phase } from '#lib/volley/formations.js';
	import { phaseName, roleName, rotationLabel, systemName } from '#lib/volley/labels.js';
	import type { RoleId, RotationNo, SystemId } from '#lib/volley/model.js';
	import GuideFigure from './GuideFigure.svelte';

	/**
	 * One computed moment of a rally for a guide, drawn with the same model as the explorer. Any
	 * other formation option (`formation`, `defense`, `attackFrom`, `incoming`, `setTo`, …) can
	 * be passed through.
	 */
	let {
		system = '5-1',
		rotation = 1,
		phase = 'receive',
		you,
		caption,
		runs = true,
		zones = true,
		area = false,
		...options
	}: {
		system?: SystemId;
		rotation?: RotationNo;
		phase?: Phase;
		/** The player the text is about, ringed on the court. */
		you?: RoleId;
		caption: string;
		runs?: boolean;
		zones?: boolean;
		area?: boolean;
	} & Partial<Omit<Options, 'system' | 'rotation'>> = $props();

	// The serve, base and defense moments belong to the serving team; attack and cover follow
	// serve receive unless the guide says otherwise.
	const placed = $derived(
		formation(
			{
				...DEFAULT_OPTIONS,
				serving: phase === 'serve' || phase === 'base' || phase === 'defense',
				...options,
				system,
				rotation
			},
			phase
		)
	);

	const label = $derived(
		you
			? m.court_label({
					phase: phaseName(phase),
					rotation: rotationLabel(rotation, system),
					you: roleName(you)
				})
			: m.figure_label({
					system: systemName(system),
					phase: phaseName(phase),
					rotation: rotationLabel(rotation, system)
				})
	);
</script>

<GuideFigure {caption}>
	<FormationCourt {placed} {you} {runs} {zones} {area} {label} />
</GuideFigure>
