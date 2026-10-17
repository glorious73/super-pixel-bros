# AGENTS.md — Working on Super Pixel Bros

Guidance for AI coding agents (and humans) working in this repository.

## What this is

A Mario-style 2D platformer for the browser: vanilla JavaScript (ES
modules), HTML5 Canvas, Web Audio API. **No frameworks, no build step, no
runtime dependencies, no binary assets** — all graphics are drawn with code
and all sound is synthesized. Keep it that way.

Created by **Qwen3.8 Flash Next** running locally on an AMD **Strix Halo**
device, together with the user (glorious73).

## Run / verify

```bash
# serve (ES modules require http://, opening index.html via file:// fails)
# tools/serve.py adds Cache-Control: no-store so edits show up on reload
# (plain `python3 -m http.server` caches modules and serves stale code)
python3 tools/serve.py 8000

# syntax-check every module (ESM from stdin)
for f in js/*.js; do node --input-type=module --check < "$f" || echo "FAIL $f"; done

# level reachability smoke test: parse levels and BFS the flag path with
# jump-range physics — run it after ANY edit to js/levels.js
# (see /tmp/opencode/smoke.mjs pattern; levels.js has no browser deps,
#  so it runs directly under Node)

# palette contrast linter — run after ANY edit to js/theme.js
node tools/check-palette.mjs

# i18n linter — run after ANY edit to js/i18n.js or UI strings
node tools/check-i18n.mjs

# regenerate PWA icons (code-drawn PNGs) after editing tools/gen-icons.mjs;
# when ANY app-shell file changes, also bump VERSION in sw.js
node tools/gen-icons.mjs

# per-character reachability: simulates each hero's real jump envelope and
# BFS's every level, flagging any level a hero cannot finish
node tools/check-reachability.mjs

# headless smoke: stubs the browser, drives Game through every state in
# both languages, incl. the full adventure-map flow and touch input
node tools/headless.mjs
```

