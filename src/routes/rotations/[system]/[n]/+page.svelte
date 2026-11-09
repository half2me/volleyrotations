<script lang="ts">
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { rotationPageLabel } from '#lib/page-labels.js';
	import { rotationNumbers, rotationPath, rotationSystems } from '#lib/pages.js';
	import { m } from '#lib/paraglide/messages.js';
	import { viewFragment } from '#lib/view-link.js';
	import { DEFAULT_OPTIONS, formation, formationOf, type Phase } from '#lib/volley/formations.js';
	import {
		defenseName,
		explain,
		phaseDescription,
		phaseName,
		roleInSentence,
		roleName,
		rotationLabel,
		settingZone,
		systemDescription,
		systemName,
		zoneRef
	} from '#lib/volley/labels.js';
	import {
		BACK_ZONES,
		FRONT_ZONES,
		isFront,
		lineupOnCourt,
		setterOf,
		zonesInRotation,
		type RotationNo,
		type Zone
	} from '#lib/volley/model.js';
	import IconArrowLeft from '~icons/lucide/arrow-left';
	import IconArrowRight from '~icons/lucide/arrow-right';
	import IconCompass from '~icons/lucide/compass';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const system = $derived(data.system);
	const rotation = $derived(data.rotation);

	/** The moments shown, in rally order. The opponent serves for the receive and the attack after it. */
	const PHASES: readonly Phase[] = ['receive', 'serve', 'base', 'defense', 'attack'];
	const weServe = (phase: Phase) => phase !== 'receive' && phase !== 'attack';
	/** Front row left to right, then back row, as the court reads from behind the end line. */
	const COURT_ORDER: readonly Zone[] = [...FRONT_ZONES, ...BACK_ZONES];

	const options = $derived({ ...DEFAULT_OPTIONS, system, rotation });
	const moments = $derived(
		PHASES.map((phase) => {
			const o = { ...options, serving: weServe(phase) };
			const placed = formation(o, phase);
			const players = [...placed]
				.sort((a, b) => COURT_ORDER.indexOf(a.zone) - COURT_ORDER.indexOf(b.zone))
				.map((p) => ({ ...p, explanation: explain(o, phase, placed, p.role) }));
			return { phase, placed, players, serving: o.serving };
		})
	);

	const zones = $derived(zonesInRotation(system, rotation));
	const setter = $derived(setterOf(system, rotation));
	/** The six on court as they receive: the libero in for the back-row middle. */
	const receiving = $derived(lineupOnCourt({ ...options, serving: false }));
	const inZone = (zone: Zone) => {
		const p = receiving.find((q) => q.zone === zone)!;
		return p.replaces
			? m.libero_for({ libero: roleName(p.role), middle: roleName(p.replaces) })
			: roleName(p.role);
	};
	const frontRow = $derived(FRONT_ZONES.map((z) => ({ zone: z, name: inZone(z) })));
	const backRow = $derived(BACK_ZONES.map((z) => ({ zone: z, name: inZone(z) })));

	const next = $derived(((rotation % 6) + 1) as RotationNo);
	const previous = $derived((((rotation + 4) % 6) + 1) as RotationNo);

	const title = $derived(rotationPageLabel(system, rotation));
	const description = $derived(
		m.rotation_page_description({
			system: systemName(system),
			rotation: rotationLabel(rotation, system),
			zone: zoneRef(settingZone(rotation, system)),
			front: FRONT_ZONES.map((z) => roleInSentence(zones[z])).join(', '),
			back: BACK_ZONES.map((z) => roleInSentence(receiving.find((p) => p.zone === z)!.role)).join(
				', '
			)
		})
	);

	/** The explorer opened on this rotation, keeping the reader's own position. */
	const explorerLink = (phase: Phase) =>
		`${href('/explorer')}#${viewFragment({
			system,
			rotation,
			serving: weServe(phase),
			libero: true,
			phase
		})}`;
</script>

<Seo
	title="{title} · {site.name}"
	{description}
	path={rotationPath(system, rotation)}
	type="article"
	schema="Article"
	breadcrumbs={[
		{ name: m.nav_home(), path: '/' },
		{ name: m.rotations_title(), path: '/rotations' },
		{ name: title, path: rotationPath(system, rotation) }
	]}
/>

<a href={href('/rotations')} class="btn-ghost mb-4 -ml-3" data-pagefind-ignore>
	<IconArrowLeft class="size-4" aria-hidden="true" />
	{m.rotations_title()}
</a>

<p class="eyebrow text-accent">{systemName(system)}</p>
<h1 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
	{rotationLabel(rotation, system)}
</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{systemDescription(system)}</p>
<p class="mt-3 max-w-2xl">
	{system === '6-6'
		? m.rotation_lead_66()
		: m.rotation_lead({ n: formationOf(options), defense: defenseName(options.defense) })}
</p>

