<script lang="ts">
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { rotationLabel } from '#lib/volley/labels.js';
	import {
		logCsv,
		longestRuns,
		outcomeCounts,
		playerStats,
		rotationStats,
		type PlayerKey,
		type RallyRecord
	} from '#lib/volley/match.js';
	import type { SystemId } from '#lib/volley/model.js';
	import IconDownload from '~icons/lucide/download';

	/**
	 * A match's statistics: sideout and points on serve per rotation, the longest runs and, when the
	 * coach recorded how rallies ended, each player's points, errors and passing.
	 */
	let {
		log,
		system,
		playerName,
		filename,
		headingLevel = 2
	}: {
		log: readonly RallyRecord[];
		system: SystemId;
		playerName: (key: PlayerKey) => string;
		filename: string;
		headingLevel?: 2 | 3;
	} = $props();

	const stats = $derived(rotationStats(log));
	const runs = $derived(longestRuns(log));
	/** The rotation with the lowest sideout rate, once it has a few receptions to judge by. */
	const weakest = $derived(
		stats
			.filter((r) => r.received >= 3)
			.sort((a, b) => a.sidedOut / a.received - b.sidedOut / b.received)[0]
	);
	const players = $derived(
		[...playerStats(log)].sort(
			([, a], [, b]) => b.kills + b.aces + b.blocks - (a.kills + a.aces + a.blocks)
		)
	);
	const outcomes = $derived(outcomeCounts(log));
	const detailed = $derived(log.some((r) => r.detail));
	const pct = (n: number, of: number) => (of ? `${Math.round((100 * n) / of)}%` : '–');
	const avg = (total: number, n: number) => (n ? (total / n).toFixed(2) : '–');
	const id = $props.id();

	function downloadCsv() {
		const blob = new Blob([logCsv(log, playerName)], { type: 'text/csv' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = filename;
		a.click();
		URL.revokeObjectURL(a.href);
	}
</script>

<section aria-labelledby="{id}-rot" data-pagefind-ignore>
	<svelte:element this={`h${headingLevel}`} id="{id}-rot" class="text-xl font-bold"
		>{m.stats_title()}</svelte:element
	>
	<p class="mt-1 text-sm text-ink-soft">{m.stats_help()}</p>
	<table class="mt-3 w-full max-w-xl table-fixed border-collapse text-sm">
		<thead>
			<tr class="text-left text-ink-soft">
				<th scope="col" class="py-1 pr-2 font-medium">{m.label_rotation()}</th>
				<th scope="col" class="py-1 pr-2 font-medium">{m.stats_sideout()}</th>
				<th scope="col" class="py-1 font-medium">{m.stats_on_serve()}</th>
			</tr>
		</thead>
		<tbody>
			{#each stats as r (r.rotation)}
				<tr class="border-t border-line">
					<th scope="row" class="py-1.5 pr-2 text-left font-medium"
						>{rotationLabel(r.rotation, system)}</th
					>
					<td class="py-1.5 pr-2 tabular-nums">
						{pct(r.sidedOut, r.received)}
						<span class="text-ink-soft">({r.sidedOut}/{r.received})</span>
					</td>
					<td class="py-1.5 tabular-nums">
						{pct(r.scored, r.served)}
						<span class="text-ink-soft">({r.scored}/{r.served})</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<p class="mt-3 text-sm">{m.stats_runs({ us: runs.us, them: runs.them })}</p>
	{#if weakest}
		<p class="mt-1 text-sm">
			{m.stats_weakest({
				rotation: rotationLabel(weakest.rotation, system),
				pct: pct(weakest.sidedOut, weakest.received)
			})}
			<a class="text-accent underline" href="{href('/drills')}#sideout">{m.stats_drills()}</a>
		</p>
	{/if}

	{#if detailed}
		<svelte:element this={`h${headingLevel + 1}`} class="mt-6 font-bold"
			>{m.stats_players()}</svelte:element
		>
		<p class="mt-1 text-sm text-ink-soft">{m.stats_players_help()}</p>
		<table class="mt-3 w-full table-fixed border-collapse text-sm">
			<thead>
				<tr class="text-left text-ink-soft">
					<th scope="col" class="w-[30%] py-1 pr-2 font-medium">{m.stats_player()}</th>
					<th scope="col" class="py-1 pr-1 font-medium" title={m.stats_kills_long()}
						>{m.stats_kills()}</th
					>
					<th scope="col" class="py-1 pr-1 font-medium" title={m.stats_aces_long()}
						>{m.stats_aces()}</th
					>
					<th scope="col" class="py-1 pr-1 font-medium" title={m.stats_blocks_long()}
						>{m.stats_blocks()}</th
					>
					<th scope="col" class="py-1 pr-1 font-medium" title={m.stats_errors_long()}
						>{m.stats_errors()}</th
					>
					<th scope="col" class="py-1 font-medium" title={m.stats_pass_long()}>{m.stats_pass()}</th>
				</tr>
			</thead>
			<tbody>
				{#each players as [key, s] (key)}
					<tr class="border-t border-line">
						<th scope="row" class="truncate py-1.5 pr-2 text-left font-medium">{playerName(key)}</th
						>
						<td class="py-1.5 pr-1 tabular-nums">{s.kills}</td>
						<td class="py-1.5 pr-1 tabular-nums">{s.aces}</td>
						<td class="py-1.5 pr-1 tabular-nums">{s.blocks}</td>
						<td class="py-1.5 pr-1 tabular-nums"
							>{s.attackErrors + s.serveErrors + s.blocked + s.errors}</td
						>
						<td class="py-1.5 tabular-nums"
							>{avg(s.passTotal, s.passes)}
							{#if s.passes}<span class="text-ink-soft">({s.passes})</span>{/if}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="mt-3 text-sm">
			{m.stats_team_line({
				kills: outcomes.kill ?? 0,
				aces: outcomes.ace ?? 0,
				blocks: outcomes.block ?? 0,
				oppErrors: outcomes['opp-error'] ?? 0,
				errors:
					(outcomes['attack-error'] ?? 0) +
					(outcomes['serve-error'] ?? 0) +
					(outcomes.blocked ?? 0) +
					(outcomes.error ?? 0)
			})}
		</p>
		<p class="mt-1 text-xs text-ink-soft">{m.stats_legend()}</p>
	{/if}

	<button type="button" class="btn-secondary mt-4" disabled={!log.length} onclick={downloadCsv}>
		<IconDownload class="size-4" aria-hidden="true" />{m.stats_csv()}
	</button>
</section>
