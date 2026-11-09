/**
 * A value kept in the reader's browser. Prerendering has no storage, so the value starts at its
 * default and `load()` reads the saved one; call it from an `$effect`. Writes go through `set`.
 */
export class Persisted<T> {
	current: T = $state() as T;
	loaded = $state(false);
	/**
	 * True after a `set` that storage refused (full, or disabled), until one succeeds: the value
	 * then lives only in this page view, and the page should warn the reader.
	 */
	unsaved = $state(false);
	#key: string;
	#fallback: T;

	constructor(key: string, fallback: T) {
		this.#key = key;
		this.#fallback = fallback;
		this.current = fallback;
	}

	load() {
		try {
			const raw = localStorage.getItem(this.#key);
			if (raw !== null) {
				const saved = JSON.parse(raw);
				// Merge objects so a field added after the reader saved still gets its default.
				this.current =
					saved &&
					typeof saved === 'object' &&
					!Array.isArray(saved) &&
					!Array.isArray(this.#fallback)
						? { ...this.#fallback, ...saved }
						: saved;
			}
		} catch {
			// Unreadable or blocked storage: keep the default.
		}
		this.loaded = true;
	}

	/** Returns whether the value reached storage. */
	set(value: T): boolean {
		this.current = value;
		try {
			localStorage.setItem(this.#key, JSON.stringify($state.snapshot(value)));
			this.unsaved = false;
			return true;
		} catch {
			this.unsaved = true;
			return false;
		}
	}
}
