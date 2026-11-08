<script lang="ts">
	import type { Point } from '#lib/volley/model.js';

	/** A movement on a Court, from one point to another, in metres. */
	let {
		from,
		to,
		dashed = false,
		strong = false
	}: { from: Point; to: Point; dashed?: boolean; strong?: boolean } = $props();

	// Stop short of the target so the head does not hide under a player token.
	const geometry = $derived.by(() => {
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const len = Math.hypot(dx, dy);
		if (len < 0.9) return undefined;
		const ux = dx / len;
		const uy = dy / len;
		const start = { x: from.x + ux * 0.5, y: from.y + uy * 0.5 };
		const tip = { x: to.x - ux * 0.5, y: to.y - uy * 0.5 };
		const head = 0.38;
		const base = { x: tip.x - ux * head, y: tip.y - uy * head };
		const left = { x: base.x - uy * head * 0.6, y: base.y + ux * head * 0.6 };
		const right = { x: base.x + uy * head * 0.6, y: base.y - ux * head * 0.6 };
		return { start, base, tip, left, right };
	});
</script>

{#if geometry}
	{@const g = geometry}
	<g
		class={strong ? 'fill-accent stroke-accent' : 'fill-ink stroke-ink opacity-60'}
		aria-hidden="true"
	>
		<line
			x1={g.start.x}
			y1={g.start.y}
			x2={g.base.x}
			y2={g.base.y}
			stroke-width={strong ? 0.11 : 0.07}
			stroke-dasharray={dashed ? '0.25 0.18' : undefined}
			stroke-linecap="round"
		/>
		<polygon
			points="{g.tip.x},{g.tip.y} {g.left.x},{g.left.y} {g.right.x},{g.right.y}"
			stroke="none"
		/>
	</g>
{/if}
