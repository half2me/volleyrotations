<script lang="ts">
	import { SPECS } from '#lib/equipment.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { Sport } from '#lib/volley/match.js';
	import { cubicInOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/**
	 * The ball at its true size relative to the gauge, bouncing: the softer beach ball flattens
	 * more on landing. The gauge shows both pressure ranges on one scale, with the needle in the
	 * middle of the chosen sport's range.
	 */
	let { sport }: { sport: Sport } = $props();

	const spec = $derived(SPECS[sport].ball);
	const opts = () => ({ duration: prefersReducedMotion.current ? 0 : 800, easing: cubicInOut });
	const mid = (r: readonly [number, number]) => (r[0] + r[1]) / 2;
	const needle = new Tween(mid(SPECS.indoor.ball.pressure), opts());
	$effect(() => {
		needle.set(mid(spec.pressure), opts());
	});

	/** Diameter in cm from the middle of the circumference range. */
	const diameter = $derived(mid(spec.circumference) / Math.PI);
	const fmt = (n: number, digits = 3) =>
		n.toLocaleString(m.number_locale(), {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		});

	// Gauge: 0–0.4 kg/cm² over a half circle.
	const MAX = 0.4;
	const GX = 49;
	const GY = 30;
	const R = 14;
	const point = (v: number, r = R) => {
		const a = Math.PI * (1 - v / MAX);
		return [GX + r * Math.cos(a), GY - r * Math.sin(a)] as const;
	};
	const arc = (from: number, to: number, r = R) => {
		const [x1, y1] = point(from, r);
		const [x2, y2] = point(to, r);
		return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
	};
	const ticks = [0, 0.1, 0.2, 0.3, 0.4];
	const tip = $derived(point(needle.current, R - 2));
</script>

<svg
	viewBox="0 0 70 40"
	class="w-full"
	role="img"
	aria-label={m.equipment_ball_label({
		circumference: `${spec.circumference[0]}–${spec.circumference[1]}`,
		weight: `${spec.weight[0]}–${spec.weight[1]}`,
		pressure: `${fmt(spec.pressure[0])}–${fmt(spec.pressure[1])}`
	})}
>
	<!-- Ground -->
	<rect
		x="2"
		y="35"
		width="26"
		height="1.4"
		rx="0.7"
		class={sport === 'beach' ? 'fill-sand' : 'fill-court'}
	/>
	<!-- The ball, its diameter in cm drawn at 1 cm = 1 unit -->
	<g
		class="ball"
		class:soft={sport === 'beach'}
		style="--d: {diameter}px"
		transform="translate(15 {35 - diameter / 2})"
	>
		<g class="bounce">
			<circle r={diameter / 2} class="fill-surface stroke-ink" stroke-width="0.4" />
			<path
				d="M{-diameter / 2} 0 C {-diameter / 4} {-diameter / 3}, {diameter / 4} {-diameter /
					3}, {diameter / 2} 0"
				class="fill-accent stroke-ink"
				stroke-width="0.35"
				opacity="0.9"
			/>
			<path
				d="M0 {-diameter / 2} C {diameter / 3} {-diameter / 4}, {diameter / 3} {diameter /
					4}, 0 {diameter / 2}"
				fill="none"
				class="stroke-ink"
				stroke-width="0.35"
			/>
			<path
				d="M{-diameter / 2.2} {diameter / 5} C {-diameter / 6} {diameter / 2.6}, {diameter /
					6} {diameter / 2.6}, {diameter / 2.2} {diameter / 5}"
				class="fill-team stroke-ink"
				stroke-width="0.35"
				opacity="0.85"
			/>
		</g>
	</g>
	<g class="fill-ink" font-size="2.6" font-weight="600">
		<text x="15" y="6" text-anchor="middle">{spec.circumference[0]}–{spec.circumference[1]} cm</text
		>
		<text
			x="15"
			y="9.4"
			text-anchor="middle"
			font-size="2.1"
			font-weight="500"
			class="fill-ink-soft">{spec.weight[0]}–{spec.weight[1]} g</text
		>
	</g>

	<!-- Pressure gauge -->
	<path d={arc(0, MAX)} fill="none" class="stroke-line" stroke-width="3" />
	<path
		d={arc(...SPECS.beach.ball.pressure)}
		fill="none"
		class="stroke-sand-deep"
		stroke-width="3"
		opacity={sport === 'beach' ? 1 : 0.45}
	/>
	<path
		d={arc(...SPECS.indoor.ball.pressure)}
		fill="none"
		class="stroke-accent"
		stroke-width="3"
		opacity={sport === 'indoor' ? 1 : 0.45}
	/>
	{#each ticks as v (v)}
		{@const [x1, y1] = point(v, R + 1.8)}
		{@const [x2, y2] = point(v, R + 3)}
		{@const [tx, ty] = point(v, R + 5.2)}
		<line {x1} {y1} {x2} {y2} class="stroke-ink" stroke-width="0.3" />
		<text x={tx} y={ty + 0.8} text-anchor="middle" font-size="2" class="fill-ink-soft"
			>{fmt(v, 1)}</text
		>
	{/each}
	<line
		x1={GX}
		y1={GY}
		x2={tip[0]}
		y2={tip[1]}
		class="stroke-ink"
		stroke-width="0.7"
		stroke-linecap="round"
	/>
	<circle cx={GX} cy={GY} r="1.2" class="fill-ink" />
	<text x={GX} y={GY + 4.2} text-anchor="middle" font-size="2.3" font-weight="600" class="fill-ink"
		>{fmt(spec.pressure[0])}–{fmt(spec.pressure[1])}</text
	>
	<text x={GX} y={GY + 7} text-anchor="middle" font-size="2" class="fill-ink-soft">kg/cm²</text>
</svg>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.bounce {
			transform-box: fill-box;
			transform-origin: 50% 100%;
			animation: bounce 1.6s cubic-bezier(0.5, 0, 0.5, 1) infinite;
			--squash: 0.9;
		}
		.soft .bounce {
			--squash: 0.8;
		}
	}
	@keyframes bounce {
		0%,
		100% {
			transform: translateY(-4px) scale(1, 1);
		}
		45% {
			transform: translateY(0) scale(1, 1);
		}
		50% {
			transform: translateY(0) scale(calc(2 - var(--squash)), var(--squash));
		}
		55% {
			transform: translateY(0) scale(1, 1);
		}
	}
</style>
