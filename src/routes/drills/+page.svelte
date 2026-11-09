<script lang="ts">
	import PlayInHungary from '#lib/components/PlayInHungary.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import {
		BEACH_DRILLS,
		BEACH_DRILL_TOPICS,
		DRILLS,
		DRILL_TOPICS,
		type DrillTopic
	} from '#lib/drills.js';
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import type { Sport } from '#lib/volley/match.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import IconExternal from '~icons/lucide/external-link';
	import IconPlus from '~icons/lucide/plus';
	import PracticePlan from '#lib/components/PracticePlan.svelte';
	import { Persisted } from '#lib/persisted.svelte.js';

	const plan = new Persisted<{ items: { id: string; minutes: number }[] }>('vr:practice', {
		items: []
	});
	$effect(() => plan.load());

	const lang = $derived(getLocale() as 'en' | 'hu');
	$effect(() => explorerPrefs.load());
	// Starts on the reader's sport; switching here does not change the site-wide choice.
	let sport: Sport = $derived(explorerPrefs.current.sport ?? 'indoor');
	const topics = $derived(sport === 'beach' ? BEACH_DRILL_TOPICS : DRILL_TOPICS);
	const drills = $derived(sport === 'beach' ? BEACH_DRILLS : DRILLS);
	const topicName = (t: DrillTopic) =>
		({
			sideout: m.drills_sideout,
			transition: m.drills_transition,
			'free-ball': m.drills_free_ball,
			coverage: m.drills_coverage,
			setter: m.drills_setter,
			serving: m.drills_serving,
			'beach-receive': m.drills_beach_receive,
			'beach-setting': m.drills_beach_setting,
			'beach-shots': m.drills_beach_shots,
			'beach-block-defence': m.drills_beach_block,
			'beach-serving': m.drills_beach_serving,
			'beach-games': m.drills_beach_games
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

<div class="mt-6" data-pagefind-ignore>
	<ChipGroup
		legend={m.sport_label()}
		options={[
			{ value: 'indoor', label: m.sport_indoor() },
			{ value: 'beach', label: m.sport_beach() }
		]}
		bind:value={sport}
	/>
</div>

<div class="mt-8"><PracticePlan {plan} /></div>

{#each topics as topic (topic)}
	<section class="mt-10 max-w-3xl" id={topic} aria-labelledby="{topic}-heading">
		<h2 id="{topic}-heading" class="text-2xl font-bold tracking-tight">{topicName(topic)}</h2>
		<ul class="mt-4 space-y-3">
			{#each drills.filter((d) => d.topic === topic) as d (d.id)}
				<li class="card">
					<h3 class="font-bold">{d.name}</h3>
					<p class="mt-1 text-ink-soft">{d.purpose[lang]}</p>
					<p class="mt-2">{d.how[lang]}</p>
					<div class="mt-2 flex flex-wrap items-center gap-x-4">
						<a
							class="inline-flex min-h-11 items-center gap-1.5 text-sm text-accent underline"
							href={d.source.url}
						>
							<IconExternal class="size-4 shrink-0" aria-hidden="true" />{m.drills_source({
								source: d.source.label
							})}
						</a>
						<button
							type="button"
							class="btn-secondary"
							data-pagefind-ignore
							onclick={() =>
								plan.set({ items: [...plan.current.items, { id: d.id, minutes: 10 }] })}
						>
							<IconPlus class="size-4" aria-hidden="true" />{m.plan_add()}
							<span class="sr-only">{d.name}</span>
						</button>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<div class="mt-12 max-w-3xl"><PlayInHungary /></div>
