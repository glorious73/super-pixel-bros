# Super Pixel Bros

A Mario-style 2D platformer for the browser — vanilla JavaScript, HTML5 Canvas
and the Web Audio API. No frameworks, no build step, no asset files: all
graphics are drawn with code and all sound is synthesized.

**Play it:** <https://superpixelbros.github.io> — desktop, tablet or phone;
installable and playable offline (it's a PWA).

## Run it

```bash
cd Mario2d
python3 tools/serve.py 8000
```

then open <http://localhost:8000>. `tools/serve.py` is a tiny stdlib server
that sends `Cache-Control: no-store` so edited files always show up on reload
(plain `python3 -m http.server` caches modules and serves stale code). Any
static server works — ES modules need `http://`, not `file://`. The service
worker deliberately does not register on localhost, so development is never
shadowed by a cached shell.

## Features

- **5 levels** with a rising difficulty curve: Sunny Plains, Rolling Hills,
  Dark Caves, Sky Heights and Lava Fortress.
- **Adventure map:** after each stage your hero walks the world map to the
  next node — cleared stages fly a flag and are replayable from the map
  (◀ ▶ to pick, Enter to play), and beating the Lava Fortress ends with a
  trophy celebration.
- **5 playable heroes** with different stats, picked on a carousel
  (◀ ▶ to browse, or swipe):
  - **Rosso** — balanced, survives one extra hit per life
  - **Bolt** — fastest runner, but dies to a single hit
  - **Aqua** — mega jump and floaty falls
  - **Faris (فارس)** — armored knight in a keffiyeh; slow but survives 3 hits
  - **Sahm (سهم)** — the arrow; extreme speed with a low, slippery jump
- **Bilingual — English & Arabic** (press `L` anytime): full UI translation,
  proper Arabic text shaping, RTL layout, and Arabic hero names. English is
  the default; the choice is remembered.
- **Day / Night mode** (press `N` anytime): night darkens the world and
  shifts the music to a slower minor-key variation, spawns ~50% more enemies
  that walk faster — but coins are worth **2× score**.
- **Synthesized chiptune**: looping melody per level plus jump/coin/stomp/
  shell/hurt/death/clear/victory sound effects (`M` mutes, remembered).
- Stompable goombas, koopa shells you can kick, un-stompable spiny, flying
  foes, question blocks, moving platforms, spikes and lava.
- Score, coins, lives, best-score save (localStorage), pause with quit-to-title,
  level retry.
- **Built for touch**: on every screen, not just gameplay. Menus run on
  canvas-drawn hot spots and tappable cards, swipes browse the hero carousel
  and map, a mute/night/language icon bar sits in the corner, and a DOM
  gamepad (◀ ▶ + jump, pause) overlays the game itself. Auto-enabled on
  touch devices (toggle with `T`); notch-safe; portrait asks you to rotate.
- **PWA**: installable, offline-capable, launches standalone in landscape —
  and on wide screens the view widens up to 640×272 (tile-snapped) so
  landscape phones fill the screen instead of showing black bars. Height is
  always 272; physics never change.

## Controls

| Key | Action |
|---|---|
| ← → / A D | Move |
| Space / ↑ / W | Jump (hold for higher) |
| Enter | Confirm / start stage (on the map, ◀ ▶ picks cleared stages) |
| N | Toggle day / night |
| M | Mute / unmute |
| Esc | Pause / resume |
| Q (while paused or on the map) | Quit to title (best score kept) |
| R | Retry (lose a life, instant) |
| F | Toggle fit-window / pixel-perfect scaling |
| L | Toggle language (English / العربية) |
| T | Show / hide touch controls (auto-on for touch devices) |

On touch devices everything above has a tap target: tap = confirm, tap the
on-screen icons = their keys, swipe left/right = ◀ ▶ on the carousel screens,
tap a map node to pick it, tap again to play.

## Project layout

```
index.html             page shell (PWA meta, touch buttons)
manifest.webmanifest   PWA manifest (relative scope, fullscreen standalone)
sw.js                  offline service worker (versioned precache shell)
css/style.css          page styling (state-gated gamepad, safe areas)
icons/                 app icons — generated, see tools/gen-icons.mjs
js/main.js             canvas setup + adaptive view + fixed-timestep loop
js/game.js             state machine, physics interactions, scoring
js/i18n.js             English/Arabic string tables, language toggle, RTL
js/levels.js           the 5 tilemap levels + level builder
js/entities.js         player characters, enemies, collision helpers
js/renderer.js         tile grid, entities, HUD
js/sprites.js          procedural pixel-art drawing
js/theme.js            day/night palettes, parallax backdrop
js/ui.js               title / select / adventure map / clear / game-over / victory screens
js/audio.js            Web Audio synth (SFX + music)
js/input.js            keyboard + virtual key edge triggers
js/touchui.js          canvas tap hot spots, swipe recognition
js/view.js             runtime view size (272 tall, 480-640 wide)
tools/serve.py              static server that sends Cache-Control: no-store
tools/gen-icons.mjs         draws the PWA icons to PNG (pure Node, no deps)
tools/check-palette.mjs     palette contrast linter
tools/check-i18n.mjs        en/ar key-parity linter
tools/check-reachability.mjs  per-hero level solvability checker
tools/headless.mjs          state-machine smoke tests, EN + AR, no browser
```

## Verify

No test framework, but the repo carries four zero-dependency checks:

```bash
node tools/check-palette.mjs       # palette contrast (after theme.js edits)
node tools/check-i18n.mjs          # en/ar key parity + every t('key') resolves
node tools/check-reachability.mjs  # every hero can finish every level (BFS with
                                   # real jump envelopes — caught real soft-locks)
node tools/headless.mjs            # drives every screen in EN + AR, touch hot
                                   # spots included, stubbing the browser
```

When any app-shell file changes, bump `VERSION` in `sw.js` (and run
`node tools/gen-icons.mjs` only if the icon design changed).

Original characters and melodies — Mario-*style* gameplay without
Nintendo's assets, so it's safe to share.

## Built with

Designed and implemented by **Qwen3.8 Flash Next** running locally on an
AMD **Strix Halo** device, together with Amjad Abujamous. Every module,
level and melody was generated and verified on-device — no cloud calls.
