<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		effectiveOptions,
		explorerPrefs as prefs,
		type ExplorerPrefs
	} from '#lib/prefs.svelte.js';
	import { numberOf, teams } from '#lib/teams.svelte.js';
	import { LEAGUE_IDS, leagueOf } from '#lib/volley/leagues.js';
	import ReportLink from '#lib/components/ReportLink.svelte';
	import PlayerCard from '#lib/components/PlayerCard.svelte';
	import {
		ATTACKS_FROM,
		DEFENSE_SYSTEMS,
		INCOMING,
		setsAvailable,
		setterInBack,
		RECEIVE_PHASES,
		SERVE_PHASES,
		formation,
		formationsFor
	} from '#lib/volley/formations.js';
	import {
		attackFromName,
		defenseName,
		incomingName,
		leagueName,
		setToName,
		explain,
		phaseDescription,
		phaseName,
		roleName,
		rotationLabel,
		settingZone,
		slotName,
		systemDescription,
		zoneRef,
		systemName,
		roleInSentence
	} from '#lib/volley/labels.js';
	import {
		LINEUP_ORDERS,
		ROLE_KIND,
		ROTATIONS,
		SYSTEMS,
		isFront,
		rolesOf,
		zoneOf,
		type RotationNo
	} from '#lib/volley/model.js';
	import IconChevronLeft from '~icons/lucide/chevron-left';
	import IconChevronRight from '~icons/lucide/chevron-right';
	import IconPause from '~icons/lucide/pause';
	import IconPlay from '~icons/lucide/play';
	import IconSettings from '~icons/lucide/settings-2';
	import IconPrinter from '~icons/lucide/printer';
	import IconLink from '~icons/lucide/link';
	import { page } from '$app/state';
	import { viewFragment, viewFromFragment, type View } from '#lib/view-link.js';
	import { untrack } from 'svelte';

	$effect(() => {
		prefs.load();
		teams.load();
		// A shared view opens on the moment it names, replacing the reader's own settings for it.
		const view = viewFromFragment(location.hash);
		if (view) untrack(() => openView(view));
	});

	const update = (patch: Partial<ExplorerPrefs>) => prefs.set({ ...prefs.current, ...patch });

	const team = $derived(teams.current.list.find((t) => t.id === prefs.current.team));
	/** Everything the diagrams follow: the chosen team's playbook, or the reader's settings. */
	const o = $derived({ ...prefs.current, ...effectiveOptions(prefs.current, team) });
	const league = $derived(team?.league ?? prefs.current.league);
	const roles = $derived(rolesOf(o.system, o.libero));
	const role = $derived(roles.includes(o.role) ? o.role : roles[0]);
	const formations = $derived(formationsFor(o));
	const options = $derived({
		...o,
		formation: formations.includes(o.formation) ? o.formation : formations[0]
	});
	const names = $derived.by(() => {
		if (!team) return undefined;
		return Object.fromEntries(roles.map((r) => [r, numberOf(team, r)]).filter(([, n]) => n));
	});
	const middles = $derived(roles.filter((r) => ROLE_KIND[r] === 'middle'));

	const phases = $derived(o.serving ? SERVE_PHASES : RECEIVE_PHASES);
	let step = $state(0);

	function openView({ phase: sharedPhase, ...settings }: View) {
		prefs.set({ ...prefs.current, ...settings, team: undefined });
		const list = prefs.current.serving ? SERVE_PHASES : RECEIVE_PHASES;
		step = Math.max(0, list.indexOf(sharedPhase ?? list[0]));
		// Drop the fragment so the address no longer claims a view the reader has moved on from.
		// The page may still be hydrating, before SvelteKit's own replaceState can run.
		history.replaceState(history.state, '', location.pathname + location.search);
	}

	let shared: 'yes' | 'failed' | undefined = $state();
	async function shareView() {
		const fragment = viewFragment({
			system: o.system,
			rotation: o.rotation,
			serving: o.serving,
			role,
			phase,
			libero: o.libero,
			formation: options.formation,
			defense: o.defense,
			attackFrom: o.attackFrom,
			incoming: o.incoming,
			setTo,
			setterDug: o.setterDug,
			league,
			order: o.order,
			liberoZone: o.liberoZone,
			keepSides: o.keepSides,
			liberoServesFor: o.liberoServesFor
		});
		try {
			await navigator.clipboard.writeText(`${site.url}${page.url.pathname}#${fragment}`);
			shared = 'yes';
		} catch {
			shared = 'failed';
		}
	}
	const phase = $derived(phases[Math.min(step, phases.length - 1)]);

	// Only the sets a hitter in this rotation can take; the cover moment follows the choice.
	const sets = $derived(setsAvailable({ ...options, serving: o.serving }));
	const setTo = $derived(sets.includes(o.setTo ?? 'left') ? (o.setTo ?? 'left') : sets[0]);
	const placed = $derived(formation({ ...options, setTo }, phase));
	const previous = $derived(step > 0 ? formation(options, phases[step - 1]) : undefined);
	const explanation = $derived(explain({ ...options, league }, phase, placed, role));
	const you = $derived(placed.find((p) => p.role === role));
	const passerCount = $derived(placed.filter((p) => p.task === 'pass').length);
	const yourZone = $derived(
		role === 'L'
			? placed.find((p) => p.role === 'L')?.zone
			: zoneOf(o.system, o.rotation, role, o.order)
	);

	let playing = $state(false);
	$effect(() => {
		if (!playing) return;
		const timer = setInterval(() => {
			if (step < phases.length - 1) step++;
			else playing = false;
		}, 2200);
		return () => clearInterval(timer);
	});

	function go(delta: number) {
		playing = false;
		step = Math.max(0, Math.min(phases.length - 1, step + delta));
	}

	const courtLabel = $derived(
		m.court_label({
			phase: phaseName(phase),
			rotation: rotationLabel(o.rotation, o.system),
			you: roleInSentence(role)
		})
	);
