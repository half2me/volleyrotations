<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	/** A player on a Court, gliding to each new position. Coordinates are metres. */
	let {
		x,
		y,
		label,
		kind = 'team',
		you = false,
		faded = false,
		setter = false,
		title
	}: {
		x: number;
		y: number;
		/** Up to three characters drawn on the token. */
		label: string;
		kind?: 'team' | 'libero';
		/** The reader's own player: ringed in the accent colour. */
		you?: boolean;
		faded?: boolean;
		/** Marks the player who sets in this rotation with a small ball. */
		setter?: boolean;
		/** A longer name, shown as a tooltip. */
		title?: string;
	} = $props();

	const pos = Tween.of(() => ({ x, y }), {
		duration: () => (prefersReducedMotion.current ? 0 : 650),
		easing: cubicInOut
	});
</script>

<g
	transform="translate({pos.current.x} {pos.current.y})"
	class={['transition-opacity', faded && 'opacity-35']}
	aria-hidden="true"
>
	{#if title}<title>{title}</title>{/if}
	{#if you}
		<circle r="0.72" class="fill-accent opacity-25" />
		<circle r="0.6" class="fill-none stroke-accent" stroke-width="0.12" />
	{/if}
	<circle
		r="0.46"
		class={kind === 'libero' ? 'fill-libero' : 'fill-team'}
		stroke-width="0.06"
		stroke="var(--color-paper)"
	/>
	<text
		text-anchor="middle"
		dominant-baseline="central"
		font-size={label.length > 2 ? 0.32 : 0.4}
		font-weight="700"
		class={kind === 'libero' ? 'fill-libero-ink' : 'fill-team-ink'}>{label}</text
	>
	{#if setter}
		<circle cx="0.4" cy="-0.4" r="0.18" class="fill-paper stroke-ink" stroke-width="0.06" />
		<path
			d="M0.22 -0.4 Q0.4 -0.3 0.58 -0.4 M0.4 -0.58 Q0.32 -0.4 0.4 -0.22"
			class="fill-none stroke-ink"
			stroke-width="0.04"
		/>
	{/if}
</g>
