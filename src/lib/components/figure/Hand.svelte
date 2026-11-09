<script lang="ts" module>
	/** What a hand does: open palm, counted fingers, a fist, a thumb up, or holding something. */
	export type HandKind =
		| 'open'
		| 'point'
		| 'fist'
		| 'thumb'
		| 'two'
		| 'four'
		| 'five'
		| 'yellow'
		| 'red'
		| 'both-cards'
		| 'flag';
	/**
	 * Which way the hand faces the viewer: palm, back of the hand (knuckles and nails), or edge-on
	 * with the thumb towards the viewer, as a hand held upright for a T.
	 */
	export type HandView = 'palm' | 'back' | 'edge';

	export const SKIN = '#e8b48e';
	export const SKIN_SHADE = '#c98a60';
	export const NAIL = '#f6d7c3';
	/** Outline of skin: dark enough to separate every finger on skin, shirt and paper. */
	export const LINE = '#3b2214';
	export const YELLOW = '#f5c400';
	export const RED = '#d7263d';
</script>

<script lang="ts">
	/**
	 * A hand in local coordinates: the wrist at the origin, the fingers pointing towards +y. The
	 * parent rotates and scales it into place. `thumb` is the side of the hand the thumb is on, -1
	 * for -x and 1 for +x; a value in between draws the thumb rolling across as the hand turns.
	 * `extend` is how far the counted fingers are out, 0 curled to 1 straight, so a number can be
	 * shown as the hand comes up.
	 */
	let {
		kind = 'open',
		view = 'palm',
		thumb = 1,
		extend = 1,
		flagSide = 1
	}: {
		kind?: HandKind;
		view?: HandView;
		thumb?: number;
		extend?: number;
		/** Which side of the pole the flag's cloth flies on, in local x. */
		flagSide?: number;
	} = $props();

	const side = $derived(thumb >= 0 ? 1 : -1);
	const holdsCard = $derived(kind === 'yellow' || kind === 'red' || kind === 'both-cards');
	/** Fingers from index to little: base x along the knuckle line, width and full length. */
	const FINGERS = [
		{ x: 7.6, w: 5.2, l: 18 },
		{ x: 2.6, w: 5, l: 20.5 },
		{ x: -2.4, w: 4.8, l: 18.5 },
		{ x: -7.4, w: 4.4, l: 14.5 }
	];
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
	/** How much each finger is out and how far the hand spreads, by kind. */
	const out = $derived.by((): { fingers: number[]; spread: number } => {
		switch (kind) {
			case 'open':
				return { fingers: [extend, extend, extend, extend], spread: 9 };
			case 'five':
				return { fingers: [1, 1, 1, 1], spread: 20 };
			case 'four':
				return { fingers: [extend, extend, extend, extend], spread: 16 };
			case 'two':
				return { fingers: [extend, extend, 0, 0], spread: 22 };
			case 'point':
				return { fingers: [extend, 0, 0, 0], spread: 0 };
			default:
				return { fingers: [0, 0, 0, 0], spread: 0 };
		}
	});
	const KNUCKLE_Y = 17;
</script>

