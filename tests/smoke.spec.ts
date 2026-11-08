import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { routes } from './routes.ts';

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

	test(`${route} passes axe (WCAG 2.1 AA)`, async ({ page }) => {
		await page.goto(route);
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
