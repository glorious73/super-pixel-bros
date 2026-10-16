// Core game: state machine, world simulation, collisions, scoring.
import Input from './input.js';
import audio from './audio.js';
import { toggleLang } from './i18n.js';
import { parseLevel, LEVEL_COUNT, T, VIEW_W, VIEW_H } from './levels.js';
import { CHARACTERS, Player, Shell, spawnEnemy, overlaps } from './entities.js';
import { drawWorld, drawHUD } from './renderer.js';
import {
  drawTitle, drawSelect, drawMap, drawClear, drawGameOver, drawVictory,
  drawIntro, drawPause,
} from './ui.js';

export default class Game {
  constructor() {
    this.input = Input;
    this.state = 'title';
    this.t = 0;
    this.night = localStorage.getItem('pixelbros_night') === '1';
    this.nightMix = this.night ? 1 : 0;
    this.best = +localStorage.getItem('pixelbros_best') || 0;
    this.levelCount = LEVEL_COUNT;
    this.selIdx = 0;
    this.char = CHARACTERS[0];
    // adventure map: hero walks between stage nodes; cleared[] tracks progress
    this.node = 0;
    this.cursor = 0;
    this.cleared = Array(LEVEL_COUNT).fill(false);
    this.mapWalk = null; // { from, to, t } while the hero walks to next node
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.shake = 0;
    this.particles = [];
    this.popCoins = []; // coins popping out of bumped ? blocks
    this.bumps = [];    // ?-block bump animations { tx, ty, t }
    this.entities = [];
    this.platforms = [];
    this.cam = { x: 0, y: 0 };
  }

  get muted() { return audio.muted; }

  sfx(name) { audio.sfx(name); }

  getTile(tx, ty) {
    if (!this.rows) return ' ';
    if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return ' ';
    return this.rows[ty][tx];
  }

  // ------------------------------------------------------------ level flow
  loadLevel(idx) {
    this.levelIdx = idx;
    this.level = parseLevel(idx);
    this.rows = this.level.rows;
    this.w = this.level.w;
    this.h = this.level.h;
    this.entities = this.level.enemies.map((s) =>
      spawnEnemy(s.type, s.x * T, s.y * T, this.night ? 1.15 : 1));
    this.nightExtras = [];
    this.platforms = this.level.platforms.map((p) => ({
      t: Math.random() * Math.PI * 2,
      axis: p.axis, range: p.range, speed: p.speed,
      bx: p.x * T, by: p.y * T,
      x: p.x * T, y: p.y * T, prevX: p.x * T, prevY: p.y * T,
      dx: 0, dy: 0, w: p.w * T, h: 10,
    }));
    this.player = new Player(this.char, this.level.spawn.x, this.level.spawn.y);
    this.cam = { x: 0, y: 0 };
    this.popCoins = [];
    this.bumps = [];
    this.introT = 120;
    if (this.night) this.spawnNightExtras();
    audio.setTheme(this.level.theme, this.night);
  }

  spawnNightExtras() {
    if (this.nightExtras.length) return;
    this.level.enemies.forEach((s, i) => {
      if ((s.type !== 'goomba' && s.type !== 'koopa') || i % 2) return;
      let ex = s.x - 5;
      const pl = this.player;
      if (pl && Math.abs(ex * T - pl.x) < 80) ex = s.x + 7;
      const e = spawnEnemy(s.type, Math.max(1, ex) * T, s.y * T, 1.15);
      this.entities.push(e);
      this.nightExtras.push(e);
      this.burst(e.x + 6, e.y + 6, '#8a6adf', 8);
    });
  }

  removeNightExtras() {
    if (!this.nightExtras.length) return;
    const set = new Set(this.nightExtras);
    this.entities = this.entities.filter((e) => !set.has(e));
    this.nightExtras = [];
  }

