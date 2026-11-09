<script lang="ts">
	import type { Flight } from '#lib/volley/ball.js';
	import { linear } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/**
	 * The ball on a Court, flying from contact to contact and starting again after a pause. Its
	 * shadow stays on the floor while the ball itself rises and grows, so the height of a serve,
	 * a set or a flat attack reads from above. Without motion the flights are dotted lines and
	 * the ball sits at the last contact.
	 */
	let { flights }: { flights: Flight[] } = $props();

	/** How high each kind of contact sends the ball, in metres above the floor, and how long it takes. */
	const ARC: Record<Flight['kind'], { peak: number; speed: number }> = {
		serve: { peak: 2.6, speed: 7 },
		pass: { peak: 3.4, speed: 5.5 },
		set: { peak: 3.6, speed: 4.5 },
		dig: { peak: 3, speed: 5.5 },
		attack: { peak: 1, speed: 16 },
		block: { peak: 1.6, speed: 7 }
	};

	let flight = $state(0);
	const t = new Tween(1, { easing: linear });
	let shown = $state(true);
	let svg: SVGGElement | undefined = $state();
	let visible = $state(false);

	$effect(() => {
		if (!svg) return;
		const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
		observer.observe(svg);
		return () => observer.disconnect();
	});

	$effect(() => {
		const list = flights;
		if (!visible || prefersReducedMotion.current || !list.length) {
			flight = Math.max(0, list.length - 1);
			shown = true;
			t.set(1, { duration: 0 });
			return;
		}
		let stopped = false;
		const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
		(async () => {
			while (!stopped) {
				shown = true;
				for (let i = 0; i < list.length && !stopped; i++) {
					flight = i;
					const f = list[i];
					const length = Math.hypot(f.to.x - f.from.x, f.to.y - f.from.y);
					await t.set(0, { duration: 0 });
					await t.set(1, { duration: 150 + (length / ARC[f.kind].speed) * 1000 });
					await wait(i === list.length - 1 ? 900 : 220);
				}
				if (stopped) break;
				shown = false;
				await wait(500);
			}
		})();
		return () => {
			stopped = true;
		};
	});

	const current = $derived(flights[Math.min(flight, flights.length - 1)]);
	const pos = $derived.by(() => {
		if (!current) return undefined;
		const k = t.current;
		return {
			x: current.from.x + (current.to.x - current.from.x) * k,
			y: current.from.y + (current.to.y - current.from.y) * k,
			height: Math.sin(Math.PI * k) * ARC[current.kind].peak
		};
	});
	/** The ball grows as it rises: seen from above, a ball at net height looks half as big again. */
	const scale = $derived(pos ? 1 + pos.height * 0.16 : 1);
	const R = 0.32;
</script>

<g
	bind:this={svg}
	aria-hidden="true"
	class={['transition-opacity duration-300', !shown && 'opacity-0']}
>
	{#if prefersReducedMotion.current}
		{#each flights as f, i (i)}
			<line
				x1={f.from.x}
				y1={f.from.y}
				x2={f.to.x}
				y2={f.to.y}
				class="stroke-ink opacity-50"
				stroke-width="0.07"
				stroke-dasharray="0.12 0.16"
				stroke-linecap="round"
			/>
		{/each}
	{/if}
	{#if pos}
		<!-- Shadow on the floor -->
		<ellipse
			cx={pos.x + pos.height * 0.12}
			cy={pos.y + pos.height * 0.1}
			rx={R * 0.9}
			ry={R * 0.55}
			class="fill-ink"
			opacity={0.28 - pos.height * 0.04}
		/>
		<g transform="translate({pos.x} {pos.y - pos.height * 0.22}) scale({scale})">
			<circle r={R} fill="#fbf7ef" stroke="#2a2a2a" stroke-width="0.035" />
			<!-- Panels: blue and yellow bands like a match ball. -->
			<path
				d="M {-R * 0.95} {-R * 0.3} Q 0 {R * 0.25} {R * 0.95} {-R * 0.3}"
				fill="none"
				stroke="#1d4f91"
				stroke-width={R * 0.3}
			/>
			<path
				d="M {-R * 0.6} {R * 0.8} Q {R * 0.1} {R * 0.1} {R * 0.95} {R * 0.3}"
				fill="none"
				stroke="#f4c531"
				stroke-width={R * 0.28}
			/>
			<path
				d="M {-R * 0.3} {-R * 0.95} Q {-R * 0.3} 0 {-R * 0.75} {R * 0.65}"
				fill="none"
				stroke="#1d4f91"
				stroke-width={R * 0.24}
			/>
			<circle r={R} fill="none" stroke="#2a2a2a" stroke-width="0.035" />
		</g>
	{/if}
</g>
