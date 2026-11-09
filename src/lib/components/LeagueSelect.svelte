<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { leagueName, regionName } from '#lib/volley/labels.js';
	import { REGIONS, type LeagueId } from '#lib/volley/leagues.js';

	/** The rule set to follow, grouped by where people play. */
	let { value = $bindable() }: { value: LeagueId } = $props();
	const id = $props.id();
</script>

<label for={id} class="eyebrow">{m.label_league()}</label>
<select {id} class="field mt-2" bind:value>
	{#each REGIONS as region (region.id)}
		<optgroup label={regionName(region.id)}>
			{#each region.leagues as league (league)}
				<option value={league}>{leagueName(league)}</option>
			{/each}
		</optgroup>
	{/each}
</select>
