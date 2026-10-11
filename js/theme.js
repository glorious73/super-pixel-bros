// Color themes per level with day + night palettes.

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(rgb) {
  return '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}
export function lerpColor(a, b, t) {
  const A = hex(a), B = hex(b);
  return toHex([0, 1, 2].map((i) => A[i] + (B[i] - A[i]) * t));
}

// keys: sky1 sky2 sun moon hill1 hill2 ground groundTop brick block pipe plat deco
export const THEMES = [
  { // 0 Sunny Plains
    day: { sky1: '#79c7ff', sky2: '#d9f2ff', sun: '#ffe14d', moon: '#e8ecff',
      hill1: '#4fbf5e', hill2: '#37995a', ground: '#a56a34', groundTop: '#5ec93f',
      brick: '#c8702a', block: '#f8b400', pipe: '#2fa52f', plat: '#b9b9c9', deco: '#3fae54' },
    night: { sky1: '#0b1030', sky2: '#2a3763', sun: '#ffe14d', moon: '#f2f2d8',
      hill1: '#1d4a3e', hill2: '#163a34', ground: '#4c3a56', groundTop: '#2f6653',
      brick: '#5c4468', block: '#b98d2e', pipe: '#1d6b45', plat: '#5a5a75', deco: '#1e4e46' },
  },
  { // 1 Rolling Hills
    day: { sky1: '#63c3e8', sky2: '#d6f6f8', sun: '#ffd93d', moon: '#e8ecff',
      hill1: '#5ad168', hill2: '#2f9e55', ground: '#9a6a34', groundTop: '#6fd44f',
      brick: '#c07830', block: '#f8b400', pipe: '#27a04a', plat: '#c2c2d2', deco: '#48b862' },
    night: { sky1: '#0a1430', sky2: '#28406a', sun: '#ffd93d', moon: '#f2f2d8',
      hill1: '#1e5448', hill2: '#143e38', ground: '#4a4058', groundTop: '#336b52',
      brick: '#56486c', block: '#b08a30', pipe: '#1d6650', plat: '#585c78', deco: '#20524a' },
  },
  { // 2 Dark Caves
    day: { sky1: '#1b1430', sky2: '#3a2c52', sun: '#ffe97a', moon: '#dfe2ff',
      hill1: '#2c2144', hill2: '#241a38', ground: '#6b5878', groundTop: '#8a7696',
      brick: '#7a5f8c', block: '#e8a83a', pipe: '#3e9464', plat: '#9a8fae', deco: '#3a2c5a' },
    night: { sky1: '#08060f', sky2: '#181228', sun: '#ffe97a', moon: '#cfd4f0',
      hill1: '#141020', hill2: '#100c1a', ground: '#3e3350', groundTop: '#574a68',
      brick: '#4a3a5c', block: '#b07f2e', pipe: '#26604a', plat: '#5e5572', deco: '#221a36' },
  },
  { // 3 Sky Heights
    day: { sky1: '#4fb8ff', sky2: '#eafaff', sun: '#ffe14d', moon: '#f4f6ff',
      hill1: '#bfe9ff', hill2: '#a2d9f7', ground: '#e8eef8', groundTop: '#ffffff',
      brick: '#cdd8ea', block: '#ffc832', pipe: '#58c0e8', plat: '#ffffff', deco: '#ffffff' },
    night: { sky1: '#060a26', sky2: '#1c2a56', sun: '#ffe14d', moon: '#f2f2d8',
      hill1: '#1a2448', hill2: '#141c3a', ground: '#3c4468', groundTop: '#556090',
      brick: '#4a5278', block: '#c09a38', pipe: '#2a5a80', plat: '#6a7298', deco: '#2a3358' },
  },
  { // 4 Lava Fortress
    day: { sky1: '#571c14', sky2: '#c05a28', sun: '#ffb830', moon: '#e8c8b0',
      hill1: '#3a2024', hill2: '#2c181c', ground: '#5c4c50', groundTop: '#8c4634',
      brick: '#6e565e', block: '#e8922a', pipe: '#7a4a4a', plat: '#9aa0b0', deco: '#46292c' },
    night: { sky1: '#150608', sky2: '#4a1a14', sun: '#ffb830', moon: '#e0d0c8',
      hill1: '#1c0e12', hill2: '#150a0e', ground: '#382c34', groundTop: '#5e3038',
      brick: '#46363e', block: '#b06e24', pipe: '#4e3238', plat: '#5e5e70', deco: '#2a1a1e' },
  },
];

export function palette(themeIdx, mix) {
  const t = THEMES[themeIdx] || THEMES[0];
  const out = {};
  for (const k in t.day) out[k] = lerpColor(t.day[k], t.night[k], mix);
  return out;
}

// seeded rng for deterministic decor
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawBackdrop(ctx, pal, mix, themeIdx, camX, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 272);
  g.addColorStop(0, pal.sky1);
  g.addColorStop(1, pal.sky2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 480, 272);

  // stars at night
  if (mix > 0.02) {
    const rnd = mulberry32(77);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (rnd() * 480 - camX * 0.05) % 480;
      const y = rnd() * 140;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.02 + i));
      ctx.globalAlpha = mix * tw * 0.9;
      ctx.fillRect((x + 480) % 480, y, 1 + (i % 3 === 0 ? 1 : 0), 1);
    }
    ctx.globalAlpha = 1;
  }

  // sun (fades out) / moon (fades in)
  const sunX = 400, moonX = 400, cy = 48;
  if (mix < 0.98) {
    ctx.globalAlpha = 1 - mix;
    ctx.fillStyle = pal.sun;
    ctx.beginPath(); ctx.arc(sunX, cy, 16, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (mix > 0.02) {
    ctx.globalAlpha = mix;
    ctx.fillStyle = pal.moon;
    ctx.beginPath(); ctx.arc(moonX, cy, 12, 0, 7); ctx.fill();
    ctx.fillStyle = pal.sky1;
    ctx.beginPath(); ctx.arc(moonX - 6, cy - 4, 10, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // day clouds
  if (mix < 0.9) {
    ctx.globalAlpha = (1 - mix) * 0.85;
    const rnd = mulberry32(1234 + themeIdx);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 7; i++) {
      const cx = ((rnd() * 700 - camX * 0.25 + t * 0.06) % 700) - 110;
      const cyy = 24 + rnd() * 80;
      cloud(ctx, cx, cyy);
    }
    ctx.globalAlpha = 1;
  }

  // parallax hills / rocks silhouettes
  const far = themeIdx === 2 || themeIdx === 4 ? 0.15 : 0.2;
  hillLayer(ctx, pal.deco, camX * far + 60, 190, 70, 150);
  if (themeIdx !== 3) hillLayer(ctx, pal.hill2, camX * 0.35 + 250, 214, 52, 110);
  hillLayer(ctx, pal.hill1, camX * 0.5, 236, 40, 90);
}

function cloud(ctx, x, y) {
  ctx.fillRect(x, y, 44, 10);
  ctx.fillRect(x + 8, y - 6, 24, 8);
  ctx.fillRect(x + 16, y - 11, 14, 7);
}

function hillLayer(ctx, color, off, base, amp, period) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 272);
  for (let x = 0; x <= 480; x += 8) {
    const h = base - (Math.sin((x + off) / period * Math.PI * 2) * 0.5 + 0.5) * amp
      - (Math.sin((x + off) / (period * 0.37) * Math.PI * 2) * 0.25) * amp;
    ctx.lineTo(x, h);
  }
  ctx.lineTo(480, 272);
  ctx.closePath();
  ctx.fill();
}
