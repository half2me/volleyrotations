<script lang="ts">
	import IconDumbbell from '~icons/lucide/dumbbell';
	import IconGlobe from '~icons/lucide/globe';
	import IconGraduationCap from '~icons/lucide/graduation-cap';
	import IconHand from '~icons/lucide/hand';
	import IconListChecks from '~icons/lucide/list-checks';
	import IconRuler from '~icons/lucide/ruler';
	import IconScale from '~icons/lucide/scale';
	import IconSun from '~icons/lucide/sun';
	import IconUsers from '~icons/lucide/users';
	import PartnerSignal from '#lib/components/PartnerSignal.svelte';
	import PlayInHungary from '#lib/components/PlayInHungary.svelte';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import DailyQuestion from '#lib/components/DailyQuestion.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { guideLabel } from '#lib/page-labels.js';
	import { m } from '#lib/paraglide/messages.js';
	import { ballPath } from '#lib/volley/ball.js';
	import { DEFAULT_OPTIONS, formation } from '#lib/volley/formations.js';
	import { phaseName, roleName, rotationLabel, systemName } from '#lib/volley/labels.js';
	import type { RotationNo } from '#lib/volley/model.js';
	import { prefersReducedMotion } from 'svelte/motion';
	import IconArrowRight from '~icons/lucide/arrow-right';
	import IconBookOpen from '~icons/lucide/book-open';
	import IconBrain from '~icons/lucide/brain';
	import IconClipboardList from '~icons/lucide/clipboard-list';
	import IconCompass from '~icons/lucide/compass';
	import IconMove from '~icons/lucide/move';
	import IconVolleyball from '~icons/lucide/volleyball';

	// The hero court plays the six rotations, unless the reader prefers less motion.
	let rotation: RotationNo = $state(1);
	$effect(() => {
		if (prefersReducedMotion.current) return;
		const timer = setInterval(() => {
			rotation = ((rotation % 6) + 1) as RotationNo;
		}, 2600);
		return () => clearInterval(timer);
	});
	const placed = $derived(formation({ ...DEFAULT_OPTIONS, rotation }, 'receive'));
	const ball = $derived(ballPath({ ...DEFAULT_OPTIONS, rotation }, 'receive', placed, 'OH1'));

	$effect(() => explorerPrefs.load());
	const beach = $derived(explorerPrefs.current.sport === 'beach');

	type Card = { path: string; icon: typeof IconCompass; title: () => string; text: () => string };
	type Group = { id: string; title: () => string; lead: () => string; cards: Card[] };
	const learn: Group = {
		id: 'learn',
		title: m.home_group_learn,
		lead: m.home_group_learn_lead,
		cards: [
			{ path: '/learn', icon: IconGraduationCap, title: m.home_learn_title, text: m.home_learn },
			{ path: '/guides', icon: IconBookOpen, title: m.nav_guides, text: m.home_guides },
			{ path: '/quiz', icon: IconBrain, title: m.quiz_title, text: m.home_quiz },
			{
				path: '/guides/positions',
				icon: IconUsers,
				title: m.guide_positions,
				text: m.home_positions
			}
		]
	};
	const coach: Group = {
		id: 'coach',
		title: m.home_group_coach,
		lead: m.home_group_coach_lead,
		cards: [
			{ path: '/explorer', icon: IconCompass, title: m.explorer_title, text: m.home_explorer },
			{ path: '/overlap', icon: IconMove, title: m.overlap_title, text: m.home_overlap },
			{ path: '/lineup', icon: IconClipboardList, title: m.lineup_title, text: m.home_lineup },
			{ path: '/match', icon: IconVolleyball, title: m.match_title, text: m.home_match },
			{ path: '/drills', icon: IconDumbbell, title: m.drills_title, text: m.home_drills }
		]
	};
	const rules: Group = {
		id: 'rules',
		title: m.home_group_rules,
		lead: m.home_group_rules_lead,
		cards: [
			{ path: '/rules', icon: IconGlobe, title: m.rules_title, text: m.home_rules },
			{
				path: '/rules/situations',
				icon: IconScale,
				title: m.situations_title,
				text: m.home_situations
			},
			{ path: '/rules/signals', icon: IconHand, title: m.signals_title, text: m.home_signals },
			{ path: '/equipment', icon: IconRuler, title: m.equipment_title, text: m.home_equipment }
		]
	};
	const sand: Group = {
		id: 'beach',
		title: m.home_group_beach,
		lead: m.home_group_beach_lead,
		cards: [
			{ path: '/beach', icon: IconSun, title: m.beach_title, text: m.home_beach },
			{
				path: '/guides/indoor-to-beach',
				icon: IconBookOpen,
				title: m.guide_indoor_to_beach,
				text: m.guide_indoor_to_beach_summary
			},
			{
				path: '/beach/quiz',
				icon: IconListChecks,
				title: m.beach_quiz_title,
				text: m.home_beach_quiz
			},
			{
				path: '/match',
				icon: IconVolleyball,
				title: m.home_beach_match,
				text: m.home_beach_match_text
			}
		]
	};
	// The reader's own sport comes first.
	const groups = $derived(beach ? [sand, rules, learn, coach] : [learn, coach, rules, sand]);
