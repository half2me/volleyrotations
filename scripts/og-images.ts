/**
 * Draws the social preview image (1200×630) for every page in every locale, plus the app icons,
 * into static/. Run `pnpm og` after changing a page's title or description, or adding a page.
 *
 * It renders HTML in the Playwright Chromium the test suite already uses, so it needs no image
 * library. Titles come straight from messages/*.json and the guides' frontmatter, because the
 * Paraglide runtime is a Vite virtual module that plain Node cannot load.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import settings from '../project.inlang/settings.json' with { type: 'json' };
import { ogImagePath, pages } from '../src/lib/pages.ts';

const root = resolve(import.meta.dirname, '..');
const messages: Record<string, Record<string, string>> = Object.fromEntries(
	settings.locales.map((l) => [
		l,
		JSON.parse(readFileSync(join(root, `messages/${l}.json`), 'utf8'))
	])
);

/** Message keys for each page's title and description. */
const KEYS: Record<string, [string, string]> = {
	'/': ['home_heading', 'home_description'],
	'/learn': ['learn_title', 'learn_description'],
	'/rules': ['rules_title', 'rules_description'],
	'/drills': ['drills_title', 'drills_description'],
	'/rules/situations': ['situations_title', 'situations_description'],
	'/rules/signals': ['signals_title', 'signals_description'],
	'/beach': ['beach_title', 'beach_description'],
	'/equipment': ['equipment_title', 'equipment_description'],
	'/explorer': ['explorer_title', 'explorer_description'],
	'/overlap': ['overlap_title', 'overlap_description'],
	'/quiz': ['quiz_title', 'quiz_description'],
	'/lineup': ['lineup_title', 'lineup_description'],
	'/match': ['match_title', 'match_description'],
	'/guides': ['nav_guides', 'guides_description'],
	'/search': ['nav_search', 'search_description']
};

const EYEBROW: Record<string, { guide: string; tool: string }> = {
	en: { guide: 'Guide', tool: 'Interactive tool' },
	hu: { guide: 'Útmutató', tool: 'Interaktív eszköz' }
};

