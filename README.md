# SBHG — website

Single-page site for **SBHG (Saved By His Grace)**, a Kalookan clothing label.
Dark, photocopied-flyer aesthetic; the hero is a video backdrop with the shirt
typography scrolling over it.

- Live: <https://mjddawangph-dotcom.github.io/SBHG/>
- Repo: <https://github.com/mjddawangph-dotcom/SBHG> (`main` deploys Pages)
- No build step, no framework, no npm. Plain HTML + CSS + vanilla JS.

## Structure

```
index.html                 all markup and section copy
css/reset.css              minimal reset, [hidden] floor
css/tokens.css             colour/spacing custom properties, @font-face
css/layout.css             section layout, hero stage, video backdrop
css/components.css         wordmark, buttons, tiles, dialog, links
css/motion.css             scroll/hero/quote choreography (needs .SBHG-motion)
js/hero-fan.js             hero "inking plates" intro (plays once, ~2s)
js/glitch.js               slice glitches on [data-glitch] targets
js/scroll.js               scroll progress, pinning, decode text, smooth links
js/main.js                 menu, dialog, contact form, year, module boot
assets/hero.png            cutout (RGBA, 1536x2752, 7.5% empty above head)
assets/LOGO_STAR.svg       star mark used in header/footer lockup
assets/AMA_QUOTE.svg       shirt typography used by the hero quote scroller
assets/noise.svg           generated grain tile (referenced by 3 CSS rules)
assets/glitch-background.mp4  1280x720 H.264 background loop (9.1 MB)
assets/glitch-poster.jpg   poster frame for the video
assets/fonts/orbitron-latin.woff2  Orbitron variable, 400-900
```

`Glitch_Background.mp4` (42 MB, 1920x1080 source) is deliberately **not**
committed. Re-transcode with:

```bash
ffmpeg -y -i Glitch_Background.mp4 -vf "scale=1280:-2,fps=30" \
  -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p \
  -movflags +faststart -an assets/glitch-background.mp4
ffmpeg -y -ss 1 -i Glitch_Background.mp4 -frames:v 1 -vf "scale=1280:-2" \
  -q:v 4 assets/glitch-poster.jpg
```

## Run locally

Never open `index.html` with `file://` — relative `assets/` paths and the video
behave differently. Serve the folder instead:

```bash
cd Repo            # this directory
python3 -m http.server 8099 --bind 127.0.0.1
# http://127.0.0.1:8099/
```

## Editing rules

1. **Bump the asset token** in `index.html` (`?v=YYYYMMDDx` on every `css/*` and
   `js/*` link) whenever those files change, otherwise browsers pair new markup
   with cached CSS/JS. `index.html` itself cannot be versioned, so a hard reload
   (`Ctrl+Shift+R`) — or opening a URL with a query string — is needed to see
   markup changes.
2. Keep the flat `css/` + `js/` + `assets/` layout; the page paths assume it.
3. `--display` is Orbitron (self-hosted). Fallback stack is Impact/Arial Narrow.
4. The hero stage is sized from the header and fold:
   `height: calc((100svh - var(--header-height) - 2svh - 8px) / 0.925)`.
   The divisor accounts for the PNG's 7.5% empty space above the head. If the
   hero art is replaced, re-measure that padding or the crop returns.
5. `.SBHG-glitch-target { position: relative }` in `components.css` is a
   generic rule. Any element that must stay `absolute` (hero plate) needs a
   more specific override — that bug cropped the hero for a whole iteration.

## Section content status

| Section | State |
|---|---|
| Hero kicker | `SAVED BY HIS GRACE` |
| Hero quote scroller | shirt typography, scrolls up, 28s loop, parks under reduced motion |
| Manifesto | **placeholder** `[PLACEHOLDER: MANIFESTO STATEMENT]` |
| Collection | 6 tiles, **placeholder** names/prices/images |
| Contact | socials + shipping live; form endpoint **placeholder** (JOIN disabled) |
| Footer | socials live, year filled by JS |

Live copy: Instagram <https://www.instagram.com/brgy.sbhg/>, Facebook
<https://www.facebook.com/brgy.sbhg>, Carousell
<https://www.carousell.ph/u/brgy.sbhg>. Shipping: nationwide via J&T Express,
same-day via Lalamove, Kalookan. Sales copy on Carousell: "Everything on sale —
30–50% off…".

## Deploy

Push to `main`; GitHub Pages rebuilds in ~1 minute. Verify the deployed markup
by fetching the live URL with a cache-busting query, not by trusting the push.
