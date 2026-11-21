# SBHG — website workspace

Repository root for the **SBHG (Saved By His Grace)** one-page site: a Kalookan
clothing label, dark photocopied-flyer aesthetic, no build step. This file is
auto-loaded for every session started in this folder and is the only instruction
file that applies here — the folder is its own git root, so project-root
discovery stops at it and the parent Jarvis `AGENTS.md` never loads.

Last verified: 2026-11-21.

## What this is

| Item | Value |
|---|---|
| Live | <https://mjddawangph-dotcom.github.io/SBHG/> |
| Repo | `git@github.com:mjddawangph-dotcom/SBHG.git`, branch `main` deploys Pages |
| Stack | plain HTML + CSS + vanilla JS, no framework, no npm, no build |
| DSH workspace | sidebar entry **SBHG**, registered at this path (see §Sidebar) |
| Detailed runbook | [README.md](README.md) — structure, media, product table, deploy notes |

## Repo and identity

- Auth is the machine-wide SSH key `~/.ssh/id_ed25519`; there is no token to
  supply and no `.env`.
- Commit identity comes from the `includeIf` in `~/.gitconfig` that points at
  `Jarvis/projects/ds-github/.gitconfig`. Do **not** add a second `.gitconfig`
  here. If this repo ever moves out of that directory, update the `includeIf`
  path first or commits lose the `mjddawangph-dotcom` identity.
- Verify access before working: `git ls-remote --heads origin` → `main`.
- Never commit: the 42 MB `Glitch_Background.mp4` source, preview copies, or
  anything under `.preview-sbhg/`.

## Layout

```
index.html                     all markup and section copy
css/reset.css                  minimal reset, [hidden] floor
css/tokens.css                 colour/spacing custom properties, @font-face
css/layout.css                 section layout, hero stage, video backdrop
css/components.css             wordmark, buttons, tiles, dialog, links
css/motion.css                 scroll/hero/quote choreography
js/hero-fan.js                 hero "inking plates" intro (plays once, ~2 s)
js/type.js                     manifesto line rises + [data-decode] scramble
js/main.js                     menu, product dialog, swipe gallery, year, boot
assets/hero.png                cutout (RGBA, 1536x2752)
assets/hero-{900,1536}.webp    responsive hero for phone / desktop
assets/LOGO_STAR.svg           star mark in the header/footer lockup
assets/AMA_QUOTE.svg           shirt typography for the hero quote scroller
assets/noise.svg               generated grain tile
assets/glitch-background.mp4   desktop background loop (9.2 MB)
assets/glitch-background-mobile.mp4  phone loop (2.1 MB)
assets/glitch-poster.jpg       poster frame
assets/caloocan-map.jpg        contact map
assets/fonts/orbitron-latin.woff2
assets/products/               six product photos, <nn>-<slug>-{front,back}.jpg
```

`README.md` keeps the long-form detail (media sizes, product table, loading
screen, scroll-restoration behaviour). Keep the two in sync when files move.

## Preview

Never open `index.html` with `file://` — relative `assets/` paths and the video
misbehave. Serve it:

```bash
python3 -m http.server 8099 --bind 127.0.0.1
# http://127.0.0.1:8099/
```

For agent verification, capture the served page (or fetch it with `curl`),
never a `file://` screenshot.

## Editing rules

1. **Bump the asset token** in `index.html` (`?v=YYYYMMDDx` on every `css/*` and
   `js/*` link) whenever those files change. `index.html` itself cannot be
   versioned, so a hard reload (`Ctrl+Shift+R`) is needed to see markup changes.
2. Keep the flat `css/` + `js/` + `assets/` layout; every page path assumes it.
3. `--display` is Orbitron (self-hosted); the fallback stack is Impact/Arial
   Narrow — check any new display type in both.
4. The hero stage is sized from the header and the fold:
   `height: calc((100svh - var(--header-height) - 2svh - 8px) / 0.925)`. The
   divisor accounts for the PNG's 7.5% empty space above the head; re-measure it
   if the hero art is replaced.
5. `.SBHG-glitch-target { position: relative }` is generic. An element that must
   stay `absolute` (the hero plate) needs a more specific override.
6. Motion is position-driven (rAF, not IntersectionObserver) and every effect has
   a reduced-motion park state. Keep that working; a new animation without a
   quiet path is a bug.
7. Product cards mirror Carousell. Carousell is the source of truth: when a
   listing changes, update the card's `data-*` attributes, `<img>` and dialog
   text together, then bump the token.
8. No dependencies. Do not introduce npm, a bundler, or a CSS framework.

## Deploy and verify

Push to `main`; GitHub Pages rebuilds in about a minute. Verify the deployed
markup by fetching the live URL with a cache-busting query — a clean `git push`
exit is not evidence the site changed.

```bash
git push origin main
curl -s 'https://mjddawangph-dotcom.github.io/SBHG/?check=1' | grep -c 'the marker you expect'
```

## Working rules for agents

- Verify the end state with evidence (served page, fetched live HTML, or a
  screenshot), never from a command's exit code alone.
- Make the smallest change that closes the loop; do not reformat or "tidy"
  unrelated CSS/JS in the same commit.
- A failed UI step ends with one verification capture and a short FAILED report —
  no retry cascade.
- Getting approval before destructive git operations (force-push, reset, history
  rewrite) and before deleting or replacing assets.
- No diary or receipt files. The commit message and README are the record.
- Keep this file about *how to work here*; put technical detail in `README.md`.

## Sidebar

This folder is registered as a DSH workspace so it gets its own sidebar group
instead of appearing under Jarvis.

- Workspace record: id `42b0cc35-2585-4f2b-ac99-df4fb1a70568`, title `SBHG`,
  path = this repository root.
- The registry is `~/.dsh/storages/workspace.json`, loaded by `dsh web` at boot;
  the record was added through the running app, so it appeared without a
  restart.
- Sessions are grouped by their start directory. A session started here lands
  under **SBHG**; sessions started in Jarvis stay under Jarvis even when they
  work on this folder.
- Re-adding this path is idempotent (it resolves the existing record); deleting
  the record leaves the repo untouched.
