// Player characters, enemies and tile collision helpers.
import { T, SOLID, HAZARD } from './levels.js';

// Names and blurbs live in i18n (hero.<id>.name / hero.<id>.blurb).
// style selects the headwear variant in sprites.drawHero.
export const CHARACTERS = [
  {
    id: 'rosso', style: 'cap', color: '#e23d3d', accent: '#ffffff',
    speed: 2.4, jump: -7.0, grav: 0.36, fallGrav: 0.36, fallMax: 8,
    hp: 2,
  },
  {
    id: 'bolt', style: 'cap', color: '#f2c027', accent: '#7a4a00',
    speed: 3.15, jump: -6.9, grav: 0.36, fallGrav: 0.38, fallMax: 9,
    hp: 1,
  },
  {
    id: 'aqua', style: 'cap', color: '#3f8fe8', accent: '#e8f6ff',
    speed: 2.05, jump: -7.7, grav: 0.34, fallGrav: 0.19, fallMax: 4.6,
    hp: 1,
  },
  {
    // the knight: sand keffiyeh with red trim — slow, tanky
    id: 'faris', style: 'keffiyeh', color: '#e9dfc8', accent: '#a52f28',
    speed: 2.1, jump: -7.2, grav: 0.36, fallGrav: 0.38, fallMax: 9,
    hp: 3,
  },
  {
    // the arrow: burnt-orange with green fletching — extreme speed,
    // lower jump (needs pipes kept <= 3 tiles tall in levels)
    id: 'sahm', style: 'fletch', color: '#c2410c', accent: '#166534',
    speed: 3.45, jump: -6.55, grav: 0.36, fallGrav: 0.36, fallMax: 8,
    hp: 1,
  },
];

export const isSolid = (ch) => SOLID.has(ch);

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function moveX(e, world) {
  e.hitWall = 0;
  if (!e.vx) return;
  e.x += e.vx;
  const ty0 = Math.floor(e.y / T);
  const ty1 = Math.floor((e.y + e.h - 0.01) / T);
  for (let ty = ty0; ty <= ty1; ty++) {
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w) / T);
      if (isSolid(world.getTile(tx, ty))) { e.x = tx * T - e.w - 0.01; e.vx = 0; e.hitWall = 1; }
    } else {
      const tx = Math.floor(e.x / T);
      if (isSolid(world.getTile(tx, ty))) { e.x = (tx + 1) * T + 0.01; e.vx = 0; e.hitWall = -1; }
    }
  }
}

export function moveY(e, world) {
  e.onGround = false;
  e.bumped = null;
  if (!e.vy) return;
  e.y += e.vy;
  const tx0 = Math.floor(e.x / T);
  const tx1 = Math.floor((e.x + e.w - 0.01) / T);
  for (let tx = tx0; tx <= tx1; tx++) {
    if (e.vy > 0) {
      const ty = Math.floor((e.y + e.h) / T);
      if (isSolid(world.getTile(tx, ty))) { e.y = ty * T - e.h - 0.01; e.vy = 0; e.onGround = true; }
    } else {
      const ty = Math.floor(e.y / T);
      if (isSolid(world.getTile(tx, ty))) { e.y = (ty + 1) * T + 0.01; e.vy = 0; e.bumped = { tx, ty }; }
    }
  }
}

// ---------------------------------------------------------------- Player
export class Player {
  constructor(ch, x, y) {
    this.ch = ch;
    this.x = x; this.y = y;
    this.w = 11; this.h = 14;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.coyote = 0; this.jumpBuf = 0;
    this.hp = ch.hp;
    this.invuln = 0;
    this.dying = false; this.dieT = 0;
    this.animT = 0;
  }

