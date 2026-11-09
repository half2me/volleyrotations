/**
 * A value kept in the reader's browser. Prerendering has no storage, so the value starts at its
 * default and `load()` reads the saved one; call it from an `$effect`, and again after storage
 * changed under it. Writes go through `set`.
 */
export class Persisted<T> {
	current: T = $state() as T;
	loaded = $state(false);
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
			// A missing key means the default, even after an earlier load: the settings page can
			// clear or replace storage and then reload values that are already on screen.
			if (raw === null) this.current = this.#fallback;
			else {
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

	set(value: T) {
		this.current = value;
		try {
			localStorage.setItem(this.#key, JSON.stringify($state.snapshot(value)));
		} catch {
			// Storage disabled or full: the value lasts for this page view only.
		}
	}
}
