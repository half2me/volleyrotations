import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { asset } from '$app/paths';
import { self as sw } from '$app/service-worker';
import type { AssetPath } from '$app/types';

/*
 * Offline support for a fully static site.
 *
 * - install: precache the build assets, every prerendered page and the static files.
 * - activate: drop caches left by earlier deploys.
 * - fetch (same-origin GET): content-hashed /_app/immutable/ files are cache-first; everything
 *   else is network-first, so a reader online always gets the latest deploy, with the cache as
 *   the offline fallback.
 *
 * Under `pnpm dev` the manifest is empty and every handler bails out, so the worker cannot get
 * between the browser and Vite.
 */

const enabled = immutable.length > 0;

/**
 * `$app/manifest` paths are relative to the base path; `asset()` turns them into the pathnames
 * requests arrive with. The cast is only because `AssetPath` is typed as the `static/` filenames.
 */
const toPathname = (path: string) => asset(path as AssetPath);

const CACHE = `cache-${version}`;
const precache = [...immutable, ...prerendered, ...assets]
	.map(({ path }) => toPathname(path))
	// `_headers` is Cloudflare configuration and is never served; one 404 fails the whole addAll.
	.filter((path) => !path.endsWith('/_headers'));

sw.addEventListener('install', (event) => {
	if (!enabled) return;
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(precache))
			.then(() => sw.skipWaiting())
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

sw.addEventListener('fetch', (event) => {
	if (!enabled) return;
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;
	event.respondWith(respond(request, url));
});

async function respond(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE);

	if (url.pathname.startsWith('/_app/immutable/')) {
		const hit = await cache.match(request);
		if (hit) return hit;
	}

	try {
		const response = await fetch(request);
		if (response.ok) await cache.put(request, response.clone());
		return response;
	} catch {
		const hit = (await cache.match(request)) ?? (await cache.match(url.pathname));
		if (hit) return hit;
		if (request.mode === 'navigate') {
			const home = await cache.match('/');
			if (home) return home;
		}
		return new Response('Offline', { status: 503, statusText: 'Offline' });
	}
}
