<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import Court from '#lib/components/court/Court.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { DEFAULT_OPTIONS, byZone, formation } from '#lib/volley/formations.js';
	import {
		roleInSentence,
		roleName,
		roleShort,
		rotationLabel,
		zoneRef,
		systemName
	} from '#lib/volley/labels.js';
	import {
		COLUMN_PAIRS,
		ROTATIONS,
		ROW_ORDER,
		SYSTEMS,
		ZONES,
		lineupOnCourt,
		type Point,
		type RotationNo,
		type SystemId,
		type Zone
	} from '#lib/volley/model.js';
	import { overlapFaults } from '#lib/volley/overlap.js';
	import IconCheck from '~icons/lucide/circle-check';
	import IconRotate from '~icons/lucide/rotate-ccw';
	import IconShuffle from '~icons/lucide/shuffle';
	import IconX from '~icons/lucide/circle-x';

	const RULE_URL =
		'https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf#page=27';

	let system: SystemId = $state('5-1');
	let rotation: RotationNo = $state(1);

	const court = $derived(lineupOnCourt({ system, rotation, serving: false, libero: true }));
	const legal = () =>
		byZone(
			formation(
				{ ...DEFAULT_OPTIONS, system, rotation, formation: system === '6-6' ? 5 : 3 },
				'receive'
			)
		);

	let positions: Record<Zone, Point> = $state(legal());
	let challenge = $state(false);

	function reset() {
		challenge = false;
		positions = legal();
	}

	/**
	 * A real formation with two players swapped: the mistake a team makes when someone lines up in
	 * the wrong spot, for the reader to fix.
	 */
	function scramble() {
		const base = legal();
		do {
			const [a, b] = [...ZONES].sort(() => Math.random() - 0.5);
			positions = { ...base, [a]: base[b], [b]: base[a] };
		} while (overlapFaults(positions).length === 0);
		challenge = true;
	}

	const faults = $derived(overlapFaults(positions));
	const broken = (a: Zone, b: Zone) => faults.some((f) => f.a === a && f.b === b);
	const who = (z: Zone) => {
		const p = court.find((c) => c.zone === z)!;
		return m.player_in_zone({ name: roleInSentence(p.role), zone: zoneRef(z) });
	};

	// Dragging: pointer coordinates to court metres through the SVG's own transform.
	let dragging: Zone | undefined = $state();
	let selected: Zone | undefined = $state();

	function toCourt(e: PointerEvent): Point {
		const el = e.currentTarget as SVGGraphicsElement;
		const svg = el instanceof SVGSVGElement ? el : el.ownerSVGElement!;
		const ctm = svg.getScreenCTM()!.inverse();
		const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm);
		return { x: Math.min(8.8, Math.max(0.2, p.x)), y: Math.min(8.8, Math.max(0.2, p.y)) };
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
		positions[z] = {
			x: Math.min(8.8, Math.max(0.2, p.x + d[0])),
			y: Math.min(8.8, Math.max(0.2, p.y + d[1]))
		};
	}

	const relations = [
		...COLUMN_PAIRS.map(([a, b]) => ({ a, b })),
		...ROW_ORDER.map(([a, b]) => ({ a, b }))
	];
</script>

<Seo
	title="{m.overlap_title()} · {site.name}"
	description={m.overlap_description()}
	path="/overlap"
	schema="WebApplication"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.overlap_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.overlap_lead()}</p>

<div class="mt-8 grid gap-4 sm:grid-cols-2" data-pagefind-ignore>
	<ChipGroup
		legend={m.label_system()}
		options={SYSTEMS.map((s) => ({ value: s, label: systemName(s) }))}
		bind:value={
			() => system,
			(s) => {
				system = s;
				reset();
			}
		}
	/>
	<ChipGroup
		legend={m.label_rotation()}
		options={ROTATIONS.map((r) => ({ value: r, label: String(r) }))}
		bind:value={
			() => rotation,
			(r) => {
				rotation = r;
				reset();
			}
		}
	/>
</div>

<div class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
	<div data-pagefind-ignore>
		<Court
			label={m.overlap_court_label({ rotation: rotationLabel(rotation, system) })}
			serviceZone={false}
			role="group"
			onpointermove={(e) => {
				if (dragging) positions[dragging] = toCourt(e);
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
			{#each court as p (p.zone)}
				{@const at = positions[p.zone]}
				{@const bad = faults.some((f) => f.a === p.zone || f.b === p.zone)}
				<g
					transform="translate({at.x} {at.y})"
					role="button"
					tabindex="0"
					aria-label={m.overlap_player({ who: who(p.zone) })}
					aria-describedby="overlap-keys"
					class="cursor-grab outline-none active:cursor-grabbing"
					onpointerdown={(e) => {
						e.preventDefault();
						dragging = p.zone;
						selected = p.zone;
						(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
					}}
					onpointermove={(e) => {
						if (dragging === p.zone) positions[p.zone] = toCourt(e);
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
			     aria-label, which already names the player and zone. -->
			{#each court as p (p.zone)}
				{@const at = positions[p.zone]}
				<g transform="translate({at.x} {at.y})" class="pointer-events-none" aria-hidden="true">
					<text
						text-anchor="middle"
						dominant-baseline="central"
						font-size="0.3"
						font-weight="700"
						y="-0.1"
						class={p.role === 'L' ? 'fill-libero-ink' : 'fill-team-ink'}>{roleShort(p.role)}</text
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
		<p id="overlap-keys" class="mt-2 text-sm text-ink-soft">{m.overlap_keys()}</p>
		<div class="mt-3 flex flex-wrap gap-2">
			<button type="button" class="btn-primary" onclick={scramble}>
				<IconShuffle class="size-4" aria-hidden="true" />{m.overlap_scramble()}
			</button>
			<button type="button" class="btn-secondary" onclick={reset}>
				<IconRotate class="size-4" aria-hidden="true" />{m.overlap_reset()}
			</button>
		</div>
	</div>

	<section class="min-w-0">
		<div aria-live="polite" data-pagefind-ignore>
			{#if faults.length === 0}
				<p class="flex items-center gap-2 text-2xl font-bold text-good">
					<IconCheck class="size-7" aria-hidden="true" />
					{challenge ? m.overlap_fixed() : m.overlap_legal()}
				</p>
			{:else}
				<p class="flex items-center gap-2 text-2xl font-bold text-bad">
					<IconX class="size-7" aria-hidden="true" />
					{m.overlap_fault_count({ count: faults.length })}
				</p>
				<ul class="mt-3 space-y-2">
					{#each faults as f (`${f.a}-${f.b}`)}
						<li class="card border-bad/50 py-3">
							{f.kind === 'depth'
								? m.fault_depth({ back: who(f.b), front: who(f.a) })
								: m.fault_side({ left: who(f.a), right: who(f.b) })}
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<h2 class="mt-8 text-xl font-bold">{m.overlap_how_title()}</h2>
		<ul class="mt-3 list-disc space-y-2 pl-5">
			<li>{m.overlap_how_1()}</li>
			<li>{m.overlap_how_2()}</li>
			<li>{m.overlap_how_3()}</li>
			<li>{m.overlap_how_4()}</li>
		</ul>
		<p class="mt-4 text-sm text-ink-soft">
			<a class="text-accent underline" href={RULE_URL}>{m.overlap_rule_link()}</a>
			·
			<a class="text-accent underline" href={href('/guides/overlap')}>{m.guide_overlap()}</a>
		</p>
	</section>
</div>
