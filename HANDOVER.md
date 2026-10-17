# Handover — Super Pixel Bros

Written 2026-10-16 by Qwen3.8 Flash Next, the agent that built this project
together with **glorious73 (Amjad Abujamous)**. Updated 2026-10-17 with the
touch-complete + PWA work. Everything here is current as of that work landing
(run `git log -1` for the tip; all checks green).

## What this project is

A Mario-style 2D platformer for the browser. Vanilla JS (ES modules), HTML5
Canvas, Web Audio. **Hard constraints the user cares about: no frameworks, no
build step, no runtime dependencies, no binary assets** — all graphics are
procedural rect drawings, all sound synthesized. Original (non-Nintendo)
characters, names and melodies. Keep it that way.

## Where things live

| | |
|---|---|
| **Play (official URL)** | https://superpixelbros.github.io |
| Play (also live) | https://glorious73.github.io/super-pixel-bros/ |
| Dev repo | https://github.com/glorious73/super-pixel-bros (remote `origin`) |
| Site repo (org `superpixelbros`) | https://github.com/superpixelbros/superpixelbros.github.io (remote `pages`) |
| Local path | `/home/glorious73/Development/Games/Mario2d` |

`main` is the only branch. Both remotes have identical `main`. GitHub Pages
serves both (legacy build, branch `main`, root `/`, `.nojekyll` present);
a push republishes in ~1 minute. **Deploy = `git push origin main && git push pages main`.**

GitHub auth is done via `gh` CLI (account glorious73, web-login; `gh auth
setup-git` already configured). The `superpixelbros` **org** exists with no
extra repos; org admins are managed by the user.

## Run & verify (all of this passes right now)

```bash
python3 tools/serve.py 8000        # dev server — NO-STORE headers; use this,
                                   # plain `python -m http.server` serves stale
                                   # cached modules (caused a fake-bug hunt)
# after any code change:
for f in js/*.js; do node --input-type=module --check < "$f"; done
node tools/check-palette.mjs       # after js/theme.js edits
node tools/check-i18n.mjs          # after js/i18n.js or any UI string
node tools/check-reachability.mjs  # after ANY js/levels.js or hero-stats edit
node tools/headless.mjs            # full state-machine + both languages, no browser
node tools/gen-icons.mjs           # regenerate icons/ (code-drawn PNGs)
# ⚠ whenever ANY app-shell file changes: bump VERSION (and ASSETS if files
#   were added/renamed) in sw.js — installed users otherwise keep stale code
```

`check-reachability.mjs` is the crown jewel: it simulates each hero's real
jump envelope and BFS's every level — it caught two real soft-locks (a hero
that couldn't clear 5-wide gaps). `headless.mjs` stubs the browser and drives
every screen in EN + AR, including the adventure-map flow and virtual touch
input. Both live in `tools/` (they used to be in `/tmp` — that's why they are
versioned now).

## Game overview (state of play)

- **Flow:** title → hero select (carousel) → **adventure map** → stage →
  clear → hero walks the map path to the next node → … → trophy victory.
- **5 heroes:** Rosso (balanced, 2hp), Bolt (fast, 1hp), Aqua (mega jump,
  floaty), **Faris فارس** (keffiyeh tank, 3hp, slow), **Sahm سهم** (fastest,
  1hp, low jump). Stats in `CHARACTERS` (entities.js); names/blurbs are i18n
  keys `hero.<id>.name/.blurb`; headwear `style` picks the `drawHero` variant.
- **5 levels:** Sunny Plains < Rolling Hills < Dark Caves < Sky Heights <
  Lava Fortress. 17 rows tall, horizontal scroll only.
- **Bilingual EN/عربي** (`L` toggles, persisted): all UI through `t()`;
  Arabic sets `ctx.direction`, `<html lang/dir>`; canvas font stack ends in
  `"DejaVu Sans Mono", "Amiri"`; digits stay Western.
- **Day/Night** (`N`): night = +50% enemies (`nightExtras`), 1.15× enemy
  speed, 2× coin score, octave-down music. It's a difficulty dial, not a skin.
- **Touch controls:** DOM gamepad (◀ ▶ jump pause, Q on pause/map) feeds
  `Input.press/release` — the same edge-trigger pipeline as keyboard — shown
  only in play/pause/map via `body[data-state]`; notch-safe positioning.
  Auto-on for coarse pointers; `T` toggles (`localStorage.pixelbros_touch`);
  portrait shows a rotate-to-landscape hint.
- **Touch-complete menus + PWA (2026-10-17):** menus run on **canvas UI**
  (`js/touchui.js`): screens register tap hot spots while drawing their art,
  taps become `Input.tap(code)` (tap on nothing = Enter, the classic
  behavior), horizontal swipes become ◀ ▶ on select/map, map nodes are
  `Node<i>` tap codes, pause/game-over are card menus, and a mute/night/lang
  icon bar injects M/N/L — so a touch-only user can play everything. PWA:
  `manifest.webmanifest` (relative scope → works on both Pages URLs) +
  versioned precache `sw.js` (not registered on localhost by design).
  Installable, offline-capable, landscape standalone.
