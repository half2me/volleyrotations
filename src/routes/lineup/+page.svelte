<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import PlayerCard from '#lib/components/PlayerCard.svelte';
	import PlaybookEditor from '#lib/components/PlaybookEditor.svelte';
	import { shareFragment, teamFromFragment } from '#lib/share.js';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		memberLabel,
		newTeam,
		teamPlaybook,
		teams,
		type Member,
		type Team
	} from '#lib/teams.svelte.js';
	import {
		DEFENSE_SYSTEMS,
		DEFAULT_OPTIONS,
		formation,
		formationsFor
	} from '#lib/volley/formations.js';
	import {
		defenseName,
		phaseName,
		roleName,
		roleShort,
		rotationLabel,
		slotName,
		taskName,
		systemName
	} from '#lib/volley/labels.js';
	import {
		ROTATIONS,
		SYSTEMS,
		ZONES,
		isFront,
		rolesOf,
		zonesInRotation,
		type RoleId,
		type RotationNo
	} from '#lib/volley/model.js';
	import IconLink from '~icons/lucide/link';
	import IconPlus from '~icons/lucide/plus';
	import IconPrinter from '~icons/lucide/printer';
	import IconTrash from '~icons/lucide/trash-2';
	import IconUserPlus from '~icons/lucide/user-plus';

	$effect(() => teams.load());

	// A shared team arrives in the URL fragment; it is offered, never added without asking.
	let incoming: Team | undefined = $state();
	let imported = $state('');
	$effect(() => {
		incoming = teamFromFragment(location.hash);
	});

	function importTeam() {
		if (!incoming) return;
		teams.set({ list: [...teams.current.list, incoming], active: incoming.id });
		imported = incoming.name;
		dismissImport();
	}

	function dismissImport() {
		incoming = undefined;
		replaceState(location.pathname + location.search, {});
	}

	// The page works without a saved team: edits to this draft are saved once made.
	const team: Team = $derived(
		teams.current.list.find((t) => t.id === teams.current.active) ??
			teams.current.list[0] ??
			newTeam(m.lineup_default_name())
	);

	function save(patch: Partial<Team>) {
		const next = { ...team, ...patch };
		const list = teams.current.list.some((t) => t.id === next.id)
			? teams.current.list.map((t) => (t.id === next.id ? next : t))
			: [...teams.current.list, next];
		teams.set({ list, active: next.id });
	}

	function setMember(role: RoleId, field: keyof Member, value: string) {
		const current = team.players[role] ?? { name: '', number: '' };
		save({ players: { ...team.players, [role]: { ...current, [field]: value } } });
	}

	function addTeam() {
		const t = newTeam(m.lineup_new_name({ n: teams.current.list.length + 1 }));
		teams.set({ list: [...teams.current.list, t], active: t.id });
	}

	function removeTeam() {
		if (!confirm(m.lineup_delete_confirm({ name: team.name }))) return;
		const list = teams.current.list.filter((t) => t.id !== team.id);
		teams.set({ list, active: list[0]?.id });
	}

	let copied: 'yes' | 'failed' | undefined = $state();
	const shareUrl = $derived(`${site.url}${page.url.pathname}#${shareFragment(team)}`);
	async function copyShare() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = 'yes';
		} catch {
			copied = 'failed';
		}
	}

	const roles = $derived(rolesOf(team.system, team.libero));
	const formations = $derived(formationsFor(team));
	const options = $derived({
		...DEFAULT_OPTIONS,
		...teamPlaybook(team),
		formation: formations.includes(team.formation) ? team.formation : formations[0]
	});

	/** Rotations in the order the team plays them, from its starting rotation. */
	const order = $derived(ROTATIONS.map((_, i) => (((team.start - 1 + i) % 6) + 1) as RotationNo));

	const tokens = $derived(
		Object.fromEntries(
			roles.map((r) => [r, team.players[r]?.number.trim() || roleShort(r)])
		) as Partial<Record<RoleId, string>>
	);
	const label = (r: RoleId) => memberLabel(team.players[r], roleName(r));

	const startZones = $derived(zonesInRotation(team.system, team.start, team.order));
	const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

	let printDefense = $state(false);
	let printCards = $state(true);
