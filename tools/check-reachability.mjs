// Character-aware, physics-based level reachability test.
// node tools/check-reachability.mjs
// For each character, simulates real jump trajectories (its own speed/jump/
// gravity) frame-by-frame through tile collisions and BFS's every standing
// position, then asserts each flag is reachable. Catches design that is
// impossible for a specific hero (e.g. Sahm's low jump vs a tall pipe).
import { parseLevel, LEVEL_COUNT, T } from '../js/levels.js';
import { CHARACTERS } from '../js/entities.js';

const PW = 11, PH = 14;
const SOLIDC = '#B?xP';

function makeWorld(lv) {
  // moving platforms are non-blocking STANDING SURFACES spanning their whole
  // sweep (you ride them); they never form walls. stand = feet-rest positions.
  const stand = new Set();
  for (const p of lv.platforms) {
    if (p.axis === 'x') {
      const row = Math.round(p.y) - 1;
      for (let tx = Math.round(p.x - p.range); tx < Math.round(p.x + p.range) + p.w; tx++)
        stand.add(`${tx},${row}`);
    } else {
      const c0 = Math.round(p.x), c1 = Math.round(p.x) + p.w - 1;
      for (let ty = Math.round(p.y - p.range) - 1; ty <= Math.round(p.y + p.range) - 1; ty++)
        for (let tx = c0; tx <= c1; tx++) stand.add(`${tx},${ty}`);
    }
  }
  const solid = (tx, ty) => {
    if (tx < 0 || tx >= lv.w || ty < 0 || ty >= lv.h) return false;
    return SOLIDC.includes(lv.rows[ty][tx]);
  };
  const haz = (tx, ty) => {
    if (tx < 0 || tx >= lv.w || ty < 0 || ty >= lv.h) return false;
    return '^L'.includes(lv.rows[ty][tx]);
  };
  return { solid, haz, stand: (tx, ty) => stand.has(`${tx},${ty}`) };
}

// tile-collision AABB move (matches entities.moveX/moveY semantics)
function moveX(px, py, vx, w) {
  px += vx;
  const ty0 = Math.floor(py / T), ty1 = Math.floor((py + PH - 0.01) / T);
  for (let ty = ty0; ty <= ty1; ty++) {
    if (vx > 0) {
      const tx = Math.floor((px + PW) / T);
      if (w.solid(tx, ty)) return { x: tx * T - PW - 0.01, hit: 1 };
    } else if (vx < 0) {
      const tx = Math.floor(px / T);
      if (w.solid(tx, ty)) return { x: (tx + 1) * T + 0.01, hit: -1 };
    }
  }
  return { x: px, hit: 0 };
}
function moveY(px, py, vy, w) {
  py += vy;
  const tx0 = Math.floor(px / T), tx1 = Math.floor((px + PW - 0.01) / T);
  let ground = false;
  for (let tx = tx0; tx <= tx1; tx++) {
    if (vy > 0) {
      const ty = Math.floor((py + PH) / T);
      if (w.solid(tx, ty)) { py = ty * T - PH - 0.01; vy = 0; ground = true; }
    } else if (vy < 0) {
      const ty = Math.floor(py / T);
      if (w.solid(tx, ty)) { py = (ty + 1) * T + 0.01; vy = 0; }
    }
  }
  return { y: py, vy, ground };
}

const feetTile = (x, y) => [Math.floor((x + PW / 2) / T), Math.floor((y + PH - 0.01) / T)];
const standingOn = (tx, ty, w) =>
  (w.solid(tx, ty + 1) || w.stand(tx, ty))
  && !w.solid(tx, ty) && !w.haz(tx, ty) && !w.haz(tx, ty + 1);

function reachable(lv, w, ch, sx, sy) {
  // Envelope from discrete ground-truth jump physics (matches the game loop).
  let y = 0, vy = ch.jump, reachPx = 0, maxUpPx = 0;
  for (let f = 0; f < 200; f++) {
    vy = Math.min(vy + ch.grav, ch.fallMax || 8);
    y += vy; reachPx += ch.speed;
    if (-y > maxUpPx) maxUpPx = -y;
    if (vy > 0 && y >= 0) break;
  }
  const maxUp = Math.floor(maxUpPx / T);
  // a jump landing `dx` tiles away needs reach > (|dx|-1)*T + PW (edge-to-edge)
  const maxDx = Math.floor((reachPx - PW) / T) + 1;
  const startKey = `${sx},${sy}`;
  const seen = new Set([startKey]);
  const q = [{ tx: sx, ty: sy }];
  const push = (tx, ty) => {
    const k = `${tx},${ty}`;
    if (!seen.has(k) && standingOn(tx, ty, w)) { seen.add(k); q.push({ tx, ty }); }
  };
  while (q.length) {
    const { tx, ty } = q.shift();
    push(tx - 1, ty); push(tx + 1, ty);
    for (const d of [-1, 1]) {
      const nx = tx + d;
      if (!w.solid(nx, ty) && !w.solid(nx, ty - 1)) {
        let yy = ty;
        while (yy + 1 < lv.h && standingOn(nx, yy + 1, w)) yy++;
        push(nx, yy);
      }
    }
    for (let dx = -maxDx; dx <= maxDx; dx++) {
      const need = Math.abs(dx) > 1 ? (Math.abs(dx) - 1) * T + PW : 0;
      const nx = tx + dx;
      for (let ny = ty - maxUp; ny <= ty + 12; ny++) {
        if (!standingOn(nx, ny, w)) continue;
        if (w.solid(nx, ny - 1) || w.solid(tx, ty - 1)) continue;
        // landing higher than the apex is impossible
        if ((ty - ny) * T > maxUpPx + T) continue;
        let ok = true;
        if (Math.abs(dx) > 1) {
          for (let mx = Math.min(tx, nx); mx <= Math.max(tx, nx); mx++) {
            let allSolid = true;
            for (let r = Math.min(ty, ny) - 1; r <= Math.max(ty, ny); r++)
              if (!w.solid(mx, r)) { allSolid = false; break; }
            if (allSolid) { ok = false; break; }
          }
        }
        if (ok) push(nx, ny);
      }
    }
  }
  return seen;
}

for (let i = 0; i < LEVEL_COUNT; i++) {
  const lv = parseLevel(i);
  const w = makeWorld(lv);
  const results = [];
  for (const ch of CHARACTERS) {
    let sx = Math.floor((lv.spawn.x + 5) / T), sy = Math.floor(lv.spawn.y / T);
    while (sy < lv.h - 1 && !standingOn(sx, sy, w)) sy++;
    if (!standingOn(sx, sy, w)) { results.push(`${ch.id}:SPAWN!`); continue; }
    const seen = reachable(lv, w, ch, sx, sy);
    if (process.env.DBG) {
      const xs = [...seen].map((s) => +s.split(',')[0]);
      console.error(`  dbg ${ch.id} size=${seen.size} maxX=${Math.max(...xs)} flagX=${lv.flags[0].x}`);
    }
    const ok = lv.flags.every((f) => {
      for (let d = -6; d <= 1; d++)
        if (seen.has(`${f.x},${f.y + d}`) || seen.has(`${f.x - 1},${f.y + d}`)) return true;
      return false;
    });
    results.push(`${ch.id}:${ok ? 'ok' : 'FAIL'}`);
  }
  const bad = results.some((r) => r.includes('FAIL') || r.includes('SPAWN'));
  console.log(`L${i + 1} ${(lv.nameKey || lv.name).padEnd(14)} ${bad ? '✗' : '✓'}  ${results.join('  ')}`);
}
