<script lang="ts">
	import type { Arm, Signal } from '#lib/signals.js';
	import { cubicInOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/**
	 * A simple sketch of a referee showing a signal, facing the reader. The referee's right arm is
	 * on the reader's left. The written gesture is the authority; this only helps picture it.
	 */
	let { signal }: { signal: Signal } = $props();

	// Cards and flags keep their real colours in both themes: a red card is red on any background.
	const UPPER = 17;
	const FORE = 16;
	const rad = (deg: number) => (deg * Math.PI) / 180;

	/** Joint positions for an arm from a shoulder; `side` is -1 for the reader's left, 1 for right. */
	function arm(shoulder: { x: number; y: number }, a: Arm, side: -1 | 1) {
		const elbow = {
			x: shoulder.x + side * UPPER * Math.sin(rad(a.upper)),
			y: shoulder.y + UPPER * Math.cos(rad(a.upper))
		};
		const hand = {
			x: elbow.x + side * FORE * Math.sin(rad(a.fore)),
			y: elbow.y + FORE * Math.cos(rad(a.fore))
		};
		return { elbow, hand };
	}

	const REST: Arm = { upper: 8, fore: 8 };
	const mix = (a: Arm, b: Arm, t: number): Arm => ({
		upper: a.upper + (b.upper - a.upper) * t,
		fore: a.fore + (b.fore - a.fore) * t
	});

	/**
	 * How far through the movement the figure is: 0 is the starting pose, 1 the signal. The figure
	 * raises its arms into the signal, holds it, and lowers them again; a repeated movement swings
	 * back and forth. Still for readers who prefer less motion, and while off screen.
	 */
	const t = new Tween(1, { easing: cubicInOut });
	let figure: SVGSVGElement | undefined = $state();
	let visible = $state(false);

	$effect(() => {
		if (!figure) return;
		const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
		observer.observe(figure);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!visible || prefersReducedMotion.current) {
			t.set(1, { duration: 0 });
			return;
		}
		let stopped = false;
		const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
		(async () => {
			await t.set(0, { duration: 0 });
			while (!stopped) {
				if (signal.repeat) {
					await t.set(1, { duration: 650 });
					if (stopped) break;
					await t.set(0, { duration: 650 });
				} else {
					await t.set(1, { duration: 700 });
					await wait(1800);
					if (stopped) break;
					await t.set(0, { duration: 500 });
					await wait(500);
				}
			}
		})();
		return () => {
			stopped = true;
		};
	});

	const sR = { x: 43, y: 38 };
	const sL = { x: 57, y: 38 };
	const right = $derived(arm(sR, mix(signal.from?.right ?? REST, signal.right, t.current), -1));
	const left = $derived(arm(sL, mix(signal.from?.left ?? REST, signal.left, t.current), 1));
	const extras = $derived(signal.props ?? []);
	const raised = $derived(right.hand.y < left.hand.y ? right.hand : left.hand);
</script>

