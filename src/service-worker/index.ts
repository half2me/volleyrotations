import { baseLocale, locales } from '#lib/paraglide/runtime.js';
import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { asset } from '$app/paths';
import { self as sw } from '$app/service-worker';
import type { AssetPath } from '$app/types';

/*
 * Offline support for a fully static site that has to keep working courtside on a weak signal.
 *
 * - install: precache the build assets, every prerendered page, the static files (except the
 *   social preview images) and, best effort, the Pagefind runtime and per-language metadata.
 * - waiting: a new worker waits until the page posts SKIP_WAITING, which the layout's update
 *   toast does when the reader chooses to reload.
 * - activate: drop caches left by earlier deploys and take control of open pages.
 * - fetch (same-origin GET):
 *   - content-hashed /_app/immutable/ files are cache-first;
 *   - /pagefind/ is stale-while-revalidate, so search works offline once the index is cached;
 *   - everything else is network-first, but a cached copy wins if the network has not answered
 *     within NETWORK_TIMEOUT_MS. A weak signal costs a few seconds, not a hung page.
 *
 * Under `pnpm dev` the manifest is empty and every handler bails out, so the worker cannot get
 * between the browser and Vite.
 */

const enabled = immutable.length > 0;

/** How long a page waits for the network before a cached copy is served instead. */
const NETWORK_TIMEOUT_MS = 3000;

/**
 * `$app/manifest` paths are relative to the base path; `asset()` turns them into the pathnames
 * requests arrive with. The cast is only because `AssetPath` is typed as the `static/` filenames.
 */
const toPathname = (path: string) => asset(path as AssetPath);

const CACHE = `cache-${version}`;
const precache = [...immutable, ...prerendered, ...assets]
	.map(({ path }) => toPathname(path))
	.filter(
		(path) =>
			// `_headers` is Cloudflare configuration and is never served; one 404 fails the whole addAll.
			!path.endsWith('/_headers') &&
			// Open Graph previews are for link unfurlers; the app never shows them.
			!path.startsWith(toPathname('og/')) &&
			// Hand-signal sprite sheets are several megabytes; they are cached as they are viewed.
			!path.startsWith(toPathname('figures/'))
	);

/**
 * Pagefind writes its index after `vite build`, so it is missing from `$app/manifest`;
 * `scripts/pagefind-precache.js` lists its files in /pagefind/precache.json instead.
 */
const PAGEFIND = toPathname('pagefind/');

async function precachePagefind(cache: Cache) {
	try {
		const list = await fetch(`${PAGEFIND}precache.json`, { cache: 'no-cache' });
		if (!list.ok) return;
		const files = (await list.json()) as string[];
		// Each file on its own, so one missing file costs only itself.
		await Promise.allSettled(files.map((file) => cache.add(PAGEFIND + file)));
	} catch {
		// Search is an extra offline; the pages must still install without it.
	}
}

/** The prerendered home page of the locale a path belongs to, for an offline navigation. */
function homeFor(pathname: string): string {
	const segment = pathname.slice(toPathname('').length).split('/')[0];
	const locale = locales.find((l) => l !== baseLocale && l === segment);
	return locale ? toPathname(locale) : toPathname('');
}

sw.addEventListener('install', (event) => {
	if (!enabled) return;
	event.waitUntil(
		caches.open(CACHE).then(async (cache) => {
			await cache.addAll(precache);
			await precachePagefind(cache);
		})
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) if (key !== CACHE) await caches.delete(key);
			await sw.clients.claim();
		})
	);
});

sw.addEventListener('message', (event) => {
	if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void sw.skipWaiting();
});

sw.addEventListener('fetch', (event) => {
	if (!enabled) return;
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;
	event.respondWith(respond(event, request, url));
});

async function respond(event: FetchEvent, request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE);

	if (url.pathname.startsWith(toPathname('_app/immutable/'))) {
		const hit = await cache.match(request);
		if (hit) return hit;
	}

	if (url.pathname.startsWith(PAGEFIND)) {
		// Keyed by pathname: Pagefind adds a `?ts=` cache-buster to pagefind-entry.json.
		const hit = await cache.match(url.pathname);
		const refresh = fetch(request).then(async (response) => {
			if (response.ok) await cache.put(url.pathname, response.clone());
			return response;
		});
		if (hit) {
			event.waitUntil(refresh.catch(() => {}));
			return hit;
		}
		return refresh.catch(() => offline());
	}

	const network = fetch(request).then(async (response) => {
		if (response.ok) await cache.put(request, response.clone());
		return response;
	});
	// The cache write and any late response finish in the background after a timeout.
	event.waitUntil(network.catch(() => {}));

	const cached = (await cache.match(request)) ?? (await cache.match(url.pathname));
	if (cached) {
		const timeout = new Promise<Response>((resolve) =>
			setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS)
		);
		return Promise.race([network, timeout]).catch(() => cached);
	}

	try {
		return await network;
	} catch {
		if (request.mode === 'navigate') {
			const home = await cache.match(homeFor(url.pathname));
			if (home) return home;
		}
		return offline();
	}
}

const offline = () => new Response('Offline', { status: 503, statusText: 'Offline' });
