# Volley Rotations

[volleyrotations.uk](https://volleyrotations.uk) teaches indoor volleyball rotations, in English
and Hungarian. It is for players (including people moving from beach to indoor) and for coaches.

- **Position explorer**: pick a system (5-1, 6-2, 4-2, 6-6) and your position, then step through
  serve receive, serve, base, defense and attack in all six rotations. It shows your area, your
  runs and the overlap neighbours you must respect.
- **Overlap trainer**: drag players (or use the keyboard) and see live which FIVB rule 7.4
  relation breaks.
- **Quiz**: "where do you stand?", "is this legal?" and "which zone?" questions, with a streak
  kept on the device.
- **Lineup builder**: names and numbers per team, the line-up slip, and printable serve-receive
  and defense sheets plus player cards.
- **Match tracker**: score, sets, sideout rotation, server, time-outs and substitutions within
  FIVB limits, with undo. It works offline.
- **Guides**: ten Markdown guides in `src/lib/content/guides/`, linking to the
  [FIVB rules 2025–2028](https://www.fivb.com/volleyball/the-game/official-volleyball-rules/).

Everything is static. Reader data stays in their browser's `localStorage`.

## Stack

SvelteKit 3 and Svelte 5, prerendered with `@sveltejs/adapter-static` and served as Cloudflare
Workers static assets. It also uses Tailwind CSS 4, bits-ui, Lucide icons, Paraglide (English at
`/`, Hungarian at `/hu`), mdsvex, Pagefind search, and Playwright with axe for tests.

## Developing

Requires Node 24+ and pnpm.

| Command       | What it does                                                       |
| ------------- | ------------------------------------------------------------------ |
| `pnpm dev`    | Vite dev server (search needs a build)                             |
| `pnpm build`  | Prerender every page to `build/`, then build the search index      |
| `pnpm check`  | svelte-check + TypeScript                                          |
| `pnpm test`   | Model tests, plus build, serve and the page suite (desktop, phone) |
| `pnpm format` | Prettier                                                           |
| `pnpm deploy` | Build and `wrangler deploy` to volleyrotations.uk                  |

See `CLAUDE.md` for the conventions and how the volleyball model is laid out.
