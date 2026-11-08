<script lang="ts">
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Persisted } from '#lib/persisted.svelte.js';
	import { memberLabel, newTeam, teams, type Member, type Team } from '#lib/teams.svelte.js';
	import { DEFAULT_OPTIONS, formation } from '#lib/volley/formations.js';
	import { roleName, roleShort, rotationLabel } from '#lib/volley/labels.js';
	import {
		SUBS_PER_SET,
		TIMEOUTS_PER_SET,
		courtRoles,
		newMatch,
		nextSetServing,
		rally,
		setOver,
		setTarget,
		setWinner,
		setsWon,
		startSet,
		subOptions,
		substitute,
		type MatchState,
		type SubOption
	} from '#lib/volley/match.js';
	import { ROTATIONS, SYSTEMS, type RoleId, type RotationNo } from '#lib/volley/model.js';
	import { Dialog } from 'bits-ui';
	import IconArrowLeftRight from '~icons/lucide/arrow-left-right';
	import IconFlag from '~icons/lucide/flag';
	import IconTimer from '~icons/lucide/timer';
	import IconUndo from '~icons/lucide/undo-2';
	import IconVolleyball from '~icons/lucide/volleyball';
	import IconX from '~icons/lucide/x';

	type Saved = {
		match?: MatchState;
		history: MatchState[];
		teamId?: string;
		opponent: string;
	};
	const saved = new Persisted<Saved>('vr:match', { history: [], opponent: '' });

	$effect(() => {
		teams.load();
		saved.load();
	});

	// Setup choices before a match starts.
	let teamId: string | undefined = $state();
	let opponent = $state('');
	let firstServe = $state(true);
	let looseSystem = $state(DEFAULT_OPTIONS.system);

	const setupTeam = $derived(teams.current.list.find((t) => t.id === teamId));
	// Follows the chosen team's starting rotation until the reader picks another.
	let startRotation: RotationNo = $derived(setupTeam?.start ?? 1);

	const team: Team = $derived(
		teams.current.list.find((t) => t.id === saved.current.teamId) ?? {
			...newTeam(m.match_us()),
			system: saved.current.match?.system ?? looseSystem,
			libero: saved.current.match?.libero ?? true
		}
	);
	const match = $derived(saved.current.match);

	function begin() {
		const t = setupTeam;
		saved.set({
			teamId: t?.id,
			opponent: opponent.trim(),
			history: [],
			match: newMatch({
				system: t?.system ?? looseSystem,
				libero: t ? t.libero && t.system !== '6-6' : looseSystem !== '6-6',
				rotation: startRotation,
				serving: firstServe
			})
		});
	}

	function apply(next: MatchState) {
		if (!match) return;
		saved.set({
			...saved.current,
			match: next,
			history: [...saved.current.history, match].slice(-300)
		});
	}

	function undo() {
		const history = saved.current.history;
		if (!history.length) return;
		saved.set({ ...saved.current, match: history.at(-1), history: history.slice(0, -1) });
	}

	function endMatch() {
		if (confirm(m.match_end_confirm()))
			saved.set({ ...saved.current, match: undefined, history: [] });
	}

	/** The player in a starting position right now, after any substitution. */
	function occupant(role: RoleId): Member | undefined {
		const sub = match?.subs[role]?.sub;
		return sub !== undefined ? team.bench[sub] : team.players[role];
	}
	const label = (role: RoleId) => memberLabel(occupant(role), roleName(role));

	const options = $derived({
		...DEFAULT_OPTIONS,
		system: match?.system ?? '5-1',
		libero: match?.libero ?? true,
		formation: team.formation,
		defense: team.defense
	});
	const phase = $derived(match?.serving ? 'serve' : 'receive');
	const placed = $derived(match ? formation({ ...options, rotation: match.rotation }, phase) : []);
	const server = $derived(placed.find((p) => p.zone === 1));
	const tokens = $derived(
		Object.fromEntries(
			placed.map((p) => [p.role, occupant(p.role)?.number.trim() || roleShort(p.role)])
		) as Partial<Record<RoleId, string>>
	);

	const current = $derived(match?.sets.at(-1) ?? { us: 0, them: 0 });
	const setIndex = $derived((match?.sets.length ?? 1) - 1);
	const won = $derived(match ? setsWon(match) : { us: 0, them: 0 });
	const over = $derived(match ? setOver(match) : false);

	// Next set: defaults the reader can change before starting it.
	let nextRotation: RotationNo = $derived(team.start);
	let nextServing = $derived(match ? nextSetServing(match) : true);

	// Substitutions
	let subOpen = $state(false);
	let subRole: RoleId | undefined = $state();
	const subChoices = $derived(
		match && subRole ? subOptions(match, subRole, team.bench.length) : []
	);
	function doSub(option: SubOption) {
		if (!match || !subRole) return;
		apply(substitute(match, subRole, option));
		subOpen = false;
		subRole = undefined;
	}
</script>

<Seo title="{m.match_title()} · {site.name}" description={m.match_description()} path="/match" />

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.match_title()}</h1>

