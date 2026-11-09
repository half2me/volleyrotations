<script lang="ts">
	import type { Arm, Hand, Signal } from '#lib/signals.js';
	import { cubicInOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/**
	 * A referee's upper body, facing the reader, acting out a signal: arms with sleeves, hands with
	 * fingers, and the whistle on its lanyard. The referee's right arm is on the reader's left.
	 * Poses come from `signals.ts`; the written gesture there is the authority.
	 *
	 * Skin, hair, cards and flags keep their real colours in both themes; the shirt and outlines use
	 * theme tokens so the figure reads on light and dark backgrounds.
	 */
	let { signal }: { signal: Signal } = $props();

	const UPPER = 46;
	const FORE = 42;
	const SKIN = '#e8b48e';
	/** Outline of hands and fingers: dark enough to separate each finger on skin and on the shirt. */
	const LINE = '#3b2214';
	/** The usual referee kit: a white polo with dark trim. */
	const SHIRT = '#ffffff';
	const SHIRT_SHADE = '#dfe4ec';
	const TRIM = '#1b2a4a';
	const SKIN_SHADE = '#cf946c';
	const HAIR = '#4a3324';
	const YELLOW = '#f5c400';
	const RED = '#d7263d';
	const rad = (deg: number) => (deg * Math.PI) / 180;

	type Point = { x: number; y: number };

	/** Elbow and wrist from a shoulder; `side` is -1 for the reader's left arm, 1 for the right. */
	function arm(shoulder: Point, a: Arm, side: -1 | 1) {
		const elbow = {
			x: shoulder.x + side * UPPER * Math.sin(rad(a.upper)),
			y: shoulder.y + UPPER * Math.cos(rad(a.upper))
		};
		const wrist = {
			x: elbow.x + side * FORE * Math.sin(rad(a.fore)),
			y: elbow.y + FORE * Math.cos(rad(a.fore))
		};
		// The hand's own axis: its fingers carry on along the forearm.
		const angle = (Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) * 180) / Math.PI - 90;
		return { elbow, wrist, angle };
	}

	const REST: Arm = { upper: 6, fore: 4 };
	const mix = (a: Arm, b: Arm, t: number): Arm => ({
		upper: a.upper + (b.upper - a.upper) * t,
		fore: a.fore + (b.fore - a.fore) * t
	});

	/**
	 * How far through the movement the figure is: 0 is the starting pose, 1 the signal. The referee
	 * raises the arms into the signal, holds it and lowers them; a repeated movement swings back and
	 * forth. Still for readers who prefer less motion, and while off screen.
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
					await t.set(1, { duration: 700 });
					if (stopped) break;
					await t.set(0, { duration: 700 });
				} else {
					await t.set(1, { duration: 750 });
					await wait(1800);
					if (stopped) break;
					await t.set(0, { duration: 550 });
					await wait(500);
				}
			}
		})();
		return () => {
			stopped = true;
		};
	});

	/**
	 * An arm whose hand moves in a straight line between the two poses: the wrist is placed on the
	 * line and the elbow found from it, bending the way the joint-angle pose at that moment does.
	 */
	function armOnLine(shoulder: Point, from: Arm, to: Arm, at: number, side: -1 | 1) {
		const a = arm(shoulder, from, side).wrist;
		const b = arm(shoulder, to, side).wrist;
		const target = { x: a.x + (b.x - a.x) * at, y: a.y + (b.y - a.y) * at };
		const dx = target.x - shoulder.x;
		const dy = target.y - shoulder.y;
		const d = Math.min(
			UPPER + FORE - 0.5,
			Math.max(Math.abs(UPPER - FORE) + 1, Math.hypot(dx, dy))
		);
		const base = Math.atan2(dy, dx);
		const bend = Math.acos((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d));
		const guide = arm(shoulder, mix(from, to, at), side).elbow;
		const elbow = [base + bend, base - bend]
			.map((th) => ({ x: shoulder.x + UPPER * Math.cos(th), y: shoulder.y + UPPER * Math.sin(th) }))
			.sort(
				(p, q) =>
					Math.hypot(p.x - guide.x, p.y - guide.y) - Math.hypot(q.x - guide.x, q.y - guide.y)
			)[0];
		const ux = (dx / Math.hypot(dx, dy)) * d;
		const uy = (dy / Math.hypot(dx, dy)) * d;
		const wrist = { x: shoulder.x + ux, y: shoulder.y + uy };
		const angle = (Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) * 180) / Math.PI - 90;
		return { elbow, wrist, angle };
	}

	const SR = { x: 90, y: 122 };
	const SL = { x: 150, y: 122 };
	const pose = (shoulder: Point, from: Arm | undefined, to: Arm, side: -1 | 1) =>
		signal.path === 'line'
			? armOnLine(shoulder, from ?? REST, to, t.current, side)
			: arm(shoulder, mix(from ?? REST, to, t.current), side);
	const right = $derived(pose(SR, signal.from?.right, signal.right, -1));
	const left = $derived(pose(SL, signal.from?.left, signal.left, 1));
	const extras = $derived(signal.props ?? []);
	const handRight: Hand = $derived(signal.hands?.right ?? 'open');
	const handLeft: Hand = $derived(signal.hands?.left ?? 'open');
	const flagDown = $derived(extras.includes('flag-down'));
	/** The net, drawn at the height of the hand that points to it. */
	const netY = $derived(right.wrist.y + 4);
	const id = $props.id();
	/** The thumb's side, rolling from the starting pose's to the signal's as the forearm turns. */
	const thumbSide = (from: number | undefined, to: number | undefined, rest: number) =>
		(from ?? rest) + ((to ?? rest) - (from ?? rest)) * t.current;
	const thumbRight = $derived(thumbSide(signal.thumbsFrom?.right, signal.thumbs?.right, -1));
	const thumbLeft = $derived(thumbSide(signal.thumbsFrom?.left, signal.thumbs?.left, 1));
	/** A hand turns from in line with the forearm to its own angle as the signal forms. */
	const handAngle = (forearm: number, tilt: number | undefined) =>
		tilt === undefined ? forearm : forearm + (tilt - forearm) * t.current;