<nav aria-label={m.rotation_all_in_system({ system: systemName(system) })} data-pagefind-ignore>
	<ul class="mt-5 flex flex-wrap gap-2">
		{#each rotationNumbers as n (n)}
			<li>
				<a
					href={href(rotationPath(system, n))}
					class="chip aria-[current]:border-accent aria-[current]:bg-accent aria-[current]:text-accent-ink"
					aria-current={n === rotation ? 'page' : undefined}
				>
					<span class="sr-only">{m.label_rotation()}</span>
					{n}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<dl class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
	<div class="card">
		<dt class="eyebrow">{m.rotation_fact_setter()}</dt>
		<dd class="mt-1 font-semibold">
			{m.player_in_zone({ name: roleName(setter), zone: zoneRef(settingZone(rotation, system)) })}
		</dd>
	</div>
	<div class="card">
		<dt class="eyebrow">{m.rotation_fact_server()}</dt>
		<dd class="mt-1 font-semibold">{m.player_in_zone({ name: roleName(zones[1]), zone: '1' })}</dd>
	</div>
	<div class="card">
		<dt class="eyebrow">{m.rotation_fact_front()}</dt>
		<dd class="mt-1">
			<ul class="space-y-1">
				{#each frontRow as p (p.zone)}
					<li>{m.player_in_zone({ name: p.name, zone: zoneRef(p.zone) })}</li>
				{/each}
			</ul>
		</dd>
	</div>
	<div class="card">
		<dt class="eyebrow">{m.rotation_fact_back()}</dt>
		<dd class="mt-1">
			<ul class="space-y-1">
				{#each backRow as p (p.zone)}
					<li>{m.player_in_zone({ name: p.name, zone: zoneRef(p.zone) })}</li>
				{/each}
			</ul>
		</dd>
	</div>
</dl>
<p class="mt-3 max-w-2xl text-sm text-ink-soft">
	{m.rotation_next_hint({ next: rotationLabel(next, system) })}
</p>

<div class="card mt-6 flex flex-wrap items-center justify-between gap-4" data-pagefind-ignore>
	<div class="flex items-start gap-3">
		<IconCompass class="mt-0.5 size-6 shrink-0 text-accent" aria-hidden="true" />
		<div>
			<p class="font-semibold">{m.explorer_title()}</p>
			<p class="mt-0.5 text-sm text-ink-soft">{m.rotation_open_explorer_lead()}</p>
		</div>
	</div>
	<a href={explorerLink('receive')} class="btn-primary">
		{m.rotation_open_explorer()}
		<IconArrowRight class="size-4" aria-hidden="true" />
	</a>
</div>

{#each moments as moment (moment.phase)}
	<section class="mt-12" aria-labelledby="phase-{moment.phase}">
		<p class="eyebrow">{moment.serving ? m.we_serve() : m.we_receive()}</p>
		<h2 id="phase-{moment.phase}" class="mt-1 text-2xl font-bold tracking-tight">
			{phaseName(moment.phase)}
		</h2>
		<p class="mt-1 max-w-2xl text-ink-soft">{phaseDescription(moment.phase, moment.serving)}</p>
		<div class="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
			<div class="lg:sticky lg:top-4">
				<FormationCourt
					placed={moment.placed}
					label="{phaseName(moment.phase)}, {rotationLabel(rotation, system)}"
				/>
				<a
					href={explorerLink(moment.phase)}
					class="btn-ghost mt-2 -ml-3 text-sm text-accent"
					data-pagefind-ignore
				>
					{m.rotation_open_phase({ phase: phaseName(moment.phase) })}
					<IconArrowRight class="size-4" aria-hidden="true" />
				</a>
			</div>
			<div class="min-w-0">
				<h3 class="eyebrow">{m.rotation_who_does_what()}</h3>
				<ol class="mt-2 space-y-2">
					{#each moment.players as p (p.role)}
						<li class="card p-3">
							<p class="font-semibold">
								{roleName(p.role)}
								<span class="font-normal text-ink-soft">
									· {m.zone_row({
										zone: zoneRef(p.zone),
										row: isFront(p.zone) ? m.row_front() : m.row_back()
									})}
								</span>
							</p>
							<p class="mt-1 text-sm">
								<strong>{p.explanation.task}.</strong>
								{p.explanation.detail}
							</p>
							{#if moment.phase === 'receive'}
								<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
									{#each p.explanation.tips as tip (tip)}
										<li>{tip}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</section>
{/each}

<nav
	aria-label={m.rotation_all_in_system({ system: systemName(system) })}
	class="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2"
	data-pagefind-ignore
>
	<a href={href(rotationPath(system, previous))} class="card hover:border-accent">
		<span class="eyebrow">{m.rotation_previous()}</span>
		<span class="mt-1 block font-semibold">{rotationLabel(previous, system)}</span>
	</a>
	<a href={href(rotationPath(system, next))} class="card text-right hover:border-accent">
		<span class="eyebrow">{m.rotation_next()}</span>
		<span class="mt-1 flex items-center justify-end gap-1 font-semibold"
			>{rotationLabel(next, system)}<IconArrowRight class="size-4" aria-hidden="true" /></span
		>
	</a>
</nav>

<nav aria-label={m.rotation_other_systems()} class="mt-8" data-pagefind-ignore>
	<h2 class="eyebrow">{m.rotation_other_systems()}</h2>
	<ul class="mt-3 flex flex-wrap gap-2">
		{#each rotationSystems.filter((s) => s !== system) as s (s)}
			<li>
				<a class="chip" href={href(rotationPath(s, rotation))}>
					{rotationPageLabel(s, rotation)}
				</a>
			</li>
		{/each}
	</ul>
</nav>
