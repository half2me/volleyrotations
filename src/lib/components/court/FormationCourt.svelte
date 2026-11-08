<script lang="ts">
	import type { Placed } from '#lib/volley/formations.js';
	import { coverageAreas } from '#lib/volley/coverage.js';
	import { roleName, roleShort } from '#lib/volley/labels.js';
	import type { Point, RoleId } from '#lib/volley/model.js';
	import Arrow from './Arrow.svelte';
	import Court from './Court.svelte';
	import PlayerToken from './PlayerToken.svelte';

	/** One moment of a rally: the six players, the reader's area and where everyone runs next. */
	let {
		placed,
		label,
		you,
		previous,
		area = false,
		runs = true,
		zones = true,
		names
	}: {
		placed: Placed[];
		label: string;
		/** The reader's role, ringed and given an area. */
		you?: RoleId;
		/** The moment before, to draw the reader's path from it. */
		previous?: Placed[];
		/** Shade the reader's area among the passers or diggers. */
		area?: boolean;
		runs?: boolean;
		zones?: boolean;
		/** Short labels to draw instead of role abbreviations, such as shirt numbers. */
		names?: Partial<Record<RoleId, string>>;
	} = $props();

	const mine = $derived(placed.find((p) => p.role === you));

	const yourArea = $derived.by((): Point[] | undefined => {
		if (!area || !mine) return undefined;
		const group = placed.filter((p) =>
			mine.task === 'pass' ? p.task === 'pass' : p.task === 'dig' || p.task === 'tip'
		);
		if (!group.includes(mine)) return undefined;
		const region =
			mine.task === 'pass' ? { x0: 0, y0: 2.5, x1: 9, y1: 9 } : { x0: 0, y0: 0, x1: 9, y1: 9 };
		return coverageAreas(group, region)[group.indexOf(mine)];
	});

	const before = $derived(previous?.find((p) => p.role === you));
</script>

<Court {label} {zones}>
	{#if yourArea}
		<polygon
			points={yourArea.map((p) => `${p.x},${p.y}`).join(' ')}
			class="fill-accent stroke-accent opacity-30"
			stroke-width="0.06"
		/>
	{/if}
	{#if runs}
		{#each placed as p (p.role)}
			{#if p.run && p.role !== you}<Arrow from={p} to={p.run} dashed />{/if}
		{/each}
	{/if}
	{#if mine && before && (before.x !== mine.x || before.y !== mine.y)}
		<Arrow from={before} to={mine} strong />
	{/if}
	{#if mine?.run}<Arrow from={mine} to={mine.run} dashed strong />{/if}
	{#each placed as p (p.role)}
		<PlayerToken
			x={p.x}
			y={p.y}
			label={names?.[p.role] ?? roleShort(p.role)}
			title={roleName(p.role)}
			kind={p.role === 'L' ? 'libero' : 'team'}
			you={p.role === you}
		/>
	{/each}
</Court>
