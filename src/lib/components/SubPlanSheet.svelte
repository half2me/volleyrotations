<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { memberLabel, type Team } from '#lib/teams.svelte.js';
	import { roleName, rotationLabel } from '#lib/volley/labels.js';
	import { nextRotation, planSubCount } from '#lib/volley/match.js';
	import type { RoleId } from '#lib/volley/model.js';

	/** The team's planned substitutions as lines for the printed sheet. */
	let { team }: { team: Team } = $props();

	const plan = $derived(team.plan);
	const starter = (role: RoleId) => memberLabel(team.players[role], roleName(role));
	const bench = (i: number) => memberLabel(team.bench[i], m.match_bench_n({ n: i + 1 }));
	const ds = $derived(plan?.doubleSwitch);
</script>

{#if plan && planSubCount(plan) > 0}
	<h3 class="mt-6 font-semibold">{m.plan_title()}</h3>
	<ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
		{#if ds}
			<li>
				{m.plan_line_double({
					rotation: rotationLabel(ds.rotation, team.system),
					hitter: bench(ds.forSetter),
					setter: starter('S'),
					setter2: bench(ds.forOpposite),
					opposite: starter('OPP'),
					back: rotationLabel(nextRotation(nextRotation(nextRotation(ds.rotation))), team.system)
				})}
			</li>
		{/if}
		{#each plan.specialists as sp, i (i)}
			<li>
				{m.plan_line_specialist({
					sub: bench(sp.bench),
					starter: starter(sp.for),
					rotations: [...sp.rotations].sort((a, b) => a - b).join(', ')
				})}
			</li>
		{/each}
	</ul>
{/if}
