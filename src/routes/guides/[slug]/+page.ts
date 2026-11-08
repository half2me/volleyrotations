import { guides } from '#lib/pages.js';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => guides.map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
	const slug = guides.find((g) => g === params.slug);
	if (!slug) error(404);
	return { slug };
};
