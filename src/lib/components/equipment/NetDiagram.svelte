<script lang="ts">
	import { SPECS } from '#lib/equipment.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { Sport } from '#lib/volley/match.js';
	import { cubicInOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/**
	 * The net seen from the side line, to scale in metres: posts, the 1 m net with its mesh and
	 * bands, the side bands above the side lines and the striped antennae. The net slides to the
	 * chosen height.
	 */
	let { sport, height }: { sport: Sport; height: number } = $props();

	const spec = $derived(SPECS[sport]);
	const opts = () => ({ duration: prefersReducedMotion.current ? 0 : 600, easing: cubicInOut });
	const h = new Tween(2.43, opts());
	const w = new Tween(9, opts());
	/** The net is drawn at the longest length its rules allow, which sets where its ends sit. */
	const n = new Tween(10, opts());
	$effect(() => {
		h.set(height, opts());
		w.set(spec.court.width, opts());
		n.set(spec.net.span[1], opts());
	});

	/** Ground level in drawing units; heights go up from it. */
	const G = 3.75;
	const y = (metres: number) => G - metres;
	const fmt = (n: number) =>
		n.toLocaleString(m.number_locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const top = $derived(y(h.current));
	const left = $derived(-w.current / 2);
	const right = $derived(w.current / 2);
	const netLeft = $derived(-n.current / 2);
	const netRight = $derived(n.current / 2);
	const stripes = Array.from({ length: 18 }, (_, i) => i);
	const id = $props.id();
</script>

<svg
	viewBox="-8.9 -0.3 16.3 4.6"
	class="w-full"
	role="img"
	aria-label={m.equipment_net_label({ height: fmt(height) })}
>
	<defs>
		<pattern id="{id}-mesh" width="0.1" height="0.1" patternUnits="userSpaceOnUse">
			<path d="M0.1 0 L0 0 0 0.1" fill="none" class="stroke-net" stroke-width="0.012" />
		</pattern>
	</defs>
	<!-- Ground -->
	<rect
		x="-8.9"
		y={G}
		width="16.3"
		height="0.6"
		class={sport === 'beach' ? 'fill-sand' : 'fill-court'}
	/>
	<!-- Court between the side lines -->
	<rect x={left} y={G} width={w.current} height="0.06" class="fill-court-line" />
	<!-- Posts, 1 m outside the side lines as at FIVB events -->
	{#each [left - 1, right + 1] as px (px)}
		<rect x={px - 0.06} y={y(2.55)} width="0.12" height="2.55" rx="0.03" class="fill-net" />
	{/each}
	<!-- Cables from the net to the posts -->
	<g class="stroke-net" stroke-width="0.02">
		<line x1={left - 1} y1={top + 0.02} x2={netLeft} y2={top + 0.02} />
		<line x1={netRight} y1={top + 0.02} x2={right + 1} y2={top + 0.02} />
		<line x1={left - 1} y1={top + 0.98} x2={netLeft} y2={top + 0.98} />
		<line x1={netRight} y1={top + 0.98} x2={right + 1} y2={top + 0.98} />
	</g>
	<!-- The net: mesh, top and bottom bands -->
	<rect x={netLeft} y={top} width={n.current} height="1" fill="url(#{id}-mesh)" />
	<rect
		x={netLeft}
		y={top}
		width={n.current}
		height={sport === 'beach' ? 0.08 : 0.07}
		class="fill-court-line stroke-net"
		stroke-width="0.01"
	/>
	<rect
		x={netLeft}
		y={top + 1 - (sport === 'beach' ? 0.08 : 0.05)}
		width={n.current}
		height={sport === 'beach' ? 0.08 : 0.05}
		class="fill-court-line stroke-net"
		stroke-width="0.01"
	/>
	<!-- Side bands above the side lines, and the antennae on their outer edges -->
	{#each [left, right - 0.05] as bx (bx)}
		<rect
			x={bx}
			y={top}
			width="0.05"
			height="1"
			class="fill-court-line stroke-net"
			stroke-width="0.01"
		/>
	{/each}
	{#each [left - 0.07, right + 0.01] as ax (ax)}
		{#each stripes as i (i)}
			<rect
				x={ax}
				y={top - 0.8 + i * 0.1}
				width="0.06"
				height="0.1"
				class={i % 2 ? 'fill-court-line' : 'fill-bad'}
			/>
		{/each}
		<rect
			x={ax}
			y={top - 0.8}
			width="0.06"
			height="1.8"
			fill="none"
			class="stroke-net"
			stroke-width="0.015"
		/>
	{/each}

	<!-- Height of the net -->
	<g class="fill-ink stroke-ink" font-weight="600">
		<g stroke-width="0.025">
			<line x1="-6.6" y1={G} x2="-6.6" y2={top} />
			<line x1="-6.8" y1={top} x2={netLeft - 0.05} y2={top} stroke-dasharray="0.08 0.06" />
			<line x1="-6.8" y1={G} x2="-6.4" y2={G} />
		</g>
		<text x="-6.8" y={(G + top) / 2 + 0.16} font-size="0.48" text-anchor="end" stroke="none"
			>{fmt(h.current)} m</text
		>
		<!-- Antenna above the net -->
		<g stroke-width="0.02">
			<line x1={left - 0.2} y1={top - 0.8} x2={left - 0.2} y2={top} />
			<line x1={left - 0.28} y1={top - 0.8} x2={left - 0.12} y2={top - 0.8} />
			<line x1={left - 0.28} y1={top} x2={left - 0.12} y2={top} />
		</g>
		<text x={left - 0.35} y={top - 0.28} font-size="0.36" text-anchor="end" stroke="none"
			>80 cm</text
		>
		<!-- Net width -->
		<g stroke-width="0.02">
			<line x1={left + 0.25} y1={top} x2={left + 0.25} y2={top + 1} />
		</g>
		<text x={left + 0.33} y={top + 0.58} font-size="0.36" stroke="none">1 m</text>
		<text x="0" y={G + 0.42} font-size="0.36" text-anchor="middle" stroke="none" font-weight="500"
			>{m.equipment_between_lines({ m: String(spec.court.width) })}</text
		>
		<text x={right + 0.6} y={y(2.55) - 0.12} font-size="0.34" stroke="none" font-weight="500"
			>{fmt(2.55)} m</text
		>
	</g>
</svg>
