/**
 * One file that holds everything the reader keeps in this browser, so they can move it to
 * another device or keep a copy. The functions take a storage object rather than reaching for
 * `localStorage`, and import neither Svelte nor Paraglide, so `tests/engine.spec.ts` can run them
 * against a plain map.
 */

/** The prefix of every key the site writes through `Persisted`. */
export const KEY_PREFIX = 'vr:';

/**
 * Every key a backup may restore, in the order the settings page lists them. A key not named
 * here is skipped on import, so a file cannot plant arbitrary entries in storage. A new
 * `Persisted` key needs adding here, with its name on the settings page.
 */
export const BACKUP_KEYS = [
	'vr:teams',
	'vr:matches',
	'vr:match',
	'vr:quiz',
	'vr:daily',
	'vr:learn',
	'vr:practice',
	'vr:explorer'
] as const;

export type BackupKey = (typeof BACKUP_KEYS)[number];

export const BACKUP_APP = 'volleyrotations';
export const BACKUP_VERSION = 1;

export type Backup = {
	app: typeof BACKUP_APP;
	version: typeof BACKUP_VERSION;
	/** ISO 8601 time of export. */
	exported: string;
	/** Each stored key with its parsed value. */
	data: Record<string, unknown>;
};

/** The part of the Web Storage API these functions use. */
export type StorageLike = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;

/** Why an import was refused: not JSON, not a backup from this site, or nothing to restore. */
export class BackupError extends Error {
	constructor(readonly reason: 'json' | 'shape' | 'empty') {
		super(reason);
		this.name = 'BackupError';
	}
}

const isKnown = (key: string): key is BackupKey => (BACKUP_KEYS as readonly string[]).includes(key);

/** Every site key currently in storage, known or not. */
export function storedKeys(storage: StorageLike): string[] {
	const keys: string[] = [];
	for (let i = 0; i < storage.length; i++) {
		const key = storage.key(i);
		if (key?.startsWith(KEY_PREFIX)) keys.push(key);
	}
	return keys.sort();
}

/**
 * Every site key in storage, as a backup object. Keys this version does not know are kept too,
 * so a file made here loses nothing if a later version reads it. A value that is not valid JSON
 * is left out: no `Persisted` could read it either.
 */
export function exportBackup(storage: StorageLike, now = new Date()): Backup {
	const data: Record<string, unknown> = {};
	for (const key of storedKeys(storage)) {
		const raw = storage.getItem(key);
		if (raw === null) continue;
		try {
			data[key] = JSON.parse(raw);
		} catch {
			continue;
		}
	}
	return { app: BACKUP_APP, version: BACKUP_VERSION, exported: now.toISOString(), data };
}

/** The download name for a backup made on `date`, by its UTC day. */
export const backupFilename = (date = new Date()) =>
	`volleyrotations-backup-${date.toISOString().slice(0, 10)}.json`;

const isRecord = (v: unknown): v is Record<string, unknown> =>
	!!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Writes a backup into storage and returns the keys it restored, in `BACKUP_KEYS` order.
 *
 * `json` is the file's text or an already-parsed object. Anything other than a backup object
 * from this site, or one with nothing restorable in it, throws a `BackupError` before storage is
 * touched. Unknown keys are ignored. `replace` also removes every known key the backup does not
 * hold, so storage ends up as backed up; `merge` only overwrites the keys the backup holds.
 */
export function importBackup(
	json: unknown,
	mode: 'replace' | 'merge',
	storage: StorageLike
): BackupKey[] {
	let parsed = json;
	if (typeof json === 'string') {
		try {
			parsed = JSON.parse(json);
		} catch {
			throw new BackupError('json');
		}
	}
	if (
		!isRecord(parsed) ||
		parsed.app !== BACKUP_APP ||
		parsed.version !== BACKUP_VERSION ||
		!isRecord(parsed.data)
	) {
		throw new BackupError('shape');
	}

	const data = parsed.data;
	const values = new Map<BackupKey, string>();
	for (const key of BACKUP_KEYS) {
		if (!Object.hasOwn(data, key)) continue;
		let value = data[key];
		// Every site value is an object or array. A string here is that value still as JSON text
		// (a file written by hand or by another tool), parsed so it is not stored double-encoded.
		if (typeof value === 'string') {
			try {
				value = JSON.parse(value);
			} catch {
				continue;
			}
		}
		if (value === null || typeof value !== 'object') continue;
		values.set(key, JSON.stringify(value));
	}
	if (values.size === 0) throw new BackupError('empty');

	if (mode === 'replace') {
		for (const key of storedKeys(storage)) {
			if (isKnown(key) && !values.has(key)) storage.removeItem(key);
		}
	}
	for (const [key, value] of values) storage.setItem(key, value);
	return [...values.keys()];
}

/** Removes every site key from storage, known or not, and returns how many there were. */
export function clearAll(storage: StorageLike): number {
	const keys = storedKeys(storage);
	for (const key of keys) storage.removeItem(key);
	return keys.length;
}
