<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import {
		BACKUP_KEYS,
		BackupError,
		backupFilename,
		clearAll,
		exportBackup,
		importBackup,
		storedKeys,
		type BackupKey
	} from '#lib/backup.js';
	import { site } from '#lib/config.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import { teams } from '#lib/teams.svelte.js';
	import IconDownload from '~icons/lucide/download';
	import IconTrash from '~icons/lucide/trash-2';
	import IconUpload from '~icons/lucide/upload';

	const keyLabel: Record<BackupKey, () => string> = {
		'vr:teams': m.settings_key_teams,
		'vr:matches': m.settings_key_matches,
		'vr:match': m.settings_key_match,
		'vr:quiz': m.settings_key_quiz,
		'vr:daily': m.settings_key_daily,
		'vr:learn': m.settings_key_learn,
		'vr:practice': m.settings_key_practice,
		'vr:explorer': m.settings_key_explorer
	};

	/** The known keys in storage now; empty until the page has read storage in the browser. */
	let stored: BackupKey[] = $state([]);
	let status: { ok: boolean; text: string } | undefined = $state();

	function refresh() {
		try {
			const present = storedKeys(localStorage);
			stored = BACKUP_KEYS.filter((k) => present.includes(k));
		} catch {
			stored = [];
		}
	}
	$effect(refresh);

	/**
	 * Values shown on every page (the header's rules picker) live in module-level `Persisted`
	 * stores that loaded once; reread them so they match storage. Every other `Persisted` belongs
	 * to a page and reads storage afresh when that page opens.
	 */
	function afterStorageChange() {
		explorerPrefs.load();
		teams.load();
		refresh();
	}

	function download() {
		const now = new Date();
		const blob = new Blob([JSON.stringify(exportBackup(localStorage, now), null, '\t')], {
			type: 'application/json'
		});
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = backupFilename(now);
		a.click();
		// Revoked after the click has handed the file to the browser; at once can cancel it in Safari.
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	}

	async function restore(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		// Cleared so choosing the same file again fires another change.
		input.value = '';
		if (!file) return;
		status = undefined;
		const text = await file.text();
		if (!confirm(m.settings_restore_confirm())) return;
		try {
			const restored = importBackup(text, 'replace', localStorage);
			afterStorageChange();
			const items = new Intl.ListFormat(getLocale()).format(restored.map((k) => keyLabel[k]()));
			status = { ok: true, text: m.settings_restore_done({ items }) };
		} catch (error) {
			const reason = error instanceof BackupError ? error.reason : 'json';
			status = {
				ok: false,
				text: {
					json: m.settings_restore_error_json,
					shape: m.settings_restore_error_shape,
					empty: m.settings_restore_error_empty
				}[reason]()
			};
		}
	}

	function clear() {
		if (!confirm(m.settings_clear_confirm())) return;
		try {
			clearAll(localStorage);
		} catch {
			// Storage blocked: there was nothing saved to clear.
		}
		afterStorageChange();
		status = { ok: true, text: m.settings_clear_done() };
	}
</script>

<Seo
	title="{m.settings_title()} · {site.name}"
	description={m.settings_description()}
	path="/settings"
	schema="WebApplication"
/>

<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{m.settings_title()}</h1>
<p class="mt-3 max-w-2xl text-lg text-ink-soft">{m.settings_lead()}</p>

<div class="mt-8 grid max-w-2xl gap-6" data-pagefind-ignore>
	<section class="card" aria-labelledby="stored-heading">
		<h2 id="stored-heading" class="text-xl font-bold">{m.settings_stored_title()}</h2>
		{#if stored.length}
			<ul class="mt-2 list-disc pl-5">
				{#each stored as key (key)}<li>{keyLabel[key]()}</li>{/each}
			</ul>
		{:else}
			<p class="mt-2 text-ink-soft">{m.settings_stored_none()}</p>
		{/if}
	</section>

	<div aria-live="polite">
		{#if status}
			<p class={['card animate-reveal font-medium', status.ok ? 'border-good' : 'border-bad']}>
				{status.text}
			</p>
		{/if}
	</div>

	<section aria-labelledby="backup-heading">
		<h2 id="backup-heading" class="text-xl font-bold">{m.settings_backup_title()}</h2>
		<p class="mt-1 text-ink-soft">{m.settings_backup_help()}</p>
		<button type="button" class="btn-primary mt-3" onclick={download}>
			<IconDownload class="size-5" aria-hidden="true" />
			{m.settings_backup_button()}
		</button>
	</section>

	<section aria-labelledby="restore-heading">
		<h2 id="restore-heading" class="text-xl font-bold">{m.settings_restore_title()}</h2>
		<p class="mt-1 text-ink-soft">{m.settings_restore_help()}</p>
		<label
			class="btn-secondary mt-3 cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
		>
			<IconUpload class="size-5" aria-hidden="true" />
			{m.settings_restore_button()}
			<input type="file" accept="application/json,.json" class="sr-only" onchange={restore} />
		</label>
	</section>

	<section aria-labelledby="clear-heading">
		<h2 id="clear-heading" class="text-xl font-bold">{m.settings_clear_title()}</h2>
		<p class="mt-1 text-ink-soft">{m.settings_clear_help()}</p>
		<button type="button" class="btn-secondary mt-3" onclick={clear}>
			<IconTrash class="size-5" aria-hidden="true" />
			{m.settings_clear_button()}
		</button>
	</section>
</div>
