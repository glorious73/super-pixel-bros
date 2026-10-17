// Generates the PWA icons procedurally — no image editors, no dependencies
// (zlib is a Node built-in, PNG encoding below is ~40 lines). The design:
// our cap-wearing hero head on a night sky over pixel grass. Re-run this
// whenever the design changes:  node tools/gen-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- PNG bits
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data, parts) {
  const typeB = new Uint8Array([...type].map((s) => s.charCodeAt(0)));
  const crcIn = new Uint8Array(typeB.length + data.length);
  crcIn.set(typeB); crcIn.set(data, typeB.length);
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, data.length);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(crcIn));
  parts.push(len, typeB, data, crc);
}

function encodePng(S, rgba) {
  const raw = new Uint8Array(S * (S * 4 + 1));
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0; // filter: none
    raw.set(rgba.subarray(y * S * 4, (y + 1) * S * 4), y * (S * 4 + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, S); dv.setUint32(4, S);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const parts = [];
  chunk('IHDR', ihdr, parts);
  chunk('IDAT', deflateSync(raw), parts);
  chunk('IEND', new Uint8Array(0), parts);
  const total = 8 + parts.reduce((n, p) => n + p.length, 0);
  const png = new Uint8Array(total);
  png.set([137, 80, 78, 71, 13, 10, 26, 10]);
  let off = 8;
  for (const p of parts) { png.set(p, off); off += p.length; }
  return png;
}

// ---------------------------------------------------------------- artwork
const PAL = {
  R: [255, 90, 78], D: [184, 58, 52], S: [255, 217, 160],
  K: [34, 34, 58], W: [255, 255, 255], Y: [255, 216, 61],
};
const HEAD = [
  '..RRRRRRRRRR..',
  '.RRRRRRRRRRRR.',
  'RRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRR',
  'RRDDDDDDDDDDRR',
  '.SSSSSSSSSSSS.',
  '.SKKSSSSSSKKS.',
  '.SSSSSSSSSSSS.',
  '.SSSSSSSSSSSS.',
  '..WWWWWWWWWW..',
  '.YYWWWWWWWWYY.',
  '.YYWWWWWWWWYY.',
  '.WWWWWWWWWWWW.',
];
HEAD.forEach((r) => { if (r.length !== 14) throw new Error(`HEAD row "${r}" is not 14 wide`); });

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

function drawIcon(S, { heroScale = 0.68, round = true, coin = true } = {}) {
  const px = new Uint8Array(S * S * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  };
  const disc = (cx, cy, r, col) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) set(x, y, col);
      }
  };

  const top = hex('#0e1030'), bot = hex('#2a2f63');
  for (let y = 0; y < S; y++) {
    const k = y / S;
    const c = [0, 1, 2].map((i) => Math.round(top[i] + (bot[i] - top[i]) * k));
    for (let x = 0; x < S; x++) set(x, y, c);
  }

  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(rnd() * S), y = Math.floor(rnd() * S * 0.6);
    set(x, y, [207, 212, 255]); set(x + 1, y, [207, 212, 255]);
    set(x, y + 1, [207, 212, 255]); set(x + 1, y + 1, [207, 212, 255]);
  }

  const gy = Math.floor(S * 0.87);
  for (let y = gy; y < S; y++)
    for (let x = 0; x < S; x++) set(x, y, hex(y >= gy + Math.floor(S * 0.05) ? '#2c7d3c' : '#3aa14d'));

  if (coin) disc(S * 0.79, S * 0.27, S * 0.062, hex('#ffd83d'));

  const cell = Math.floor((S * heroScale) / 14);
  const hx = Math.floor((S - cell * 14) / 2);
  const hy = Math.floor(S * 0.87 - cell * HEAD.length);
  HEAD.forEach((row, ry) => row.split('').forEach((ch, rx) => {
    if (ch === '.') return;
    const c = PAL[ch];
    for (let dy = 0; dy < cell; dy++)
      for (let dx = 0; dx < cell; dx++) set(hx + rx * cell + dx, hy + ry * cell + dy, c);
  }));

  if (round) {
    const r = S * 0.14;
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const cx = Math.max(r - x, x - (S - 1 - r), 0);
        const cy = Math.max(r - y, y - (S - 1 - r), 0);
        if (Math.hypot(cx, cy) > r) px[(y * S + x) * 4 + 3] = 0;
      }
  }
  return px;
}

function shrink(rgba, S, s) {
  const out = new Uint8Array(s * s * 4);
  const f = S / s;
  const cl = (v) => Math.min(S - 1, Math.max(0, Math.floor(v)));
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let dy = 0; dy < f; dy++)
        for (let dx = 0; dx < f; dx++) {
          const i = (cl(y * f + dy) * S + cl(x * f + dx)) * 4;
          r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; a += rgba[i + 3]; n++;
        }
      const j = (y * s + x) * 4;
      out[j] = r / n; out[j + 1] = g / n; out[j + 2] = b / n; out[j + 3] = a / n;
    }
  return out;
}

const square512 = drawIcon(512, { round: false });
const writes = [
  ['icon-512.png', 512, drawIcon(512)],
  ['icon-maskable-512.png', 512, drawIcon(512, { heroScale: 0.5, round: false, coin: false })],
  ['icon-192.png', 192, shrink(square512, 512, 192)],
  ['apple-touch-icon.png', 180, shrink(square512, 512, 180)],
  ['favicon.png', 32, shrink(square512, 512, 32)],
];
for (const [name, S, px] of writes) {
  writeFileSync(join(outDir, name), encodePng(S, px));
  console.log('wrote icons/' + name);
}