<svg bind:this={figure} viewBox="0 -24 100 134" class="h-auto w-full" aria-hidden="true">
	{#if extras.includes('net')}
		<line
			x1="0"
			y1="34"
			x2="100"
			y2="34"
			class="stroke-ink-soft"
			stroke-width="1.5"
			stroke-dasharray="3 2"
		/>
	{/if}
	{#if extras.includes('line')}
		<line x1="5" y1="104" x2="95" y2="104" class="stroke-accent" stroke-width="2" />
	{/if}
	<g class="fill-none stroke-ink" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
		<!-- Body and legs -->
		<line x1="50" y1="34" x2="50" y2="68" />
		<line x1="43" y1="38" x2="57" y2="38" />
		<line x1="50" y1="68" x2="42" y2="100" />
		<line x1="50" y1="68" x2="58" y2="100" />
		<!-- Arms -->
		<polyline
			points="{sR.x},{sR.y} {right.elbow.x},{right.elbow.y} {right.hand.x},{right.hand.y}"
		/>
		<polyline points="{sL.x},{sL.y} {left.elbow.x},{left.elbow.y} {left.hand.x},{left.hand.y}" />
	</g>
	<circle cx="50" cy="24" r="8" class="fill-paper stroke-ink" stroke-width="3" />
	<circle cx={right.hand.x} cy={right.hand.y} r="2.6" class="fill-accent" />
	<circle cx={left.hand.x} cy={left.hand.y} r="2.6" class="fill-accent" />

	{#if extras.includes('yellow') || extras.includes('both-cards')}
		<rect
			x={right.hand.x - 4}
			y={right.hand.y - 12}
			width="8"
			height="11"
			rx="1"
			fill="#f5c400"
			class="stroke-ink"
			stroke-width="0.8"
		/>
	{/if}
	{#if extras.includes('red') && !extras.includes('yellow')}
		<rect
			x={right.hand.x - 4}
			y={right.hand.y - 12}
			width="8"
			height="11"
			rx="1"
			fill="#d7263d"
			class="stroke-ink"
			stroke-width="0.8"
		/>
	{/if}
	{#if extras.includes('red') && extras.includes('yellow')}
		<rect
			x={left.hand.x - 4}
			y={left.hand.y - 12}
			width="8"
			height="11"
			rx="1"
			fill="#d7263d"
			class="stroke-ink"
			stroke-width="0.8"
		/>
	{/if}
	{#if extras.includes('both-cards')}
		<rect
			x={right.hand.x - 1}
			y={right.hand.y - 14}
			width="8"
			height="11"
			rx="1"
			fill="#d7263d"
			class="stroke-ink"
			stroke-width="0.8"
		/>
	{/if}
	{#if extras.includes('flag-up') || extras.includes('flag-wave')}
		<line
			x1={right.hand.x}
			y1={right.hand.y}
			x2={right.hand.x}
			y2={right.hand.y - 16}
			class="stroke-ink"
			stroke-width="1.5"
		/>
		<rect x={right.hand.x} y={right.hand.y - 16} width="9" height="7" fill="#d7263d" />
	{/if}
	{#if extras.includes('flag-down')}
		<line
			x1={right.hand.x}
			y1={right.hand.y}
			x2={right.hand.x - 6}
			y2={right.hand.y + 12}
			class="stroke-ink"
			stroke-width="1.5"
		/>
		<rect x={right.hand.x - 13} y={right.hand.y + 6} width="9" height="7" fill="#d7263d" />
	{/if}
	{#if signal.fingers}
		<text
			x={raised.x}
			y={raised.y - 6}
			text-anchor="middle"
			font-size="9"
			font-weight="700"
			class="fill-accent">{signal.fingers}</text
		>
	{/if}

	{#if signal.motion}
		<g class="fill-none stroke-accent" stroke-width="1.6" stroke-linecap="round">
			{#if signal.motion === 'sweep'}
				<path d="M 50 50 Q 35 40 22 40" marker-end="url(#arrow-{signal.id})" />
			{:else if signal.motion === 'spin' || signal.motion === 'circle'}
				<ellipse cx="50" cy="52" rx="15" ry="5" stroke-dasharray="3 2" />
			{:else if signal.motion === 'up'}
				<path
					d="M {right.hand.x - 7} {right.hand.y + 10} L {right.hand.x - 7} {right.hand.y - 4}"
					marker-end="url(#arrow-{signal.id})"
				/>
			{:else if signal.motion === 'down'}
				<path
					d="M {right.hand.x - 7} {right.hand.y - 2} L {right.hand.x - 7} {right.hand.y + 16}"
					marker-end="url(#arrow-{signal.id})"
				/>
			{:else if signal.motion === 'brush'}
				<path
					d="M {right.hand.x - 2} {right.hand.y - 8} L {right.hand.x + 8} {right.hand.y - 14}"
					marker-end="url(#arrow-{signal.id})"
				/>
			{/if}
		</g>
		<defs>
			<marker
				id="arrow-{signal.id}"
				viewBox="0 0 6 6"
				refX="3"
				refY="3"
				markerWidth="5"
				markerHeight="5"
				orient="auto"
			>
				<path d="M0,0 L6,3 L0,6 z" class="fill-accent" />
			</marker>
		</defs>
	{/if}
</svg>
