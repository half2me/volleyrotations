# CLAUDE.md

Volley Rotations (volleyrotations.uk): an English/Hungarian site that teaches indoor volleyball
rotations to players and coaches. It has a position explorer, an overlap trainer, a quiz, a
lineup builder with printable sheets, a courtside match tracker, and Markdown guides. It is fully
static, built from the static-site template; the README covers the stack.

## Volleyball model

- `src/lib/volley/` is the model every tool shares, free of Svelte and Paraglide so
  `tests/engine.spec.ts` can load it: `model.ts` (zones, systems, roles, libero), `overlap.ts`
  (rule 7.4 check and `makeLegal`), `formations.ts` (positions per rally phase), `coverage.ts`,
  `quiz.ts` and `match.ts`. `labels.ts` is the only part that uses messages.
- Court coordinates are metres seen from behind our end line: x 0–9 left to right, y 0–9 from the
  net. Rotation N has the first setter (S or S1) in zone 1, 6, 5, 4, 3, 2 for N = 1…6; labels
  name the zone of the setter who sets in that rotation (`settingZone`), which differs in 6-2 and 4-2.
- Rules follow the FIVB 2025–2028 rulebook. Rule 7.4 now frees the serving team from rotational
  order; the older rule is the `servingOverlap` option. Link rules to the PDF with `#page=N`.
- Receive formations are computed, not hand-drawn. Every one must pass the overlap test in
  `tests/engine.spec.ts`; check a change to `formations.ts` visually in the explorer too.
- Reader data lives in `localStorage` through `Persisted` (`src/lib/persisted.svelte.ts`): keys
  `vr:explorer`, `vr:quiz`, `vr:teams`, `vr:match`, `vr:learn`, `vr:daily`, `vr:matches`, `vr:practice`, `vr:overlap`. There is no server.

## Commands (pnpm only, never npm or npx)

- `pnpm dev`: dev server. Search does not work here; it needs a build.
- `pnpm build`: prerenders every page to `build/` (it fails if a page touches `window` or
  `document` during render), then indexes search with Pagefind.
- `pnpm check`: svelte-check + TypeScript. Run after every change.
- `pnpm test`: runs `tests/engine.spec.ts` (the volleyball model, no browser) and builds, serves `build/` with `wrangler dev`, and runs `tests/smoke.spec.ts` at
  desktop and phone sizes: every page in every locale loads without errors or sideways scroll,
  and passes axe (WCAG 2.1 AA) in light and dark mode.
- `pnpm format`: Prettier. Run after every change.
- `pnpm og`: redraws the 1200×630 social preview of every page in every locale (and the app
  icons) into `static/og/` with Playwright. Run it after adding a page or changing a title or
  description; set `CHROMIUM_PATH` if Playwright's own browser is missing. `<Seo>` points
  `og:image` at these files and writes JSON-LD when given a `schema`.

## Architecture

- **Static only.** `export const prerender = true` in `src/routes/+layout.ts` covers every route,
  and `wrangler.jsonc` deploys `build/` as Cloudflare static assets with no Worker script. There
  are no server routes, bindings or runtime env vars. Anything dynamic runs in the browser, so
  browser APIs go inside `$effect` or event handlers, never in the component body.
- **No `svelte.config.js`.** SvelteKit 3 is configured in `vite.config.ts` through the
  `sveltekit()` plugin options.
- **SvelteKit 3 module names**: `$app/env` (`dev`, `browser`, `version`), `$app/manifest` and
  `$app/service-worker`. The SvelteKit 2 names `$app/environment` and `$service-worker` no longer
  exist. Imports from `src/lib` use `#lib/…` with the file extension
  (`#lib/config.js`, `#lib/components/Seo.svelte`).
- **Pages**: `src/lib/pages.ts` lists every indexable page, and the nav, sitemap, `llms.txt`
  and test suite all read it. A new page goes there, with its label in `src/lib/page-labels.ts`,
  and renders `<Seo …/>` (which writes the title, canonical, hreflang and Open Graph tags).
  `pages.ts` must not import Paraglide: its messages are Vite virtual modules, which Playwright
  cannot load.
- **Languages**: Paraglide, locale from the URL only (`/about` English, `/hu/about` Hungarian),
  because a static page cannot read a cookie. **Build internal links with `href()` from
  `#lib/i18n.js`**, never `localizeHref` directly: it strips the trailing slash Paraglide puts on
  `/hu/`, which Cloudflare would answer with a redirect. Pages in other locales are prerendered
  because the crawler follows the language switcher's links.
- **Markdown**: `src/lib/content/<page>/<locale>.md`, picked by `localizedMarkdown()` in the
  route (see `src/routes/about/`). Frontmatter `title` and `description` feed `<Seo>`.
- **Search**: Pagefind indexes only what is inside `<main data-pagefind-body>`, separately per
  `<html lang>`. Mark anything that should not be searchable with `data-pagefind-ignore`.
- **404**: adapter-static writes a `404.html` SPA shell, and Cloudflare serves it for any unknown
  path (`not_found_handling`). It renders `src/routes/+error.svelte`.
- **Offline**: `src/service-worker/index.ts` precaches the whole site; it has its own
  `tsconfig.json`.

## Design

- **Use the theme tokens, never a literal colour.** `bg-paper`, `bg-surface`, `border-line`,
  `text-ink`, `text-ink-soft`, `text-accent`, `bg-accent` / `text-accent-ink`, all in
  `src/routes/layout.css`. Each one is redefined for dark mode there, so a component built on
  them needs no `dark:` variant. `bg-white`, a hex value or a stock grey breaks dark mode.
- A shape used more than once (`btn-primary`, `btn-ghost`, `prose-site`) belongs in the
  `@layer components` block of `layout.css`, not repeated in markup.
- Dark mode keys off `<html data-theme>`, which the inline script in `app.html` sets before first
  paint. `src/lib/theme.svelte.ts` is the reactive store the toggle uses.
- Interactive elements are at least 44px (`min-h-11`), and focus uses the theme outline.
- **Check every UI change at 320px wide, in light and dark mode**, in the real page with
  Playwright, before calling it done.
- Prefer bits-ui over a hand-built dialog, popover, select or slider.

## Conventions

- Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`), snippets over slots,
  `onclick=` over `on:click`. Run the Svelte MCP `svelte-autofixer` on Svelte code you write.
- Keep dependencies on their latest versions, except where a peer dependency rules one out
  (TypeScript stays on 6 until SvelteKit and svelte-check accept 7). Prefer adding nothing.
- **Comments explain the code, not the session that wrote it.** Keep a comment only if it would
  still help someone reading the file a year from now: a constraint the code cannot show, or what
  breaks if it changes. Never narrate the change, compare with code that was replaced, or leave a
  note about something deleted.
