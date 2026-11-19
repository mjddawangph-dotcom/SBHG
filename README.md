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
| Manifesto | `BORN IN TUKSO / SAVED BY GRACE / KALOOKAN, PH` (3 masked lines, max 155px) |
| Collection | 6 live listings mirrored from Carousell; swipe gallery with dots (see Products) |
| Contact | socials + shipping + Caloocan map — no email/form (removed 2026-11-20) |
| Footer | socials live, year filled by JS |

Live copy: Instagram <https://www.instagram.com/brgy.sbhg/>, Facebook
<https://www.facebook.com/brgy.sbhg>, Carousell
<https://www.carousell.ph/u/brgy.sbhg>. Shipping: nationwide via J&T Express,
same-day via Lalamove, Kalookan. Sales copy on Carousell: "Everything on sale —
30–50% off…".

## Phones are static

Under 768 px, `scroll.js` and `glitch.js` return early: no pinned sections, no decode
lines, no seams, no glitch slices, no scroll-driven transforms. The mobile stylesheet
enables the quote marquee directly (it normally needs `.SBHG-motion`) and hides any
glitch layer. What still moves on a phone: the quote, the backdrop video, and the hero
plate fan. The mobile clip is 480x270 / 15s / ~790 KB.

## Runtime cost

The only permanently animating things are the backdrop video and the quote marquee.
`initBackdrop()` pauses both when the hero/quote leaves the viewport or the tab is
hidden (a paused video keeps its frame, so the backdrop looks identical), and the video
no longer carries a CSS `filter` — a static scrim in `.SBHG-bg::after` replaced it, so
frames are not re-filtered every tick.

## Always start at the top

`history.scrollRestoration = "manual"` is set in an inline head script, `startAtTop()`
runs on `DOMContentLoaded` and on any `pageshow` with `persisted`, and the loader pins
scroll to 0 when it clears. Explicit `#hash` URLs are left alone so deep links still work.

## Loading screen

The first load of a browser session shows an overlay (`#SBHG-loader`) that blocks scroll
for **about four seconds** (paced), while the hero image decodes, the video reports
`loadeddata`/`loadedmetadata`, the webfont and the window `load` event resolve. Each task
is capped (0.5–3 s) so one slow asset cannot hold the screen; hard ceiling 8 s. Progress is real: the yellow star fill
rises inside the pink outline (`#SBHG-loader-fill`, y 59..165 of the SVG). It is skipped
on later loads via `sessionStorage.SBHG-loaded`, hidden entirely without JS, and
dispatches `SBHG:loaded`, which is what releases the hero plate intro.

## Products

Six cards mirror the Carousell shop; each card is an `<article data-tile>` carrying
`data-name`, `data-price`, optional `data-price-was`, `data-condition`, `data-url`,
`data-image` and optional `data-image-back`. The card shows the front photo; the dialog
(click VIEW) shows both photos, the price, the condition and a **BUY ON CAROSELL** link.

| # | Product | Price | Condition |
|---|---|---|---|
| 01 | The Prayer Vince Carter Nets Jersey | PHP 2,000 | Brand new |
| 02 | The Prayer Wembanyama Jersey | PHP 2,000 | Brand new |
| 03 | Ambagan Full-Zip Track Jacket | PHP 500 (was 850) | Brand new |
| 04 | Taksil Raglan Sweatshirt | PHP 680 | Lightly used |
| 05 | Taksil Ripstop Polo | PHP 450 (was 800) | Like new |
| 06 | Wavvy Logo Reversible Basketball Shorts | PHP 650 | Lightly used |

The collection is a **swipe gallery**, not a pinned scroll animation: the row is a
native horizontal scroller (`scroll-snap-type: x mandatory`, hidden scrollbar),
drag-able with a mouse, arrow-key navigable, with indicator dots whose active state
grows into a pill (`.SBHG-dot.is-active`). The **SEE ALL** button is deliberately
`disabled` until a shop page exists.

Mobile uses lighter media: `hero-900.webp` (47 KB) via `<picture media>` and
`glitch-background-mobile.mp4` (2.1 MB, 640x360), selected in JS because Chrome ignores
`media` on `<video><source>`. Desktop gets `hero-1536.webp` (90 KB) and the 9.1 MB clip.

Photos live in `assets/products/<nn>-<slug>-{front,back}.jpg`, cropped/optimised to about
675x900, JPEG q84. To add or replace an item: drop the photo in, update the `<article>`
attributes and the `<img>`/meta text, then bump the `?v=` token. Prices are a snapshot —
Carousell is the source of truth and each card links to its listing.

## Deploy

Push to `main`; GitHub Pages rebuilds in ~1 minute. Verify the deployed markup
by fetching the live URL with a cache-busting query, not by trusting the push.