</script>

<!-- One finger as a rounded capsule from the palm's top edge, in hand coordinates. -->
{#snippet finger(x: number, length: number, tilt = 0, width = 5.6)}
	<g transform="translate({x} 15) rotate({tilt})">
		<rect
			x={-width / 2}
			y={-3}
			{width}
			height={length + 3}
			rx={width / 2}
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.5"
		/>
		<line
			x1={-width / 2 + 1.2}
			y1={length * 0.5}
			x2={width / 2 - 1.2}
			y2={length * 0.5}
			stroke={SKIN_SHADE}
			stroke-width="1"
		/>
	</g>
{/snippet}

<!--
	A hand at a wrist, its fingers carrying on along the forearm. Local coordinates: the wrist at
	the origin and the fingers pointing towards +y; `thumb` is the side the thumb is on.
-->
{#snippet hand(at: Point, angle: number, kind: Hand, thumb: number)}
	<g transform="translate({at.x} {at.y}) rotate({angle}) scale(1.5)">
		{#if kind === 'flag'}
			{@const pole = flagDown ? 1 : -1}
			<g transform="rotate({-angle + (flagDown ? 30 * thumb : 0)})">
				<line
					x1="0"
					y1="0"
					x2="0"
					y2={pole * 46}
					class="stroke-ink"
					stroke-width="2.6"
					stroke-linecap="round"
				/>
				<!-- The cloth flies on the outer side of the pole, clear of the other hand. -->
				<rect
					x="-18"
					y={flagDown ? 30 : -46}
					width="18"
					height="14"
					fill={RED}
					class="stroke-ink"
					stroke-width="1"
				/>
				<rect x="-18" y={flagDown ? 30 : -46} width="9" height="7" fill={YELLOW} />
				<rect x="-9" y={flagDown ? 37 : -39} width="9" height="7" fill={YELLOW} />
			</g>
		{/if}
		{#if kind === 'yellow' || kind === 'red' || kind === 'both-cards'}
			<g transform="rotate({-angle})">
				{#if kind === 'both-cards'}
					<rect
						x="-4"
						y="-34"
						width="18"
						height="25"
						rx="2"
						fill={RED}
						class="stroke-ink"
						stroke-width="1.1"
						transform="rotate(12)"
					/>
				{/if}
				<rect
					x="-11"
					y="-34"
					width="18"
					height="25"
					rx="2"
					fill={kind === 'red' ? RED : YELLOW}
					class="stroke-ink"
					stroke-width="1.1"
				/>
			</g>
		{/if}
		<!-- Palm -->
		<rect
			x="-9"
			y="-1"
			width="18"
			height="18"
			rx="6"
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.6"
		/>
		<!-- Fingers spread a little, so each one shows on its own. -->
		{#if kind === 'open'}
			{@render finger(-6.6, 11, -12)}
			{@render finger(-2.2, 13, -4)}
			{@render finger(2.2, 13, 4)}
			{@render finger(6.6, 10, 12)}
		{:else if kind === 'point'}
			{@render finger(-3, 16, 0)}
			<path d="M 0 15 q 3 4 6 0" fill={SKIN} stroke={LINE} stroke-width="1.4" />
		{:else if kind === 'two'}
			{@render finger(-3.6, 15, -18)}
			{@render finger(3.6, 15, 18)}
			<path d="M -1 16 q 1 3 2 0" fill="none" stroke={LINE} stroke-width="1.2" />
		{:else if kind === 'five'}
			{@render finger(-7.5, 12, 34)}
			{@render finger(-2.6, 14, 11)}
			{@render finger(2.6, 14, -11)}
			{@render finger(7.5, 11, -34)}
		{:else if kind === 'four'}
			{@render finger(-7, 11, 24)}
			{@render finger(-2.4, 13, 8)}
			{@render finger(2.4, 13, -8)}
			{@render finger(7, 10, -24)}
		{:else}
			<!-- Curled fingers: four knuckles along the top of the fist. -->
			<path
				d="M -8 15 q 2 4 4 0 q 2 4 4 0 q 2 4 4 0 q 2 4 4 0"
				fill={SKIN}
				stroke={LINE}
				stroke-width="1.4"
			/>
		{/if}
		<!-- Thumb: out to the side, or straight up for a thumbs-up whatever the hand's angle. -->
		{#if kind === 'thumb'}
			<!-- Thumbs up: from the top of the fist, pointing straight up whatever the forearm's angle. -->
			<g transform="translate({thumb * 2} 14) rotate({-angle + 180})">
				<rect
					x="-3.4"
					y="-2"
					width="6.8"
					height="17"
					rx="3.4"
					fill={SKIN}
					stroke={LINE}
					stroke-width="1.6"
				/>
				<path d="M -2 11 q 2 2 4 0" fill="none" stroke={SKIN_SHADE} stroke-width="1" />
			</g>
		{:else if kind === 'four'}
			<path
				d="M {thumb * 8} 6 q {thumb * 3} 4 {thumb * 1} 9"
				fill="none"
				stroke={LINE}
				stroke-width="1.5"
			/>
		{:else}
			<g transform="translate({thumb * 8.5} 4) rotate({thumb * (kind === 'five' ? -80 : -48)})">
				<rect
					x="-3.1"
					y="-1"
					width="6.2"
					height="12"
					rx="3.1"
					fill={SKIN}
					stroke={LINE}
					stroke-width="1.5"
				/>
			</g>
		{/if}
	</g>
{/snippet}

<!-- An arm: a short sleeve at the shoulder, then skin to the wrist, with a darker outline. -->
{#snippet limb(shoulder: Point, a: { elbow: Point; wrist: Point })}
	<g stroke-linecap="round" stroke-linejoin="round" fill="none">
		<polyline
			points="{shoulder.x},{shoulder.y} {a.elbow.x},{a.elbow.y} {a.wrist.x},{a.wrist.y}"
			class="stroke-ink"
			stroke-width="17"
		/>
		<polyline
			points="{shoulder.x},{shoulder.y} {a.elbow.x},{a.elbow.y} {a.wrist.x},{a.wrist.y}"
			stroke={SKIN}
			stroke-width="14"
		/>
		<!-- Sleeve: the first part of the upper arm. -->
		<line
			x1={shoulder.x}
			y1={shoulder.y}
			x2={shoulder.x + (a.elbow.x - shoulder.x) * 0.5}
			y2={shoulder.y + (a.elbow.y - shoulder.y) * 0.5}
			class="stroke-ink"
			stroke-width="22"
		/>
		<line
			x1={shoulder.x}
			y1={shoulder.y}
			x2={shoulder.x + (a.elbow.x - shoulder.x) * 0.5}
			y2={shoulder.y + (a.elbow.y - shoulder.y) * 0.5}
			stroke={SHIRT}
			stroke-width="19"
		/>
		<!-- Sleeve band -->
		<line
			x1={shoulder.x + (a.elbow.x - shoulder.x) * 0.44}
			y1={shoulder.y + (a.elbow.y - shoulder.y) * 0.44}
			x2={shoulder.x + (a.elbow.x - shoulder.x) * 0.5}
			y2={shoulder.y + (a.elbow.y - shoulder.y) * 0.5}
			stroke={TRIM}
			stroke-width="19"
			stroke-linecap="butt"
		/>
	</g>
{/snippet}

<svg bind:this={figure} viewBox="-30 -44 300 312" class="h-auto w-full" aria-hidden="true">
	<defs>
		<clipPath id="{id}-frame"><rect x="-30" y="-44" width="300" height="312" /></clipPath>
		<marker
			id="{id}-arrow"
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
	<g clip-path="url(#{id}-frame)">
		{#if extras.includes('net')}
			<!-- The net, its tape at the height of the hand. -->
			<rect
				x="-4"
				y={netY}
				width="122"
				height="40"
				class="fill-none stroke-ink-soft"
				stroke-width="1"
			/>
			<pattern id="{id}-mesh" width="8" height="8" patternUnits="userSpaceOnUse">
				<path d="M 8 0 L 0 0 0 8" class="fill-none stroke-ink-soft" stroke-width="0.6" />
			</pattern>
			<rect x="-4" y={netY} width="122" height="40" fill="url(#{id}-mesh)" />
			<rect
				x="-4"
				y={netY - 3}
				width="122"
				height="6"
				class="fill-paper stroke-ink"
				stroke-width="1"
			/>
		{/if}

		<!-- Torso and shirt -->
		<path
			d="M 80 116 Q 120 104 160 116 Q 172 122 172 140 L 166 268 L 74 268 L 68 140 Q 68 122 80 116 Z"
			fill={SHIRT}
			class="stroke-ink"
			stroke-width="2"
		/>
		<!-- Shading down the sides of the shirt, and the button placket. -->
		<path
			d="M 70 150 L 74 268 L 84 268 L 82 150 Z M 170 150 L 166 268 L 156 268 L 158 150 Z"
			fill={SHIRT_SHADE}
		/>
		<line x1="120" y1="124" x2="120" y2="150" stroke={TRIM} stroke-width="1.5" />
		<circle cx="120" cy="133" r="1.6" fill={TRIM} />
		<circle cx="120" cy="143" r="1.6" fill={TRIM} />
		<!-- Neck and collar -->
		<rect
			x="110"
			y="86"
			width="20"
			height="26"
			rx="6"
			fill={SKIN}
			class="stroke-ink"
			stroke-width="1.5"
		/>
		<!-- Polo collar in the trim colour -->
		<path
			d="M 102 106 L 120 126 L 112 106 Z M 138 106 L 120 126 L 128 106 Z"
			fill={TRIM}
			class="stroke-ink"
			stroke-width="1.4"
		/>
		<!-- Lanyard and whistle -->
		<path
			d="M 108 110 Q 112 150 122 158 Q 130 150 132 110"
			fill="none"
			stroke="#111"
			stroke-width="2"
		/>
		<!-- Whistle -->
		<g transform="translate(122 158)">
			<rect
				x="-5"
				y="0"
				width="19"
				height="10"
				rx="4"
				fill="#c9ced6"
				stroke="#111"
				stroke-width="1.3"
			/>
			<circle cx="0" cy="5" r="6.5" fill="#c9ced6" stroke="#111" stroke-width="1.3" />
			<circle cx="0" cy="5" r="2.2" fill="#111" />
		</g>
		<!-- Head -->
		<ellipse cx="96" cy="64" rx="5" ry="8" fill={SKIN} class="stroke-ink" stroke-width="1.4" />
		<ellipse cx="144" cy="64" rx="5" ry="8" fill={SKIN} class="stroke-ink" stroke-width="1.4" />
		<ellipse cx="120" cy="60" rx="24" ry="29" fill={SKIN} class="stroke-ink" stroke-width="2" />
		<path d="M 96 56 Q 96 28 120 28 Q 146 28 144 56 Q 138 40 120 40 Q 104 40 96 56 Z" fill={HAIR} />
		<path
			d="M 106 54 q 5 -3 10 0 M 124 54 q 5 -3 10 0"
			class="fill-none stroke-ink"
			stroke-width="1.6"
			stroke-linecap="round"
		/>
		<circle cx="111" cy="61" r="2.4" class="fill-ink" />
		<circle cx="129" cy="61" r="2.4" class="fill-ink" />
		<path
			d="M 120 63 q -2 7 1 9"
			fill="none"
			stroke={SKIN_SHADE}
			stroke-width="1.6"
			stroke-linecap="round"
		/>
		<path
			d="M 112 77 q 8 4 16 0"
			fill="none"
			class="stroke-ink"
			stroke-width="1.6"
			stroke-linecap="round"
		/>

		<!-- Arms, then hands on top -->
		{@render limb(SR, right)}
		{@render limb(SL, left)}
		{@render hand(right.wrist, handAngle(right.angle, signal.tilt?.right), handRight, thumbRight)}
		{@render hand(left.wrist, handAngle(left.angle, signal.tilt?.left), handLeft, thumbLeft)}

		{#if signal.fingers && prefersReducedMotion.current}
			<text
				x="120"
				y="-30"
				text-anchor="middle"
				font-size="16"
				font-weight="700"
				class="fill-accent">{signal.fingers}</text
			>
		{/if}
		{#if extras.includes('line')}
			<line
				x1={right.wrist.x - 34}
				y1="240"
				x2={right.wrist.x + 34}
				y2="240"
				class="stroke-accent"
				stroke-width="4"
			/>
		{/if}
		{#if signal.motion && prefersReducedMotion.current}
			<!-- Without animation, an arrow shows the movement. -->
			<g class="fill-none stroke-accent" stroke-width="3" stroke-linecap="round">
				{#if signal.motion === 'spin' || signal.motion === 'circle'}
					<ellipse cx="120" cy="170" rx="44" ry="12" stroke-dasharray="6 4" />
				{:else if signal.motion === 'sweep'}
					<path
						d="M {SL.x - 10} {right.wrist.y - 18} L {right.wrist.x + 22} {right.wrist.y - 18}"
						marker-end="url(#{id}-arrow)"
					/>
				{:else if signal.motion === 'up'}
					<path
						d="M {right.wrist.x - 20} {right.wrist.y + 30} L {right.wrist.x - 20} {right.wrist.y}"
						marker-end="url(#{id}-arrow)"
					/>
				{:else if signal.motion === 'down'}
					<path
						d="M {right.wrist.x - 20} {right.wrist.y - 30} L {right.wrist.x - 20} {right.wrist.y}"
						marker-end="url(#{id}-arrow)"
					/>
				{:else if signal.motion === 'brush'}
					<path
						d="M {left.wrist.x + 18} {left.wrist.y - 6} L {left.wrist.x - 6} {left.wrist.y - 16}"
						marker-end="url(#{id}-arrow)"
					/>
				{/if}
			</g>
		{/if}
	</g>
</svg>
