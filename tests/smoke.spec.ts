import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { routes } from './routes.ts';

// The analytics beacon is a third-party script: tests stub it so they neither depend on the
// network nor count visits.
test.beforeEach(async ({ page }) => {
	await page.route('https://static.cloudflareinsights.com/**', (route) =>
		route.fulfill({ body: '', contentType: 'text/javascript' })
	);
});

for (const route of routes) {
	test(`${route} loads cleanly`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));

		const response = await page.goto(route);
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toBeVisible();
		expect(errors).toEqual([]);

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth
		);
		expect(overflow, 'page scrolls sideways').toBe(false);
	});

	test(`${route} has a social preview image and valid structured data`, async ({
		page,
		request
	}) => {
		await page.goto(route);
		const image = await page.locator('meta[property="og:image"]').getAttribute('content');
		expect(image, 'og:image').toBeTruthy();
		// The tag names the production origin; fetch the same path from the server under test.
		const response = await request.get(new URL(image!).pathname);
		expect(response.status(), image!).toBe(200);
		expect(response.headers()['content-type']).toBe('image/png');
		for (const json of await page.locator('script[type="application/ld+json"]').allTextContents()) {
			expect(() => JSON.parse(json)).not.toThrow();
		}
	});

	test(`${route} passes axe (WCAG 2.1 AA)`, async ({ page }) => {
		await page.goto(route);
		// Colour transitions would let axe measure a colour halfway between the two themes.
		await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
		for (const theme of ['light', 'dark']) {
			await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
			const { violations } = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();
			expect(violations, `${theme} mode`).toEqual([]);
		}
	});
}

/**
 * Opens a page and waits until the network is quiet, so the app has hydrated: a click before
 * hydration does nothing, which made interaction tests flaky under load.
 */
async function open(page: Page, url: string) {
	await page.goto(url);
	await page.waitForLoadState('networkidle');
}

test('the hungarian homepage is served in hungarian', async ({ page }) => {
	await open(page, '/hu');
	await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		/\/hu$/ // no trailing slash: Cloudflare redirects /hu/ to /hu
	);
});

test('the language switcher keeps the reader on the same page', async ({ page }) => {
	await open(page, '/explorer');
	await page.getByRole('link', { name: 'Magyar' }).click();
	await expect(page).toHaveURL(/\/hu\/explorer$/);
	await expect(page.locator('h1')).toHaveText('Posztkereső');
});