function frontmatter(slug: string, locale: string, folder = 'guides') {
	const md = readFileSync(join(root, `src/lib/content/${folder}/${slug}/${locale}.md`), 'utf8');
	// YAML values may be quoted when they contain a colon.
	const field = (name: string) =>
		(md.match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1].trim() ?? '').replace(
			/^(["'])(.*)\1$/,
			'$2'
		);
	return { title: field('title'), description: field('description') };
}

function textFor(path: string, locale: string) {
	const position = path.match(/^\/positions\/(.+)$/)?.[1];
	if (position)
		return { ...frontmatter(position, locale, 'positions'), eyebrow: EYEBROW[locale].guide };
	const guide = path.match(/^\/guides\/(.+)$/)?.[1];
	if (guide) return { ...frontmatter(guide, locale), eyebrow: EYEBROW[locale].guide };
	const [t, d] = KEYS[path];
	const eyebrow =
		path === '/' || path === '/guides' || path === '/search'
			? ''
			: path === '/learn' ||
				  path === '/drills' ||
				  path === '/beach' ||
				  path === '/equipment' ||
				  path.startsWith('/rules')
				? EYEBROW[locale].guide
				: EYEBROW[locale].tool;
	return { title: messages[locale][t], description: messages[locale][d], eyebrow };
}

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Colours from the light theme in src/routes/layout.css.
const C = {
	paper: '#fbf6ee',
	line: '#ddd2c6',
	ink: '#152137',
	inkSoft: '#485366',
	accent: '#aa3700',
	court: '#eabe8f',
	courtFront: '#e2a577',
	team: '#192f58',
	libero: '#00684c'
};

/** A 5-1 serve-receive formation (rotation 1), in court metres. */
const PLAYERS = [
	{ x: 1.1, y: 0.9, role: 'opp' },
	{ x: 4.5, y: 0.9, role: 'mb1' },
	{ x: 1.6, y: 6.4, role: 'oh2' },
	{ x: 4.5, y: 6.8, role: 'l', libero: true },
	{ x: 6.4, y: 7.1, role: 's' },
	{ x: 7.4, y: 6.4, role: 'oh1', you: true }
];

/** The court graphic, with token labels in the locale (`short_*` messages). */
const court = (
	locale: string
) => `<svg viewBox="-0.6 -1.2 10.2 10.8" width="430" height="455" xmlns="http://www.w3.org/2000/svg">
	<rect x="0" y="-1.2" width="9" height="1.2" fill="${C.court}" opacity="0.5"/>
	<rect x="0" y="0" width="9" height="9" fill="${C.court}"/>
	<rect x="0" y="0" width="9" height="3" fill="${C.courtFront}"/>
	<g stroke="#fff" stroke-width="0.06" fill="none"><rect x="0" y="0" width="9" height="9"/><line x1="0" y1="3" x2="9" y2="3"/></g>
	<line x1="-0.4" y1="0" x2="9.4" y2="0" stroke="${C.ink}" stroke-width="0.16"/>
	<polygon points="5.95,3.9 9,3.9 9,9 6.9,9" fill="${C.accent}" opacity="0.28"/>
	<line x1="6.4" y1="6.5" x2="6.0" y2="1.45" stroke="${C.ink}" stroke-width="0.08" stroke-dasharray="0.25 0.18" opacity="0.6"/>
	${PLAYERS.map((p) => ({ ...p, l: messages[locale][`short_${p.role}`] }))
		.map(
			(p) => `<g transform="translate(${p.x} ${p.y})">
		${p.you ? `<circle r="0.78" fill="${C.accent}" opacity="0.25"/><circle r="0.64" fill="none" stroke="${C.accent}" stroke-width="0.13"/>` : ''}
		<circle r="0.5" fill="${p.libero ? C.libero : C.team}" stroke="${C.paper}" stroke-width="0.06"/>
		<text text-anchor="middle" dominant-baseline="central" font-size="${p.l.length > 2 ? 0.34 : 0.42}" font-weight="700" fill="#fff">${p.l}</text>
	</g>`
		)
		.join('')}
</svg>`;

const fontCss = pathToFileURL(
	join(root, 'node_modules/@fontsource-variable/plus-jakarta-sans/index.css')
).href;
const logo = readFileSync(join(root, 'static/favicon.svg'), 'utf8');

function card(text: { title: string; description: string; eyebrow: string }, locale: string) {
	const long = text.title.length > 34;
	return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fontCss}">
<style>
	* { box-sizing: border-box; margin: 0; }
	body { width: 1200px; height: 630px; background: ${C.paper}; color: ${C.ink};
		font-family: 'Plus Jakarta Sans Variable', sans-serif; display: flex; overflow: hidden; }
	main { flex: 1; padding: 64px 40px 56px 72px; display: flex; flex-direction: column; }
	.brand { display: flex; align-items: center; gap: 16px; font-size: 30px; font-weight: 700; }
	.brand svg { width: 56px; height: 56px; }
	.eyebrow { margin-top: 56px; font-size: 22px; font-weight: 700; letter-spacing: 0.08em;
		text-transform: uppercase; color: ${C.accent}; min-height: 28px; }
	h1 { margin-top: 14px; font-size: ${long ? 54 : 66}px; line-height: 1.06; letter-spacing: -0.02em;
		font-weight: 700; text-wrap: balance; }
	p { margin-top: 22px; font-size: 25px; line-height: 1.4; color: ${C.inkSoft};
		display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
	footer { margin-top: auto; font-size: 24px; font-weight: 600; color: ${C.inkSoft}; }
	aside { width: 470px; display: flex; align-items: center; justify-content: center;
		border-left: 2px solid ${C.line}; }
</style></head><body>
	<main>
		<div class="brand">${logo}<span>Volley Rotations</span></div>
		<div class="eyebrow">${escape(text.eyebrow)}</div>
		<h1>${escape(text.title)}</h1>
		<p>${escape(text.description)}</p>
		<footer>volleyrotations.uk</footer>
	</main>
	<aside>${court(locale)}</aside>
</body></html>`;
}

const work = join(tmpdir(), 'volleyrotations-og');
mkdirSync(work, { recursive: true });
rmSync(join(root, 'static/og'), { recursive: true, force: true });

const browser = await chromium.launch(
	process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

for (const { path } of pages) {
	for (const locale of settings.locales) {
		const file = join(work, 'card.html');
		writeFileSync(file, card(textFor(path, locale), locale));
		await page.goto(pathToFileURL(file).href);
		await page.evaluate(() => document.fonts.ready);
		const out = join(root, 'static', ogImagePath(path, locale));
		mkdirSync(resolve(out, '..'), { recursive: true });
		await page.screenshot({ path: out, type: 'png' });
		console.log(out.replace(`${root}/`, ''));
	}
}

// Home-screen icons. iOS fills transparent corners with black, so its icon and Android's
// maskable one (which the launcher crops to a circle or squircle) get a solid background.
for (const [name, size, pad, solid] of [
	['apple-touch-icon.png', 180, 0, true],
	['icon-192.png', 192, 0, false],
	['icon-512.png', 512, 0, false],
	['icon-maskable-512.png', 512, 0.12, true]
] as const) {
	const inner = Math.round(size * (1 - 2 * pad));
	const file = join(work, 'icon.html');
	writeFileSync(
		file,
		`<!doctype html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${solid ? '#1f2a4d' : 'transparent'}">
		<div style="width:${inner}px;height:${inner}px">${logo.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body>`
	);
	await page.setViewportSize({ width: size, height: size });
	await page.goto(pathToFileURL(file).href);
	await page.screenshot({ path: join(root, 'static', name), omitBackground: !solid });
	console.log(`static/${name}`);
}

await browser.close();