{#if !match}
	<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.match_lead()}</p>
	<form
		class="card mt-8 max-w-xl space-y-5"
		data-pagefind-ignore
		onsubmit={(e) => {
			e.preventDefault();
			begin();
		}}
	>
		<h2 class="text-xl font-bold">{m.match_new()}</h2>
		<label class="block">
			<span class="eyebrow">{m.lineup_team()}</span>
			<select class="field mt-1" bind:value={teamId}>
				<option value={undefined}>{m.match_no_team()}</option>
				{#each teams.current.list as t (t.id)}
					<option value={t.id}>{t.name} ({t.system})</option>
				{/each}
			</select>
		</label>
		{#if !setupTeam}
			<ChipGroup
				legend={m.label_system()}
				options={SYSTEMS.map((s) => ({ value: s, label: s }))}
				bind:value={looseSystem}
			/>
			<p class="text-sm text-ink-soft">
				{m.match_team_hint()}
				<a class="text-accent underline" href={href('/lineup')}>{m.lineup_title()}</a>
			</p>
		{/if}
		<label class="block">
			<span class="eyebrow">{m.match_opponent()}</span>
			<input class="field mt-1" bind:value={opponent} placeholder={m.match_them()} />
		</label>
		<ChipGroup
			legend={m.match_first_serve()}
			options={[
				{ value: true, label: m.we_serve() },
				{ value: false, label: m.we_receive() }
			]}
			bind:value={firstServe}
		/>
		<ChipGroup
			legend={m.lineup_start()}
			options={ROTATIONS.map((r) => ({ value: r, label: String(r) }))}
			bind:value={startRotation}
		/>
		<button type="submit" class="btn-primary">
			<IconVolleyball class="size-4" aria-hidden="true" />{m.match_start()}
		</button>
	</form>
{:else}
	{@const us = team.name}
	{@const them = saved.current.opponent || m.match_them()}
	<div class="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,24rem)]" data-pagefind-ignore>
		<div class="min-w-0">
			<!-- Scoreboard -->
			<section class="card" aria-label={m.match_score()}>
				<p class="eyebrow">
					{m.match_set({ n: setIndex + 1 })} · {m.match_to({ n: setTarget(setIndex) })}
				</p>
				<div class="mt-2 grid grid-cols-2 gap-3 text-center">
					{#each [{ side: 'us', name: us, points: current.us, sets: won.us, serve: match.serving }, { side: 'them', name: them, points: current.them, sets: won.them, serve: !match.serving }] as t (t.side)}
						<div>
							<p class="flex items-center justify-center gap-1.5 truncate font-semibold">
								{#if t.serve}
									<IconVolleyball
										class="size-4 shrink-0 text-accent"
										aria-label={m.match_serving()}
									/>
								{/if}
								<span class="truncate">{t.name}</span>
							</p>
							<p class="text-6xl font-bold tabular-nums sm:text-7xl" aria-live="polite">
								{t.points}
							</p>
							<p class="text-sm text-ink-soft">{m.match_sets_won({ n: t.sets })}</p>
						</div>
					{/each}
				</div>
				{#if match.sets.length > 1}
					<ol class="mt-3 flex flex-wrap justify-center gap-2 text-sm text-ink-soft">
						{#each match.sets.slice(0, -1) as s, i (i)}
							<li class="rounded-full border border-line px-2.5 py-0.5 tabular-nums">
								{i + 1}: {s.us}–{s.them}
							</li>
						{/each}
					</ol>
				{/if}
			</section>

			{#if match.finished}
				<p class="mt-6 text-2xl font-bold">
					{won.us > won.them ? m.match_won({ team: us }) : m.match_won({ team: them })}
				</p>
				<div class="mt-4 flex flex-wrap gap-2">
					<button type="button" class="btn-secondary" onclick={undo}>
						<IconUndo class="size-4" aria-hidden="true" />{m.match_undo()}
					</button>
					<button
						type="button"
						class="btn-primary"
						onclick={() => saved.set({ ...saved.current, match: undefined, history: [] })}
					>
						{m.match_new()}
					</button>
				</div>
			{:else if over}
				<section class="card mt-6 space-y-4">
					<h2 class="text-xl font-bold">
						{m.match_set_over({
							n: setIndex + 1,
							team: setWinner(current, setIndex) === 'us' ? us : them
						})}
					</h2>
					<ChipGroup
						legend={m.match_first_serve()}
						options={[
							{ value: true, label: m.we_serve() },
							{ value: false, label: m.we_receive() }
						]}
						bind:value={nextServing}
					/>
					{#if match.sets.length === 4}<p class="text-sm text-ink-soft">{m.match_toss()}</p>{/if}
					<ChipGroup
						legend={m.lineup_start()}
						options={ROTATIONS.map((r) => ({ value: r, label: String(r) }))}
						bind:value={nextRotation}
					/>
					<div class="flex flex-wrap gap-2">
						<button type="button" class="btn-secondary" onclick={undo}>
							<IconUndo class="size-4" aria-hidden="true" />{m.match_undo()}
						</button>
						<button
							type="button"
							class="btn-primary"
							onclick={() => apply(startSet(match, nextRotation, nextServing))}
						>
							{m.match_next_set({ n: setIndex + 2 })}
						</button>
					</div>
				</section>
			{:else}
				<div class="mt-4 grid grid-cols-2 gap-3">
					<button
						type="button"
						class="min-h-24 rounded-2xl bg-accent text-xl font-bold text-accent-ink transition-opacity hover:opacity-90"
						onclick={() => apply(rally(match, 'us'))}>{m.match_point({ team: us })}</button
					>
					<button
						type="button"
						class="min-h-24 rounded-2xl border-2 border-ink text-xl font-bold transition-colors hover:bg-line/50"
						onclick={() => apply(rally(match, 'them'))}>{m.match_point({ team: them })}</button
					>
				</div>
				<div class="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						class="btn-secondary"
						onclick={undo}
						disabled={!saved.current.history.length}
					>
						<IconUndo class="size-4" aria-hidden="true" />{m.match_undo()}
					</button>
					{#each [{ side: 'us' as const, name: us }, { side: 'them' as const, name: them }] as t (t.side)}
						<button
							type="button"
							class="btn-secondary"
							disabled={match.timeouts[t.side] >= TIMEOUTS_PER_SET}
							onclick={() =>
								apply({
									...match,
									timeouts: { ...match.timeouts, [t.side]: match.timeouts[t.side] + 1 }
								})}
						>
							<IconTimer class="size-4" aria-hidden="true" />
							{m.match_timeout({
								team: t.name,
								used: match.timeouts[t.side],
								max: TIMEOUTS_PER_SET
							})}
						</button>
					{/each}
					<button type="button" class="btn-secondary" onclick={() => (subOpen = true)}>
						<IconArrowLeftRight class="size-4" aria-hidden="true" />
						{m.match_subs({ used: match.subCount, max: SUBS_PER_SET })}
					</button>
				</div>
			{/if}

			<button type="button" class="btn-ghost mt-6 -ml-3" onclick={endMatch}>
				<IconFlag class="size-4" aria-hidden="true" />{m.match_end()}
			</button>
		</div>

		<section class="min-w-0" aria-labelledby="court-heading">
			<h2 id="court-heading" class="font-bold">{rotationLabel(match.rotation, match.system)}</h2>
			<p class="text-sm text-ink-soft">
				{match.serving
					? m.match_server({ name: server ? label(server.role) : '' })
					: m.match_receiving()}
			</p>
			<div class="mt-2">
				<FormationCourt
					{placed}
					names={tokens}
					label="{rotationLabel(match.rotation, match.system)}, {match.serving
						? m.we_serve()
						: m.we_receive()}"
				/>
			</div>
			<ul class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
				{#each placed as p (p.role)}
					<li class="truncate">
						<span class="font-semibold">{p.zone}</span> · {label(p.role)}
						{#if p.replaces}<span class="text-ink-soft">
								({m.match_for({ name: label(p.replaces) })})</span
							>{/if}
					</li>
				{/each}
			</ul>
		</section>
	</div>

	<Dialog.Root bind:open={subOpen}>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 z-40 bg-ink/40" />
			<Dialog.Content
				class="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-xl"
			>
				<div class="flex items-start justify-between gap-2">
					<Dialog.Title class="text-xl font-bold">{m.match_sub_title()}</Dialog.Title>
					<Dialog.Close class="btn-ghost -mt-2 -mr-2" aria-label={m.close()}>
						<IconX class="size-5" aria-hidden="true" />
					</Dialog.Close>
				</div>
				<Dialog.Description class="mt-1 text-sm text-ink-soft">
					{m.match_sub_help({ used: match.subCount, max: SUBS_PER_SET })}
				</Dialog.Description>
				<p class="eyebrow mt-4">{m.match_sub_out()}</p>
				<ul class="mt-2 grid grid-cols-2 gap-2">
					{#each courtRoles(match) as role (role)}
						<li>
							<button
								type="button"
								class="chip w-full justify-start text-left"
								aria-pressed={subRole === role}
								onclick={() => (subRole = role)}>{label(role)}</button
							>
						</li>
					{/each}
				</ul>
				{#if subRole}
					<p class="eyebrow mt-4">{m.match_sub_in()}</p>
					{#if subChoices.length === 0}
						<p class="mt-2 text-sm">
							{team.bench.length === 0 ? m.match_sub_no_bench() : m.match_sub_none()}
						</p>
					{:else}
						<ul class="mt-2 grid grid-cols-2 gap-2">
							{#each subChoices as option (option.kind === 'bench' ? option.bench : 'starter')}
								<li>
									<button type="button" class="btn-secondary w-full" onclick={() => doSub(option)}>
										{option.kind === 'bench'
											? memberLabel(
													team.bench[option.bench],
													m.match_bench_n({ n: option.bench + 1 })
												)
											: memberLabel(team.players[subRole], roleName(subRole))}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
