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
	await page.goto('/about');
	await page.getByRole('link', { name: 'Magyar' }).click();
	await expect(page).toHaveURL(/\/hu\/about$/);
	await expect(page.locator('h1')).toHaveText('Rólunk');
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
	await page.getByRole('search').getByRole('textbox').fill('prerendered');
	await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible();
});