</script>

<Seo
	title="{m.explorer_title()} · {site.name}"
	description={m.explorer_description()}
	path="/explorer"
	schema="WebApplication"
/>

<div class="print:hidden">
	<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.explorer_title()}</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.explorer_lead()}</p>

	{#if teams.current.list.length}
		<div class="mt-8" data-pagefind-ignore>
			<ChipGroup
				legend={m.label_team()}
				options={[
					{ value: '', label: m.team_generic() },
					...teams.current.list.map((t) => ({ value: t.id, label: t.name }))
				]}
				bind:value={() => team?.id ?? '', (id) => update({ team: id || undefined })}
			/>
			{#if team}
				<p class="mt-2 text-sm text-ink-soft">
					{m.team_using({ team: team.name })}
					<a class="text-accent underline" href={href('/lineup')}>{m.edit_playbook()}</a>
				</p>
			{/if}
		</div>
	{/if}

	<div
		class={['grid gap-4 lg:grid-cols-2', teams.current.list.length ? 'mt-4' : 'mt-8']}
		data-pagefind-ignore
	>
		{#if !team}
			<ChipGroup
				legend={m.label_system()}
				options={SYSTEMS.map((s) => ({ value: s, label: systemName(s) }))}
				bind:value={() => o.system, (system) => update({ system })}
			/>
		{/if}
		<ChipGroup
			legend={m.label_role()}
			options={roles.map((r) => ({ value: r, label: roleName(r) }))}
			bind:value={() => role, (r) => update({ role: r })}
		/>
		<ChipGroup
			legend={m.label_situation()}
			options={[
				{ value: false, label: m.we_receive() },
				{ value: true, label: m.we_serve() }
			]}
			bind:value={
				() => o.serving,
				(serving) => {
					step = 0;
					playing = false;
					update({ serving });
				}
			}
		/>
		<ChipGroup
			legend={m.label_rotation()}
			options={ROTATIONS.map((r) => ({
				value: r,
				label: String(r),
				hint:
					o.system === '6-6' ? undefined : m.setter_zone_short({ zone: settingZone(r, o.system) })
			}))}
			bind:value={() => o.rotation, (rotation: RotationNo) => update({ rotation })}
		/>
	</div>
	<p class="mt-3 text-sm text-ink-soft" data-pagefind-ignore>{systemDescription(o.system)}</p>

	{#if !team}
		<details class="card mt-4" data-pagefind-ignore>
			<summary class="flex min-h-11 cursor-pointer items-center gap-2 font-medium">
				<IconSettings class="size-5" aria-hidden="true" />
				{m.settings()}
			</summary>
			<div class="mt-4 grid gap-5 sm:grid-cols-2">
				<div class="sm:col-span-2">
					<ChipGroup
						legend={m.label_league()}
						options={LEAGUE_IDS.map((l) => ({ value: l, label: leagueName(l) }))}
						bind:value={() => prefs.current.league, (league) => update({ league })}
					/>
					<p class="mt-2 text-sm text-ink-soft">{m.league_help()}</p>
				</div>
				{#if formations.length > 1}
					<ChipGroup
						legend={m.label_formation()}
						options={formations.map((f) => ({ value: f, label: m.formation_n({ n: f }) }))}
						bind:value={() => options.formation, (formation) => update({ formation })}
					/>
				{/if}
				<ChipGroup
					legend={m.label_defense()}
					options={DEFENSE_SYSTEMS.map((d) => ({ value: d, label: defenseName(d) }))}
					bind:value={() => o.defense, (defense) => update({ defense })}
				/>
				{#if o.system !== '6-6'}
					<ChipGroup
						legend={m.label_libero()}
						options={[
							{ value: true, label: m.yes() },
							{ value: false, label: m.no() }
						]}
						bind:value={() => o.libero, (libero) => update({ libero })}
					/>
					<div>
						<ChipGroup
							legend={m.label_order()}
							options={LINEUP_ORDERS.map((v) => ({
								value: v,
								label: v === 'oh-first' ? m.order_oh_first() : m.order_mb_first()
							}))}
							bind:value={() => o.order ?? 'oh-first', (order) => update({ order })}
						/>
						<p class="mt-2 text-sm text-ink-soft">{m.order_help()}</p>
					</div>
					<ChipGroup
						legend={m.label_libero_zone()}
						options={[
							{ value: 5, label: m.libero_zone_5() },
							{ value: 6, label: m.libero_zone_6() }
						]}
						bind:value={() => o.liberoZone ?? 5, (liberoZone) => update({ liberoZone })}
					/>
					<div>
						<ChipGroup
							legend={m.label_keep_sides()}
							options={[
								{ value: true, label: m.keep_sides_yes() },
								{ value: false, label: m.keep_sides_no() }
							]}
							bind:value={() => o.keepSides ?? true, (keepSides) => update({ keepSides })}
						/>
						<p class="mt-2 text-sm text-ink-soft">{m.keep_sides_help()}</p>
					</div>
					{#if o.libero && leagueOf(league).liberoServes}
						<ChipGroup
							legend={m.label_libero_serves()}
							options={[
								{ value: '', label: m.libero_serves_none() },
								...middles.map((r) => ({ value: r, label: roleName(r) }))
							]}
							bind:value={
								() => prefs.current.liberoServesFor ?? '',
								(r) =>
									update({ liberoServesFor: (r || undefined) as ExplorerPrefs['liberoServesFor'] })
							}
						/>
					{/if}
				{/if}
			</div>
		</details>
	{/if}

	<div class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
		<div class="lg:sticky lg:top-4">
			<nav aria-label={m.label_phase()} class="mb-3 flex items-center gap-2" data-pagefind-ignore>
				<button
					type="button"
					class="btn-ghost"
					onclick={() => go(-1)}
					disabled={step === 0}
					aria-label={m.previous_phase()}
				>
					<IconChevronLeft class="size-5" aria-hidden="true" />
				</button>
				<ol class="flex flex-1 flex-wrap justify-center gap-1">
					{#each phases as p, i (p)}
						<li>
							<button
								type="button"
								class="chip"
								aria-pressed={i === step}
								onclick={() => {
									playing = false;
									step = i;
								}}>{phaseName(p)}</button
							>
						</li>
					{/each}
				</ol>
				<button
					type="button"
					class="btn-ghost"
					onclick={() => go(1)}
					disabled={step === phases.length - 1}
					aria-label={m.next_phase()}
				>
					<IconChevronRight class="size-5" aria-hidden="true" />
				</button>
			</nav>

			<FormationCourt {placed} {previous} {names} you={role} area label={courtLabel} />

			<div class="mt-3 flex flex-wrap items-center justify-between gap-2" data-pagefind-ignore>
				<button
					type="button"
					class="btn-secondary"
					onclick={() => {
						if (!playing && step === phases.length - 1) step = 0;
						playing = !playing;
					}}
				>
					{#if playing}
						<IconPause class="size-4" aria-hidden="true" />{m.pause()}
					{:else}
						<IconPlay class="size-4" aria-hidden="true" />{m.play()}
					{/if}
				</button>
				<button type="button" class="btn-secondary" onclick={() => print()}>
					<IconPrinter class="size-4" aria-hidden="true" />{m.print_my_card()}
				</button>
				<button type="button" class="btn-secondary" onclick={shareView}>
					<IconLink class="size-4" aria-hidden="true" />{m.share_view()}
				</button>
				<ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
					<li class="flex items-center gap-1.5">
						<span class="size-3 rounded-full bg-accent"></span>{m.legend_you()}
					</li>
					<li class="flex items-center gap-1.5">
						<span class="size-3 rounded-full bg-libero"></span>{m.role_l()}
					</li>
					<li class="flex items-center gap-1.5">
						<svg viewBox="-0.25 -0.25 0.5 0.5" class="size-3" aria-hidden="true">
							<circle r="0.2" class="fill-paper stroke-ink" stroke-width="0.06" />
						</svg>{m.legend_setter()}
					</li>
					<li class="flex items-center gap-1.5">
						<span class="h-0 w-4 border-t-2 border-dashed border-ink-soft"></span>{m.legend_run()}
					</li>
				</ul>
			</div>
			<p class="mt-2 text-sm" aria-live="polite">
				{shared === 'yes'
					? team?.custom
						? m.share_view_copied_custom()
						: m.share_view_copied()
					: shared === 'failed'
						? m.share_view_failed()
						: ''}
			</p>

			{#if phase === 'receive' && passerCount < options.formation && o.system !== '6-6'}
				<p class="card mt-3 text-sm">{m.passers_fewer({ n: passerCount })}</p>
			{/if}

			{#if phase === 'defense'}
				<div class="mt-4 space-y-4" data-pagefind-ignore>
					<ChipGroup
						legend={m.label_incoming()}
						options={INCOMING.map((i) => ({ value: i, label: incomingName(i) }))}
						bind:value={() => o.incoming ?? 'attack', (incoming) => update({ incoming })}
					/>
					{#if (o.incoming ?? 'attack') === 'attack'}
						<ChipGroup
							legend={m.label_attack_from()}
							options={ATTACKS_FROM.map((a) => ({ value: a, label: attackFromName(a) }))}
							bind:value={() => o.attackFrom, (attackFrom) => update({ attackFrom })}
						/>
					{/if}
				</div>
			{/if}
			{#if phase === 'attack' && o.serving && o.system !== '6-6' && setterInBack(options)}
				<div class="mt-4" data-pagefind-ignore>
					<ChipGroup
						legend={m.label_first_ball()}
						options={[
							{ value: false, label: m.first_ball_anyone() },
							{ value: true, label: m.first_ball_setter() }
						]}
						bind:value={() => o.setterDug ?? false, (setterDug) => update({ setterDug })}
					/>
				</div>
			{/if}
			{#if phase === 'cover' && sets.length}
				<div class="mt-4" data-pagefind-ignore>
					<ChipGroup
						legend={m.label_set_to()}
						options={sets.map((t) => ({ value: t, label: setToName(t) }))}
						bind:value={() => setTo, (setTo) => update({ setTo })}
					/>
				</div>
			{/if}
		</div>

		<section aria-live="polite" class="min-w-0">
			<p class="eyebrow">{phaseName(phase)} · {rotationLabel(o.rotation, o.system)}</p>
			<h2 class="mt-1 text-2xl font-bold tracking-tight">{explanation.task}</h2>
			<p class="mt-1 text-ink-soft">{phaseDescription(phase, o.serving, o.incoming)}</p>

			<dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div class="card">
					<dt class="eyebrow">{m.your_zone()}</dt>
					<dd class="mt-1 text-2xl font-bold">{yourZone ?? '–'}</dd>
				</div>
				<div class="card">
					<dt class="eyebrow">{m.your_row()}</dt>
					<dd class="mt-1 text-lg font-semibold">
						{yourZone ? (isFront(yourZone) ? m.row_front() : m.row_back()) : '–'}
					</dd>
				</div>
				{#if you && o.system !== '6-6'}
					<div class="card col-span-2 sm:col-span-1">
						<dt class="eyebrow">{m.your_spot()}</dt>
						<dd class="mt-1 text-lg font-semibold">{slotName(you.slot)}</dd>
					</div>
				{/if}
			</dl>

			<p class="mt-5 text-lg">{explanation.detail}</p>
			<details class="mt-4" open>
				<summary class="flex min-h-11 cursor-pointer items-center font-semibold">
					{m.more_detail()}
				</summary>
				<ul class="mt-2 list-disc space-y-2 pl-5">
					{#each explanation.tips as tip (tip)}
						<li>{tip}</li>
					{/each}
				</ul>
			</details>
			<ReportLink
				context={[
					`${systemName(o.system)}, ${rotationLabel(o.rotation, o.system)}, ${phaseName(phase)}`,
					`${m.label_role()}: ${roleName(role)}`,
					`${m.label_league()}: ${leagueName(league)}`,
					`${JSON.stringify({
						formation: options.formation,
						defense: o.defense,
						libero: o.libero,
						order: o.order,
						liberoZone: o.liberoZone,
						keepSides: o.keepSides,
						attackFrom: phase === 'defense' ? o.attackFrom : undefined,
						custom: team?.custom?.[o.rotation] ? true : undefined
					})}`
				]}
			/>
			<p class="mt-4 text-sm text-ink-soft">
				{m.learn_more()}
				<a class="text-accent underline" href={href('/guides/rotations')}
					>{m.guide_rotations_link()}</a
				>,
				<a class="text-accent underline" href={href('/guides/overlap')}>{m.guide_overlap_link()}</a
				>,
				<a class="text-accent underline" href={href('/guides/defense')}>{m.guide_defense_link()}</a
				>.
			</p>
		</section>
	</div>

	<section class="mt-12" data-pagefind-ignore>
		<h2 class="text-2xl font-bold tracking-tight">
			{m.all_rotations({ phase: phaseName(phase) })}
		</h2>
		<p class="mt-1 text-ink-soft">{m.all_rotations_lead()}</p>
		<ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{#each ROTATIONS as r (r)}
				{@const at = formation({ ...options, rotation: r }, phase)}
				{@const z =
					role === 'L' ? at.find((p) => p.role === 'L')?.zone : zoneOf(o.system, r, role, o.order)}
				<li>
					<button
						type="button"
						class="card block w-full p-2 text-left transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:ring-2 aria-pressed:ring-accent"
						aria-pressed={r === o.rotation}
						onclick={() => update({ rotation: r })}
					>
						<span class="block px-1 pb-1 text-sm font-semibold">{rotationLabel(r, o.system)}</span>
						<FormationCourt
							placed={at}
							{names}
							you={role}
							runs={false}
							zones={false}
							table={false}
							label={m.court_label({
								phase: phaseName(phase),
								rotation: rotationLabel(r, o.system),
								you: roleInSentence(role)
							})}
						/>
						<span class="block px-1 pt-1 text-xs text-ink-soft">
							{z
								? m.zone_row({ zone: zoneRef(z), row: isFront(z) ? m.row_front() : m.row_back() })
								: m.off_court()}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	</section>
</div>

<!-- Printed instead of the page: the reader's own card for all six rotations. -->
<section class="hidden print:block" data-pagefind-ignore>
	<PlayerCard
		{options}
		{role}
		{names}
		title="{team ? `${team.name} · ` : ''}{roleName(role)} · {systemName(o.system)}"
		rotations={ROTATIONS}
		diagrams
	/>
	<p class="mt-2 text-xs">{site.name} · {site.url}</p>
</section>
