<script lang="ts" module>
	export type HandSign = 'one' | 'two' | 'fist' | 'open';
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';

	/**
	 * A beach blocker seen from behind, as the defender sees them, giving a signal behind their
	 * back: the left hand for the attacker on their left, the right hand for the one on their
	 * right. The hands flash the signal and close again, as players do between rallies.
	 */
	let { left, right, label }: { left: HandSign; right: HandSign; label: string } = $props();

	const SKIN = '#e8b48e';
	const SKIN_SHADE = '#cf946c';
	const LINE = '#3b2214';
	const TOP = '#1f6f8b';
	const TOP_SHADE = '#195a71';
	const SHORTS = '#1b2a4a';
	const HAIR = '#4a3324';

	let svg: SVGSVGElement | undefined = $state();
	let visible = $state(false);
	let shown = $state(true);

	onMount(() => {
		if (!svg) return;
		const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
		io.observe(svg);
		return () => io.disconnect();
	});

	$effect(() => {
		if (!visible || prefersReducedMotion.current) {
			shown = true;
			return;
		}
		// Show the signal for most of the cycle, then close the hands briefly.
		let on = true;
		const tick = () => {
			on = !on;
			shown = on;
			timer = setTimeout(tick, on ? 2200 : 700);
		};
		let timer = setTimeout(tick, 2200);
		return () => clearTimeout(timer);
	});

	/** Which fingers are out, index to little finger, and whether the thumb is. */
	const FINGERS: Record<HandSign, { fingers: boolean[]; thumb: boolean }> = {
		one: { fingers: [true, false, false, false], thumb: false },
		two: { fingers: [true, true, false, false], thumb: false },
		fist: { fingers: [false, false, false, false], thumb: false },
		open: { fingers: [true, true, true, true], thumb: true }
	};
	const FINGER_LENGTH = [19, 21, 19, 15];
</script>

<!--
	A hand behind the back, palm towards the viewer and fingers pointing down. Local coordinates:
	the wrist at the origin; `side` is 1 when the thumb is on the viewer's right. Seen palm first with the
	fingers down, a left hand has its thumb on the right, so both thumbs point towards the spine.
-->
{#snippet hand(sign: HandSign, side: 1 | -1)}
	{@const pose = shown ? FINGERS[sign] : FINGERS.fist}
	<g>
		<!-- Fingers, index nearest the thumb -->
		{#each pose.fingers as out, i (i)}
			{@const x = side * (7.5 - i * 5.6)}
			{@const length = out ? FINGER_LENGTH[i] : 5}
			<rect
				x={x - 2.7}
				y="14"
				width="5.4"
				height={length + 3}
				rx="2.7"
				fill={SKIN}
				stroke={LINE}
				stroke-width="1.4"
				class="finger"
			/>
			{#if out}
				<line
					x1={x - 1.4}
					y1={14 + length * 0.55}
					x2={x + 1.4}
					y2={14 + length * 0.55}
					stroke={SKIN_SHADE}
					stroke-width="1"
				/>
			{/if}
		{/each}
		<!-- Palm -->
		<rect
			x="-12"
			y="-2"
			width="24"
			height="20"
			rx="7"
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.5"
		/>
		<path d="M-7 11 Q0 14 7 11" fill="none" stroke={SKIN_SHADE} stroke-width="1" />
		<!-- Thumb: out to the side, or folded across the palm -->
		{#if pose.thumb}
			<rect
				x="-2.8"
				y="0"
				width="5.6"
				height="15"
				rx="2.8"
				fill={SKIN}
				stroke={LINE}
				stroke-width="1.4"
				transform="translate({side * 11} 6) rotate({side * 55})"
			/>
		{:else}
			<rect
				x="-2.6"
				y="0"
				width="5.2"
				height="11"
				rx="2.6"
				fill={SKIN}
				stroke={LINE}
				stroke-width="1.3"
				transform="translate({side * 10} 4) rotate({side * 70})"
			/>
		{/if}
	</g>
{/snippet}

<svg bind:this={svg} viewBox="0 -18 200 236" class="w-full" role="img" aria-label={label}>
	<!-- Head and neck from behind -->
	<rect x="88" y="14" width="24" height="22" rx="6" fill={SKIN} stroke={LINE} stroke-width="1.5" />
	<ellipse cx="100" cy="6" rx="22" ry="20" fill={HAIR} stroke={LINE} stroke-width="1.5" />
	<!-- Upper arms down the sides -->
	<path d="M38 44 L26 118" stroke={LINE} stroke-width="20" stroke-linecap="round" />
	<path d="M38 44 L26 118" stroke={SKIN} stroke-width="17" stroke-linecap="round" />
	<path d="M162 44 L174 118" stroke={LINE} stroke-width="20" stroke-linecap="round" />
	<path d="M162 44 L174 118" stroke={SKIN} stroke-width="17" stroke-linecap="round" />
	<!-- Torso in a sports top -->
	<path
		d="M44 34 Q100 22 156 34 L150 70 Q146 120 138 158 L62 158 Q54 120 50 70 Z"
		fill={TOP}
		stroke={LINE}
		stroke-width="1.5"
	/>
	<path d="M100 32 L100 156" stroke={TOP_SHADE} stroke-width="2" />
	<path d="M62 52 Q100 60 138 52" fill="none" stroke={TOP_SHADE} stroke-width="1.5" />
	<!-- Shorts -->
	<path
		d="M60 156 L140 156 L148 214 L104 214 L100 196 L96 214 L52 214 Z"
		fill={SHORTS}
		stroke={LINE}
		stroke-width="1.5"
	/>
	<!-- Forearms across the lower back -->
	<path d="M26 118 L66 146" stroke={LINE} stroke-width="17" stroke-linecap="round" />
	<path d="M26 118 L66 146" stroke={SKIN} stroke-width="14" stroke-linecap="round" />
	<path d="M174 118 L134 146" stroke={LINE} stroke-width="17" stroke-linecap="round" />
	<path d="M174 118 L134 146" stroke={SKIN} stroke-width="14" stroke-linecap="round" />
	<!-- Hands: the blocker's left hand is on the viewer's left, seen from behind -->
	<g transform="translate(72 144) scale(1.5)">{@render hand(left, 1)}</g>
	<g transform="translate(128 144) scale(1.5)">{@render hand(right, -1)}</g>
</svg>
<p class="grid grid-cols-2 text-center text-sm font-semibold" aria-hidden="true">
	<span>{m.partner_left()}</span><span>{m.partner_right()}</span>
</p>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.finger {
			transition: height 0.18s ease-out;
		}
	}
</style>