  setNight(on) {
    this.night = on;
    localStorage.setItem('pixelbros_night', on ? '1' : '0');
    if (this.level) {
      audio.setTheme(this.level.theme, on);
      if (this.state === 'play') {
        const m = on ? 1.15 : 1;
        for (const e of this.entities)
          if (e.base0 !== undefined) e.baseSpeed = e.base0 * m;
        if (on) this.spawnNightExtras();
        else this.removeNightExtras();
      }
    } else {
      audio.setTheme(0, on);
    }
  }

  startRun() {
    this.char = CHARACTERS[this.selIdx];
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.node = 0;
    this.cursor = 0;
    this.cleared = Array(LEVEL_COUNT).fill(false);
    this.mapWalk = null;
    this.state = 'map';
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('pixelbros_best', String(this.best));
    }
  }

  // ------------------------------------------------------------ world bits
  bumpBlock(tx, ty) {
    if (this.rows[ty][tx] !== '?') return;
    this.rows[ty][tx] = 'x';
    this.addCoinScore(tx * T + 8, ty * T - 4);
    this.popCoins.push({ x: tx * T, y: ty * T, vy: -3.6, t: 26 });
    this.bumps.push({ tx, ty, t: 10 });
    this.sfx('bump');
    this.shake = Math.max(this.shake, 3);
  }

  addCoinScore(x, y) {
    this.coins++;
    this.score += this.night ? 200 : 100;
    this.sfx(this.night ? 'coin2' : 'coin');
    this.burst(x, y, '#f8c81c', 6);
  }

  burst(x, y, col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.5 + Math.random() * 1.8;
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
        life: 22 + Math.random() * 12, maxLife: 34, size: 1 + Math.random() * 2,
        col, grav: 0.12,
      });
    }
  }

  collectCoins() {
    const pl = this.player;
    const x0 = Math.floor(pl.x / T), x1 = Math.floor((pl.x + pl.w - 0.01) / T);
    const y0 = Math.floor((pl.y - 2) / T), y1 = Math.floor((pl.y + pl.h - 0.01) / T);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.getTile(tx, ty) === 'o') {
          this.rows[ty][tx] = ' ';
          this.addCoinScore(tx * T + 8, ty * T + 8);
        }
      }
    }
  }

  // ------------------------------------------------------------ update
  update() {
    this.t++;
    if (this.input.pressed('KeyM')) { audio.toggleMute(); this.sfx('select'); }
    if (this.input.pressed('KeyN')) { this.setNight(!this.night); this.sfx('confirm'); }
    if (this.input.pressed('KeyL')) { toggleLang(); this.sfx('confirm'); }

    switch (this.state) {
      case 'title':
        if (this.input.pressed('Enter')) { this.state = 'select'; this.sfx('confirm'); }
        break;
      case 'select':
        const n = CHARACTERS.length;
        if (this.input.pressed('ArrowLeft') || this.input.pressed('KeyA')) {
          this.selIdx = (this.selIdx + n - 1) % n; this.sfx('select');
        }
        if (this.input.pressed('ArrowRight') || this.input.pressed('KeyD')) {
          this.selIdx = (this.selIdx + 1) % n; this.sfx('select');
        }
        if (this.input.pressed('Enter')) { this.startRun(); this.sfx('confirm'); }
        break;
      case 'play':
        if (this.input.pressed('Escape')) this.state = 'pause';
        this.updatePlay();
        break;
      case 'map':
        this.updateMap();
        break;
      case 'pause':
        if (this.input.pressed('Escape')) this.state = 'play';
        if (this.input.pressed('KeyQ')) {
          this.saveBest(); // abandoning the run, but keep the record
          this.state = 'title'; this.sfx('confirm');
        }
        break;
      case 'clear':
        if (this.input.pressed('Enter')) this.finishStage();
        break;
      case 'gameover':
        if (this.input.pressed('Enter')) {
          this.lives = 3; this.loadLevel(this.levelIdx); this.state = 'play';
          this.sfx('confirm');
        } else if (this.input.pressed('Escape')) { this.state = 'title'; }
        break;
      case 'victory':
        if (this.input.pressed('Enter')) { this.state = 'title'; this.sfx('confirm'); }
        break;
    }

    // animate nightMix toward target
    const target = this.night ? 1 : 0;
    this.nightMix += (target - this.nightMix) * 0.04;
    if (Math.abs(target - this.nightMix) < 0.005) this.nightMix = target;
    if (this.shake > 0.3) this.shake *= 0.86; else this.shake = 0;
  }

  // ------------------------------------------------------------ adventure map
  finishStage() {
    const i = this.levelIdx;
    this.cleared[i] = true;
    if (i + 1 < LEVEL_COUNT) {
      this.state = 'map';
      if (i >= this.node) {
        // cleared the frontier stage: hero walks on to the next node
        // (updateMap moves `node` and `cursor` when the walk completes)
        this.mapWalk = { from: i, to: i + 1, t: 0 };
      } else {
        this.mapWalk = null; // replay of a cleared stage: stay at the frontier
        this.cursor = this.node;
      }
      this.sfx('confirm');
    } else {
      this.saveBest();
      this.state = 'victory';
      this.sfx('victory');
    }
  }

  updateMap() {
    if (this.mapWalk) {
      if (this.input.pressed('Enter')) this.mapWalk.t = 0.99; // skip walk
      this.mapWalk.t += 1 / 80;
      if (this.mapWalk.t >= 1) {
        this.node = this.mapWalk.to;
        this.cursor = this.node;
        this.mapWalk = null;
        this.sfx('confirm');
      }
      return;
    }
    if (this.input.pressed('ArrowLeft') || this.input.pressed('KeyA')) {
      this.cursor = Math.max(0, this.cursor - 1); this.sfx('select');
    }
    if (this.input.pressed('ArrowRight') || this.input.pressed('KeyD')) {
      this.cursor = Math.min(this.node, this.cursor + 1); this.sfx('select');
    }
    if (this.input.pressed('KeyQ') || this.input.pressed('Escape')) {
      this.saveBest();
      this.state = 'title'; this.sfx('confirm');
    }
    if (this.input.pressed('Enter')) {
      this.loadLevel(this.cursor);
      this.state = 'play'; this.sfx('confirm');
    }
  }

  updatePlay() {
    if (this.introT > 0) this.introT--;
    const pl = this.player;

    // moving platforms
    for (const p of this.platforms) {
      p.t += p.speed;
      p.prevX = p.x; p.prevY = p.y;
      const s = Math.sin(p.t) * p.range * T;
      p.x = p.axis === 'x' ? p.bx + s : p.bx;
      p.y = p.axis === 'y' ? p.by + s : p.by;
      p.dx = p.x - p.prevX;
      p.dy = p.y - p.prevY;
    }

    if (this.input.pressed('KeyR') && !pl.dying) pl.hurt(this, true);

    const prevFeet = pl.y + pl.h;
    pl.update(this);

    // ride platforms
    if (!pl.dying) {
      for (const p of this.platforms) {
        if (pl.vy >= 0 && overlaps(pl, p) && prevFeet <= p.prevY + 4) {
          pl.y = p.y - pl.h - 0.01;
          pl.vy = 0;
          pl.onGround = true;
          pl.coyote = 4;
          pl.x += p.dx;
        }
      }
    }

    this.collectCoins();

    // enemies
    for (const e of this.entities) e.update(this);
    this.handleShells();
    this.handlePlayerEnemies();
    this.entities = this.entities.filter((e) =>
      !e.dead && e.x > this.cam.x - 96 && e.y < this.h * T + 80);

    // particles
    for (const pt of this.particles) {
      pt.vy += pt.grav; pt.x += pt.vx; pt.y += pt.vy; pt.life--;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);

    // ?-block feedback: coin popping up, block bumping back down
    for (const c of this.popCoins) { c.y += c.vy; c.vy += 0.28; c.t--; }
    this.popCoins = this.popCoins.filter((c) => c.t > 0);
    for (const b of this.bumps) b.t--;
    this.bumps = this.bumps.filter((b) => b.t > 0);

    // camera
    const tx = pl.x + pl.w / 2 - VIEW_W * 0.45 + pl.vx * 10;
    this.cam.x += (Math.max(0, Math.min(tx, this.w * T - VIEW_W)) - this.cam.x) * 0.12;

    // flag / death / resolution
    if (!pl.dying && this.checkFlag()) {
      this.score += 1000;
      this.state = 'clear';
      this.sfx('clear');
    }
    if (pl.dying && pl.dieT <= 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.saveBest();
        this.state = 'gameover';
        this.sfx('gameover');
      } else {
        this.loadLevel(this.levelIdx);
      }
    }
  }

  handleShells() {
    for (const e of this.entities) {
      if (e.type !== 'shell' || Math.abs(e.vx) < 1 || e.dead) continue;
      for (const o of this.entities) {
        if (o === e || o.dead || o.type === 'shell') continue;
        if (overlaps(e, o)) {
          o.dead = true;
          this.score += 400;
          this.burst(o.x + o.w / 2, o.y + o.h / 2, '#ffd83d', 10);
          this.sfx('kick');
        }
      }
    }
  }

  handlePlayerEnemies() {
    const pl = this.player;
    if (pl.dying) return;
    for (const e of this.entities) {
      if (e.dead || !overlaps(pl, e)) continue;
      const stomp = pl.vy > 0.6 && (pl.y + pl.h) - e.y < 11;
      if (stomp && e.stompable) {
        pl.stompBounce(this);
        if (e.type === 'koopa') {
          e.dead = true;
          const sh = new Shell(e.x, e.y);
          sh.dir = e.dir;
          this.entities.push(sh);
          this.score += 100;
          this.sfx('stomp');
        } else if (e.type === 'shell') {
          e.vx = 0;
          this.sfx('stomp');
        } else {
          e.dead = true;
          this.score += 200;
          this.burst(e.x + e.w / 2, e.y + e.h / 2, '#d8a060', 10);
          this.sfx('stomp');
        }
        this.shake = Math.max(this.shake, 3);
      } else if (e.type === 'shell' && Math.abs(e.vx) < 0.5 && !stomp) {
        e.vx = pl.x < e.x ? 4.4 : -4.4;
        this.score += 100;
        this.sfx('kick');
      } else if (!stomp) {
        pl.hurt(this, false);
      }
    }
  }

  checkFlag() {
    const pl = this.player;
    for (const f of this.level.flags) {
      const fx = f.x * T + 8, fy = f.y * T;
      if (pl.x + pl.w > fx - 8 && pl.x < fx + 8 &&
          pl.y + pl.h > fy - 88 && pl.y < fy + 16) return true;
    }
    return false;
  }

  // ------------------------------------------------------------ render
  render(ctx) {
    switch (this.state) {
      case 'title': drawTitle(ctx, this); break;
      case 'select': drawSelect(ctx, this); break;
      case 'map': drawMap(ctx, this); break;
      case 'play':
      case 'pause':
        drawWorld(ctx, this);
        drawHUD(ctx, this);
        if (this.introT > 0) drawIntro(ctx, this);
        if (this.state === 'pause') drawPause(ctx, this);
        break;
      case 'clear':
        drawWorld(ctx, this);
        drawHUD(ctx, this);
        drawClear(ctx, this);
        break;
      case 'gameover':
        drawWorld(ctx, this);
        drawHUD(ctx, this);
        drawGameOver(ctx, this);
        break;
      case 'victory': drawVictory(ctx, this); break;
    }
  }
}
