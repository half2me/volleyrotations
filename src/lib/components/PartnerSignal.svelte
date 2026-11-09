<script lang="ts" module>
	export type HandSign = 'one' | 'two' | 'fist' | 'open';
</script>

<script lang="ts">
	import Hand, { LINE, SKIN, type HandKind } from '#lib/components/figure/Hand.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/**
	 * A beach blocker seen from behind, as the defender sees them, giving a signal behind their
	 * back: the left hand for the attacker on their left, the right hand for the one on their
	 * right. The fingers flick out to show the signal and close again, as players do between
	 * rallies.
	 */
	let { left, right, label }: { left: HandSign; right: HandSign; label: string } = $props();

	const TOP = '#1f6f8b';
	const TOP_SHADE = '#195a71';
	const SHORTS = '#1b2a4a';
	const HAIR = '#4a3324';

	const KIND: Record<HandSign, HandKind> = { one: 'point', two: 'two', fist: 'fist', open: 'open' };

	let svg: SVGSVGElement | undefined = $state();
	let visible = $state(false);
	/** How far the fingers are out: 1 shows the signal, 0 is a closed hand. */
	const extend = new Tween(1, { duration: 220, easing: cubicOut });

	onMount(() => {
		if (!svg) return;
		const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
		io.observe(svg);
		return () => io.disconnect();
	});

	$effect(() => {
		if (!visible || prefersReducedMotion.current) {
			extend.set(1, { duration: 0 });
			return;
		}
		// Show the signal for most of the cycle, then close the hands briefly.
		let stopped = false;
		const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
		(async () => {
			while (!stopped) {
				await wait(2200);
				if (stopped) break;
				await extend.set(0);
				await wait(600);
				if (stopped) break;
				await extend.set(1);
			}
		})();
		return () => {
			stopped = true;
		};
	});
</script>

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
	<!--
		Hands behind the back, palms to the viewer and fingers down. Seen from behind, the blocker's
		left hand is on the viewer's left; palm first with the fingers down, its thumb is on the
		viewer's right, so both thumbs point towards the spine.
	-->
	<g transform="translate(72 146) scale(1.5)">
		<Hand kind={KIND[left]} view="palm" thumb={1} extend={extend.current} />
	</g>
	<g transform="translate(128 146) scale(1.5)">
		<Hand kind={KIND[right]} view="palm" thumb={-1} extend={extend.current} />
	</g>
</svg>
<p class="grid grid-cols-2 text-center text-sm font-semibold" aria-hidden="true">
	<span>{m.partner_left()}</span><span>{m.partner_right()}</span>
</p>
