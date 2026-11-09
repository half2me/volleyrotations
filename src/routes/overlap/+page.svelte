<script lang="ts">
	import IndoorOnlyNotice from '#lib/components/IndoorOnlyNotice.svelte';
	import LeagueSelect from '#lib/components/LeagueSelect.svelte';
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import DragCourt from '#lib/components/court/DragCourt.svelte';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import { LEAGUE_IDS, leagueOf } from '#lib/volley/leagues.js';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { DEFAULT_OPTIONS, byZone, formation } from '#lib/volley/formations.js';
	import { leagueName, rotationLabel, zoneRef, systemName, roleRef } from '#lib/volley/labels.js';
	import {
		ROTATIONS,
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

	$effect(() => explorerPrefs.load());

	let system: SystemId = $state('5-1');
	let rotation: RotationNo = $state(1);
	/** Whether the reader checks their team at its own serve, where their league asks for it. */
	let serving = $state(false);

	const league = $derived(explorerPrefs.current.league);
	const servingChecked = $derived(leagueOf(league).servingOverlap);
	const atServe = $derived(serving && servingChecked);
	/** The server stands behind the end line and is never compared (rule 7.4.1). */
	const exempt: Zone[] = $derived(atServe ? [1] : []);

	const court = $derived(lineupOnCourt({ system, rotation, serving: atServe, libero: true }));
	const legal = () =>
		byZone(
			formation(
				{
					...DEFAULT_OPTIONS,
					system,
					rotation,
					serving: atServe,
					servingOverlap: true,
					formation: system === '6-6' ? 5 : 3
				},
				atServe ? 'serve' : 'receive'
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
		const zones = ZONES.filter((z) => !exempt.includes(z));
		do {
			const [a, b] = [...zones].sort(() => Math.random() - 0.5);
			positions = { ...base, [a]: base[b], [b]: base[a] };
		} while (overlapFaults(positions, exempt).length === 0);
		challenge = true;
	}

	const faults = $derived(overlapFaults(positions, exempt));
	const who = (z: Zone) => {
		const p = court.find((c) => c.zone === z)!;
		return m.player_in_zone({ name: roleRef(p.role), zone: zoneRef(z) });
	};
</script>

<Seo
	title="{m.overlap_title()} · {site.name}"
	description={m.overlap_description()}
	path="/overlap"
	schema="WebApplication"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.overlap_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.overlap_lead()}</p>
<IndoorOnlyNotice />

<div class="mt-8 grid gap-4 sm:grid-cols-2" data-pagefind-ignore>
	<div>
		<LeagueSelect
			bind:value={
				() => league,
				(l) => {
					explorerPrefs.set({ ...explorerPrefs.current, league: l });
					reset();
				}
			}
		/>
	</div>
	<div>
		<ChipGroup
			legend={m.label_situation()}
			options={[
				{ value: false, label: m.we_receive() },
				{ value: true, label: m.we_serve() }
			]}
			bind:value={
				() => serving,
				(v) => {
					serving = v;
					reset();
				}
			}
		/>
		{#if serving && !servingChecked}
			<p class="mt-2 text-sm text-ink-soft">{m.overlap_serving_free()}</p>
		{:else if serving}
			<p class="mt-2 text-sm text-ink-soft">{m.overlap_serving_checked()}</p>
		{/if}
	</div>
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
		<DragCourt
			{court}
			bind:positions
			{faults}
			{exempt}
			keysId="overlap-keys"
			label={m.overlap_court_label({ rotation: rotationLabel(rotation, system) })}
		/>
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
