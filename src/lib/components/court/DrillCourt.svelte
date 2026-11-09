<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { diagramPoints, type Diagram, type DiagramPlayer } from '#lib/volley/diagram.js';
	import { roleShort } from '#lib/volley/labels.js';
	import type { Sport } from '#lib/volley/match.js';
	import { ROLE_KIND, type Point, type RoleId } from '#lib/volley/model.js';
	import Arrow from './Arrow.svelte';
	import Court from './Court.svelte';
	import PlayerToken from './PlayerToken.svelte';

	/**
	 * A drill or a match situation as a still picture: players, where they run, where the ball
	 * goes and what they aim at. The court shows as much of the opponents' side and the service
	 * zone as the diagram uses.
	 */
	let {
		diagram,
		label,
		sport = 'indoor'
	}: { diagram: Diagram; label: string; sport?: Sport } = $props();

	const size = $derived(sport === 'beach' ? 8 : 9);
	const points = $derived(diagramPoints(diagram));
	const minY = $derived(Math.min(0, ...points.map((p) => p.y)));
	const maxY = $derived(Math.max(0, ...points.map((p) => p.y)));
	const far = $derived(
		diagram.bothHalves ? size + (minY < -size ? 2 : 0.6) : Math.max(1.3, 0.7 - minY)
	);
	const serviceZone = $derived(maxY > size);

	const text = (p: DiagramPlayer): string => {
		if (p.label === undefined) return p.kind === 'coach' ? m.short_coach() : '';
		if (typeof p.label === 'object') return p.label[getLocale() as 'en' | 'hu'];
		return p.label in ROLE_KIND ? roleShort(p.label as RoleId) : p.label;
	};

	const unit = (from: Point, to: Point) => {
		const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
		return { x: (to.x - from.x) / len, y: (to.y - from.y) / len, len };
	};
	/** An open chevron at the end of a flight, smaller than a movement arrow's head. */
	const chevron = (from: Point, to: Point) => {
		const u = unit(from, to);
		const back = { x: to.x - u.x * 0.3, y: to.y - u.y * 0.3 };
		return `${back.x - u.y * 0.22},${back.y + u.x * 0.22} ${to.x},${to.y} ${back.x + u.y * 0.22},${back.y - u.x * 0.22}`;
	};
	/** The ball just leaving the first contact, clear of the token that plays it. */
	const ball = $derived.by(() => {
		const first = diagram.ball?.[0];
		if (!first) return undefined;
		const u = unit(first.from, first.to);
		const d = Math.min(0.75, u.len / 2);
		return { x: first.from.x + u.x * d, y: first.from.y + u.y * d };
	});
</script>

<Court {label} {sport} {far} {serviceZone} zones={diagram.zones ?? true}>
	{#each diagram.areas ?? [] as a, i (i)}
		<rect
			x={a.x}
			y={a.y}
			width={a.w}
			height={a.h}
			class="fill-accent stroke-accent"
			fill-opacity="0.18"
			stroke-width="0.06"
			stroke-dasharray="0.2 0.14"
		/>
	{/each}
	{#each diagram.moves ?? [] as mv, i (i)}
		<Arrow from={mv.from} to={mv.to} dashed={mv.dashed ?? true} />
	{/each}
	<!-- Flights are dotted, runs dashed, so the ball's path never reads as a player's. -->
	<g class="stroke-ink" stroke-width="0.09" stroke-linecap="round" fill="none" opacity="0.7">
		{#each diagram.ball ?? [] as f, i (i)}
			<line x1={f.from.x} y1={f.from.y} x2={f.to.x} y2={f.to.y} stroke-dasharray="0.01 0.22" />
			<polyline points={chevron(f.from, f.to)} stroke-linejoin="round" stroke-width="0.07" />
		{/each}
	</g>
	{#each diagram.targets ?? [] as t, i (i)}
		<polygon
			points="{t.x},{t.y - 0.36} {t.x - 0.3},{t.y + 0.24} {t.x + 0.3},{t.y + 0.24}"
			class="fill-accent"
			stroke="var(--color-paper)"
			stroke-width="0.05"
			stroke-linejoin="round"
		/>
	{/each}
	{#each diagram.players as p, i (i)}
		<PlayerToken x={p.x} y={p.y} label={text(p)} kind={p.kind} faded={p.faded} />
	{/each}
	{#if ball}
		<!-- A ball is white in any theme, so it keeps the literal colours Ball.svelte uses. -->
		<circle cx={ball.x} cy={ball.y} r="0.24" fill="#fbf7ef" stroke="#2a2a2a" stroke-width="0.05" />
	{/if}
</Court>
