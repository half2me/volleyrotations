<script lang="ts">
	import type { Placed } from '#lib/volley/formations.js';
	import { coverageAreas } from '#lib/volley/coverage.js';
	import { roleName, roleShort, taskName } from '#lib/volley/labels.js';
	import { m } from '#lib/paraglide/messages.js';
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
		names,
		table = true
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
		/**
		 * A table of everyone's spot for screen readers. Leave it out where the diagram sits inside
		 * a button, which cannot hold a table.
		 */
		table?: boolean;
	} = $props();

	const metres = (n: number) => (Math.round(n * 10) / 10).toLocaleString(m.number_locale());

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
	<!-- The setter's run is always drawn, even on diagrams that leave out the other runs. -->
	{#each placed as p (p.role)}
		{#if p.run && p.role !== you && (runs || p.setter)}<Arrow from={p} to={p.run} dashed />{/if}
	{/each}
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
			setter={p.setter}
		/>
	{/each}
</Court>

{#if table && placed.length}
	<!-- The wrapper hides the table: a table itself grows to fit its content whatever its width. -->
	<div class="sr-only">
		<table>
			<caption>{label}</caption>
			<thead>
				<tr>
					<th scope="col">{m.table_player()}</th>
					<th scope="col">{m.table_zone()}</th>
					<th scope="col">{m.table_task()}</th>
					<th scope="col">{m.table_where()}</th>
				</tr>
			</thead>
			<tbody>
				{#each placed as p (p.role)}
					<tr>
						<th scope="row"
							>{names?.[p.role] ? `${names[p.role]} (${roleName(p.role)})` : roleName(p.role)}</th
						>
						<td>{p.zone}</td>
						<td>{taskName(p.task)}</td>
						<td>
							{p.y > 9
								? m.where_behind({ x: metres(p.x) })
								: m.where_metres({ net: metres(Math.max(0, p.y)), left: metres(p.x) })}
							{#if p.run}{m.where_then({
									net: metres(Math.max(0, p.run.y)),
									left: metres(p.run.x)
								})}{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
