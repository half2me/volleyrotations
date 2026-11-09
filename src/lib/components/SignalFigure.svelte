<script lang="ts">
	import Hand, { SKIN, LINE, SKIN_SHADE } from '#lib/components/figure/Hand.svelte';
	import type { Pose, Signal } from '#lib/signals.js';
	import { cubicInOut, cubicOut, linear } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/**
	 * A referee's upper body, facing the reader, acting out a signal. The referee's right arm is
	 * on the reader's left. Poses come from `signals.ts`; the written gesture there is the
	 * authority.
	 *
	 * Each arm is a shoulder, an elbow and a wrist. A pose gives either the joint angles or the
	 * point the wrist should reach, which is solved for the elbow. Arms carry a depth, so a forearm
	 * can pass behind the body or over the other arm, and the hands are drawn by `Hand`.
	 *
	 * Skin, hair, cards and flags keep their real colours in both themes; the shirt and outlines
	 * use theme tokens so the figure reads on light and dark backgrounds.
	 */
	let { signal }: { signal: Signal } = $props();

	const UPPER = 58;
	const FORE = 52;
	const HAND_SCALE = 1.5;
	/** The usual referee kit: a white polo with dark trim. */
	const SHIRT = '#ffffff';
	const SHIRT_SHADE = '#dde2ea';
	const TRIM = '#1b2a4a';
	const HAIR = '#4a3324';
	const rad = (deg: number) => (deg * Math.PI) / 180;
	const deg = (r: number) => (r * 180) / Math.PI;

	type Point = { x: number; y: number };
	type Limb = { elbow: Point; wrist: Point; angle: number };
	type SideName = 'left' | 'right';

	/** The referee's right shoulder is on the reader's left. */
	const SHOULDER: Record<SideName, Point> = { right: { x: 80, y: 130 }, left: { x: 160, y: 130 } };
	/** -1 for the arm on the reader's left (the referee's right), 1 for the other. */
	const SIDE: Record<SideName, -1 | 1> = { right: -1, left: 1 };
	const REST: Pose = { upper: 6, fore: 4 };

	const isAngles = (p: Pose): p is { upper: number; fore: number } => 'upper' in p;

	/** Forward kinematics: elbow and wrist from joint angles. */
	function fromAngles(side: SideName, a: { upper: number; fore: number }): Limb {
		const s = SHOULDER[side];
		const k = SIDE[side];
		const elbow = {
			x: s.x + k * UPPER * Math.sin(rad(a.upper)),
			y: s.y + UPPER * Math.cos(rad(a.upper))
		};
		const wrist = {
			x: elbow.x + k * FORE * Math.sin(rad(a.fore)),
			y: elbow.y + FORE * Math.cos(rad(a.fore))
		};
		return { elbow, wrist, angle: handAngle(elbow, wrist) };
	}

	/** Where the fingers point when the hand carries on from the forearm, in screen degrees (0 is down). */
	const handAngle = (elbow: Point, wrist: Point) =>
		deg(Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x)) - 90;

	/**
	 * Inverse kinematics: the elbow for a wrist at `target`, clamped to what the arm can reach.
	 * Of the two solutions the lower elbow is taken, which is how an arm naturally hangs, bends
	 * across the chest or folds up with the hand raised.
	 */
	function toPoint(side: SideName, target: Point): Limb {
		const s = SHOULDER[side];
		const dx = target.x - s.x;
		const dy = target.y - s.y;
		const d = Math.min(
			UPPER + FORE - 0.5,
			Math.max(Math.abs(UPPER - FORE) + 1, Math.hypot(dx, dy))
		);
		const base = Math.atan2(dy, dx);
		const bend = Math.acos((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d));
		const elbow = [base + bend, base - bend]
			.map((th) => ({ x: s.x + UPPER * Math.cos(th), y: s.y + UPPER * Math.sin(th) }))
			.sort((p, q) => q.y - p.y)[0];
		const wrist = { x: s.x + Math.cos(base) * d, y: s.y + Math.sin(base) * d };
		return { elbow, wrist, angle: handAngle(elbow, wrist) };
	}

	const limbOf = (side: SideName, p: Pose): Limb =>
		isAngles(p) ? fromAngles(side, p) : toPoint(side, p);
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
	const lerpPoint = (a: Point, b: Point, t: number): Point => ({
		x: lerp(a.x, b.x, t),
		y: lerp(a.y, b.y, t)
	});
	/** Between two angles the short way round. */
	const lerpAngle = (a: number, b: number, t: number) => {
		const d = ((((b - a) % 360) + 540) % 360) - 180;
		return a + d * t;
	};

	/**
	 * How far through the movement the figure is: 0 is the starting pose, 1 the signal. The referee
	 * raises the arms into the signal, holds it and lowers them; a repeated movement swings back and
	 * forth. `phase` turns continuously for signals that circle. Still for readers who prefer less
	 * motion, and while off screen.
	 */
	const t = new Tween(1, { easing: cubicInOut });
	const phase = new Tween(0, { easing: linear });
	let figure: SVGSVGElement | undefined = $state();
	let visible = $state(false);
	const circles = $derived(!!signal.orbit || !!signal.spin);

	$effect(() => {
		if (!figure) return;
		const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
		observer.observe(figure);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!visible || prefersReducedMotion.current) {
			t.set(1, { duration: 0 });
			phase.set(signal.spin ? 0.2 : 0, { duration: 0 });
			return;
		}
		let stopped = false;
		const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
		const rise = signal.slow ? 1500 : 650;
		(async () => {
			await t.set(0, { duration: 0 });
			await phase.set(0, { duration: 0 });
			await wait(300);
			while (!stopped) {
				if (circles) {
					await t.set(1, { duration: rise, easing: cubicOut });
					while (!stopped) {
						await phase.set(0, { duration: 0 });
						await phase.set(1, { duration: signal.spin ? 2600 : 1500 });
					}
				} else if (signal.repeat) {
					await t.set(1, { duration: 700 });
					if (stopped) break;
					await t.set(0, { duration: 700 });
				} else {
					await t.set(1, { duration: rise, easing: cubicOut });
					await wait(1900);
					if (stopped) break;
					await t.set(0, { duration: 600 });
					await wait(700);
				}
			}
		})();
		return () => {
			stopped = true;
		};
	});

	/** Where the thumb sits, as `Hand` wants it: palm to the reader puts it away from the body. */
	const thumbSide = (side: SideName, view: 'palm' | 'back' | 'edge' | undefined) =>
		view === 'edge' ? 0 : (view === 'back' ? -1 : 1) * -SIDE[side];

	/** One arm at the current moment: its joints, depth and how its hand is drawn. */
	function pose(side: SideName) {
		const to = signal[side];
		const from = signal.from?.[side] ?? REST;
		const at = t.current;
		let limb: Limb;
		if (isAngles(from) && isAngles(to) && signal.path !== 'line') {
			limb = fromAngles(side, {
				upper: lerp(from.upper, to.upper, at),
				fore: lerp(from.fore, to.fore, at)
			});
		} else {
			limb = toPoint(side, lerpPoint(limbOf(side, from).wrist, limbOf(side, to).wrist, at));
		}
		let depth = side === 'right' ? 0.1 : 0;
		const turn = phase.current * 2 * Math.PI;
		const orbit = signal.orbit;
		if (orbit && orbit[side] !== undefined) {
			const th = turn + orbit[side]! * 2 * Math.PI;
			const centre = orbit.common
				? lerpPoint(limbOf('right', signal.right).wrist, limbOf('left', signal.left).wrist, 0.5)
				: limbOf(side, to).wrist;
			const target = {
				x: centre.x + orbit.rx * Math.sin(th),
				y: centre.y - orbit.ry * Math.cos(th)
			};
			limb = toPoint(side, lerpPoint(limb.wrist, target, at));
			depth = Math.sin(th);
		}
		const spin = signal.spin;
		if (spin) {
			const th = turn + (side === 'left' ? Math.PI : 0);
			const rest = limbOf(side, to).wrist;
			const target = { x: rest.x + spin.amplitude * Math.sin(th), y: rest.y };
			limb = toPoint(side, lerpPoint(limb.wrist, target, at));
			depth = Math.cos(th) * at;
		}
		const tilt = signal.tilt?.[side];
		const angle = tilt === undefined ? limb.angle : lerpAngle(limb.angle, tilt, at);
		const viewTo = signal.views?.[side] ?? 'palm';
		const viewFrom = signal.viewsFrom?.[side] ?? viewTo;
		const thumb = lerp(thumbSide(side, viewFrom), thumbSide(side, viewTo), at);
		const kind = signal.hands?.[side] ?? 'open';
		const counted = kind === 'two' || kind === 'four' || kind === 'five' || kind === 'point';
		// The flag's cloth flies away from the body, whichever way the pole points.
		const outward = -SIDE[side];
		const localX = Math.cos(rad(angle));
		const flagSide = Math.abs(localX) < 0.2 ? 1 : Math.sign(localX) * outward;
		return {
			side,
			...limb,
			depth,
			angle,
			kind,
			view: at < 0.5 ? viewFrom : viewTo,
			thumb,
			extend: counted ? at : 1,
			flagSide
		};
	}

	const right = $derived(pose('right'));
	const left = $derived(pose('left'));
	/** Arms from the farthest to the nearest; those behind the body are drawn before it. */
	const arms = $derived([right, left].sort((a, b) => a.depth - b.depth));
	const behind = $derived(arms.filter((a) => a.depth < -0.05));
	const front = $derived(arms.filter((a) => a.depth >= -0.05));
	const extras = $derived(signal.props ?? []);
	/** The net, drawn at the height of the hand that points to it. */
	const netY = $derived(right.wrist.y + (signal.id === 'reach-over' ? 14 : 4));
	const id = $props.id();

	/**
	 * The picture's width, from how far the arms reach in any of the signal's poses; its height is
	 * fixed so every figure is drawn at the same scale and figures with their arms out are only
	 * scaled down to fit.
	 */
	const TOP = -92;
	const BOTTOM = 276;
	const box = $derived.by(() => {
		const xs: number[] = [60, 180];
		for (const side of ['right', 'left'] as const) {
			for (const p of [signal[side], signal.from?.[side], REST]) {
				if (!p) continue;
				const w = limbOf(side, p).wrist;
				const reach = 70 + (signal.spin?.amplitude ?? 0) + (signal.orbit?.rx ?? 0);
				xs.push(w.x - reach, w.x + reach);
			}
		}
		if (extras.includes('net')) xs.push(-60);
		const min = Math.min(...xs);
		const max = Math.max(...xs);
		const width = Math.max(300, max - min);
		const x = Math.min(min, 120 - width / 2);
		return { x, width: Math.max(width, 240 - x) };
	});
