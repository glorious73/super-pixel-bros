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
python3 -m http.server 8000

# syntax-check every module (ESM from stdin)
for f in js/*.js; do node --input-type=module --check < "$f" || echo "FAIL $f"; done

# level reachability smoke test: parse levels and BFS the flag path with
# jump-range physics — run it after ANY edit to js/levels.js
# (see /tmp/opencode/smoke.mjs pattern; levels.js has no browser deps,
#  so it runs directly under Node)
```

There is no test suite and no CI; the reachability check is the closest thing
and has caught real soft-locks before (a pipe taller than the player's jump).

## Architecture

| File | Responsibility |
|---|---|
| `js/main.js` | canvas setup, integer-pixel scaling, fixed-timestep loop |
| `js/game.js` | state machine (`title/select/play/pause/clear/gameover/victory`), world simulation, collisions, scoring. Implements the "world" facade entities use (`getTile`, `sfx`, `bumpBlock`, `shake`, `input`) |
| `js/levels.js` | tile chars, `Builder` helpers, the 5 levels, `parseLevel()` |
| `js/entities.js` | `Player` + `CHARACTERS` stat table, enemy classes, tile collision (`moveX`/`moveY`) |
| `js/renderer.js` | tile grid + entity + HUD drawing |
| `js/sprites.js` | procedural pixel-art drawing (rects only) |
| `js/theme.js` | per-level day/night palettes, color lerp, parallax backdrop |
| `js/ui.js` | menu screens |
| `js/audio.js` | Web Audio synth: SFX + per-level looping melodies (night = octave down, slower, triangle) |
| `js/input.js` | keyboard state + edge-triggered `pressed()` (cleared each rAF frame) |

## Key facts & gotchas

- **Fixed timestep 60 Hz** (`STEP = 1000/60`); all physics values are
  px/frame, not px/second. Player max jump ≈ 4.2 tiles up, ≈ 6 tiles across
  (Aqua floats lower/faster-falling; Bolt runs farther). Anything you place
  must stay within those numbers for the *worst* character.
- **Tile chars** are defined in `js/levels.js`: `#`B?x` ground/bricks/blocks,
  `P` pipe, `o` coin, `^` spikes, `L` lava, `F` flagpole base, and spawn
  markers `g`/`k`/`f`/`s` (goomba/koopa/flyer/spiny). `SOLID`/`HAZARD` sets
  control collisions.
- Level height is always **17 rows = 272px** (`VIEW_H`); levels scroll
  horizontally only. Keep new levels 17 rows.
- **Pipes must be ≤ 4 tiles tall** or low characters can't clear them.
  Jumpable gaps: 4 comfortable, 5 challenging, ≤6 hard; wider than 6 needs
  a moving platform in its swing range.
- **Night mode** is a difficulty dial, not just a palette: `setNight()`
  spawns ~50% extra enemies (`nightExtras`), multiplies enemy speed by 1.15
  (`base0 * mult`), doubles coin score, and re-sets the music theme. When
  adding enemies, register them in `loadLevel` so night extras keep working.
- Audio can only start after a user gesture; `audio.unlock()` is called on
  first keypress/pointerdown in `main.js`.
- Best score, mute, day/night and scaling prefs persist via `localStorage`
  (`pixelbros_best`, `pixelbros_mute`, `pixelbros_night`, `pixelbros_fit`).
- The canvas renders at 480×272 and is scaled by CSS with
  `image-rendering: pixelated`. `resize()` in `main.js` fills the window at a
  fractional scale by default (fit mode); **F** toggles pixel-perfect integer
  scaling (floor factor, falls back to fit below 1). Never enlarge the
  internal resolution to "fix" blurriness.

## Conventions

- ES modules, no bundler, no new dependencies without strong reason.
- 2-space indent, single quotes, semicolons (match surrounding code).
- Sprites are procedural rect drawings in `sprites.js` — do not add image
  files; music/SFX are synthesized — do not add audio files.
- Game content is original (names, melodies, art). Never introduce
  Nintendo-copyrighted assets, names or lyrics.
- When changing difficulty: the intended curve is Sunny Plains < Rolling
  Hills < Dark Caves < Sky Heights < Lava Fortress; keep enemy count and
  gap widths monotonic-ish along it.

## Ideas that fit the project

Extra levels (new entries in `LEVELS`), new enemy types (class in
`entities.js` + spawn char + draw fn), power-ups (e.g. coin magnet),
touch controls, PWA manifest. Keep zero-dependency and no-assets properties.
