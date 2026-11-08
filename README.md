# static-site-template

A starter for fully static websites: SvelteKit prerenders every page to HTML at build time, and
Cloudflare serves the files with no server code. Anything dynamic runs in the browser.

## Stack

| Piece                                                                                        | What it does                                                                        |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [SvelteKit 3](https://svelte.dev/docs/kit) + Svelte 5 (runes), TypeScript                    | Pages and components                                                                |
| [`@sveltejs/adapter-static`](https://svelte.dev/docs/kit/adapter-static)                     | Writes the site to `build/` as plain files                                          |
| [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/) | Hosting. `wrangler.jsonc` has no `main`, so no Worker script runs                   |
| [Tailwind CSS 4](https://tailwindcss.com) + typography                                       | Styling; theme tokens in `src/routes/layout.css`                                    |
| [bits-ui](https://bits-ui.com)                                                               | Headless, accessible UI primitives (dialogs, popovers, sliders…) when you need them |
| [unplugin-icons](https://github.com/unplugin/unplugin-icons) + Lucide                        | `import IconX from '~icons/lucide/x'`                                               |
| [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)                        | Translations; English at `/`, Hungarian at `/hu`                                    |
| [mdsvex](https://mdsvex.pngwn.io)                                                            | Markdown pages that can use Svelte components                                       |
| [Pagefind](https://pagefind.app)                                                             | Site search, indexed at build time, no server                                       |
| [Playwright](https://playwright.dev) + [axe](https://github.com/dequelabs/axe-core)          | Smoke and WCAG 2.1 AA tests for every page in every language                        |

Also included: SEO tags with hreflang, a sitemap, `llms.txt`, a light/dark toggle with no flash on
load, an offline service worker, Cloudflare Web Analytics, and long cache headers for hashed
assets (`static/_headers`).

## Starting a new site

1. Click **Use this template** on GitHub (or copy the repo).
2. Set the name and URL in `src/lib/config.ts`, `wrangler.jsonc` (`name`), `static/robots.txt`
   and `static/site.webmanifest`.
3. Pick the colours and font in `src/routes/layout.css`, and replace `static/favicon.svg`.
4. Set the languages in `project.inlang/settings.json` and `messages/*.json`, and the language
   names in `src/lib/components/LanguageSwitcher.svelte`.

## Developing

Requires Node 24+ and pnpm.

```sh
pnpm install
pnpm dev
```

| Command        | What it does                                                   |
| -------------- | -------------------------------------------------------------- |
| `pnpm dev`     | Vite dev server (search is unavailable here; it needs a build) |
| `pnpm build`   | Prerender every page to `build/`, then build the search index  |
| `pnpm preview` | Serve `build/` with `wrangler dev`, as Cloudflare will         |
| `pnpm check`   | svelte-check + TypeScript                                      |
| `pnpm test`    | Build, serve, and run the Playwright suite (desktop and phone) |
| `pnpm format`  | Prettier                                                       |
| `pnpm deploy`  | Build and `wrangler deploy`                                    |

## Adding a page

1. Create `src/routes/<name>/+page.svelte` (or a Markdown page like `about/`).
2. Render `<Seo title=… description=… path="/<name>" />` on it.
3. Add it to `src/lib/pages.ts` and its label to `src/lib/page-labels.ts`. That puts it in the
   nav (if `inNav`), the sitemap, `llms.txt` and the test suite.

## Deploying

Either:

- **From your machine**: `wrangler login`, then `pnpm deploy`.
- **On every push**: in the Cloudflare dashboard, go to Workers & Pages → Create → Import a
  repository, pick this repo, set the build command to `pnpm build` and the deploy command to
  `pnpm exec wrangler deploy`.

The first deploy lands on `<name>.<account>.workers.dev`. To use your own domain, uncomment
`routes` in `wrangler.jsonc` once the domain's zone is on the Cloudflare account.
