# Super Pixel Bros

A Mario-style 2D platformer for the browser — vanilla JavaScript, HTML5 Canvas
and the Web Audio API. No frameworks, no build step, no asset files: all
graphics are drawn with code and all sound is synthesized.

## Run it

```bash
cd Mario2d
python3 -m http.server 8000
```

then open <http://localhost:8000>. (Any static server works — ES modules
need `http://`, not `file://`.)

## Features

- **5 levels** with a rising difficulty curve: Sunny Plains, Rolling Hills,
  Dark Caves, Sky Heights and Lava Fortress.
- **3 playable heroes** with different stats:
  - **Rosso** — balanced, survives one extra hit per life
  - **Bolt** — fastest runner, but dies to a single hit
  - **Aqua** — mega jump and floaty falls
- **Day / Night mode** (press `N` anytime): night darkens the world and
  shifts the music to a slower minor-key variation, spawns ~50% more enemies
  that walk faster — but coins are worth **2× score**.
- **Synthesized chiptune**: looping melody per level plus jump/coin/stomp/
  shell/hurt/death/clear/victory sound effects (`M` mutes, remembered).
- Stompable goombas, koopa shells you can kick, un-stompable spiny, flying
  foes, question blocks, moving platforms, spikes and lava.
- Score, coins, lives, best-score save (localStorage), pause, level retry.

## Controls

| Key | Action |
|---|---|
| ← → / A D | Move |
| Space / ↑ / W | Jump (hold for higher) |
| Enter | Confirm / next stage |
| N | Toggle day / night |
| M | Mute / unmute |
| Esc | Pause |
| R | Retry (lose a life, instant) |
| F | Toggle fit-window / pixel-perfect scaling |

## Project layout

```
index.html          page shell
css/style.css       page styling
js/main.js          canvas setup + fixed-timestep loop
js/game.js          state machine, physics interactions, scoring
js/levels.js        the 5 tilemap levels + level builder
js/entities.js      player characters, enemies, collision helpers
js/renderer.js      tile grid, entities, HUD
js/sprites.js       procedural pixel-art drawing
js/theme.js         day/night palettes, parallax backdrop
js/ui.js            title / select / clear / game-over / victory screens
js/audio.js         Web Audio synth (SFX + music)
js/input.js         keyboard handling
```

Original characters and melodies — Mario-*style* gameplay without
Nintendo's assets, so it's safe to share.

## Built with

Designed and implemented by **Qwen3.8 Flash Next** running locally on an
AMD **Strix Halo** device, together with Amjad Abujamous. Every module,
level and melody was generated and verified on-device — no cloud calls.