</script>

<Seo
	title="{m.lineup_title()} · {site.name}"
	description={m.lineup_description()}
	path="/lineup"
	schema="WebApplication"
/>

<div class="print:hidden">
	<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.lineup_title()}</h1>
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.lineup_lead()}</p>
	<div aria-live="polite" data-pagefind-ignore>
		{#if incoming}
			<div class="card mt-6 flex flex-wrap items-center gap-3 border-accent">
				<p class="mr-auto font-medium">{m.import_found({ name: incoming.name })}</p>
				<button type="button" class="btn-primary" onclick={importTeam}>{m.import_add()}</button>
				<button type="button" class="btn-secondary" onclick={dismissImport}
					>{m.import_dismiss()}</button
				>
			</div>
		{:else if imported}
			<p class="card mt-6">{m.import_done({ name: imported })}</p>
		{/if}
	</div>
</div>

<div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] print:hidden" data-pagefind-ignore>
	<section class="card space-y-5" aria-labelledby="team-heading">
		<h2 id="team-heading" class="text-xl font-bold">{m.lineup_team()}</h2>
		<div class="flex gap-2">
			<label class="min-w-0 flex-1">
				<span class="sr-only">{m.lineup_choose_team()}</span>
				<select
					class="field"
					value={team.id}
					onchange={(e) => teams.set({ ...teams.current, active: e.currentTarget.value })}
				>
					{#each teams.current.list.some((t) => t.id === team.id) ? teams.current.list : [team] as t (t.id)}
						<option value={t.id}>{t.name}</option>
					{/each}
				</select>
			</label>
			<button
				type="button"
				class="btn-secondary"
				onclick={addTeam}
				aria-label={m.lineup_add_team()}
			>
				<IconPlus class="size-4" aria-hidden="true" />
			</button>
			<button
				type="button"
				class="btn-secondary"
				onclick={removeTeam}
				aria-label={m.lineup_delete_team()}
			>
				<IconTrash class="size-4" aria-hidden="true" />
			</button>
		</div>
		<label class="block">
			<span class="eyebrow">{m.lineup_team_name()}</span>
			<input
				class="field mt-1"
				value={team.name}
				onchange={(e) => save({ name: e.currentTarget.value || m.lineup_default_name() })}
			/>
		</label>
		<ChipGroup
			legend={m.label_system()}
			options={SYSTEMS.map((s) => ({ value: s, label: systemName(s) }))}
			bind:value={() => team.system, (system) => save({ system, custom: undefined })}
		/>
		{#if team.system !== '6-6'}
			<ChipGroup
				legend={m.label_libero()}
				options={[
					{ value: true, label: m.yes() },
					{ value: false, label: m.no() }
				]}
				bind:value={() => team.libero, (libero) => save({ libero, custom: undefined })}
			/>
		{/if}
		{#if formations.length > 1}
			<ChipGroup
				legend={m.label_formation()}
				options={formations.map((f) => ({ value: f, label: m.formation_n({ n: f }) }))}
				bind:value={() => options.formation, (formation) => save({ formation })}
			/>
		{/if}
		<ChipGroup
			legend={m.label_defense()}
			options={DEFENSE_SYSTEMS.map((d) => ({ value: d, label: defenseName(d) }))}
			bind:value={() => team.defense, (defense) => save({ defense })}
		/>
		<ChipGroup
			legend={m.lineup_start()}
			options={ROTATIONS.map((r) => ({ value: r, label: String(r) }))}
			bind:value={() => team.start, (start) => save({ start })}
		/>
	</section>

	<div class="min-w-0 space-y-6">
		<section class="card" aria-labelledby="players-heading">
			<h2 id="players-heading" class="text-xl font-bold">{m.lineup_players()}</h2>
			<p class="mt-1 text-sm text-ink-soft">{m.lineup_players_help()}</p>
			<div class="mt-4 space-y-3">
				{#each roles as role (role)}
					<div class="grid grid-cols-[4.5rem_1fr] items-end gap-2 sm:grid-cols-[9rem_4.5rem_1fr]">
						<p class="col-span-2 font-medium sm:col-span-1 sm:self-center">{roleName(role)}</p>
						<label>
							<span class="sr-only">{m.lineup_number({ role: roleName(role) })}</span>
							<input
								class="field text-center"
								inputmode="numeric"
								placeholder="#"
								value={team.players[role]?.number ?? ''}
								onchange={(e) => setMember(role, 'number', e.currentTarget.value)}
							/>
						</label>
						<label>
							<span class="sr-only">{m.lineup_name({ role: roleName(role) })}</span>
							<input
								class="field"
								placeholder={m.lineup_name_placeholder()}
								value={team.players[role]?.name ?? ''}
								onchange={(e) => setMember(role, 'name', e.currentTarget.value)}
							/>
						</label>
					</div>
				{/each}
			</div>

			<h3 class="mt-6 font-semibold">{m.lineup_bench()}</h3>
			<p class="mt-1 text-sm text-ink-soft">{m.lineup_bench_help()}</p>
			<ul class="mt-3 space-y-2">
				{#each team.bench as member, i (i)}
					<li class="grid grid-cols-[4.5rem_1fr_auto] gap-2">
						<label>
							<span class="sr-only">{m.lineup_bench_number({ n: i + 1 })}</span>
							<input
								class="field text-center"
								inputmode="numeric"
								placeholder="#"
								value={member.number}
								onchange={(e) =>
									save({
										bench: team.bench.map((b, j) =>
											j === i ? { ...b, number: e.currentTarget.value } : b
										)
									})}
							/>
						</label>
						<label>
							<span class="sr-only">{m.lineup_bench_name({ n: i + 1 })}</span>
							<input
								class="field"
								placeholder={m.lineup_name_placeholder()}
								value={member.name}
								onchange={(e) =>
									save({
										bench: team.bench.map((b, j) =>
											j === i ? { ...b, name: e.currentTarget.value } : b
										)
									})}
							/>
						</label>
						<button
							type="button"
							class="btn-ghost"
							aria-label={m.lineup_bench_remove({ n: i + 1 })}
							onclick={() => save({ bench: team.bench.filter((_, j) => j !== i) })}
						>
							<IconTrash class="size-4" aria-hidden="true" />
						</button>
					</li>
				{/each}
			</ul>
			<button
				type="button"
				class="btn-secondary mt-3"
				onclick={() => save({ bench: [...team.bench, { name: '', number: '' }] })}
			>
				<IconUserPlus class="size-4" aria-hidden="true" />{m.lineup_bench_add()}
			</button>
		</section>

		<PlaybookEditor {team} {save} names={tokens} />

		<section class="card" aria-labelledby="share-heading">
			<h2 id="share-heading" class="text-xl font-bold">{m.share_title()}</h2>
			<p class="mt-1 text-sm text-ink-soft">{m.share_help()}</p>
			<div class="mt-3 flex flex-wrap gap-2">
				<label class="min-w-0 flex-1">
					<span class="sr-only">{m.share_title()}</span>
					<input
						class="field"
						readonly
						value={shareUrl}
						onfocus={(e) => e.currentTarget.select()}
					/>
				</label>
				<button type="button" class="btn-secondary" onclick={copyShare}>
					<IconLink class="size-4" aria-hidden="true" />{m.share_copy()}
				</button>
			</div>
			<p class="mt-2 text-sm" aria-live="polite">
				{copied === 'yes' ? m.share_copied() : copied === 'failed' ? m.share_failed() : ''}
			</p>
		</section>

		<section class="card" aria-labelledby="slip-heading">
			<h2 id="slip-heading" class="text-xl font-bold">{m.lineup_slip()}</h2>
			<p class="mt-1 text-sm text-ink-soft">{m.lineup_slip_help()}</p>
			<table class="mt-4 w-full max-w-sm table-fixed border-collapse text-center">
				<tbody>
					{#each [[4, 3, 2], [5, 6, 1]] as row, ri (ri)}
						<tr>
							{#each row as z (z)}
								<td class="border border-line p-2">
									<span class="block text-xs text-ink-soft">{ROMAN[z - 1]}</span>
									<span class="block text-lg font-bold">{tokens[startZones[z as 1]] ?? '–'}</span>
									<span class="block truncate text-xs">{roleShort(startZones[z as 1])}</span>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="card" aria-labelledby="print-heading">
			<h2 id="print-heading" class="text-xl font-bold">{m.lineup_print()}</h2>
			<p class="mt-1 text-sm text-ink-soft">{m.lineup_print_help()}</p>
			<div class="mt-3 flex flex-wrap gap-2">
				<label class="chip gap-2">
					<input type="checkbox" class="size-4 accent-current" checked disabled />
					{phaseName('receive')}
				</label>
				<label class="chip gap-2">
					<input type="checkbox" class="size-4" bind:checked={printDefense} />
					{phaseName('defense')}
				</label>
				<label class="chip gap-2">
					<input type="checkbox" class="size-4" bind:checked={printCards} />
					{m.lineup_cards()}
				</label>
			</div>
			<button type="button" class="btn-primary mt-4" onclick={() => print()}>
				<IconPrinter class="size-4" aria-hidden="true" />{m.lineup_print_button()}
			</button>
		</section>
	</div>
</div>

<!-- The sheets: a preview on screen, the whole page when printed. -->
<section class="mt-12 print:mt-0" aria-labelledby="sheet-heading" data-pagefind-ignore>
	<h2 id="sheet-heading" class="text-2xl font-bold tracking-tight print:text-xl">
		{team.name}: {m.lineup_sheet_title({ system: systemName(team.system) })}
	</h2>
	<p class="mt-1 text-sm text-ink-soft">
		{roles.map((r) => `${tokens[r]} = ${label(r)}`).join(' · ')}
	</p>

	<h3 class="mt-6 font-semibold">
		{phaseName('receive')} ({m.formation_n({ n: options.formation })})
	</h3>
	<ol class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3 print:gap-2">
		{#each order as r (r)}
			<li class="card break-inside-avoid p-2">
				<p class="px-1 pb-1 text-sm font-semibold">{rotationLabel(r, team.system)}</p>
				<FormationCourt
					placed={formation({ ...options, rotation: r }, 'receive')}
					names={tokens}
					label="{phaseName('receive')}, {rotationLabel(r, team.system)}"
				/>
			</li>
		{/each}
	</ol>

	{#if printDefense}
		<h3 class="mt-6 break-before-page font-semibold">
			{phaseName('defense')}: {defenseName(team.defense)}
		</h3>
		<ol class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3 print:gap-2">
			{#each order as r (r)}
				<li class="card break-inside-avoid p-2">
					<p class="px-1 pb-1 text-sm font-semibold">{rotationLabel(r, team.system)}</p>
					<FormationCourt
						placed={formation({ ...options, rotation: r, serving: true }, 'defense')}
						names={tokens}
						label="{phaseName('defense')}, {rotationLabel(r, team.system)}"
					/>
				</li>
			{/each}
		</ol>
	{/if}

	{#if printCards}
		<h3 class="mt-6 break-before-page font-semibold">{m.lineup_cards()}</h3>
		<div class="mt-2 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
			{#each roles as role (role)}
				<PlayerCard {options} {role} title="{label(role)} · {roleName(role)}" rotations={order} />
			{/each}
		</div>
	{/if}
	<p class="mt-4 text-xs text-ink-soft print:block">
		{site.name} · {m.lineup_print_footer()}
		<a href={href('/explorer')} class="underline">{m.explorer_title()}</a>
	</p>
</section>
