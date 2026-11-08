<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { guideLabel } from '#lib/page-labels.js';
	import { guides, type GuideSlug } from '#lib/pages.js';
	import { m } from '#lib/paraglide/messages.js';
	import IconBookOpen from '~icons/lucide/book-open';

	const summary: Record<GuideSlug, () => string> = {
		positions: m.guide_positions_summary,
		rotations: m.guide_rotations_summary,
		overlap: m.guide_overlap_summary,
		systems: m.guide_systems_summary,
		'serve-receive': m.guide_serve_receive_summary,
		defense: m.guide_defense_summary,
		coverage: m.guide_coverage_summary,
		libero: m.guide_libero_summary,
		substitutions: m.guide_substitutions_summary,
		leagues: m.guide_leagues_summary,
		'beach-to-indoor': m.guide_beach_to_indoor_summary,
		glossary: m.guide_glossary_summary
	};
</script>

<Seo title="{m.nav_guides()} · {site.name}" description={m.guides_description()} path="/guides" />

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.nav_guides()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.guides_lead()}</p>

<ol class="mt-8 grid gap-3 sm:grid-cols-2">
	{#each guides as slug, i (slug)}
		<li>
			<a href={href(`/guides/${slug}`)} class="card flex h-full gap-4 hover:border-accent">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-ink"
					>{i + 1}</span
				>
				<span>
					<span class="block font-semibold">{guideLabel[slug]()}</span>
					<span class="mt-1 block text-sm text-ink-soft">{summary[slug]()}</span>
				</span>
			</a>
		</li>
	{/each}
</ol>

<p class="mt-8 flex items-start gap-2 text-sm text-ink-soft">
	<IconBookOpen class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
	<span>
		{m.guides_rules_note()}
		<a
			class="text-accent underline"
			href="https://www.fivb.com/volleyball/the-game/official-volleyball-rules/">{m.fivb_rules()}</a
		>
	</span>
</p>