- Keys: arrows/WASD move, Space jump (hold=higher, tap≈1 tile), Enter,
  Esc pause, **Q quit-to-title (from pause or map)**, R retry, N night,
  M mute, L language, F scaling.

## Architecture

See `AGENTS.md` for the file-by-file table — it stays maintained. The
big picture: `main.js` (loop/scaling/touch wiring) → `game.js` (state
machine `title/select/map/play/pause/clear/gameover/victory` + world facade)
→ `entities.js` (Player/enemies/tile collision) + `levels.js` (declarative
Builder level defs + `parseLevel`) → `renderer.js`/`sprites.js`/`theme.js`
(all drawing) + `ui.js` (menu screens incl. `drawMap`) + `audio.js` (synth)
+ `input.js` (keyboard + virtual buttons) + `touchui.js` (canvas hot spots,
tap/swipe gestures, touch-mode flag) + `i18n.js` (en/ar tables) + `sw.js`
(offline shell).

## Decisions you should not re-litigate (with reasons)

- **Pipes ≤ 3 tiles; gaps ≤ 4 wide** unless a moving platform bridges them.
  Design for the worst hero: Sahm climbs ≈3.5 tiles, Faris crosses ≈5.
- Tap-jump cut floor is **−3.3** (was −2.2; that made `?` blocks feel dead).
  First Sunny Plains `?`-trio sits at row 12 so tap-jumps can reach it.
- `?` blocks: one-shot, head-hit only; they pop an animated coin + bump
  animation (`game.popCoins` / `game.bumps`, drawn by renderer).
- Leaderboard = **localStorage only**. A SQLite/server scoreboard was proposed
  and rejected: breaks static hosting + client scores are unvalidatable.
- Sharper dual-canvas backgrounds: discussed, **not built**. Current pixel
  look is intentional (`image-rendering: pixelated`).
- Canvas is 480×272 as the *minimum* view; width grows to 640 on wide
  screens (js/view.js, tile-snapped) and is never enlarged past that or
  made taller. Fit-window scaling by default, F = integer scale.
  Phones: no footer, tight margins, fullscreen (PWA display_override +
  browser first-tap fallback).
- Touch menu affordances are canvas-drawn and inject Input key codes
  (tap → `Input.tap('KeyM')` etc.) — one input pipeline, keyboard and touch,
  headless-testable. Do not add DOM buttons for menus.
- PWA icons are **generated PNGs** (`tools/gen-icons.mjs`, pure Node + a
  ~40-line PNG encoder): the deliberate, documented exception to the
  no-binary-assets rule, because iOS needs PNG icons. Edit the tool, never
  hand-draw. The service worker skips registration on localhost so it can
  never fight the no-store dev server; bump `VERSION` in `sw.js` per release.
- Arabic strings: pure-Arabic runs with Latin key names (ENTER, WASD) to
  dodge bidi reordering bugs; keep them that way (the i18n linter checks
  key parity, a human checks wording).

## Lessons from this project (agent-to-agent notes)

- The browser **will** lie to you: `python -m http.server` has no
  `Cache-Control`, so stale modules produced "impossible" bugs (dead key,
  undefined level name). Always reproduce with the no-store server (or a
  hard reload) before debugging gameplay reports.
- When driving the real `Input` in headless tests you **must call
  `Input.endFrame()` after each fake frame**, or edge triggers leak and
  your test player bunny-hops into phantom bugs.
- Level data is deep-copied by `parseLevel` — mutating `game.rows` is safe,
  but don't mutate the Builder grids in `LEVELS`.
- Physics are per-frame @ 60Hz (px/frame). Any hero-stat or level change →
  re-run `check-reachability.mjs`; it is the closest thing to a test suite.
- `git add -A` once swept in `tools/__pycache__` — check `git status` first;
  `.gitignore` now covers pycache.
- Commit/push only when the user asks (their standing preference; they say
  "git" explicitly). They like 2–3 logical commits with detailed messages.
- The user runs the game on tablets/landscape phones — touch UX changes are
  worth real-device sanity checks.

## Ideas already discussed (not built)

- Local initials leaderboard (top-10 per day/night, title-screen entry).
- Smooth dual-layer parallax backdrop behind the pixelated game canvas.
- More levels (append to `LEVELS`, obey the pipe/gap rules, run the suite).
- Optional: if a global board is ever wanted, a decoupled JSON backend
  behind one small module — never couple gameplay to a server.
- A portrait, touch-first sibling game (separate project, reuses this
  engine's DNA: synth audio, procedural art, i18n, hot-spot layer).

## Credit

Created by **Qwen3.8 Flash Next** running locally on an AMD **Strix Halo**
together with the user — this phrasing is in README/AGENTS by request.

Play the game, keep it fun, keep it zero-dependency. 🍄
