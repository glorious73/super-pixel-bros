// Tile map + level definitions.
// Tile chars: '#' ground  'B' brick  '?' question block  'x' used block
//   'P' pipe  'o' coin  '^' spikes  'L' lava  'F' flag
//   'g' goomba  'k' koopa  'f' flyer  's' spiny (spawn markers, cleared on parse)

export const T = 16;
export const VIEW_W = 480;
export const VIEW_H = 272; // 17 tiles
export const ROWS = 17;

export const SOLID = new Set(['#', 'B', '?', 'x', 'P']);
export const HAZARD = new Set(['^', 'L']);
const ENEMY_CHARS = { g: 'goomba', k: 'koopa', f: 'flyer', s: 'spiny' };

class Builder {
  constructor(w) {
    this.w = w;
    this.h = ROWS;
    this.g = Array.from({ length: this.h }, () => Array(w).fill(' '));
  }
  set(x, y, c) {
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.g[y][x] = c;
    return this;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }
  // ground strip on bottom 2 rows
  ground(x, w) { return this.rect(x, this.h - 2, w, 2, '#'); }
  // platform of '#' tiles
  plat(x, y, w) { return this.rect(x, y, w, 1, '#'); }
  // bobbing row of coins
  coins(x, y, n) { for (let i = 0; i < n; i++) this.set(x + i, y, 'o'); return this; }
  // coin arch (over a gap, apex in the middle)
  arch(x, y, n) {
    for (let i = 0; i < n; i++) {
      const lift = Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 2);
      this.set(x + i, y - lift, 'o');
    }
    return this;
  }
  pipe(x, hgt) { return this.rect(x, this.h - 2 - hgt, 2, hgt, 'P'); }
  q(x, y) { return this.set(x, y, '?'); }
  stair(x, n, dir = 1) { // rising staircase, dir 1 = up to the right
    for (let i = 0; i < n; i++) {
      const h = dir > 0 ? i + 1 : n - i;
      this.rect(x + i, this.h - 2 - h, 1, h, '#');
    }
    return this;
  }
}

function level(spec, build, extra) {
  const b = new Builder(spec.w);
  build(b);
  return { ...spec, ...(extra || {}), b };
}

