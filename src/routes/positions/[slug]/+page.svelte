<script lang="ts">
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { localizedMarkdown } from '#lib/content.js';
	import { href } from '#lib/i18n.js';
	import { positionLabel } from '#lib/page-labels.js';
	import { positionPages, type PositionSlug } from '#lib/pages.js';
	import { m } from '#lib/paraglide/messages.js';
	import { viewFragment } from '#lib/view-link.js';
	import { DEFAULT_OPTIONS, RECEIVE_PHASES, formation } from '#lib/volley/formations.js';
	import { prefersReducedMotion } from 'svelte/motion';
	import { phaseName, roleInSentence, rotationLabel, zoneRef } from '#lib/volley/labels.js';
	import { ROTATIONS, isFront, type RoleId } from '#lib/volley/model.js';
	import IconArrowLeft from '~icons/lucide/arrow-left';
	import IconArrowRight from '~icons/lucide/arrow-right';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const ROLE: Record<PositionSlug, RoleId> = {
		setter: 'S',
		'outside-hitter': 'OH1',
		'middle-blocker': 'MB1',
		opposite: 'OPP',
		libero: 'L'
	};

	// The glob must be a literal, so it takes every position; the route picks one by slug.
	const all = import.meta.glob('/src/lib/content/positions/*/*.md', { eager: true });
	const page = $derived(
		localizedMarkdown(
			Object.fromEntries(
				Object.entries(all).filter(([path]) => path.includes(`/positions/${data.slug}/`))
			)
		)
	);
	const role = $derived(ROLE[data.slug]);

	/**
	 * The rally on the opponent's serve, played through every rotation: receive, attack, cover.
	 * Shows the first rotation's receive and stays still for readers who prefer less motion.
	 */
	let step = $state(0);
	$effect(() => {
		if (prefersReducedMotion.current) return;
		const timer = setInterval(() => (step = (step + 1) % (6 * RECEIVE_PHASES.length)), 1800);
		return () => clearInterval(timer);
	});
	const playRotation = $derived(
		(Math.floor(step / RECEIVE_PHASES.length) + 1) as (typeof ROTATIONS)[number]
	);
	const playPhase = $derived(RECEIVE_PHASES[step % RECEIVE_PHASES.length]);
	const playPlaced = $derived(formation({ ...DEFAULT_OPTIONS, rotation: playRotation }, playPhase));
	/** The explorer opened on this position, in a 5-1 with a libero, on the opponent's serve. */
	const explorerLink = (rotation: (typeof ROTATIONS)[number]) =>
		`${href('/explorer')}#${viewFragment({
			system: '5-1',
			libero: true,
			serving: false,
			rotation,
			role,
			phase: 'receive'
		})}`;
</script>

<Seo
	title="{page.metadata.title} · {site.name}"
	description={page.metadata.description}
	path="/positions/{data.slug}"
	type="article"
	schema="Article"
/>

<a href={href('/guides/positions')} class="btn-ghost mb-4 -ml-3" data-pagefind-ignore>
	<IconArrowLeft class="size-4" aria-hidden="true" />
	{m.guide_positions()}
</a>

<div class="grid items-start gap-8 lg:grid-cols-[1fr_minmax(0,20rem)]">
	<article class="prose-site">
		<page.default />
	</article>
	<figure class="mx-auto w-full max-w-72 lg:sticky lg:top-4" data-pagefind-ignore>
		<FormationCourt
			placed={playPlaced}
			you={role}
			label="{phaseName(playPhase)}, {rotationLabel(playRotation, '5-1')}"
		/>
		<figcaption class="mt-2 text-center text-sm text-ink-soft" aria-live="off">
			{phaseName(playPhase)} · {rotationLabel(playRotation, '5-1')}
		</figcaption>
	</figure>
</div>

<section class="mt-12" aria-labelledby="rotations-heading" data-pagefind-ignore>
	<h2 id="rotations-heading" class="text-2xl font-bold tracking-tight">{m.position_rotations()}</h2>
	<p class="mt-1 max-w-prose text-ink-soft">{m.position_rotations_lead()}</p>
	<ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
		{#each ROTATIONS as r (r)}
			{@const at = formation({ ...DEFAULT_OPTIONS, rotation: r }, 'receive')}
			{@const me = at.find((p) => p.role === role)}
			<li>
				<a href={explorerLink(r)} class="card block p-2 hover:border-accent">
					<span class="sr-only">{m.position_open_explorer()}:</span>
					<span class="block px-1 pb-1 text-sm font-semibold">{rotationLabel(r, '5-1')}</span>
					<FormationCourt
						placed={at}
						you={role}
						runs={false}
						zones={false}
						table={false}
						label="{phaseName('receive')}, {rotationLabel(r, '5-1')}"
					/>
					<span class="block px-1 pt-1 text-xs text-ink-soft">
						{me
							? m.zone_row({
									zone: zoneRef(me.zone),
									row: isFront(me.zone) ? m.row_front() : m.row_back()
								})
							: m.off_court()}
					</span>
				</a>
			</li>
		{/each}
	</ul>
	<a href={explorerLink(1)} class="btn-primary mt-5">
		{m.position_explorer_cta({ role: roleInSentence(role) })}
		<IconArrowRight class="size-4" aria-hidden="true" />
	</a>
</section>

<nav aria-label={m.position_more()} class="mt-12 border-t border-line pt-6" data-pagefind-ignore>
	<h2 class="eyebrow">{m.position_more()}</h2>
	<ul class="mt-3 flex flex-wrap gap-2">
		{#each positionPages.filter((p) => p !== data.slug) as slug (slug)}
			<li><a class="chip" href={href(`/positions/${slug}`)}>{positionLabel[slug]()}</a></li>
		{/each}
	</ul>
</nav>
