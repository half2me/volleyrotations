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
	import { leagueOf, type LeagueId } from '#lib/volley/leagues.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import { DEFAULT_OPTIONS, formation } from '#lib/volley/formations.js';
	import { roleName, roleShort, rotationLabel, systemName } from '#lib/volley/labels.js';
	import {
		LOSS_OUTCOMES,
		PLAYER_OUTCOMES,
		WIN_OUTCOMES,
		annotateLast,
		beachServer,
		courtRoles,
		isFullCopy,
		sideSwitchDue,
		technicalTimeoutDue,
		subsPerSet,
		timeoutsPerSet,
		newMatch,
		nextSetServing,
		pushUndo,
		rally,
		restoreUndo,
		setOver,
		setTarget,
		setWinner,
		setsWon,
		startSet,
		subOptions,
		substitute,
		undoEntry,
		type MatchState,
		type Outcome,
		type PassRating,
		type PlayerKey,
		type RallyRecord,
		type SetScore,
		type Sport,
		type SubOption,
		type UndoEntry
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
	import { untrack } from 'svelte';
	import IconArrowLeftRight from '~icons/lucide/arrow-left-right';
	import IconAlertTriangle from '~icons/lucide/triangle-alert';
	import IconFlag from '~icons/lucide/flag';
	import IconTimer from '~icons/lucide/timer';
	import IconUndo from '~icons/lucide/undo-2';
	import IconVolleyball from '~icons/lucide/volleyball';
	import IconX from '~icons/lucide/x';

	type Saved = {
		match?: MatchState;
		/** Undo steps, oldest first. */
		history: UndoEntry[];
		teamId?: string;
		opponent: string;
		/** Whether the coach records how each rally ended; off unless chosen. */
		detailed?: boolean;
		/** Beach: our two players' names, which the stats key as `p0` and `p1`. */
		pair?: [string, string];
	};
	const saved = new Persisted<Saved>('vr:match', { history: [], opponent: '' });

	/** A finished match kept for review: the rallies, and the names its players had. */
	type ArchivedMatch = {
		id: string;
		date: string;
		us: string;
		them: string;
		system: SystemId;
		sport?: Sport;
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
		untrack(slimHistory);
	});

	/** Undo history saved before `UndoEntry` holds full copies of the match; this converts them. */
	function slimHistory() {
		const history: (UndoEntry | MatchState)[] = saved.current.history;
		if (!history.some(isFullCopy)) return;
		saved.set({
			...saved.current,
			history: history.reduce<UndoEntry[]>(
				(acc, h) => pushUndo(acc, isFullCopy(h) ? undoEntry(h) : h),
				[]
			)
		});
	}

	// Setup choices before a match starts.
	let teamId: string | undefined = $state();
	let opponent = $state('');
	let firstServe = $state(true);
	let looseSystem = $state(DEFAULT_OPTIONS.system);
	let setupSport: Sport = $derived(explorerPrefs.current.sport ?? 'indoor');
	let pair: [string, string] = $state(['', '']);
	let firstServer: 0 | 1 = $state(0);

	const setupTeam = $derived(teams.current.list.find((t) => t.id === teamId));
	// Follows the chosen team's starting rotation until the reader picks another.
	let startRotation: RotationNo = $derived(setupTeam?.start ?? 1);
	let setupLeague: LeagueId = $derived(setupTeam?.league ?? explorerPrefs.current.league);

	const pairNames = $derived(
		[0, 1].map((i) => saved.current.pair?.[i]?.trim() || m.beach_player_n({ n: i + 1 }))
	);
	const team: Team = $derived(
		teams.current.list.find((t) => t.id === saved.current.teamId) ?? {
			...newTeam(
				saved.current.match?.sport === 'beach'
					? saved.current.pair?.some((n) => n.trim())
						? pairNames.join(' / ')
						: m.match_us()
					: m.match_us()
			),
			system: saved.current.match?.system ?? looseSystem,
			libero: saved.current.match?.libero ?? true
		}
	);
	const match = $derived(saved.current.match);
	const beach = $derived(match?.sport === 'beach');

	function begin() {
		if (setupSport === 'beach') {
			saved.set({
				detailed: saved.current.detailed,
				pair: [pair[0].trim(), pair[1].trim()],
				opponent: opponent.trim(),
				history: [],
				match: newMatch({
					system: '5-1',
					libero: false,
					rotation: 1,
					serving: firstServe,
					sport: 'beach',
					firstServer
				})
			});
			return;
		}
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
			history: pushUndo(saved.current.history, undoEntry(match))
		});
	}

	function undo() {
		const history = saved.current.history;
		const last = history.at(-1);
		if (!last || !match) return;
		saved.set({
			...saved.current,
			match: restoreUndo(last, match.log ?? []),
			history: history.slice(0, -1)
		});
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
				sport: match.sport,
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
		const p = key.match(/^p([01])$/);
		if (p) return pairNames[Number(p[1])];
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
		const serverKey = !match.serving
			? undefined
			: beach
				? `p${beachServer(match)}`
				: server
					? occupantKey(server.role)
					: undefined;
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
		beach
			? pairNames.map((name, i) => ({ key: `p${i}`, label: name }))
			: placed.map((p) => ({
					key: occupantKey(p.role),
					label: tokens[p.role] ?? roleShort(p.role)
				}))
	);
	const switchSides = $derived(match ? sideSwitchDue(match) : false);
	const technicalTimeout = $derived(match ? technicalTimeoutDue(match) : false);

	const current = $derived(match?.sets.at(-1) ?? { us: 0, them: 0 });
	const setIndex = $derived((match?.sets.length ?? 1) - 1);
	const won = $derived(match ? setsWon(match) : { us: 0, them: 0 });
	const over = $derived(match ? setOver(match) : false);
	/** Whether a set is being played: points can be scored and the screen should stay on. */
	const scoring = $derived(!!match && !match.finished && !over);

	// Keeps the screen on courtside while a set is being played and the page is visible. The
	// browser drops the lock whenever the page is hidden, so it is asked for again on return.
	$effect(() => {
		if (!scoring || !('wakeLock' in navigator)) return;
		let lock: WakeLockSentinel | undefined;
		let active = true;
		const request = async () => {
			if (!active || document.visibilityState !== 'visible') return;
			try {
				const sentinel = await navigator.wakeLock.request('screen');
				if (active) lock = sentinel;
				else await sentinel.release();
			} catch {
				// Refused (low battery, or a browser policy): the screen may dim as usual.
			}
		};
		request();
		document.addEventListener('visibilitychange', request);
		return () => {
			active = false;
			document.removeEventListener('visibilitychange', request);
			lock?.release().catch(() => {});
		};
	});

	// Keyboard scoring, for a laptop or a tablet with a keyboard at the scorer's table.
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || subOpen) return;
			if ((e.target as Element | null)?.closest('input, textarea, select, [contenteditable]'))
				return;
			const key = e.key.toLowerCase();
			if (key === 'arrowleft' || key === 'a') {
				if (!scoring) return;
				point('us');
			} else if (key === 'arrowright' || key === 'l') {
				if (!scoring) return;
				point('them');
			} else if (key === 'u' || key === 'backspace') {
				undo();
			} else return;
			e.preventDefault();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	// Next set: defaults the reader can change before starting it.
	let nextRotation: RotationNo = $derived(team.start);
	let nextServing = $derived(match ? nextSetServing(match) : true);
	let nextFirstServer: 0 | 1 = $derived(match?.beach?.first ?? 0);

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
		<ChipGroup
			legend={m.sport_label()}
			options={[
				{ value: 'indoor', label: m.sport_indoor() },
				{ value: 'beach', label: m.sport_beach() }
			]}
			bind:value={setupSport}
		/>
		{#if setupSport === 'beach'}
			<p class="text-sm text-ink-soft">{m.match_beach_rules()}</p>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each [0, 1] as i (i)}
					<label class="block">
						<span class="eyebrow">{m.beach_player_n({ n: i + 1 })}</span>
						<input
							class="field mt-1"
							bind:value={pair[i]}
							placeholder={m.beach_player_n({ n: i + 1 })}
						/>
					</label>
				{/each}
			</div>
		{:else}
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
		{#if setupSport === 'beach'}
			<ChipGroup
				legend={m.beach_first_server()}
				options={[0, 1].map((i) => ({
					value: i as 0 | 1,
					label: pair[i].trim() || m.beach_player_n({ n: i + 1 })
				}))}
				bind:value={firstServer}
			/>
		{:else}
			<ChipGroup
				legend={m.lineup_start()}
				options={ROTATIONS.map((r) => ({ value: r, label: String(r) }))}
				bind:value={startRotation}
			/>
		{/if}
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
					{@const won = a.sets.filter((s, i) => setWinner(s, i, a.sport) === 'us').length}
					{@const lost = a.sets.filter((s, i) => setWinner(s, i, a.sport) === 'them').length}
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
									sport={a.sport}
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
	{#if saved.unsaved}
		<p
			role="alert"
			class="mt-4 flex items-start gap-2 rounded-xl border border-accent px-3 py-2 text-sm"
			data-pagefind-ignore
		>
			<IconAlertTriangle class="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
			{m.match_unsaved()}
		</p>
	{/if}
	<div class="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,24rem)]" data-pagefind-ignore>
		<div class="min-w-0">
			<!-- Scoreboard -->
			<section class="card" aria-label={m.match_score()}>
				<p class="eyebrow">
					{m.match_set({ n: setIndex + 1 })} · {m.match_to({ n: setTarget(setIndex, match.sport) })}
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
							team: setWinner(current, setIndex, match.sport) === 'us' ? us : them
						})}
					</h2>
					{#if beach && match.sets.length === 1}<p class="text-sm text-ink-soft">
							{m.match_beach_second_set()}
						</p>{/if}
					<ChipGroup
						legend={m.match_first_serve()}
						options={[
							{ value: true, label: m.we_serve() },
							{ value: false, label: m.we_receive() }
						]}
						bind:value={nextServing}
					/>
					{#if match.sets.length === (beach ? 2 : 4)}<p class="text-sm text-ink-soft">
							{m.match_toss()}
						</p>{/if}
					{#if beach}
						<ChipGroup
							legend={m.beach_first_server()}
							options={[0, 1].map((i) => ({ value: i as 0 | 1, label: pairNames[i] }))}
							bind:value={nextFirstServer}
						/>
					{:else}
						<ChipGroup
							legend={m.lineup_start()}
							options={ROTATIONS.map((r) => ({ value: r, label: String(r) }))}
							bind:value={nextRotation}
						/>
					{/if}
					<div class="flex flex-wrap gap-2">
						<button type="button" class="btn-secondary" onclick={undo}>
							<IconUndo class="size-4" aria-hidden="true" />{m.match_undo()}
						</button>
						<button
							type="button"
							class="btn-primary"
							onclick={() => apply(startSet(match, nextRotation, nextServing, nextFirstServer))}
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
				<p class="mt-2 hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft sm:flex">
					<span class="font-medium">{m.match_keys()}:</span>
					<span
						><kbd class="key">←</kbd> <kbd class="key">A</kbd> {m.match_point({ team: us })}</span
					>
					<span
						><kbd class="key">→</kbd> <kbd class="key">L</kbd> {m.match_point({ team: them })}</span
					>
					<span><kbd class="key">U</kbd> <kbd class="key">Backspace</kbd> {m.match_undo()}</span>
				</p>
				{#if switchSides || technicalTimeout}
					<div class="mt-3 space-y-2" role="status">
						{#if switchSides}
							<p
								class="animate-pop flex items-center gap-2 rounded-xl bg-accent px-3 py-2 font-bold text-accent-ink"
							>
								<IconArrowLeftRight class="size-5" aria-hidden="true" />{m.beach_switch_sides()}
							</p>
						{/if}
						{#if technicalTimeout}
							<p class="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
								<IconTimer
									class="size-5 shrink-0"
									aria-hidden="true"
								/>{m.beach_technical_timeout()}
							</p>
						{/if}
					</div>
				{/if}
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
					{#if !beach}
						<button type="button" class="btn-secondary" onclick={() => (subOpen = true)}>
							<IconArrowLeftRight class="size-4" aria-hidden="true" />
							{m.match_subs({ used: match.subCount, max: subsPerSet(match) })}
						</button>
					{/if}
				</div>
			{/if}

			<button type="button" class="btn-ghost mt-6 -ml-3" onclick={endMatch}>
				<IconFlag class="size-4" aria-hidden="true" />{m.match_end()}
			</button>
		</div>

		{#if beach}
			{@const next = beachServer(match)}
			<section class="card min-w-0" aria-labelledby="serve-heading">
				<h2 id="serve-heading" class="font-bold">{m.beach_serve_order()}</h2>
				<p class="mt-1 text-sm text-ink-soft">
					{match.serving
						? m.beach_serving_now({ name: pairNames[next] })
						: m.beach_serves_next({ name: pairNames[next] })}
				</p>
				<ol class="mt-3 space-y-2">
					{#each [match.beach?.first ?? 0, 1 - (match.beach?.first ?? 0)] as i (i)}
						<li
							class="flex min-h-11 items-center gap-2 rounded-xl border px-3 {i === next
								? 'border-accent font-semibold'
								: 'border-line'}"
						>
							{#if i === next}<IconVolleyball class="size-4 text-accent" aria-hidden="true" />{/if}
							{pairNames[i]}
						</li>
					{/each}
				</ol>
				<p class="mt-3 text-sm text-ink-soft">
					{m.beach_next_switch({
						n:
							(match.sets.length === 3 ? 5 : 7) -
							((current.us + current.them) % (match.sets.length === 3 ? 5 : 7))
					})}
				</p>
			</section>
		{:else}
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
		{/if}
	</div>

	<div class="mt-10">
		<MatchReport
			log={match.log ?? []}
			system={match.system}
			sport={match.sport}
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
