<script lang="ts">
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { guideLabel } from '#lib/page-labels.js';
	import { m } from '#lib/paraglide/messages.js';
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

	const tools = [
		{ path: '/explorer', icon: IconCompass, title: m.explorer_title, text: m.home_explorer },
		{ path: '/overlap', icon: IconMove, title: m.overlap_title, text: m.home_overlap },
		{ path: '/quiz', icon: IconBrain, title: m.quiz_title, text: m.home_quiz },
		{ path: '/lineup', icon: IconClipboardList, title: m.lineup_title, text: m.home_lineup },
		{ path: '/match', icon: IconVolleyball, title: m.match_title, text: m.home_match }
	] as const;
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
			<a href={href('/explorer')} class="btn-primary">
				{m.home_cta_explore()}
				<IconArrowRight class="size-4" aria-hidden="true" />
			</a>
			<a href={href('/learn')} class="btn-secondary">{m.home_cta_learn()}</a>
			<a href={href('/guides/beach-to-indoor')} class="btn-secondary">{m.home_cta_beach()}</a>
		</div>
	</div>
	<figure class="mx-auto w-full max-w-72">
		<FormationCourt
			{placed}
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
	</figure>
</section>

<section class="mt-16" aria-labelledby="tools-heading">
	<h2 id="tools-heading" class="text-2xl font-bold tracking-tight">{m.home_tools()}</h2>
	<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each tools as tool (tool.path)}
			<li>
				<a href={href(tool.path)} class="card flex h-full gap-4 hover:border-accent">
					<tool.icon class="mt-0.5 size-6 shrink-0 text-accent" aria-hidden="true" />
					<span>
						<span class="block font-semibold">{tool.title()}</span>
						<span class="mt-1 block text-sm text-ink-soft">{tool.text()}</span>
					</span>
				</a>
			</li>
		{/each}
		<li>
			<a href={href('/guides')} class="card flex h-full gap-4 hover:border-accent">
				<IconBookOpen class="mt-0.5 size-6 shrink-0 text-accent" aria-hidden="true" />
				<span>
					<span class="block font-semibold">{m.nav_guides()}</span>
					<span class="mt-1 block text-sm text-ink-soft">{m.home_guides()}</span>
				</span>
			</a>
		</li>
	</ul>
</section>

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
