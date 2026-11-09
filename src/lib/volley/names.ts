import type { SystemId } from './model.js';

/**
 * Names that depend only on the locale code, kept apart from `labels.ts` so plain Node (the og
 * script) can load them: the Paraglide runtime it would otherwise need is a Vite virtual module.
 */

const HU_SUFFIX: Record<number, string> = { 1: 'es', 2: 'es', 3: 'as', 4: 'es', 5: 'ös', 6: 'os' };

/**
 * A zone number as it reads inside a sentence. Hungarian attaches a suffix that depends on the
 * number ("3-as zóna", "5-ös zóna"), which a message template cannot pick by itself.
 */
export const zoneRefIn = (zone: number, locale: string): string =>
	locale === 'hu' ? `${zone}-${HU_SUFFIX[zone] ?? 'es'}` : String(zone);

/** A system's name as the locale writes it: "5-1" in English, "5:1" in Hungarian. */
export const systemNameIn = (system: SystemId, locale: string): string =>
	locale === 'hu' ? system.replace('-', ':') : system;