</script>

<!-- An arm: a short sleeve at the shoulder, then skin to the wrist, tapering towards the hand. -->
{#snippet limb(a: { side: SideName; elbow: Point; wrist: Point })}
	{@const s = SHOULDER[a.side]}
	{@const mid = { x: lerp(s.x, a.elbow.x, 0.5), y: lerp(s.y, a.elbow.y, 0.5) }}
	{@const band = { x: lerp(s.x, a.elbow.x, 0.42), y: lerp(s.y, a.elbow.y, 0.42) }}
	<g stroke-linecap="round" stroke-linejoin="round" fill="none">
		<polyline
			points="{s.x},{s.y} {a.elbow.x},{a.elbow.y} {a.wrist.x},{a.wrist.y}"
			stroke={LINE}
			stroke-width="19.5"
		/>
		<line x1={s.x} y1={s.y} x2={a.elbow.x} y2={a.elbow.y} stroke={SKIN} stroke-width="16.5" />
		<line
			x1={a.elbow.x}
			y1={a.elbow.y}
			x2={a.wrist.x}
			y2={a.wrist.y}
			stroke={SKIN}
			stroke-width="16.5"
		/>
		<!-- Elbow crease and the wrist's narrowing. -->
		<circle cx={a.elbow.x} cy={a.elbow.y} r="3" fill={SKIN_SHADE} stroke="none" opacity="0.45" />
		<line
			x1={lerp(a.elbow.x, a.wrist.x, 0.55)}
			y1={lerp(a.elbow.y, a.wrist.y, 0.55)}
			x2={a.wrist.x}
			y2={a.wrist.y}
			stroke={SKIN}
			stroke-width="14"
		/>
		<line x1={s.x} y1={s.y} x2={mid.x} y2={mid.y} class="stroke-ink" stroke-width="24" />
		<line x1={s.x} y1={s.y} x2={mid.x} y2={mid.y} stroke={SHIRT} stroke-width="21" />
		<line
			x1={band.x}
			y1={band.y}
			x2={mid.x}
			y2={mid.y}
			stroke={TRIM}
			stroke-width="21"
			stroke-linecap="butt"
		/>
	</g>
{/snippet}

{#snippet arm(a: ReturnType<typeof pose>)}
	{@render limb(a)}
	<g transform="translate({a.wrist.x} {a.wrist.y}) rotate({a.angle}) scale({HAND_SCALE})">
		<Hand kind={a.kind} view={a.view} thumb={a.thumb} extend={a.extend} flagSide={a.flagSide} />
	</g>
{/snippet}

<svg
	bind:this={figure}
	viewBox="{box.x} {TOP} {box.width} {BOTTOM - TOP}"
	preserveAspectRatio="xMidYMid meet"
	class="h-auto w-full"
	style:aspect-ratio="300 / {BOTTOM - TOP}"
	aria-hidden="true"
>
	<defs>
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
		<pattern id="{id}-mesh" width="8" height="8" patternUnits="userSpaceOnUse">
			<path d="M 8 0 L 0 0 0 8" class="fill-none stroke-ink-soft" stroke-width="0.6" />
		</pattern>
	</defs>

	{#if extras.includes('net')}
		<!-- The net, its tape at the height of the hand. -->
		<rect
			x={box.x}
			y={netY}
			width={120 - box.x}
			height="44"
			class="fill-none stroke-ink-soft"
			stroke-width="1"
		/>
		<rect x={box.x} y={netY} width={120 - box.x} height="44" fill="url(#{id}-mesh)" />
		<rect
			x={box.x}
			y={netY - 3}
			width={120 - box.x}
			height="6"
			class="fill-paper stroke-ink"
			stroke-width="1"
		/>
		<!-- Antenna -->
		<line x1="116" y1={netY - 40} x2="116" y2={netY + 44} class="stroke-bad" stroke-width="2.5" />
		<line
			x1="116"
			y1={netY - 40}
			x2="116"
			y2={netY - 20}
			class="stroke-paper"
			stroke-width="2.5"
			stroke-dasharray="5 5"
		/>
	{/if}

	{#each behind as a (a.side)}{@render arm(a)}{/each}

	<!-- Torso and shirt -->
	<path
		d="M 68 124 Q 94 112 120 112 Q 146 112 172 124 Q 184 130 182 146 L 170 276 L 70 276 L 58 146 Q 56 130 68 124 Z"
		fill={SHIRT}
		class="stroke-ink"
		stroke-width="2"
	/>
	<path
		d="M 60 156 L 70 276 L 82 276 L 74 156 Z M 180 156 L 170 276 L 158 276 L 166 156 Z"
		fill={SHIRT_SHADE}
	/>
	<line x1="120" y1="132" x2="120" y2="162" stroke={TRIM} stroke-width="1.5" />
	<circle cx="120" cy="142" r="1.7" fill={TRIM} />
	<circle cx="120" cy="153" r="1.7" fill={TRIM} />
	<!-- Neck and collar -->
	<path
		d="M 109 82 L 131 82 L 133 116 Q 120 124 107 116 Z"
		fill={SKIN}
		stroke={LINE}
		stroke-width="1.5"
		stroke-linejoin="round"
	/>
	<path d="M 109 96 Q 120 102 131 96" fill="none" stroke={SKIN_SHADE} stroke-width="1.2" />
	<path
		d="M 100 114 L 120 136 L 110 112 Z M 140 114 L 120 136 L 130 112 Z"
		fill={TRIM}
		class="stroke-ink"
		stroke-width="1.4"
		stroke-linejoin="round"
	/>
	<!-- Lanyard and whistle -->
	<path
		d="M 108 118 Q 112 160 122 170 Q 130 160 132 118"
		class="fill-none stroke-ink"
		stroke-width="2"
	/>
	<g transform="translate(122 170)">
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
	<ellipse cx="95" cy="64" rx="5" ry="8" fill={SKIN} stroke={LINE} stroke-width="1.4" />
	<ellipse cx="145" cy="64" rx="5" ry="8" fill={SKIN} stroke={LINE} stroke-width="1.4" />
	<ellipse cx="120" cy="60" rx="25" ry="30" fill={SKIN} stroke={LINE} stroke-width="2" />
	<path d="M 95 56 Q 95 27 120 27 Q 146 27 145 56 Q 139 40 120 40 Q 103 40 95 56 Z" fill={HAIR} />
	<path
		d="M 106 53 q 5 -3 10 0 M 124 53 q 5 -3 10 0"
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
		d="M 112 78 q 8 4 16 0"
		fill="none"
		class="stroke-ink"
		stroke-width="1.6"
		stroke-linecap="round"
	/>

	{#each front as a (a.side)}{@render arm(a)}{/each}

	{#if extras.includes('line')}
		<line
			x1={right.wrist.x - 40}
			y1="258"
			x2={right.wrist.x + 40}
			y2="258"
			class="stroke-accent"
			stroke-width="4"
			stroke-linecap="round"
		/>
	{/if}
	{#if signal.fingers && prefersReducedMotion.current}
		<text x="120" y="-70" text-anchor="middle" font-size="18" font-weight="700" class="fill-accent"
			>{signal.fingers}</text
		>
	{/if}
	{#if signal.motion && prefersReducedMotion.current}
		<!-- Without animation, an arrow shows the movement. -->
		<g class="fill-none stroke-accent" stroke-width="3" stroke-linecap="round">
			{#if signal.motion === 'spin' || signal.motion === 'circle'}
				<ellipse
					cx={lerp(right.wrist.x, left.wrist.x, 0.5)}
					cy={right.wrist.y}
					rx={(signal.spin?.amplitude ?? signal.orbit?.rx ?? 20) + 10}
					ry="12"
					stroke-dasharray="6 4"
				/>
			{:else if signal.motion === 'sweep'}
				<path
					d="M {SHOULDER.left.x - 10} {right.wrist.y - 22} L {right.wrist.x + 26} {right.wrist.y -
						22}"
					marker-end="url(#{id}-arrow)"
				/>
			{:else if signal.motion === 'up'}
				<path
					d="M {right.wrist.x - 24} {right.wrist.y + 34} L {right.wrist.x - 24} {right.wrist.y + 2}"
					marker-end="url(#{id}-arrow)"
				/>
			{:else if signal.motion === 'down'}
				<path
					d="M {right.wrist.x - 24} {right.wrist.y - 34} L {right.wrist.x - 24} {right.wrist.y - 2}"
					marker-end="url(#{id}-arrow)"
				/>
			{:else if signal.motion === 'brush'}
				<path
					d="M {right.wrist.x - 10} {right.wrist.y - 20} L {right.wrist.x + 30} {right.wrist.y -
						20}"
					marker-end="url(#{id}-arrow)"
				/>
			{/if}
		</g>
	{/if}
</svg>