</script>

<Seo
	title="{site.name} · {m.home_tagline()}"
	description={m.home_description()}
	path="/"
	schema="WebSite"
/>

<section class="grid items-center gap-10 md:grid-cols-[1fr_minmax(0,20rem)]">
	<div>
		<p class="eyebrow text-accent">{m.home_eyebrow()}</p>
		<h1 class="mt-2 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
			{m.home_heading()}
		</h1>
		<p class="mt-4 max-w-xl text-lg text-ink-soft">{m.home_intro()}</p>
		<div class="mt-8 flex flex-wrap gap-3">
			<a href={href('/learn')} class="btn-primary">
				{m.home_cta_learn()}
				<IconArrowRight class="size-4" aria-hidden="true" />
			</a>
			{#if beach}
				<a href={href('/beach')} class="btn-secondary">{m.beach_title()}</a>
				<a href={href('/match')} class="btn-secondary">{m.home_beach_match()}</a>
			{:else}
				<a href={href('/explorer')} class="btn-secondary">{m.home_cta_explore()}</a>
				<a href={href('/guides/indoor-to-beach')} class="btn-secondary">{m.home_cta_to_beach()}</a>
			{/if}
		</div>
	</div>
	<figure class="mx-auto w-full max-w-72">
		{#if beach}
			<PartnerSignal left="one" right="two" label={m.partner_fixed()} />
			<figcaption class="mt-2 text-center text-sm text-ink-soft">
				{m.home_beach_caption()}
			</figcaption>
		{:else}
			<FormationCourt
				{placed}
				{ball}
				you="OH1"
				area
				label={m.court_label({
					phase: phaseName('receive'),
					rotation: rotationLabel(rotation, '5-1'),
					you: roleName('OH1')
				})}
			/>
			<figcaption class="mt-2 text-center text-sm text-ink-soft">
				{systemName('5-1')} · {phaseName('receive')} · {rotationLabel(rotation, '5-1')}
			</figcaption>
		{/if}
	</figure>
</section>

{#each groups as g (g.id)}
	<section class="mt-14" aria-labelledby="{g.id}-heading">
		<h2 id="{g.id}-heading" class="text-2xl font-bold tracking-tight">{g.title()}</h2>
		<p class="mt-1 max-w-2xl text-ink-soft">{g.lead()}</p>
		<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each g.cards as card (card.path + card.title())}
				<li>
					<a href={href(card.path)} class="card flex h-full gap-4 hover:border-accent">
						<card.icon class="mt-0.5 size-6 shrink-0 text-accent" aria-hidden="true" />
						<span>
							<span class="block font-semibold">{card.title()}</span>
							<span class="mt-1 block text-sm text-ink-soft">{card.text()}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<div class="mt-14"><PlayInHungary /></div>

<div class="mt-16"><DailyQuestion /></div>

<section class="mt-16 grid gap-6 md:grid-cols-2" aria-labelledby="start-heading">
	<div>
		<h2 id="start-heading" class="text-2xl font-bold tracking-tight">{m.home_start()}</h2>
		<ol class="mt-4 space-y-3">
			{#each ['rotations', 'positions', 'overlap', 'systems'] as const as slug, i (slug)}
				<li>
					<a href={href(`/guides/${slug}`)} class="flex items-center gap-3 hover:text-accent">
						<span
							class="flex size-8 shrink-0 items-center justify-center rounded-full border border-line font-semibold"
							>{i + 1}</span
						>
						<span class="font-medium underline-offset-4 hover:underline">{guideLabel[slug]()}</span>
					</a>
				</li>
			{/each}
		</ol>
	</div>
	<aside class="card self-start">
		<h2 class="font-bold">{m.home_rule_title()}</h2>
		<p class="mt-2 text-ink-soft">{m.home_rule_text()}</p>
		<a
			href={href('/guides/overlap')}
			class="mt-3 inline-flex min-h-11 items-center gap-1 font-medium text-accent"
		>
			{m.guide_overlap()}<IconArrowRight class="size-4" aria-hidden="true" />
		</a>
	</aside>
</section>
