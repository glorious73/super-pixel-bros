# Super Pixel Bros

A Mario-style 2D platformer for the browser — vanilla JavaScript, HTML5 Canvas
and the Web Audio API. No frameworks, no build step, no asset files: all
graphics are drawn with code and all sound is synthesized.

## Run it

```bash
cd Mario2d
python3 tools/serve.py 8000
```

then open <http://localhost:8000>. `tools/serve.py` is a tiny stdlib server
that sends `Cache-Control: no-store` so edited files always show up on reload
(plain `python3 -m http.server` caches modules and serves stale code). Any
static server works — ES modules need `http://`, not `file://`.

## Features

- **5 levels** with a rising difficulty curve: Sunny Plains, Rolling Hills,
  Dark Caves, Sky Heights and Lava Fortress.
- **Adventure map:** after each stage your hero walks the world map to the
  next node — cleared stages fly a flag and are replayable from the map
  (←/→ to pick, Enter to play), and beating the Lava Fortress ends with a
  trophy celebration.
- **5 playable heroes** with different stats, picked on a carousel
  (←/→ to browse):
  - **Rosso** — balanced, survives one extra hit per life
  - **Bolt** — fastest runner, but dies to a single hit
  - **Aqua** — mega jump and floaty falls
  - **Faris (فارس)** — armored knight in a keffiyeh; slow but survives 3 hits
  - **Sahm (سهم)** — the arrow; extreme speed with a low, slippery jump
- **Bilingual — English & Arabic** (press `L` anytime): full UI translation,
  proper Arabic text shaping, RTL footer, and Arabic hero names. English is
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
- **Touch controls** for tablets and landscape phones: on-screen ◀ ▶ + jump
  buttons and a pause button appear automatically on touch devices (toggle
  with `T`); in portrait you get a rotate-to-landscape hint. Tap the canvas
  to confirm menus.

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

## Project layout

```
index.html          page shell
css/style.css       page styling
js/main.js          canvas setup + fixed-timestep loop
js/game.js          state machine, physics interactions, scoring
js/i18n.js          English/Arabic string tables, language toggle, RTL
js/levels.js        the 5 tilemap levels + level builder
js/entities.js      player characters, enemies, collision helpers
js/renderer.js      tile grid, entities, HUD
js/sprites.js       procedural pixel-art drawing
js/theme.js         day/night palettes, parallax backdrop
js/ui.js            title / select / adventure map / clear / game-over / victory screens
js/audio.js         Web Audio synth (SFX + music)
js/input.js         keyboard handling
tools/serve.py          static server that sends Cache-Control: no-store
tools/check-palette.mjs  palette contrast linter
tools/check-i18n.mjs     en/ar key-parity linter
```

## Verify

No test framework, but the repo carries three zero-dependency checks:

```bash
node tools/check-palette.mjs   # palette contrast rules (run after theme.js edits)
node tools/check-i18n.mjs      # en/ar key parity + every t('key') resolves
```

A per-character reachability test (BFS of every level with each hero's real
jump envelope) also runs under Node — see `AGENTS.md` for the current copy.
It has caught real soft-locks, like gaps wider than the slowest hero can jump.

Original characters and melodies — Mario-*style* gameplay without
Nintendo's assets, so it's safe to share.

## Built with

Designed and implemented by **Qwen3.8 Flash Next** running locally on an
AMD **Strix Halo** device, together with Amjad Abujamous. Every module,
level and melody was generated and verified on-device — no cloud calls.