There is no test suite and no CI; the reachability check is the closest thing
and has caught real soft-locks before (a pipe taller than the player's jump).

## Architecture

| File | Responsibility |
|---|---|
| `js/main.js` | canvas setup, integer-pixel scaling, fixed-timestep loop |
| `js/game.js` | state machine (`title/select/map/play/pause/clear/gameover/victory`), world simulation, collisions, scoring. Implements the "world" facade entities use (`getTile`, `sfx`, `bumpBlock`, `shake`, `input`) |
| `js/i18n.js` | English + Arabic string tables, `t()` lookup, `L` language toggle, RTL/`<html lang>` handling; persisted via `pixelbros_lang` |
| `js/levels.js` | tile chars, `Builder` helpers, the 5 levels, `parseLevel()` |
| `js/entities.js` | `Player` + `CHARACTERS` stat table, enemy classes, tile collision (`moveX`/`moveY`) |
| `js/renderer.js` | tile grid + entity + HUD drawing |
| `js/sprites.js` | procedural pixel-art drawing (rects only) |
| `js/theme.js` | per-level day/night palettes, color lerp, parallax backdrop. Palettes carry `spike`/`pole` colors so those objects harmonize per theme and mode |
| `js/ui.js` | menu screens (incl. touch hot spots, option bar, pause/game-over cards) |
| `js/audio.js` | Web Audio synth: SFX + per-level looping melodies (night = octave down, slower, triangle) |
| `js/input.js` | keyboard state + edge-triggered `pressed()` (cleared each rAF frame); `press`/`release`/`tap` for virtual keys |
| `js/touchui.js` | canvas tap hot spots, tap/swipe gesture recognizer, touch-mode flag |
| `js/view.js` | runtime view size: height fixed 272, width 480→640 on wide screens (all drawing anchors on `view.w`) |
| `sw.js` + `manifest.webmanifest` | PWA service worker (versioned app-shell precache; bump `VERSION` on any change) + install manifest |
| `icons/` | app icons — generated PNGs, regenerate with `node tools/gen-icons.mjs` |

## Key facts & gotchas

- **Touch controls:** on-screen ◀ ▶ / jump / pause / Q DOM buttons (shown only
  when `body[data-state]` is play/pause/map — menus run on canvas UI) plus
  **canvas touch UI** in `js/touchui.js`: screens register tap hot spots
  (`hotspot(x, y, w, h, code)`) while they draw their button art, and
  `main.js` turns a tap into `Input.tap(code)` — the same edge triggers as
  the keyboard (tap with no hot spot = Enter). Horizontal swipes become ◀ ▶
  on select/map; map nodes fire `Node<i>` codes (first tap selects, tap again
  plays). Pause and game-over show tappable cards; mute/night/lang is a
  canvas icon bar (touch mode only) injecting M/N/L. Auto-enabled on coarse
  pointers; `T` toggles (`localStorage.pixelbros_touch`). Portrait shows a
  rotate-to-landscape hint. DOM buttons sit inside notch safe areas
  (`env(safe-area-inset-*)`).
- **PWA:** `manifest.webmanifest` (relative `start_url`/`scope`, so it works
  on both Pages URLs) + `sw.js` (versioned precache of the app shell;
  navigation network-first, assets cache-first). **Bump `VERSION` and update
  `ASSETS` in `sw.js` whenever an app-shell file changes**, or installed
  users keep stale code. The SW is deliberately NOT registered on
  `localhost` — it can never shadow `tools/serve.py` during development.
  Icons are code-drawn PNGs: `node tools/gen-icons.mjs` regenerates `icons/`
  (the one accepted binary-asset exception — reproducible from source, no
  image editor involved).
- **Adventure map** (`map` state in `game.js`, `drawMap` in `ui.js`): hero
  walks a 5-node path between stages; clearing the frontier stage walks the
  hero to the next node (Enter skips the walk), cleared stages are replayable
  via the cursor, `Q` quits to title. Final stage → trophy victory screen.
- **Fixed timestep 60 Hz** (`STEP = 1000/60`); all physics values are
  px/frame, not px/second. Jump reach varies per hero — design for the
  **worst** case: Sahm climbs only ≈3.5 tiles (low jump), Faris crosses only
  ≈5 tiles horizontally (slow). Rosso/Aqua are mid, Bolt/Sahm clear ≈7.
- **Tile chars** are defined in `js/levels.js`: `#`B?x` ground/bricks/blocks,
  `P` pipe, `o` coin, `^` spikes, `L` lava, `F` flagpole base, and spawn
  markers `g`/`k`/`f`/`s` (goomba/koopa/flyer/spiny). `SOLID`/`HAZARD` sets
  control collisions.
- Level height is always **17 rows = 272px** (`VIEW_H`); levels scroll
  horizontally only. Keep new levels 17 rows.
- **Pipes must be ≤ 3 tiles tall** and **gaps ≤ 4 tiles wide** (or bridged by
  a moving platform within swing range) or the slow/low heroes get stuck.
  A 4-wide gap needs a 5-tile jump; Faris's reach is 82px — 5-wide gaps need
  >91px and are impassable for him. Verify with the per-character smoke test.
- **i18n:** every UI string must go through `t('key')` in `js/i18n.js`;
  add the key to BOTH the `en` and `ar` tables (the i18n linter enforces this
  and that every `t()` call resolves). Arabic is RTL — canvas text sets
  `ctx.direction`; keep translated strings as pure-Arabic runs with Latin key
  names (ENTER, WASD) to avoid bidi reordering bugs, and keep digits Western.
  The canvas font stack must list `"DejaVu Sans Mono", "Amiri"` fallbacks so
  Arabic glyphs render. Language persists via `localStorage.pixelbros_lang`.
- **Roster:** Rosso (balanced, 2 hp), Bolt (fast, 1 hp), Aqua (jump, 1 hp),
  Faris (slow tank, 3 hp, keffiyeh), Sahm (fastest, low jump, 1 hp). Names and
  blurbs are i18n keys `hero.<id>.name/.blurb`; the headwear `style`
  ('cap'/'keffiyeh'/'fletch') selects the `drawHero` variant in `sprites.js`.
- **Night mode** is a difficulty dial, not just a palette: `setNight()`
  spawns ~50% extra enemies (`nightExtras`), multiplies enemy speed by 1.15
  (`base0 * mult`), doubles coin score, and re-sets the music theme. When
  adding enemies, register them in `loadLevel` so night extras keep working.
- Audio can only start after a user gesture; `audio.unlock()` is called on
  first keypress/pointerdown in `main.js`.
- Best score, mute, day/night and scaling prefs persist via `localStorage`
  (`pixelbros_best`, `pixelbros_mute`, `pixelbros_night`, `pixelbros_fit`,
  `pixelbros_touch`).
- The canvas renders at **272px tall; width adapts** — `js/view.js` keeps
  `view.w` at 480 minimum, up to 640 (tile-snapped) on wide screens, so a
  landscape phone fills the width instead of showing black bars (more world
  visible, physics identical). All drawing anchors on `view.w`, never on
  hardcoded 480/240. Scaled by CSS with `image-rendering: pixelated`;
  `resize()` in `main.js` fills the window at a fractional scale (fit mode);
  **F** toggles pixel-perfect integer scaling (floor factor, falls back to
  fit below 1). Never enlarge the internal resolution past 640×272 or make
  it taller to "fix" blurriness. Phones also get: footer hidden, 4px
  margins, fullscreen first tap (browser) / fullscreen display (PWA).

## Conventions

- ES modules, no bundler, no new dependencies without strong reason.
- 2-space indent, single quotes, semicolons (match surrounding code).
- Sprites are procedural rect drawings in `sprites.js` — do not add image
  files; music/SFX are synthesized — do not add audio files. (Exception:
  `icons/`, generated from code by `tools/gen-icons.mjs` — change the design
  in the tool and regenerate, never hand-draw or drop in art.)
- Game content is original (names, melodies, art). Never introduce
  Nintendo-copyrighted assets, names or lyrics.
- When changing difficulty: the intended curve is Sunny Plains < Rolling
  Hills < Dark Caves < Sky Heights < Lava Fortress; keep enemy count and
  gap widths monotonic-ish along it.

## Ideas that fit the project

Extra levels (new entries in `LEVELS`), new enemy types (class in
`entities.js` + spawn char + draw fn), power-ups (e.g. coin magnet),
extra hero costumes in `drawHero`. Keep zero-dependency and no-assets properties.
