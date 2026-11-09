<script lang="ts">
	import { SPECS } from '#lib/equipment.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { Sport } from '#lib/volley/match.js';
	import { cubicInOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/**
	 * Both halves of the court from above, to scale in metres, with the 3 m minimum free zone.
	 * Switching sport grows or shrinks the court in place, and the other sport's court stays as a
	 * dashed outline so the difference is visible at a glance.
	 */
	let { sport }: { sport: Sport } = $props();

	const spec = $derived(SPECS[sport]);
	const other = $derived(SPECS[sport === 'beach' ? 'indoor' : 'beach']);
	const opts = () => ({ duration: prefersReducedMotion.current ? 0 : 700, easing: cubicInOut });
	const size = new Tween({ ...SPECS.indoor.court }, opts());
	const lines = new Tween(1, opts());
	$effect(() => {
		size.set(spec.court, opts());
		lines.set(sport === 'indoor' ? 1 : 0, opts());
	});

	// The drawing is centred on the middle of an 18 × 9 m court with room for the free zone.
	const CX = 9;
	const CY = 4.5;
	const x0 = $derived(CX - size.current.length / 2);
	const y0 = $derived(CY - size.current.width / 2);
	const free = $derived(spec.freeZone.min);
	const fmt = (n: number) => n.toLocaleString(m.number_locale(), { maximumFractionDigits: 1 });
	const surface = $derived(sport === 'beach' ? 'fill-sand' : 'fill-court');
</script>

<svg
	viewBox="-4.2 -4.6 26.4 18.6"
	class="w-full"
	role="img"
	aria-label={m.equipment_court_label({
		length: fmt(spec.court.length),
		width: fmt(spec.court.width)
	})}
>
	<!-- Free zone (minimum) -->
	<rect
		x={x0 - free}
		y={y0 - free}
		width={size.current.length + 2 * free}
		height={size.current.width + 2 * free}
		rx="0.3"
		class={sport === 'beach' ? 'fill-sand-deep' : 'fill-free'}
	/>
	<!-- Service zones behind each end line, as wide as the court -->
	<g class="fill-ink" opacity="0.06">
		<rect x={x0 - free} y={y0} width={free} height={size.current.width} />
		<rect x={x0 + size.current.length} y={y0} width={free} height={size.current.width} />
	</g>
	<!-- Court -->
	<rect x={x0} y={y0} width={size.current.length} height={size.current.width} class={surface} />
	{#if lines.current > 0.01}
		<g opacity={lines.current}>
			<rect x={CX - 3} y={y0} width="3" height={size.current.width} class="fill-court-front" />
			<rect x={CX} y={y0} width="3" height={size.current.width} class="fill-court-front" />
		</g>
	{/if}
	<g class="stroke-court-line" fill="none" stroke-width="0.1">
		<rect x={x0} y={y0} width={size.current.length} height={size.current.width} />
		<g opacity={lines.current}>
			<line x1={CX} y1={y0} x2={CX} y2={y0 + size.current.width} />
			<line x1={CX - 3} y1={y0} x2={CX - 3} y2={y0 + size.current.width} />
			<line x1={CX + 3} y1={y0} x2={CX + 3} y2={y0 + size.current.width} />
		</g>
	</g>
	<!-- The net, posts outside the side lines -->
	<line
		x1={CX}
		y1={y0 - 1}
		x2={CX}
		y2={y0 + size.current.width + 1}
		class="stroke-net"
		stroke-width="0.12"
	/>
	<circle cx={CX} cy={y0 - 1} r="0.22" class="fill-net" />
	<circle cx={CX} cy={y0 + size.current.width + 1} r="0.22" class="fill-net" />
	<!-- The other sport's court, for comparison -->
	<rect
		x={CX - other.court.length / 2}
		y={CY - other.court.width / 2}
		width={other.court.length}
		height={other.court.width}
		fill="none"
		class="stroke-ink"
		stroke-width="0.07"
		stroke-dasharray="0.3 0.25"
		opacity="0.55"
	/>

	<!-- Dimensions -->
	<g class="fill-ink stroke-ink" font-size="0.85" font-weight="600">
		<g stroke-width="0.05">
			<line
				x1={x0}
				y1={y0 + size.current.width + 1.9}
				x2={x0 + size.current.length}
				y2={y0 + size.current.width + 1.9}
			/>
			<line x1={x0} y1={y0 + size.current.width + 1.6} x2={x0} y2={y0 + size.current.width + 2.2} />
			<line
				x1={x0 + size.current.length}
				y1={y0 + size.current.width + 1.6}
				x2={x0 + size.current.length}
				y2={y0 + size.current.width + 2.2}
			/>
			<line x1={x0 - 1.9} y1={y0} x2={x0 - 1.9} y2={y0 + size.current.width} />
			<line x1={x0 - 2.2} y1={y0} x2={x0 - 1.6} y2={y0} />
			<line x1={x0 - 2.2} y1={y0 + size.current.width} x2={x0 - 1.6} y2={y0 + size.current.width} />
		</g>
		<text x={CX} y={y0 + size.current.width + 3.2} text-anchor="middle" stroke="none"
			>{fmt(size.current.length)} m</text
		>
		<text
			x={x0 - 2.5}
			y={CY}
			text-anchor="middle"
			stroke="none"
			transform="rotate(-90 {x0 - 2.5} {CY})">{fmt(size.current.width)} m</text
		>
		{#if lines.current > 0.5}
			<text x={CX + 1.5} y={y0 - 0.35} text-anchor="middle" stroke="none" font-size="0.7">3 m</text>
		{/if}
		<text x={CX} y={y0 - 1.6} text-anchor="middle" stroke="none" font-size="0.7"
			>{m.equipment_net()}</text
		>
		<text x={x0 - free + 0.3} y={y0 - free + 0.85} stroke="none" font-size="0.65" font-weight="500"
			>{m.equipment_free_zone({ m: fmt(free) })}</text
		>
	</g>
</svg>