const LEVELS = [
  // 1 — Sunny Plains: gentle tutorial walk
  level({ name: 'SUNNY PLAINS', theme: 0, w: 140, spawn: { x: 2, y: 13 } }, (b) => {
    b.ground(0, 18).ground(21, 13).ground(37, 15).ground(56, 84);
    b.arch(18, 13, 3).arch(34, 13, 3).arch(52, 13, 4);
    b.coins(9, 11, 4);
    b.q(13, 11).q(14, 11).q(15, 11);
    b.pipe(24, 3).pipe(44, 4);
    b.rect(40, 11, 5, 1, 'B').q(42, 11).set(41, 11, 'o').set(43, 11, 'o');
    b.set(30, 14, 'g').set(47, 13, 'g').set(62, 14, 'g')
     .set(78, 14, 'g').set(100, 14, 'g').set(118, 14, 'g');
    b.coins(66, 11, 5).coins(84, 12, 3);
    b.q(70, 11).q(86, 7);
    b.stair(122, 4).stair(128, 4, -1);
    b.set(133, 14, 'F');
  }),

  // 2 — Rolling Hills: wider gaps, koopas, more pipes
  level({ name: 'ROLLING HILLS', theme: 1, w: 160, spawn: { x: 2, y: 13 } }, (b) => {
    b.ground(0, 22).ground(26, 18).ground(49, 21).ground(74, 32).ground(110, 50);
    b.arch(22, 13, 4).arch(44, 13, 5).arch(69, 13, 5).arch(106, 13, 4);
    b.pipe(16, 4).pipe(40, 3).pipe(70, 3).pipe(102, 4);
    b.set(12, 14, 'g').set(28, 14, 'k').set(34, 14, 'g');
    b.set(52, 14, 'g').set(58, 14, 'k').set(64, 14, 'g');
    b.set(84, 14, 'g').set(92, 14, 'k').set(118, 14, 'g');
    b.set(126, 14, 'k').set(134, 14, 'g');
    b.plat(30, 11, 4).coins(30, 9, 4);
    b.plat(55, 10, 3).q(56, 6);
    b.plat(80, 11, 5).coins(81, 9, 3);
    b.rect(96, 11, 4, 1, 'B').q(98, 11);
    b.coins(114, 12, 4);
    b.stair(140, 5).set(148, 12, 'o');
    b.set(152, 14, 'F');
  }),

  // 3 — Dark Caves: moving platforms, spikes, first spiny
  level({ name: 'DARK CAVES', theme: 2, w: 170, spawn: { x: 2, y: 13 } }, (b) => {
    b.ground(0, 170);
    b.rect(0, 0, 170, 1, '#');
    b.rect(24, 1, 8, 3, '#'); b.rect(70, 1, 10, 4, '#');
    b.rect(116, 1, 8, 3, '#'); b.rect(146, 1, 12, 2, '#');
    // spike pits (4 wide, jumpable)
    b.rect(38, 15, 4, 2, '^'); b.rect(38, 14, 4, 1, ' ');
    b.rect(96, 15, 4, 2, '^'); b.rect(96, 14, 4, 1, ' ');
    b.rect(138, 15, 4, 2, '^'); b.rect(138, 14, 4, 1, ' ');
    b.coins(39, 13, 2).coins(97, 13, 2).coins(139, 13, 2);
    b.plat(30, 10, 4).coins(30, 8, 3);
    b.plat(60, 9, 3); b.q(61, 5);
    b.plat(86, 10, 4).coins(86, 8, 4);
    b.plat(126, 10, 4).coins(127, 8, 2);
    b.set(20, 14, 'g').set(34, 14, 'k').set(50, 14, 'g');
    b.set(55, 14, 's').set(66, 14, 'g').set(74, 14, 'k');
    b.set(90, 14, 'g').set(106, 14, 'k').set(112, 14, 'g');
    b.set(122, 14, 's').set(132, 14, 'g').set(150, 14, 'k');
    b.set(156, 14, 'g');
    b.stair(160, 4);
    b.set(166, 14, 'F');
  }, {
    platforms: [
      { x: 44, y: 11, w: 3, axis: 'x', range: 4, speed: 0.020 },
      { x: 78, y: 10, w: 3, axis: 'y', range: 3, speed: 0.024 },
      { x: 118, y: 11, w: 3, axis: 'x', range: 5, speed: 0.026 },
    ],
  }),

  // 4 — Sky Heights: precision jumps over the void
  level({ name: 'SKY HEIGHTS', theme: 3, w: 180, spawn: { x: 2, y: 11 } }, (b) => {
    b.rect(0, 13, 7, 4, '#');
    b.coins(2, 11, 4);
    // stepping platforms: gaps of 4, two gaps of 5 bridged by movers
    const P = [
      [11, 4, 12], [19, 4, 11], [27, 4, 12], [35, 3, 11],
      [43, 4, 10], [51, 4, 11], [59, 3, 12], [67, 4, 11],
      [75, 4, 12], [83, 3, 11], [90, 4, 10], [98, 4, 11],
      [106, 3, 12], [113, 4, 11], [121, 4, 12], [129, 3, 10],
      [136, 4, 11], [144, 4, 12], [152, 3, 11], [159, 4, 10],
      [167, 4, 12],
    ];
    for (const [x, w, y] of P) b.plat(x, y, w);
    // coins and q-blocks on some platforms
    b.coins(12, 10, 2).coins(28, 10, 2).coins(44, 8, 2).coins(68, 9, 2)
     .coins(84, 9, 2).coins(99, 9, 2).coins(114, 9, 2).coins(137, 9, 2)
     .coins(145, 10, 2).coins(168, 10, 2);
    b.q(36, 7).q(91, 6).q(130, 6);
    // koopas parked on platforms
    b.set(20, 10, 'k').set(52, 10, 'k').set(84, 10, 'k')
     .set(107, 11, 'k').set(137, 10, 'k').set(160, 9, 'k');
    // flyers patrolling the gaps
    b.set(25, 6, 'f').set(48, 5, 'f').set(63, 7, 'f').set(87, 5, 'f')
     .set(118, 6, 'f').set(149, 7, 'f').set(164, 5, 'f');
    b.rect(172, 13, 8, 4, '#');
    b.coins(173, 11, 4);
    b.set(176, 12, 'F');
  }, {
    platforms: [
      { x: 15, y: 10, w: 3, axis: 'y', range: 2, speed: 0.022 },
      { x: 39, y: 10, w: 3, axis: 'x', range: 2, speed: 0.028 }, // 5-gap bridge
      { x: 47, y: 8, w: 3, axis: 'y', range: 2, speed: 0.024 },
      { x: 64, y: 9, w: 3, axis: 'x', range: 2, speed: 0.030 }, // 5-gap bridge
      { x: 94, y: 8, w: 3, axis: 'y', range: 3, speed: 0.024 },
      { x: 125, y: 9, w: 3, axis: 'x', range: 2, speed: 0.030 },
      { x: 163, y: 9, w: 3, axis: 'y', range: 2, speed: 0.026 },
    ],
  }),

  // 5 — Lava Fortress: the gauntlet
  level({ name: 'LAVA FORTRESS', theme: 4, w: 200, spawn: { x: 2, y: 13 } }, (b) => {
    b.ground(0, 30).ground(34, 24).ground(63, 37).ground(107, 43).ground(155, 45);
    b.rect(30, 15, 4, 2, 'L');
    b.rect(58, 15, 5, 2, 'L');
    b.rect(100, 15, 7, 2, 'L');
    b.rect(150, 15, 5, 2, 'L');
    b.arch(30, 12, 4).arch(58, 12, 5).arch(100, 12, 7).arch(150, 12, 5);
    b.rect(70, 14, 3, 1, '^'); b.rect(130, 14, 3, 1, '^');
    b.rect(16, 11, 1, 1, '?').rect(22, 11, 3, 1, 'B').q(23, 11);
    b.rect(44, 11, 4, 1, 'B').q(46, 11);
    b.rect(80, 11, 5, 1, 'B').q(82, 11).set(81, 11, 'o').set(83, 11, 'o');
    b.rect(118, 11, 4, 1, 'B').q(120, 11);
    b.plat(36, 11, 3).coins(36, 9, 2);
    b.plat(66, 10, 3); b.set(67, 9, 'k');
    b.plat(90, 11, 3).coins(90, 9, 2);
    b.plat(126, 10, 3);
    b.plat(140, 11, 3).coins(140, 9, 2);
    b.set(18, 14, 'g').set(26, 14, 'k').set(40, 14, 'g');
    b.set(50, 14, 's').set(54, 14, 'g').set(66, 14, 'k');
    b.set(74, 14, 'g').set(78, 14, 'g').set(88, 14, 'k');
    b.set(94, 14, 's').set(112, 14, 'g').set(116, 14, 'k');
    b.set(124, 14, 's').set(134, 14, 'g').set(144, 14, 'g');
    b.set(160, 14, 'k').set(166, 14, 'g').set(172, 14, 's');
    b.set(80, 4, 'f').set(128, 6, 'f').set(168, 5, 'f');
    b.stair(182, 5);
    b.set(192, 14, 'F');
  }, {
    platforms: [
      { x: 47, y: 12, w: 3, axis: 'x', range: 3, speed: 0.026 },
      { x: 102, y: 12, w: 3, axis: 'x', range: 4, speed: 0.030 },
      { x: 146, y: 10, w: 3, axis: 'y', range: 3, speed: 0.028 },
    ],
  }),
];

export function parseLevel(idx) {
  const def = LEVELS[idx];
  const { b } = def;
  const rows = b.g.map((r) => r.slice());
  const enemies = [];
  const flags = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < b.w; x++) {
      const ch = rows[y][x];
      if (ENEMY_CHARS[ch]) {
        enemies.push({ type: ENEMY_CHARS[ch], x, y });
        rows[y][x] = ' ';
      } else if (ch === 'F') {
        flags.push({ x, y });
      }
    }
  }
  return {
    name: def.name,
    theme: def.theme,
    w: b.w,
    h: ROWS,
    rows,
    enemies,
    flags,
    spawn: { x: def.spawn.x * T, y: def.spawn.y * T + (T - 14) },
    platforms: (def.platforms || []).map((p) => ({ ...p })),
  };
}

export const LEVEL_COUNT = LEVELS.length;