<!-- One finger from the knuckle line, tapering to a rounded tip, with creases or a nail. -->
{#snippet finger(x: number, w: number, full: number, amount: number, spread: number)}
	{@const l = lerp(6.5, full, amount)}
	{@const tilt = -(x / 7.6) * spread * amount}
	{@const r = w * 0.42}
	<g transform="translate({x} {KNUCKLE_Y}) rotate({tilt})">
		<path
			d="M {-w / 2} -2.5 L {-w / 2} {l * 0.5} L {-r} {l - r} A {r} {r} 0 0 1 {r} {l - r} L {w /
				2} {l * 0.5} L {w / 2} -2.5 Z"
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.5"
			stroke-linejoin="round"
		/>
		{#if amount > 0.6}
			{#if view === 'back'}
				<ellipse
					cx="0"
					cy={l - r - 1}
					rx={r * 0.62}
					ry={r * 0.85}
					fill={NAIL}
					stroke={LINE}
					stroke-width="0.9"
				/>
				<path
					d="M {-w * 0.3} {l * 0.4} q {w * 0.3} -2 {w * 0.6} 0"
					fill="none"
					stroke={SKIN_SHADE}
					stroke-width="1"
				/>
			{:else}
				<line
					x1={-w * 0.3}
					y1={l * 0.4}
					x2={w * 0.3}
					y2={l * 0.4}
					stroke={SKIN_SHADE}
					stroke-width="1.1"
				/>
				<line
					x1={-w * 0.3}
					y1={l * 0.72}
					x2={w * 0.3}
					y2={l * 0.72}
					stroke={SKIN_SHADE}
					stroke-width="1.1"
				/>
			{/if}
		{:else}
			<!-- Curled: the first knuckle, with the folded finger's shadow under it. -->
			<path
				d="M {-w * 0.35} {l - 1.5} q {w * 0.35} 2.5 {w * 0.7} 0"
				fill="none"
				stroke={SKIN_SHADE}
				stroke-width="1.2"
			/>
		{/if}
	</g>
{/snippet}

<!-- The thumb as a capsule from `at`, pointing along `angle` (0 is +y, towards the fingers). -->
{#snippet thumbShape(x: number, y: number, angle: number, length: number, width = 5.8)}
	<g transform="translate({x} {y}) rotate({angle})">
		<rect
			x={-width / 2}
			y={-width / 2}
			{width}
			height={length + width / 2}
			rx={width / 2}
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.5"
		/>
		{#if view === 'back' || angle === 0}
			<ellipse
				cx="0"
				cy={length - width * 0.1}
				rx={width * 0.26}
				ry={width * 0.36}
				fill={NAIL}
				stroke={LINE}
				stroke-width="0.9"
			/>
		{:else}
			<line
				x1={-width * 0.28}
				y1={length * 0.55}
				x2={width * 0.28}
				y2={length * 0.55}
				stroke={SKIN_SHADE}
				stroke-width="1"
			/>
		{/if}
	</g>
{/snippet}

<g>
	{#if kind === 'flag'}
		<!-- Pole along the forearm, through the fist; cloth at the far end. -->
		<line
			x1="0"
			y1="-16"
			x2="0"
			y2="62"
			class="stroke-ink"
			stroke-width="2.8"
			stroke-linecap="round"
		/>
		<path
			d="M 0 62 L 0 42 L {flagSide * 27} 40 Q {flagSide * 23} 51 {flagSide * 27} 62 Z"
			fill={RED}
			class="stroke-ink"
			stroke-width="1.1"
			stroke-linejoin="round"
		/>
		<path d="M 0 42 L {flagSide * 13.5} 41 L {flagSide * 13.5} 52 L 0 52 Z" fill={YELLOW} />
		<path
			d="M {flagSide * 13.5} 52 L {flagSide * 24.5} 51.5 L {flagSide * 27} 62 L {flagSide *
				13.5} 62 Z"
			fill={YELLOW}
		/>
		<!-- A fist seen from the side, the fingers wrapped around the pole. -->
		<rect
			x="-8.5"
			y="-2"
			width="17"
			height="25"
			rx="6"
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.6"
		/>
		<path
			d="M -7 6 L 7 6 M -7 12 L 7 12 M -7 18 L 7 18"
			fill="none"
			stroke={LINE}
			stroke-width="1.1"
			stroke-linecap="round"
		/>
		{@render thumbShape(thumb * 1.5, 20, thumb * 8, 9, 6)}
	{:else if view === 'edge'}
		<!-- Edge-on: a narrow palm, the fingers together, the thumb lying along the palm. -->
		<path
			d="M -5 -2 L 5 -2 L 5 18 Q 5 20 3 20 L -3 20 Q -5 20 -5 18 Z"
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.5"
		/>
		<path
			d="M -4.6 18 L -4 34 Q -3.6 38 0 38 Q 3.6 38 4 34 L 4.6 18 Z"
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.5"
			stroke-linejoin="round"
		/>
		<path
			d="M -1.5 19 L -1.2 36 M 1.5 19 L 1.2 36"
			fill="none"
			stroke={SKIN_SHADE}
			stroke-width="0.9"
		/>
		{@render thumbShape(2.2, 4, -6, 11, 4.6)}
	{:else}
		<!-- A thumb folded across the palm lies behind the back of the hand. -->
		{#if view === 'back' && (kind === 'fist' || kind === 'point' || kind === 'two' || kind === 'four')}
			{@render thumbShape(thumb * 8, 4, thumb * 62, 12)}
		{/if}
		<!-- Palm: wider at the knuckles than the wrist. -->
		<path
			d="M -8 -2 L 8 -2 Q 10 -2 10.2 1 L 10.8 14 Q 11 {KNUCKLE_Y + 2} 6 {KNUCKLE_Y +
				2} L -6 {KNUCKLE_Y + 2} Q -11 {KNUCKLE_Y + 2} -10.8 14 L -10.2 1 Q -10 -2 -8 -2 Z"
			fill={SKIN}
			stroke={LINE}
			stroke-width="1.6"
			stroke-linejoin="round"
		/>
		{#if view === 'palm'}
			<path
				d="M {-side * 7} 4 Q {-side * 2} 9 {side * 5} 15 M {-side * 6} 13 Q 0 10 {side * 7} 7"
				fill="none"
				stroke={SKIN_SHADE}
				stroke-width="1"
				stroke-linecap="round"
			/>
		{:else}
			<path
				d="M -7 {KNUCKLE_Y - 2} L -5 {KNUCKLE_Y - 4} M -2 {KNUCKLE_Y - 2.5} L 0 {KNUCKLE_Y -
					4.5} M 3 {KNUCKLE_Y - 2.5} L 5 {KNUCKLE_Y - 4.5}"
				fill="none"
				stroke={SKIN_SHADE}
				stroke-width="1"
				stroke-linecap="round"
			/>
		{/if}
		{#if holdsCard}
			<!-- The card stands in the fist, the fingers closed on its lower edge and the thumb across its face. -->
			{#if kind === 'both-cards'}
				<rect
					x="-5"
					y="6"
					width="24"
					height="34"
					rx="2"
					fill={RED}
					class="stroke-ink"
					stroke-width="1.1"
					transform="rotate(-13 7 40)"
				/>
			{/if}
			<rect
				x="-12"
				y="6"
				width="24"
				height="34"
				rx="2"
				fill={kind === 'red' ? RED : YELLOW}
				class="stroke-ink"
				stroke-width="1.1"
			/>
		{/if}
		<!-- Fingers, index nearest the thumb. -->
		{#each FINGERS as f, i (i)}
			{@render finger(side * f.x, f.w, f.l, out.fingers[i], out.spread)}
		{/each}
		<!-- Thumb -->
		{#if holdsCard}
			{@render thumbShape(thumb * 6.5, 4, thumb * 10, 15)}
		{:else if kind === 'thumb'}
			{@render thumbShape(thumb * 8, 8, 0, 20, 6.6)}
		{:else if kind === 'open'}
			{@render thumbShape(thumb * 9, 6, -thumb * 42, 17)}
		{:else if kind === 'five'}
			{@render thumbShape(thumb * 9.5, 4, -thumb * 72, 16.5)}
		{:else if view === 'palm'}
			{@render thumbShape(thumb * 8.5, 4, thumb * 62, 12.5)}
		{/if}
	{/if}
</g>
