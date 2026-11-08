import { Persisted } from '#lib/persisted.svelte.js';
import { DEFAULT_OPTIONS, type Options } from '#lib/volley/formations.js';
import type { RoleId } from '#lib/volley/model.js';

export type ExplorerPrefs = Options & { role: RoleId };

/** The explorer's choices, shared with the quiz so both start from the reader's own setup. */
export const explorerPrefs = new Persisted<ExplorerPrefs>('vr:explorer', {
	...DEFAULT_OPTIONS,
	role: 'OH1'
});
