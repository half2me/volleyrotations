<script lang="ts">
	import LeagueSelect from '#lib/components/LeagueSelect.svelte';
	import ChipGroup from '#lib/components/ChipGroup.svelte';
	import FormationCourt from '#lib/components/court/FormationCourt.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Persisted } from '#lib/persisted.svelte.js';
	import {
		memberLabel,
		newTeam,
		teamPlaybook,
		teams,
		type Member,
		type Team
	} from '#lib/teams.svelte.js';
	import { LEAGUE_IDS, leagueOf, type LeagueId } from '#lib/volley/leagues.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import IconDownload from '~icons/lucide/download';
	import { DEFAULT_OPTIONS, formation } from '#lib/volley/formations.js';
	import {
		leagueName,
		roleName,
		roleShort,
		rotationLabel,
		systemName
	} from '#lib/volley/labels.js';
	import {
		LOSS_OUTCOMES,
		PLAYER_OUTCOMES,
		WIN_OUTCOMES,
		annotateLast,
		courtRoles,
		subsPerSet,
		timeoutsPerSet,
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
		type Outcome,
		type PassRating,
		type PlayerKey,
		type RallyRecord,
		type SetScore,
		type SubOption
	} from '#lib/volley/match.js';
	import {
		ROTATIONS,
		SYSTEMS,
		type RoleId,
		type RotationNo,
		type SystemId
	} from '#lib/volley/model.js';
	import MatchReport from '#lib/components/MatchReport.svelte';
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
		/** Whether the coach records how each rally ended; off unless chosen. */
		detailed?: boolean;
	};
	const saved = new Persisted<Saved>('vr:match', { history: [], opponent: '' });

	/** A finished match kept for review: the rallies, and the names its players had. */
	type ArchivedMatch = {
		id: string;
		date: string;
		us: string;
		them: string;
		system: SystemId;
		sets: SetScore[];
		log: RallyRecord[];
		names: Record<PlayerKey, string>;
	};
	const archive = new Persisted<{ list: ArchivedMatch[] }>('vr:matches', { list: [] });

	$effect(() => {
		teams.load();
		saved.load();
		archive.load();
		explorerPrefs.load();
	});

	// Setup choices before a match starts.
	let teamId: string | undefined = $state();
	let opponent = $state('');
	let firstServe = $state(true);
	let looseSystem = $state(DEFAULT_OPTIONS.system);

	const setupTeam = $derived(teams.current.list.find((t) => t.id === teamId));
	// Follows the chosen team's starting rotation until the reader picks another.
	let startRotation: RotationNo = $derived(setupTeam?.start ?? 1);
	let setupLeague: LeagueId = $derived(setupTeam?.league ?? explorerPrefs.current.league);

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
			detailed: saved.current.detailed,
			teamId: t?.id,
			opponent: opponent.trim(),
			history: [],
			match: newMatch({
				system: t?.system ?? looseSystem,
				libero: t ? t.libero && t.system !== '6-6' : looseSystem !== '6-6',
				rotation: startRotation,
				serving: firstServe,
				league: setupLeague
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

	/** Keeps a played match for review, then clears the tracker for the next one. */
	function closeMatch() {
		if (match?.log?.length) {
			const keys = new Set<PlayerKey>();
			for (const r of match.log) {
				if (r.detail?.by) keys.add(r.detail.by);
				if (r.detail?.pass) keys.add(r.detail.pass.by);
			}
			const entry: ArchivedMatch = {
				id: Math.random().toString(36).slice(2, 10),
				date: new Date().toISOString(),
				us: team.name,
				them: saved.current.opponent || m.match_them(),
				system: match.system,
				sets: match.sets,
				log: match.log,
				names: Object.fromEntries([...keys].map((k) => [k, playerName(k)]))
			};
			archive.set({ list: [entry, ...archive.current.list].slice(0, 50) });
		}
		saved.set({ ...saved.current, match: undefined, history: [] });
	}

	function endMatch() {
		if (confirm(m.match_end_confirm())) closeMatch();
	}

	// Detailed stats: a pass rating picked before the point, and the "how did it end?" question
	// about the rally just scored. Both are optional and never hold up the next point.
	let passBy: PlayerKey | undefined = $state();
	let passRating: PassRating | undefined = $state();
	let asking:
		{ won: boolean; server?: PlayerKey; court: { key: PlayerKey; label: string }[] } | undefined =
		$state();
	let askingHow: Outcome | undefined = $state();
	let savedNote = $state('');

	/** The key the stats use for whoever plays in a starting position now. */
	function occupantKey(role: RoleId): PlayerKey {
		const sub = match?.subs[role]?.sub;
		return sub !== undefined ? `b${sub}` : role;
	}

	function playerName(key: PlayerKey): string {
		const bench = key.match(/^b(\d+)$/);
		if (bench) {
			const i = Number(bench[1]);
			return memberLabel(team.bench[i], m.match_bench_n({ n: i + 1 }));
		}
		return memberLabel(team.players[key as RoleId], roleName(key as RoleId));
	}

	function point(winner: 'us' | 'them') {
		if (!match) return;
		const detail =
			passBy !== undefined && passRating !== undefined
				? { pass: { by: passBy, rating: passRating } }
				: undefined;
		const serverKey = match.serving && server ? occupantKey(server.role) : undefined;
		const court = courtPlayers;
		apply(rally(match, winner, saved.current.detailed ? detail : undefined));
		passBy = undefined;
		passRating = undefined;
		askingHow = undefined;
		savedNote = '';
		asking = saved.current.detailed
			? { won: winner === 'us', server: serverKey, court }
			: undefined;
	}

	/** Records how the last rally ended, without adding a step to undo. */
	function annotate(how: Outcome, by?: PlayerKey) {
		if (!match) return;
		saved.set({ ...saved.current, match: annotateLast(match, { how, by }) });
		savedNote = m.how_saved({ how: outcomeName(how), who: by ? ` · ${playerName(by)}` : '' });
		asking = undefined;
		askingHow = undefined;
	}

	function chooseHow(how: Outcome) {
		if (!asking) return;
		if (!PLAYER_OUTCOMES.includes(how)) return annotate(how);
		if ((how === 'ace' || how === 'serve-error') && asking.server)
			return annotate(how, asking.server);
		askingHow = how;
	}

	const outcomeName = (o: Outcome) =>
		({
			kill: m.how_kill,
			ace: m.how_ace,
			block: m.how_block,
			'opp-error': m.how_opp_error,
			'attack-error': m.how_attack_error,
			'serve-error': m.how_serve_error,
			blocked: m.how_blocked,
			error: m.how_error,
			'opp-point': m.how_opp_point
		})[o]();
	const PASS_LABEL: Record<PassRating, () => string> = {
		3: m.pass_3,
		2: m.pass_2,
		1: m.pass_1,
		0: m.pass_0
	};
	let openReport: string | undefined = $state();

	/** The player in a starting position right now, after any substitution. */
	function occupant(role: RoleId): Member | undefined {
		const sub = match?.subs[role]?.sub;
		return sub !== undefined ? team.bench[sub] : team.players[role];
	}
	const label = (role: RoleId) => memberLabel(occupant(role), roleName(role));

	const options = $derived({
		...DEFAULT_OPTIONS,
		...teamPlaybook({ ...team, league: match?.league }),
		system: match?.system ?? '5-1',
		libero: match?.libero ?? true
	});

	const phase = $derived(match?.serving ? 'serve' : 'receive');
	const placed = $derived(match ? formation({ ...options, rotation: match.rotation }, phase) : []);
	const server = $derived(placed.find((p) => p.zone === 1));
	const tokens = $derived(
		Object.fromEntries(
			placed.map((p) => [p.role, occupant(p.role)?.number.trim() || roleShort(p.role)])
		) as Partial<Record<RoleId, string>>
	);

	const courtPlayers = $derived(
		placed.map((p) => ({ key: occupantKey(p.role), label: tokens[p.role] ?? roleShort(p.role) }))
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

<Seo
	title="{m.match_title()} · {site.name}"
	description={m.match_description()}
	path="/match"
	schema="WebApplication"
/>

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
					<option value={t.id}>{t.name} ({systemName(t.system)})</option>
				{/each}
			</select>
		</label>
		{#if !setupTeam}
			<ChipGroup
				legend={m.label_system()}
				options={SYSTEMS.map((s) => ({ value: s, label: systemName(s) }))}
				bind:value={looseSystem}
			/>
			<p class="text-sm text-ink-soft">
				{m.match_team_hint()}
				<a class="text-accent underline" href={href('/lineup')}>{m.lineup_title()}</a>
			</p>
		{/if}
		<div><LeagueSelect bind:value={setupLeague} /></div>
		<p class="text-sm text-ink-soft">
			{m.match_league_limits({
				subs: leagueOf(setupLeague).subsPerSet,
				timeouts: leagueOf(setupLeague).timeoutsPerSet
			})}
			{#if setupLeague === 'ncaa'}{m.match_ncaa_note()}{/if}
		</p>
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
		<div>
			<ChipGroup
				legend={m.detailed_label()}
				options={[
					{ value: false, label: m.detailed_off() },
					{ value: true, label: m.detailed_on() }
				]}
				bind:value={
					() => saved.current.detailed ?? false,
					(detailed) => saved.set({ ...saved.current, detailed })
				}
			/>
			<p class="mt-2 text-sm text-ink-soft">{m.detailed_help()}</p>
		</div>
		<button type="submit" class="btn-primary">
			<IconVolleyball class="size-4" aria-hidden="true" />{m.match_start()}
		</button>
	</form>

	<section class="mt-12 max-w-3xl" aria-labelledby="past-heading" data-pagefind-ignore>
		<h2 id="past-heading" class="text-xl font-bold">{m.past_title()}</h2>
		<p class="mt-1 text-sm text-ink-soft">{m.past_lead()}</p>
		{#if archive.current.list.length === 0}
			<p class="mt-3 text-sm">{m.past_none()}</p>
		{:else}
			<ul class="mt-3 space-y-3">
				{#each archive.current.list as a (a.id)}
					{@const won = a.sets.filter((s, i) => setWinner(s, i) === 'us').length}
					{@const lost = a.sets.filter((s, i) => setWinner(s, i) === 'them').length}
					<li class="card">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<p>
								<span class="font-semibold">{m.past_vs({ us: a.us, them: a.them })}</span>
								<span class="tabular-nums">{won}–{lost}</span>
								<span class="text-sm text-ink-soft"
									>· {new Date(a.date).toLocaleDateString(m.number_locale())}</span
								>
							</p>
							<div class="flex gap-2">
								<button
									type="button"
									class="btn-secondary"
									aria-expanded={openReport === a.id}
									onclick={() => (openReport = openReport === a.id ? undefined : a.id)}
									>{openReport === a.id ? m.past_hide() : m.past_open()}</button
								>
								<button
									type="button"
									class="btn-ghost"
									onclick={() => {
										if (confirm(m.past_delete_confirm()))
											archive.set({ list: archive.current.list.filter((x) => x.id !== a.id) });
									}}>{m.past_delete()}</button
								>
							</div>
						</div>
						{#if openReport === a.id}
							<div class="mt-4">
								<MatchReport
									log={a.log}
									system={a.system}
									playerName={(k) => a.names[k] ?? k}
									filename="{a.us} - {a.them}.csv"
									headingLevel={3}
								/>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
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
								{#key t.points}<span class="animate-pop inline-block">{t.points}</span>{/key}
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
					<button type="button" class="btn-primary" onclick={closeMatch}>
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
						onclick={() => point('us')}>{m.match_point({ team: us })}</button
					>
					<button
						type="button"
						class="min-h-24 rounded-2xl border-2 border-ink text-xl font-bold transition-colors hover:bg-line/50"
						onclick={() => point('them')}>{m.match_point({ team: them })}</button
					>
				</div>
				{#if saved.current.detailed && !match.serving}
					<div class="mt-3" aria-live="polite">
						<p class="text-sm font-medium">{m.pass_prompt()}</p>
						<div class="mt-1 flex flex-wrap gap-1.5">
							{#each courtPlayers as p (p.key)}
								<button
									type="button"
									class="chip min-w-11"
									aria-pressed={passBy === p.key}
									onclick={() => (passBy = passBy === p.key ? undefined : p.key)}>{p.label}</button
								>
							{/each}
						</div>
						{#if passBy !== undefined}
							<p class="mt-2 text-sm font-medium">{m.pass_rating()}</p>
							<div class="mt-1 flex flex-wrap gap-1.5">
								{#each [3, 2, 1, 0] as const as r (r)}
									<button
										type="button"
										class="chip"
										aria-pressed={passRating === r}
										onclick={() => (passRating = r)}>{PASS_LABEL[r]()}</button
									>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
				<div aria-live="polite">
					{#if asking}
						<div class="card mt-3">
							<div class="flex items-center justify-between gap-2">
								<p class="text-sm font-medium">
									{askingHow ? `${outcomeName(askingHow)}: ${m.how_who()}` : m.how_prompt()}
								</p>
								<button
									type="button"
									class="btn-ghost text-sm"
									onclick={() => {
										asking = undefined;
										askingHow = undefined;
									}}>{m.how_skip()}</button
								>
							</div>
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#if askingHow}
									{#each asking.court as p (p.key)}
										<button
											type="button"
											class="chip min-w-11"
											onclick={() => annotate(askingHow!, p.key)}>{p.label}</button
										>
									{/each}
								{:else}
									{#each asking.won ? WIN_OUTCOMES : LOSS_OUTCOMES as o (o)}
										<button type="button" class="chip" onclick={() => chooseHow(o)}
											>{outcomeName(o)}</button
										>
									{/each}
								{/if}
							</div>
						</div>
					{:else if savedNote}
						<p class="mt-2 text-sm text-ink-soft">{savedNote}</p>
					{/if}
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
							disabled={match.timeouts[t.side] >= timeoutsPerSet(match)}
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
								max: timeoutsPerSet(match)
							})}
						</button>
					{/each}
					<button type="button" class="btn-secondary" onclick={() => (subOpen = true)}>
						<IconArrowLeftRight class="size-4" aria-hidden="true" />
						{m.match_subs({ used: match.subCount, max: subsPerSet(match) })}
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

	<div class="mt-10">
		<MatchReport
			log={match.log ?? []}
			system={match.system}
			{playerName}
			filename="{team.name} - {saved.current.opponent || m.match_them()}.csv"
		/>
		{#if match.log?.length}
			<label class="mt-4 flex min-h-11 items-center gap-2 text-sm">
				<input
					type="checkbox"
					class="size-4"
					checked={saved.current.detailed ?? false}
					onchange={(e) => saved.set({ ...saved.current, detailed: e.currentTarget.checked })}
				/>
				{m.detailed_label()}
			</label>
		{/if}
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
					{leagueOf(match.league).fivbReentry
						? m.match_sub_help({ used: match.subCount, max: subsPerSet(match) })
						: m.match_sub_help_league({ used: match.subCount, max: subsPerSet(match) })}
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
