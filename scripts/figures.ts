/**
 * Renders every hand-signal figure to a sprite sheet in static/figures/ and writes the frame
 * metadata to src/lib/figures.json. Run `pnpm figures` after changing scripts/figures/poses.mjs
 * or mannequin.mjs.
 *
 * The figure is a 3D mannequin drawn with three.js (see scripts/figures/mannequin.mjs). It is
 * rendered in the Playwright Chromium the test suite already uses, with software WebGL, so no
 * 3D code ships to the site: pages play the frames of a WebP sprite sheet. Set CHROMIUM_PATH if
 * Playwright's own browser is missing.
 */
import { chromium } from '@playwright/test';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outDir = join(root, 'static/figures');
mkdirSync(outDir, { recursive: true });

/** Frame size in CSS pixels, drawn at 1.5× for crisp lines on phones. */
const SCALE = 1.5;
const FRAME_W = Math.round(300 * SCALE);
const FRAME_H = Math.round(420 * SCALE);

const TYPES: Record<string, string> = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.json': 'application/json'
};

/** A static server over the repository, so the page can import three from node_modules. */
const server = createServer((req, res) => {
	const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
	const file = join(root, path === '/' ? '/scripts/figures/index.html' : path);
	if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
		res.writeHead(404);
		res.end();
		return;
	}
	res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
	createReadStream(file).pipe(res);
});
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;

const browser = await chromium.launch({
	executablePath: process.env.CHROMIUM_PATH,
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (msg) => {
	if (process.env.FIGURES_DEBUG) console.log(msg.text());
});
await page.goto(`http://127.0.0.1:${port}/scripts/figures/index.html`);
await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready);

type Meta = {
	frames: number;
	rise: number;
	still: number;
	loop: boolean;
	pingPong: boolean;
	slow: boolean;
};
const ids: string[] = await page.evaluate(() =>
	(window as unknown as { figureIds: () => string[] }).figureIds()
);
const only = process.argv.slice(2);
const meta: Record<string, Meta & { width: number; height: number }> = existsSync(
	join(root, 'src/lib/figures.json')
)
	? JSON.parse(
			await import('node:fs').then((fs) =>
				fs.readFileSync(join(root, 'src/lib/figures.json'), 'utf8')
			)
		)
	: {};

for (const id of ids) {
	if (only.length && !only.includes(id)) continue;
	const result = (await page.evaluate(
		([id, w, h]) =>
			(
				window as unknown as {
					renderFigure: (
						id: string,
						w: number,
						h: number
					) => Promise<{ dataUrl: string; meta: Meta }>;
				}
			).renderFigure(id as string, w as number, h as number),
		[id, FRAME_W, FRAME_H] as const
	)) as { dataUrl: string; meta: Meta };
	const bytes = Buffer.from(result.dataUrl.split(',')[1], 'base64');
	writeFileSync(join(outDir, `${id}.webp`), bytes);
	meta[id] = { ...result.meta, width: FRAME_W / SCALE, height: FRAME_H / SCALE };
	console.log(`${id}: ${result.meta.frames} frames, ${Math.round(bytes.length / 1024)} kB`);
}

writeFileSync(join(root, 'src/lib/figures.json'), JSON.stringify(meta, null, '\t') + '\n');
await browser.close();
server.close();
