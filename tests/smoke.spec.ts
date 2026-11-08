import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
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

test('the hungarian homepage is served in hungarian', async ({ page }) => {
	await page.goto('/hu');
	await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		/\/hu$/ // no trailing slash: Cloudflare redirects /hu/ to /hu
	);
});

test('the language switcher keeps the reader on the same page', async ({ page }) => {
	await page.goto('/explorer');
	await page.getByRole('link', { name: 'Magyar' }).click();
	await expect(page).toHaveURL(/\/hu\/explorer$/);
	await expect(page.locator('h1')).toHaveText('Posztkereső');
});

test('the theme toggle switches and remembers the theme', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
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
	await page.goto('/search');
	await page.getByRole('search').getByRole('textbox').fill('libero');
	await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible();
});

test('the explorer steps through the rally and remembers the position', async ({ page }) => {
	await page.goto('/explorer');
	await page.locator('label').getByText('Setter', { exact: true }).click();
	await page.locator('label').getByText('We serve', { exact: true }).click();
	await page.getByRole('button', { name: 'Defense' }).click();
	await expect(page.getByRole('heading', { level: 2, name: 'Dig' })).toBeVisible();
	await page.reload();
	await expect(page.getByRole('radio', { name: 'Setter', exact: true })).toBeChecked();
});

test('the overlap trainer flags a fault and accepts the keyboard', async ({ page }) => {
	await page.goto('/overlap');
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
	await page.goto('/match');
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
	await page.goto('/lineup');
	await page.getByLabel('Shirt number of the Setter').fill('12');
	await page.getByLabel('Shirt number of the Setter').blur();
	await expect(page.getByText('12 = #12')).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('Shirt number of the Setter')).toHaveValue('12');
});

test('a shared team link offers the team and adds it', async ({ page, browser }) => {
	await page.goto('/lineup');
	await page.getByLabel('Team name').fill('Falcons');
	await page.getByLabel('Team name').blur();
	await page.getByLabel('Shirt number of the Setter').fill('7');
	await page.getByLabel('Shirt number of the Setter').blur();
	const link = await page.getByRole('textbox', { name: 'Share this team' }).inputValue();
	const url = new URL(link);

	// A reader who has never visited: a fresh context with empty storage.
	const other = await browser.newContext();
	const fresh = await other.newPage();
	await fresh.goto(url.pathname + url.hash);
	await expect(fresh.getByText('Someone shared the team “Falcons” with you.')).toBeVisible();
	await fresh.getByRole('button', { name: 'Add to my teams' }).click();
	await expect(fresh.getByLabel('Team name')).toHaveValue('Falcons');
	await expect(fresh.getByLabel('Shirt number of the Setter')).toHaveValue('7');
	await other.close();
});

test('the playbook saves only legal receive positions', async ({ page }) => {
	await page.goto('/lineup');
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
	await page.goto('/lineup');
	await page.getByLabel('Team name').fill('Owls');
	await page.getByLabel('Team name').blur();
	await page.locator('label').getByText('NCAA (US college)', { exact: true }).click();
	await page.goto('/explorer');
	await page.locator('label').getByText('Owls', { exact: true }).click();
	await expect(page.getByText(/Using Owls's playbook/)).toBeVisible();
	await page.locator('label').getByText('Libero', { exact: true }).click();
	await page.locator('label').getByText('We serve', { exact: true }).click();
	await expect(page.getByText(/your league lets you serve in one position/i)).toBeVisible();
});

test('the match tracker shows rotation statistics', async ({ page }) => {
	await page.goto('/match');
	await page.locator('label').getByText('They serve', { exact: true }).click();
	await page.getByRole('button', { name: 'Start match' }).click();
	await page.getByRole('button', { name: 'Point Us' }).click();
	await page.getByRole('button', { name: 'Point Us' }).click();
	const row = page.getByRole('row', { name: /Rotation 1/ });
	await expect(row).toContainText('100% (1/1)');
	await expect(page.getByRole('button', { name: 'Download rallies (CSV)' })).toBeEnabled();
});

test('the learning path remembers finished steps', async ({ page }) => {
	await page.goto('/learn');
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
	await page.goto('/explorer');
	await page.locator('label').getByText('We serve', { exact: true }).click();
	await page.getByRole('button', { name: 'Defense', exact: true }).click();
	await page.locator('label').getByText('Free ball', { exact: true }).click();
	await expect(page.getByText(/can only send a free ball/)).toBeVisible();
	await page.getByRole('button', { name: 'Cover', exact: true }).click();
	await expect(page.getByText(/forms a cup/)).toBeVisible();
});

test('a shared explorer view opens on the moment it names', async ({ page }) => {
	await page.goto('/explorer#system=6-2&rotation=4&serving=1&role=MB1&phase=defense&incoming=free');
	await expect(page.getByRole('radio', { name: '6-2', exact: true })).toBeChecked();
	await expect(page.getByRole('radio', { name: 'Middle 1', exact: true })).toBeChecked();
	await expect(page.getByText(/can only send a free ball/)).toBeVisible();
	await expect(page.getByText(/Rotation 4/).first()).toBeVisible();
	expect(new URL(page.url()).hash).toBe('');
});

test('the question of the day keeps the answer and the streak', async ({ page }) => {
	await page.goto('/');
	const day = page.getByRole('region', { name: 'Question of the day' });
	await expect(day.getByText('Question', { exact: true })).toBeVisible();
	await day.getByRole('button', { disabled: false }).first().click();
	await expect(day.getByText('1-day streak')).toBeVisible();
	await page.reload();
	await expect(day.getByText('1-day streak')).toBeVisible();
	await expect(day.getByText('A new question comes tomorrow.')).toBeVisible();
});
