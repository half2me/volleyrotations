<script lang="ts">
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { formation, type Options } from '#lib/volley/formations.js';
	import { phaseName, rotationLabel, slotName, taskName } from '#lib/volley/labels.js';
	import { isFront, zoneOf, type RoleId, type RotationNo } from '#lib/volley/model.js';

	/**
	 * One player's card: their zone, serve-receive job and spot after the switch in every
	 * rotation, optionally with the receive diagram for each.
	 */
	let {
		options,
		role,
		title,
		rotations,
		names,
		diagrams = false
	}: {
		options: Options;
		role: RoleId;
		title: string;
		/** The rotations in the order the team plays them. */
		rotations: readonly RotationNo[];
		names?: Partial<Record<RoleId, string>>;
		diagrams?: boolean;
	} = $props();

	const rows = $derived(
		rotations.map((r) => {
			const receive = formation({ ...options, rotation: r, serving: false }, 'receive');
			const me = receive.find((p) => p.role === role);
			const zone = me?.zone ?? zoneOf(options.system, r, role, options.order);
			return { r, receive, me, zone };
		})
	);
</script>

<article class="card break-inside-avoid overflow-x-auto">
	<h4 class="font-bold">{title}</h4>
	<table class="mt-2 w-full text-left text-sm">
		<thead>
			<tr class="text-ink-soft">
				<th scope="col" class="py-1 pr-2 font-medium">{m.label_rotation()}</th>
				<th scope="col" class="py-1 pr-2 font-medium">{m.your_zone()}</th>
				<th scope="col" class="py-1 pr-2 font-medium">{phaseName('receive')}</th>
				<th scope="col" class="py-1 font-medium">{m.your_spot()}</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as { r, me, zone } (r)}
				<tr class="border-t border-line">
					<td class="py-1 pr-2">{r}</td>
					<td class="py-1 pr-2">
						{zone ?? '–'}{zone ? ` (${isFront(zone) ? m.row_front() : m.row_back()})` : ''}
					</td>
					<td class="py-1 pr-2">{me ? taskName(me.task) : m.lineup_on_bench()}</td>
					<td class="py-1">{me ? slotName(me.slot) : '–'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if diagrams}
		<ol class="mt-3 grid grid-cols-3 gap-2">
			{#each rows as { r, receive } (r)}
				<li class="break-inside-avoid">
					<p class="text-xs font-semibold">{rotationLabel(r, options.system)}</p>
					<FormationCourt
						placed={receive}
						{names}
						you={role}
						runs={false}
						zones={false}
						label="{phaseName('receive')}, {rotationLabel(r, options.system)}"
					/>
				</li>
			{/each}
		</ol>
	{/if}
</article>
