import { positionPages } from '#lib/pages.js';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => positionPages.map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
	const slug = positionPages.find((p) => p === params.slug);
	if (!slug) error(404);
	return { slug };
};
