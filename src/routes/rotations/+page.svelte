<script lang="ts">
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { rotationNumbers, rotationPath, rotationSystems } from '#lib/pages.js';
	import { m } from '#lib/paraglide/messages.js';
	import { DEFAULT_OPTIONS, formation } from '#lib/volley/formations.js';
	import { phaseName, rotationLabel, systemDescription, systemName } from '#lib/volley/labels.js';
	import IconArrowRight from '~icons/lucide/arrow-right';
</script>

<Seo
	title="{m.rotations_title()} · {site.name}"
	description={m.rotations_description()}
	path="/rotations"
	breadcrumbs={[
		{ name: m.nav_home(), path: '/' },
		{ name: m.rotations_title(), path: '/rotations' }
	]}
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.rotations_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.rotations_lead()}</p>
<div class="mt-6 flex flex-wrap gap-3" data-pagefind-ignore>
	<a href={href('/explorer')} class="btn-primary">
		{m.explorer_title()}
		<IconArrowRight class="size-4" aria-hidden="true" />
	</a>
	<a href={href('/guides/rotations')} class="btn-secondary">{m.guide_rotations()}</a>
</div>

{#each rotationSystems as system (system)}
	<section class="mt-12" aria-labelledby="system-{system}">
		<h2 id="system-{system}" class="text-2xl font-bold tracking-tight">
			{m.rotations_in_system({ system: systemName(system) })}
		</h2>
		<p class="mt-1 max-w-2xl text-ink-soft">{systemDescription(system)}</p>
		<ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{#each rotationNumbers as n (n)}
				{@const placed = formation({ ...DEFAULT_OPTIONS, system, rotation: n }, 'receive')}
				<li>
					<a href={href(rotationPath(system, n))} class="card block p-2 hover:border-accent">
						<span class="block px-1 pb-1 text-sm font-semibold">{rotationLabel(n, system)}</span>
						<FormationCourt
							{placed}
							runs={false}
							zones={false}
							table={false}
							label="{phaseName('receive')}, {rotationLabel(n, system)}"
						/>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/each}
