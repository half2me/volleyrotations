<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { capitalize, roleRef, roleShort, zoneRef } from '#lib/volley/labels.js';
	import {
		COLUMN_PAIRS,
		ROW_ORDER,
		type OnCourt,
		type Point,
		type RoleId,
		type Zone
	} from '#lib/volley/model.js';
	import type { OverlapFault } from '#lib/volley/overlap.js';
	import Court from './Court.svelte';

	/**
	 * A court whose players can be dragged, or moved with the arrow keys, with the rule 7.4
	 * relations drawn between them: green while kept, red when broken.
	 */
	let {
		court,
		positions = $bindable(),
		faults,
		label,
		exempt = [],
		names,
		keysId
	}: {
		court: OnCourt[];
		positions: Record<Zone, Point>;
		faults: OverlapFault[];
		label: string;
		/** Zones left out of the check, such as the server's, who also stays put. */
		exempt?: readonly Zone[];
		names?: Partial<Record<RoleId, string>>;
		/** The id of the text that explains the keyboard controls. */
		keysId: string;
	} = $props();

	const broken = (a: Zone, b: Zone) => faults.some((f) => f.a === a && f.b === b);
	const who = (z: Zone) => {
		const p = court.find((c) => c.zone === z)!;
		return m.player_in_zone({ name: roleRef(p.role), zone: zoneRef(z) });
	};
	const movable = $derived(court.filter((p) => !exempt.includes(p.zone)));
	const relations = $derived(
		[...COLUMN_PAIRS, ...ROW_ORDER]
			.map(([a, b]) => ({ a, b }))
			.filter((r) => !exempt.includes(r.a) && !exempt.includes(r.b))
	);

	// Dragging: pointer coordinates to court metres through the SVG's own transform.
	let dragging: Zone | undefined = $state();
	let selected: Zone | undefined = $state();

	const clamp = (p: Point): Point => ({
		x: Math.min(8.8, Math.max(0.2, p.x)),
		y: Math.min(8.8, Math.max(0.2, p.y))
	});

	function toCourt(e: PointerEvent): Point {
		const el = e.currentTarget as SVGGraphicsElement;
		const svg = el instanceof SVGSVGElement ? el : el.ownerSVGElement!;
		const ctm = svg.getScreenCTM()!.inverse();
		const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm);
		return clamp(p);
	}

	function move(z: Zone, p: Point) {
		positions = { ...positions, [z]: p };
	}

	function onkeydown(e: KeyboardEvent, z: Zone) {
		const step = e.shiftKey ? 1 : 0.25;
		const d = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step]
		}[e.key];
		if (!d) return;
		e.preventDefault();
		const p = positions[z];
		move(z, clamp({ x: p.x + d[0], y: p.y + d[1] }));
	}
</script>

<Court
	{label}
	serviceZone={exempt.length > 0}
	role="group"
	onpointermove={(e) => {
		if (dragging) move(dragging, toCourt(e));
	}}
	onpointerup={() => (dragging = undefined)}
	onpointercancel={() => (dragging = undefined)}
>
	{#each relations as r (`${r.a}-${r.b}`)}
		<line
			x1={positions[r.a].x}
			y1={positions[r.a].y}
			x2={positions[r.b].x}
			y2={positions[r.b].y}
			class={broken(r.a, r.b) ? 'stroke-bad' : 'stroke-good'}
			stroke-width={broken(r.a, r.b) ? 0.12 : 0.06}
			stroke-dasharray={broken(r.a, r.b) ? undefined : '0.2 0.15'}
		/>
	{/each}
	{#each movable as p (p.zone)}
		{@const at = positions[p.zone]}
		{@const bad = faults.some((f) => f.a === p.zone || f.b === p.zone)}
		<g
			transform="translate({at.x} {at.y})"
			role="button"
			tabindex="0"
			aria-label={m.overlap_player({ who: capitalize(who(p.zone)) })}
			aria-describedby={keysId}
			class="cursor-grab outline-none active:cursor-grabbing"
			onpointerdown={(e) => {
				e.preventDefault();
				dragging = p.zone;
				selected = p.zone;
				(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
			}}
			onpointermove={(e) => {
				if (dragging === p.zone) move(p.zone, toCourt(e));
			}}
			onpointerup={() => (dragging = undefined)}
			onfocus={() => (selected = p.zone)}
			onkeydown={(e) => onkeydown(e, p.zone)}
		>
			{#if selected === p.zone}
				<circle r="0.68" class="fill-none stroke-accent" stroke-width="0.1" />
			{/if}
			<circle r="0.5" class={p.role === 'L' ? 'fill-libero' : 'fill-team'} />
			{#if bad}<circle r="0.5" class="fill-none stroke-bad" stroke-width="0.12" />{/if}
		</g>
	{/each}
	<!-- Token labels sit outside the focusable groups: each group's accessible name is its
	     aria-label, which already names the player and zone. Exempt players are drawn here only. -->
	{#each court as p (p.zone)}
		{@const at = positions[p.zone]}
		<g transform="translate({at.x} {at.y})" class="pointer-events-none" aria-hidden="true">
			{#if exempt.includes(p.zone)}
				<circle r="0.5" class={p.role === 'L' ? 'fill-libero' : 'fill-team'} opacity="0.6" />
			{/if}
			<text
				text-anchor="middle"
				dominant-baseline="central"
				font-size="0.3"
				font-weight="700"
				y="-0.1"
				class={p.role === 'L' ? 'fill-libero-ink' : 'fill-team-ink'}
				>{names?.[p.role] ?? roleShort(p.role)}</text
			>
			<text
				text-anchor="middle"
				dominant-baseline="central"
				font-size="0.24"
				y="0.2"
				class={p.role === 'L' ? 'fill-libero-ink' : 'fill-team-ink'}>{p.zone}</text
			>
		</g>
	{/each}
</Court>
