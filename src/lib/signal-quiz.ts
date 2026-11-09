/**
 * Hand signal flashcards: one signal and four names to pick from. Distractors come from the
 * signal's own set, so a flag signal is never asked against referee names, which the flag in the
 * figure would give away.
 */
import type { Signal } from './signals.js';

export type SignalQuestion = {
	signal: Signal;
	/** Four names in random order, one of them the signal's own. */
	options: Signal[];
	/** Index of the right option. */
	answer: number;
};

/** Fisher–Yates shuffle into a new array. `random` returns a number in [0, 1). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/**
 * A question drawn from `sets`, each a list of signals that share a look (referee signals, flag
 * signals). Skips the signal asked last time, `previous`, so the same card never comes twice in a
 * row. Every set needs at least four signals.
 */
export function makeSignalQuestion(
	sets: readonly (readonly Signal[])[],
	previous?: string,
	random: () => number = Math.random
): SignalQuestion {
	const pool = sets.flatMap((set) => set.filter((s) => s.id !== previous).map((s) => ({ s, set })));
	const { s: signal, set } = pool[Math.floor(random() * pool.length)];
	const others = shuffle(
		set.filter((s) => s.id !== signal.id),
		random
	).slice(0, 3);
	const options = shuffle([signal, ...others], random);
	return { signal, options, answer: options.indexOf(signal) };
}
