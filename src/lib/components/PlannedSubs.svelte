<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { plannedSubs, type MatchState, type SubOption, type SubPlan } from '#lib/volley/match.js';
	import type { RoleId } from '#lib/volley/model.js';
	import IconArrowLeftRight from '~icons/lucide/arrow-left-right';

	/** The team's planned substitutions that are due in this rotation, each with a button to make it. */
	let {
		match,
		plan,
		benchSize,
		occupant,
		starter,
		bench,
		onSub
	}: {
		match: MatchState;
		plan: SubPlan;
		benchSize: number;
		/** Whoever plays in a starting position now. */
		occupant: (role: RoleId) => string;
		/** The starter of a position. */
		starter: (role: RoleId) => string;
		bench: (index: number) => string;
		onSub: (role: RoleId, option: SubOption) => void;
	} = $props();

	const due = $derived(plannedSubs(match, plan, benchSize));
</script>

{#if due.length}
	<section class="mt-3" aria-labelledby="planned-heading">
		<h2 id="planned-heading" class="eyebrow">{m.plan_reminder_title()}</h2>
		<ul class="mt-1.5 space-y-2">
			{#each due as p (p.role)}
				<li
					class="animate-reveal flex flex-wrap items-center gap-2 rounded-xl border border-accent px-3 py-2"
				>
					<IconArrowLeftRight class="size-4 shrink-0 text-accent" aria-hidden="true" />
					<span class="min-w-0 flex-1 text-sm font-medium">
						{p.option.kind === 'bench'
							? m.plan_reminder_in({ in: bench(p.option.bench), out: occupant(p.role) })
							: m.plan_reminder_return({ in: starter(p.role), out: occupant(p.role) })}
					</span>
					<button type="button" class="btn-primary" onclick={() => onSub(p.role, p.option)}>
						{m.plan_do()}
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}