test('the theme toggle switches and remembers the theme', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await open(page, '/');
	await page.getByRole('button', { name: 'Switch to dark mode' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('an unknown URL shows the 404 page', async ({ page }) => {
	const response = await page.goto('/no/such/page');
	expect(response?.status()).toBe(404);
	await expect(page.locator('h1')).toHaveText('Page not found');
});

test('search finds a page', async ({ page }) => {
	await open(page, '/search');
	await page.getByRole('search').getByRole('textbox').fill('libero');
	await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible();
});

test('the explorer steps through the rally and remembers the position', async ({ page }) => {
	await open(page, '/explorer');
	await page.locator('label').getByText('Setter', { exact: true }).click();
	await page.locator('label').getByText('We serve', { exact: true }).click();
	await page.getByRole('button', { name: 'Defense' }).click();
	await expect(page.getByRole('heading', { level: 2, name: 'Dig' })).toBeVisible();
	await page.reload();
	await expect(page.getByRole('radio', { name: 'Setter', exact: true })).toBeChecked();
});

test('the overlap trainer flags a fault and accepts the keyboard', async ({ page }) => {
	await open(page, '/overlap');
	await expect(page.getByText('Legal formation', { exact: true })).toBeVisible();
	// Move the zone 4 player far to the right, past zone 3.
	const player = page.getByRole('button', { name: /zone 4/ });
	await player.focus();
	for (let i = 0; i < 8; i++) await page.keyboard.press('Shift+ArrowRight');
	await expect(page.getByText(/Overlap fault/)).toBeVisible();
	await page.getByRole('button', { name: 'Show a legal formation' }).click();
	await expect(page.getByText('Legal formation', { exact: true })).toBeVisible();
});

test('the match tracker rotates on a sideout and survives a reload', async ({ page }) => {
	await open(page, '/match');
	await page.locator('label').getByText('They serve', { exact: true }).click();
	await page.getByRole('button', { name: 'Start match' }).click();
	await page.getByRole('button', { name: 'Point Us' }).click();
	await expect(page.getByRole('heading', { name: /Rotation 2/ })).toBeVisible();
	await page.reload();
	await expect(page.getByRole('heading', { name: /Rotation 2/ })).toBeVisible();
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(page.getByRole('heading', { name: /Rotation 1/ })).toBeVisible();
});

test('the lineup builder puts shirt numbers on the sheets', async ({ page }) => {
	await open(page, '/lineup');
	await page.getByLabel('Shirt number of the Setter').fill('12');
	await page.getByLabel('Shirt number of the Setter').blur();
	await expect(page.getByText('12 = #12')).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('Shirt number of the Setter')).toHaveValue('12');
});

test('a shared team link offers the team and adds it', async ({ page, browser }) => {
	await open(page, '/lineup');
	await page.getByLabel('Team name').fill('Falcons');
	await page.getByLabel('Team name').blur();
	await page.getByLabel('Shirt number of the Setter').fill('7');
	await page.getByLabel('Shirt number of the Setter').blur();
	const link = await page.getByRole('textbox', { name: 'Share this team' }).inputValue();
	const url = new URL(link);

	// A reader who has never visited: a fresh context with empty storage.
	const other = await browser.newContext();
	const fresh = await other.newPage();
	await open(fresh, url.pathname + url.hash);
	await expect(fresh.getByText('Someone shared the team “Falcons” with you.')).toBeVisible();
	await fresh.getByRole('button', { name: 'Add to my teams' }).click();
	await expect(fresh.getByLabel('Team name')).toHaveValue('Falcons');
	await expect(fresh.getByLabel('Shirt number of the Setter')).toHaveValue('7');
	await other.close();
});

test('the playbook saves only legal receive positions', async ({ page }) => {
	await open(page, '/lineup');
	const save = page.getByRole('button', { name: 'Save positions' });
	await expect(save).toBeDisabled();
	const player = page.getByRole('button', { name: /zone 4/ });
	await player.focus();
	for (let i = 0; i < 8; i++) await page.keyboard.press('Shift+ArrowRight');
	await expect(save).toBeDisabled();
	for (let i = 0; i < 8; i++) await page.keyboard.press('Shift+ArrowLeft');
	await page.keyboard.press('ArrowDown');
	await expect(save).toBeEnabled();
	await save.click();
	await expect(page.getByText('This rotation uses your own positions.')).toBeVisible();
});

test('the explorer follows a chosen team and its league', async ({ page }) => {
	await open(page, '/lineup');
	await page.getByLabel('Team name').fill('Owls');
	await page.getByLabel('Team name').blur();
	await page.getByLabel('Rules', { exact: true }).selectOption('ncaa');
	await open(page, '/explorer');
	await page.locator('label').getByText('Owls', { exact: true }).click();
	await expect(page.getByText(/Using Owls's playbook/)).toBeVisible();
	await page.locator('label').getByText('Libero', { exact: true }).click();
	await page.locator('label').getByText('We serve', { exact: true }).click();
	await expect(page.getByText(/your league lets you serve in one position/i)).toBeVisible();
});

test('the match tracker shows rotation statistics', async ({ page }) => {
	await open(page, '/match');
	await page.locator('label').getByText('They serve', { exact: true }).click();
	await page.getByRole('button', { name: 'Start match' }).click();
	await page.getByRole('button', { name: 'Point Us' }).click();
	await page.getByRole('button', { name: 'Point Us' }).click();
	const row = page.getByRole('row', { name: /Rotation 1/ });
	await expect(row).toContainText('100% (1/1)');
	await expect(page.getByRole('button', { name: 'Download rallies (CSV)' })).toBeEnabled();
});

test('the learning path remembers finished steps', async ({ page }) => {
	await open(page, '/learn');
	await expect(page.getByText(/^0 of \d+ steps done$/)).toBeVisible();
	// A click before hydration does nothing, so retry until the count changes.
	await expect(async () => {
		if (await page.getByText(/^0 of \d+ steps done$/).isVisible())
			await page.getByRole('button', { name: 'Mark as done' }).first().click();
		await expect(page.getByText(/^1 of \d+ steps done$/)).toBeVisible({ timeout: 1000 });
	}).toPass();
	await page.reload();
	await expect(page.getByText(/^1 of \d+ steps done$/)).toBeVisible();
});

test('the explorer shows free balls and hitter coverage', async ({ page }) => {
	await open(page, '/explorer');
	await page.locator('label').getByText('We serve', { exact: true }).click();
	await page.getByRole('button', { name: 'Defense', exact: true }).click();
	await page.locator('label').getByText('Free ball', { exact: true }).click();
	await expect(page.getByText(/can only send a free ball/)).toBeVisible();
	await page.getByRole('button', { name: 'Cover', exact: true }).click();
	await expect(page.getByText(/forms a cup/)).toBeVisible();
});

test('a shared explorer view opens on the moment it names', async ({ page }) => {
	await open(
		page,
		'/explorer#system=6-2&rotation=4&serving=1&role=MB1&phase=defense&incoming=free'
	);
	await expect(page.getByRole('radio', { name: '6-2', exact: true })).toBeChecked();
	await expect(page.getByRole('radio', { name: 'Middle 1', exact: true })).toBeChecked();
	await expect(page.getByText(/can only send a free ball/)).toBeVisible();
	await expect(page.getByText(/Rotation 4/).first()).toBeVisible();
	expect(new URL(page.url()).hash).toBe('');
});

test('the question of the day keeps the answer and the streak', async ({ page }) => {
	await open(page, '/');
	const day = page.getByRole('region', { name: 'Question of the day' });
	await expect(day.getByText('Question', { exact: true })).toBeVisible();
	await day.getByRole('button', { disabled: false }).first().click();
	await expect(day.getByText('1-day streak')).toBeVisible();
	await page.reload();
	await expect(day.getByText('1-day streak')).toBeVisible();
	await expect(day.getByText('A new question comes tomorrow.')).toBeVisible();
});

test('detailed match stats are optional and quick to enter', async ({ page }) => {
	await open(page, '/match');
	await page.locator('label').getByText('They serve', { exact: true }).click();
	await page.locator('label').getByText('On', { exact: true }).click();
	await expect(page.getByRole('radio', { name: 'On', exact: true })).toBeChecked();
	await page.getByRole('button', { name: 'Start match' }).click();
	// A pass rating before the point, then how the point ended and who scored it.
	await page.getByRole('button', { name: 'L', exact: true }).first().click();
	await page.getByRole('button', { name: '3 perfect' }).click();
	await page.getByRole('button', { name: 'Point Us' }).click();
	await page.getByRole('button', { name: 'Kill', exact: true }).click();
	await page.getByRole('button', { name: 'OH1', exact: true }).click();
	await expect(page.getByText(/Saved: Kill · Outside 1/)).toBeVisible();
	// Skipping is always possible: the next point simply moves on.
	await page.getByRole('button', { name: 'Point Them' }).click();
	await page.getByRole('button', { name: 'Point Us' }).click();
	await expect(page.getByRole('heading', { name: 'Player statistics' })).toBeVisible();
	const players = page
		.getByRole('table')
		.filter({ has: page.getByRole('columnheader', { name: 'K', exact: true }) });
	await expect(players.getByRole('row', { name: /Outside 1/ })).toContainText('1');
	page.once('dialog', (d) => d.accept());
	await page.getByRole('button', { name: 'End match' }).click();
	await expect(page.getByRole('heading', { name: 'Past matches' })).toBeVisible();
	await page.getByRole('button', { name: 'Show report' }).click();
	await expect(page.getByRole('heading', { name: 'Player statistics' })).toBeVisible();
});

test('a practice plan keeps its drills and runs a timer', async ({ page }) => {
	await open(page, '/drills');
	await page.getByRole('button', { name: /Add to plan Wash table/ }).click();
	await page.getByRole('button', { name: /Add to plan Coverage drill/ }).click();
	await expect(page.getByText('20 minutes in total.')).toBeVisible();
	await page.reload();
	await expect(page.getByText('20 minutes in total.')).toBeVisible();
	await page.getByRole('button', { name: 'Start practice' }).click();
	await expect(
		page.getByText(/Wash table \(one-way\) · 10:00|Wash table \(one-way\) · 9:5\d/)
	).toBeVisible();
});

test('the match tracker scores a beach match with the serve order and side switches', async ({
	page
}) => {
	await open(page, '/match');
	await page.locator('label').getByText('Beach', { exact: true }).click();
	await page.getByRole('textbox', { name: 'Player 1' }).fill('Anna');
	await page.getByRole('textbox', { name: 'Player 2' }).fill('Bea');
	await page.locator('label').getByText('They serve', { exact: true }).click();
	await page.locator('label').getByText('Bea', { exact: true }).click();
	await page.getByRole('button', { name: 'Start match' }).click();
	await expect(page.getByText('Set 1 · to 21')).toBeVisible();
	await expect(page.getByText(/When you win the serve back, Bea serves/)).toBeVisible();
	await page.getByRole('button', { name: /^Point Anna/ }).click();
	await expect(page.getByText('Bea serves.')).toBeVisible();
	for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Point Them' }).click();
	await expect(page.getByText('Switch sides now')).toBeVisible();
	await expect(page.getByRole('button', { name: /Substitutions/ })).toHaveCount(0);
	await page.getByRole('button', { name: /^Point Anna/ }).click();
	await expect(page.getByText('Anna serves.')).toBeVisible();
});

test('choosing beach in the header points the rotation tools to the beach page', async ({
	page
}) => {
	await open(page, '/explorer');
	await page.getByRole('button', { name: /Where you play/ }).click();
	await page.getByRole('button', { name: 'Beach', exact: true }).click();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('note')).toContainText('You picked beach');
	await page.getByRole('button', { name: 'Switch to indoor' }).click();
	await expect(page.getByRole('note')).toHaveCount(0);
});