  update(world) {
    const inp = world.input;
    const ch = this.ch;

    if (this.dying) {
      this.dieT--;
      this.vy += 0.32;
      this.y += this.vy;
      return;
    }
    if (this.invuln > 0) this.invuln--;

    const left = inp.isDown('ArrowLeft') || inp.isDown('KeyA');
    const right = inp.isDown('ArrowRight') || inp.isDown('KeyD');
    const jumpHeld = inp.isDown('Space') || inp.isDown('ArrowUp') || inp.isDown('KeyW');
    const dir = (right ? 1 : 0) - (left ? 1 : 0);

    const accel = this.onGround ? 0.38 : 0.22;
    const target = dir * ch.speed;
    if (this.vx < target) this.vx = Math.min(target, this.vx + accel);
    else if (this.vx > target) this.vx = Math.max(target, this.vx - accel);
    if (dir) this.facing = dir;

    if (this.coyote > 0) this.coyote--;
    if (this.jumpBuf > 0) this.jumpBuf--;
    if (inp.pressed('Space') || inp.pressed('ArrowUp') || inp.pressed('KeyW')) this.jumpBuf = 8;
    if (this.jumpBuf > 0 && (this.onGround || this.coyote > 0)) {
      this.vy = ch.jump;
      this.jumpBuf = 0; this.coyote = 0; this.onGround = false;
      world.sfx('jump');
    }
    if (!jumpHeld && this.vy < -2.2) this.vy = -2.2;

    const g = this.vy > 0 ? (ch.fallGrav || ch.grav) : ch.grav;
    this.vy = Math.min(this.vy + g, ch.fallMax || 8);

    moveX(this, world);
    const wasGround = this.onGround;
    moveY(this, world);
    if (this.onGround) this.coyote = 6;
    else if (wasGround && this.vy >= 0) this.coyote = 6;

    this.animT += Math.abs(this.vx);

    if (this.bumped) {
      const ch2 = world.getTile(this.bumped.tx, this.bumped.ty);
      if (ch2 === '?') world.bumpBlock(this.bumped.tx, this.bumped.ty);
      else world.sfx('bump');
      this.bumped = null;
    }

    // hazard tiles + pit
    const x0 = Math.floor(this.x / T), x1 = Math.floor((this.x + this.w - 0.01) / T);
    const y0 = Math.floor(this.y / T), y1 = Math.floor((this.y + this.h - 0.01) / T);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = world.getTile(tx, ty);
        if (t === 'L') { this.hp = 1; this.hurt(world, true); return; }
        if (HAZARD.has(t)) { this.hurt(world, false); return; }
      }
    }
    if (this.y > world.h * T + 24) this.hurt(world, true);
  }

  hurt(world, fatal) {
    if (this.dying) return;
    if (!fatal && this.invuln > 0) return;
    if (!fatal && this.hp > 1) {
      this.hp--;
      this.invuln = 110;
      this.vy = -3.6;
      this.vx = -this.facing * 1.8;
      world.sfx('hurt');
      world.shake = 8;
      return;
    }
    this.dying = true;
    this.dieT = 80;
    this.vy = -6.2;
    this.vx = 0;
    world.sfx('die');
    world.shake = 10;
  }

  stompBounce(world) {
    this.vy = -5.2;
    this.jumpBuf = 0;
  }
}

// ---------------------------------------------------------------- enemies
class Enemy {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.dead = false;
    this.stompable = true;
    this.type = 'enemy';
    this.animT = 0;
  }
}

export class Goomba extends Enemy {
  constructor(x, y, mult = 1) {
    super(x, y);
    this.type = 'goomba';
    this.w = 13; this.h = 14;
    this.base0 = 0.55;
    this.baseSpeed = this.base0 * mult;
    this.dir = -1;
  }
  update(world) {
    this.animT++;
    this.vy = Math.min(this.vy + 0.32, 8);
    this.vx = this.dir * this.baseSpeed;
    moveX(this, world);
    if (this.hitWall) this.dir = this.hitWall > 0 ? -1 : 1;
    moveY(this, world);
  }
}

export class Koopa extends Enemy {
  constructor(x, y, mult = 1) {
    super(x, y);
    this.type = 'koopa';
    this.w = 13; this.h = 17;
    this.base0 = 0.45;
    this.baseSpeed = this.base0 * mult;
    this.dir = -1;
  }
  update(world) {
    this.animT++;
    this.vy = Math.min(this.vy + 0.32, 8);
    this.vx = this.dir * this.baseSpeed;
    moveX(this, world);
    if (this.hitWall) this.dir = this.hitWall > 0 ? -1 : 1;
    moveY(this, world);
  }
}

export class Spiny extends Enemy {
  constructor(x, y, mult = 1) {
    super(x, y);
    this.type = 'spiny';
    this.w = 14; this.h = 13;
    this.baseSpeed = 0.5 * mult;
    this.dir = -1;
    this.stompable = false;
  }
  update(world) {
    this.animT++;
    this.vy = Math.min(this.vy + 0.32, 8);
    this.vx = this.dir * this.baseSpeed;
    moveX(this, world);
    if (this.hitWall) this.dir = this.hitWall > 0 ? -1 : 1;
    moveY(this, world);
  }
}

export class Flyer extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.type = 'flyer';
    this.w = 13; this.h = 12;
    this.bx = x; this.by = y;
    this.t = Math.random() * Math.PI * 2;
    this.range = 42; this.amp = 10;
  }
  update(world) {
    this.animT++;
    this.t += 0.035;
    this.x = this.bx + Math.sin(this.t) * this.range;
    this.y = this.by + Math.sin(this.t * 1.9) * this.amp;
  }
}

export class Shell extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.type = 'shell';
    this.w = 13; this.h = 12;
    this.y = y + 5;
    this.vx = 0;
  }
  update(world) {
    this.animT++;
    this.vy = Math.min(this.vy + 0.32, 8);
    moveX(this, world);
    if (this.hitWall) { this.vx = -this.vx; world.sfx('bump'); }
    moveY(this, world);
  }
}

export function spawnEnemy(type, x, y, mult = 1) {
  switch (type) {
    case 'goomba': return new Goomba(x, y, mult);
    case 'koopa': return new Koopa(x, y, mult);
    case 'flyer': return new Flyer(x, y, mult);
    case 'spiny': return new Spiny(x, y, mult);
  }
}
