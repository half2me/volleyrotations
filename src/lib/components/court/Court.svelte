<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SVGAttributes } from 'svelte/elements';

	/**
	 * Our half of a court in metres, seen from behind our end line with the net at the top, plus
	 * a strip of the opponent's side and the service zone. Draw players and marks as children, in
	 * the same metre coordinates.
	 */
	let {
		label,
		zones = true,
		serviceZone = true,
		children,
		...rest
	}: {
		/** What the diagram shows, for screen readers. */
		label: string;
		/** Faint zone numbers 1–6. */
		zones?: boolean;
		/** Room behind the end line for a server. */
		serviceZone?: boolean;
		children?: Snippet;
	} & Omit<SVGAttributes<SVGSVGElement>, 'children'> = $props();

	const bottom = $derived(serviceZone ? 11 : 9.6);
	const ZONE_LABELS = [
		{ zone: 4, x: 1.5, y: 1.9 },
		{ zone: 3, x: 4.5, y: 1.9 },
		{ zone: 2, x: 7.5, y: 1.9 },
		{ zone: 5, x: 1.5, y: 6.3 },
		{ zone: 6, x: 4.5, y: 6.3 },
		{ zone: 1, x: 7.5, y: 6.3 }
	];
</script>

<svg
	viewBox="-1 -1.3 11 {bottom + 1.3}"
	role="img"
	aria-label={label}
	class="block h-auto w-full touch-none select-none"
	{...rest}
>
	<!-- Opponent strip and our court -->
	<rect x="-1" y="-1.3" width="11" height={bottom + 1.3} class="fill-paper" />
	<rect x="0" y="-1.3" width="9" height="1.3" class="fill-court opacity-50" />
	<rect x="0" y="0" width="9" height="9" class="fill-court" />
	<rect x="0" y="0" width="9" height="3" class="fill-court-front" />
	{#if zones}
		{#each ZONE_LABELS as z (z.zone)}
			<text
				x={z.x}
				y={z.y}
				text-anchor="middle"
				dominant-baseline="middle"
				class="fill-ink opacity-15"
				font-size="1.6"
				font-weight="700"
				aria-hidden="true">{z.zone}</text
			>
		{/each}
	{/if}
	<g class="stroke-court-line" stroke-width="0.05" fill="none">
		<rect x="0" y="0" width="9" height="9" />
		<line x1="0" y1="3" x2="9" y2="3" />
		<line x1="0" y1="-1.3" x2="0" y2="0" />
		<line x1="9" y1="-1.3" x2="9" y2="0" />
	</g>
	<!-- Net and antennae -->
	<line x1="-0.5" y1="0" x2="9.5" y2="0" class="stroke-ink" stroke-width="0.14" />
	<line x1="0" y1="-0.5" x2="0" y2="0.1" class="stroke-bad" stroke-width="0.1" />
	<line x1="9" y1="-0.5" x2="9" y2="0.1" class="stroke-bad" stroke-width="0.1" />

	{@render children?.()}
</svg>
