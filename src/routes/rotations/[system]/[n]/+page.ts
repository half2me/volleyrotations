import { rotationNumbers, rotationSystems } from '#lib/pages.js';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	rotationSystems.flatMap((system) => rotationNumbers.map((n) => ({ system, n: String(n) })));

export const load: PageLoad = ({ params }) => {
	const system = rotationSystems.find((s) => s === params.system);
	const rotation = rotationNumbers.find((n) => String(n) === params.n);
	if (!system || !rotation) error(404);
	return { system, rotation };
};
