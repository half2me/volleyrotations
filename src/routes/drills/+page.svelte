<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { DRILLS, DRILL_TOPICS, type DrillTopic } from '#lib/drills.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import IconExternal from '~icons/lucide/external-link';

	const lang = $derived(getLocale() as 'en' | 'hu');
	const topicName = (t: DrillTopic) =>
		({
			sideout: m.drills_sideout,
			transition: m.drills_transition,
			'free-ball': m.drills_free_ball,
			coverage: m.drills_coverage,
			setter: m.drills_setter,
			serving: m.drills_serving
		})[t]();
</script>

<Seo
	title="{m.drills_title()} · {site.name}"
	description={m.drills_description()}
	path="/drills"
	schema="Article"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.drills_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.drills_lead()}</p>
<p class="mt-3 max-w-2xl text-sm text-ink-soft">
	{m.drills_tracker()}
	<a class="text-accent underline" href={href('/match')}>{m.nav_match()}</a>
</p>

{#each DRILL_TOPICS as topic (topic)}
	<section class="mt-10 max-w-3xl" id={topic} aria-labelledby="{topic}-heading">
		<h2 id="{topic}-heading" class="text-2xl font-bold tracking-tight">{topicName(topic)}</h2>
		<ul class="mt-4 space-y-3">
			{#each DRILLS.filter((d) => d.topic === topic) as d (d.id)}
				<li class="card">
					<h3 class="font-bold">{d.name}</h3>
					<p class="mt-1 text-ink-soft">{d.purpose[lang]}</p>
					<p class="mt-2">{d.how[lang]}</p>
					<a
						class="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-accent underline"
						href={d.source.url}
					>
						<IconExternal class="size-4 shrink-0" aria-hidden="true" />{m.drills_source({
							source: d.source.label
						})}
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/each}
