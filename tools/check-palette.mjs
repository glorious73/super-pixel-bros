// Palette contrast linter — run with: node tools/check-palette.mjs
// Enforces the readability rules from AGENTS.md:
//  R1 day ground not too dark   (L >= 14%)
//  R2 night readability floor   (ground L >= 5%, sky2 L >= 2.5%)
//  R3 night surfaces visible    (groundTop/brick/plat L >= 4%)
//  R4 floor readable against the horizon (day: |L(ground)-L(sky2)| >= 6)
//  R5 no near-white scenery in day themes (hills/decor/plat L <= 72%)
//     — clouds are pure white; scenery must never match them
//  R6 day/night palettes define identical keys
import { THEMES } from '../js/theme.js';

const REQUIRED = ['sky1', 'sky2', 'sun', 'moon', 'hill1', 'hill2', 'ground',
  'groundTop', 'brick', 'block', 'pipe', 'plat', 'deco', 'spike', 'pole'];

const lum = (h) => {
  const n = parseInt(h.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) * 100;
};

let fails = 0;
const fail = (msg) => { fails++; console.log(`  FAIL ${msg}`); };

for (let i = 0; i < THEMES.length; i++) {
  const t = THEMES[i];
  console.log(`Theme ${i} (${t.day.ground} / ${t.night.ground})`);
  const dayKeys = Object.keys(t.day).sort().join(',');
  const nightKeys = Object.keys(t.night).sort().join(',');
  if (dayKeys !== nightKeys) fail('R6 day and night palettes have different keys');
  for (const k of REQUIRED) {
    if (!t.day[k]) fail(`R6 day palette missing "${k}"`);
    if (!t.night[k]) fail(`R6 night palette missing "${k}"`);
  }

  for (const mode of ['day', 'night']) {
    const p = t[mode];
    const g = lum(p.ground);
    const sky2 = lum(p.sky2);
    console.log(`  ${mode.padEnd(5)} ground ${g.toFixed(1).padStart(5)}%  sky2 ${sky2.toFixed(1).padStart(5)}%`);
    if (mode === 'day') {
      if (g < 14) fail(`R1 day ground too dark (${g.toFixed(1)}% < 14%)`);
      if (Math.abs(g - sky2) < 6) fail(`R4 day ground blends into horizon (${Math.abs(g - sky2).toFixed(1)} < 6)`);
      for (const k of ['hill1', 'hill2', 'deco', 'plat']) {
        const L = lum(p[k]);
        if (L > 72) fail(`R5 day ${k} too close to cloud white (${L.toFixed(1)}% > 72%)`);
      }
    } else {
      if (g < 5) fail(`R2 night ground too dark (${g.toFixed(1)}% < 5%)`);
      if (sky2 < 2.5) fail(`R2 night horizon too dark (${sky2.toFixed(1)}% < 2.5%)`);
      for (const k of ['groundTop', 'brick', 'plat']) {
        const L = lum(p[k]);
        if (L < 4) fail(`R3 night ${k} invisible (${L.toFixed(1)}% < 4%)`);
      }
    }
  }
}

console.log(fails ? `\n${fails} palette problem(s) found` : '\nAll palettes pass');
process.exit(fails ? 1 : 0);
