// Lists the Pagefind files the service worker precaches, so search works offline for any query.
// Pagefind writes its index after `vite build`, so the files are missing from `$app/manifest`
// and the worker cannot discover them on its own. Run after `pagefind --site build`.
import { readdirSync, writeFileSync } from 'node:fs';

const dir = 'build/pagefind';

// The search page uses the default UI only; the other UI bundles are never loaded.
const unused = new Set([
	'pagefind-component-ui.js',
	'pagefind-component-ui.css',
	'pagefind-modular-ui.js',
	'pagefind-modular-ui.css',
	'pagefind-highlight.js',
	'precache.json'
]);

const files = readdirSync(dir, { recursive: true, withFileTypes: true })
	.filter((entry) => entry.isFile())
	.map((entry) => `${entry.parentPath}/${entry.name}`.slice(dir.length + 1))
	.filter((file) => !unused.has(file))
	.sort();

writeFileSync(`${dir}/precache.json`, JSON.stringify(files));
console.log(`Listed ${files.length} Pagefind files for the service worker`);
