<script lang="ts">
	import Sprite, { FIGURES, type FigureId } from '#lib/components/figure/Sprite.svelte';
	import type { Signal } from '#lib/signals.js';

	/**
	 * A referee acting out a signal: the pre-rendered 3D figure for the signal's id (see
	 * scripts/figures/poses.mjs). The figure is decorative; the written gesture beside it is the
	 * authority and the accessible text.
	 */
	let { signal }: { signal: Signal } = $props();

	const id = $derived((signal.id in FIGURES ? signal.id : 'team-to-serve') as FigureId);
</script>

<Sprite {id} />
