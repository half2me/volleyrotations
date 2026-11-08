/** Where readers report mistakes: the site's public issue tracker. */
const ISSUES = 'https://github.com/half2me/volleyrotations/issues/new';

/**
 * A link that opens a new issue with the page and what the reader was looking at filled in, so a
 * report says exactly which diagram is wrong.
 */
export function reportUrl(page: string, context: string[]): string {
	const body = [
		`Page: ${page}`,
		...context.map((c) => `- ${c}`),
		'',
		'What is wrong, and what should it be? (A rulebook rule or a coaching source helps.)',
		''
	].join('\n');
	const title = `Mistake on ${new URL(page).pathname}`;
	return `${ISSUES}?${new URLSearchParams({ title, body, labels: 'content' })}`;
}
