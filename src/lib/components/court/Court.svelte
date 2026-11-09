<script lang="ts">
	import type { Sport } from '#lib/volley/match.js';
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
		sport = 'indoor',
		far = 1.3,
		children,
		...rest
	}: {
		/** What the diagram shows, for screen readers. */
		label: string;
		/** Faint zone numbers 1–6 (indoor only). */
		zones?: boolean;
		/** Room behind the end line for a server. */
		serviceZone?: boolean;
		/** A sand court is 8 m square with no attack line. */
		sport?: Sport;
		/** How many metres of the opponents' side to show; their whole half is 9 (8 on sand). */
		far?: number;
		children?: Snippet;
	} & Omit<SVGAttributes<SVGSVGElement>, 'children'> = $props();

	const size = $derived(sport === 'beach' ? 8 : 9);
	const bottom = $derived(serviceZone ? size + 2 : size + 0.6);
	/* The drawing is always 11 m wide, so a sand court renders at the same scale as a hall. */
	const left = $derived(-(11 - size) / 2);
	const floor = $derived(sport === 'beach' ? 'fill-sand' : 'fill-court');
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
	viewBox="{left} {-far} 11 {bottom + far}"
	role="img"
	aria-label={label}
	class="block h-auto w-full touch-none select-none"
	{...rest}
>
	<!-- Opponent side and our court -->
	<rect x={left} y={-far} width="11" height={bottom + far} class="fill-paper" />
	<rect
		x="0"
		y={-Math.min(far, size)}
		width={size}
		height={Math.min(far, size)}
		class={[floor, 'opacity-50']}
	/>
	{#if sport === 'indoor' && far > 3}
		<rect x="0" y="-3" width="9" height="3" class="fill-court-front opacity-50" />
	{/if}
	<rect x="0" y="0" width={size} height={size} class={floor} />
	{#if sport === 'indoor'}
		<rect x="0" y="0" width="9" height="3" class="fill-court-front" />
	{/if}
	{#if zones && sport === 'indoor'}
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
		<rect x="0" y="0" width={size} height={size} />
		{#if sport === 'indoor'}
			<line x1="0" y1="3" x2="9" y2="3" />
			{#if far > 3}<line x1="0" y1="-3" x2="9" y2="-3" />{/if}
		{/if}
		<line x1="0" y1={-Math.min(far, size)} x2="0" y2="0" />
		<line x1={size} y1={-Math.min(far, size)} x2={size} y2="0" />
		{#if far >= size}<line x1="0" y1={-size} x2={size} y2={-size} />{/if}
	</g>
	<!-- Net and antennae -->
	<line x1="-0.5" y1="0" x2={size + 0.5} y2="0" class="stroke-ink" stroke-width="0.14" />
	<line x1="0" y1="-0.5" x2="0" y2="0.1" class="stroke-bad" stroke-width="0.1" />
	<line x1={size} y1="-0.5" x2={size} y2="0.1" class="stroke-bad" stroke-width="0.1" />

	{@render children?.()}
</svg>
