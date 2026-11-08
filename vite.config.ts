import { paraglideVitePlugin } from '@inlang/paraglide-js';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { mdsvex } from 'mdsvex';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		Icons({ compiler: 'svelte' }),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				// mdsvex 0.12 writes frontmatter into `<script context="module">`, which Svelte 5
				// deprecates; the markup is mdsvex's, so there is nothing to fix in a .md file.
				warningFilter: (warning) =>
					!(warning.code === 'script_context_deprecated' && warning.filename?.endsWith('.md'))
			},
			preprocess: [mdsvex({ extensions: ['.md'] })],
			extensions: ['.svelte', '.md'],
			// 404.html is the SPA shell Cloudflare serves for any unknown path
			// (`not_found_handling: "404-page"` in wrangler.jsonc); it renders +error.svelte.
			adapter: adapter({ fallback: '404.html' }),
			// 404.html is served at whatever URL was missed, so relative asset paths would resolve
			// against that URL's depth and break.
			paths: { relative: false },
			// '*' crawls every linked page, which reaches the /hu pages through the language
			// switcher. The sitemap and llms.txt are listed because nothing links to them.
			prerender: { entries: ['*', '/sitemap.xml', '/llms.txt'] }
		}),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			// A static page cannot read a cookie at request time, so the locale comes from the
			// URL alone: /about is English, /hu/about Hungarian.
			strategy: ['url', 'baseLocale']
		})
	]
});
