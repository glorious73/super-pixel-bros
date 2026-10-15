// Procedural pixel-art drawing (all rects, no external assets).

const SKIN = '#f6c99f';
const DARK = '#1c1c28';

// hero drawn in a 12x16 box, (x,y) = top-left
export function drawHero(ctx, ch, x, y, facing, moving, onGround, t) {
  const frame = moving ? Math.floor(t / 5) % 4 : 0;
  ctx.save();
  ctx.translate(Math.round(x) + 6, Math.round(y));
  if (facing < 0) ctx.scale(-1, 1);
  ctx.translate(-6, 0);

  const c = ch.color;
  // feet
  ctx.fillStyle = '#5a3a1e';
  if (!onGround) {
    ctx.fillRect(1, 13, 4, 3); ctx.fillRect(7, 12, 4, 3);
  } else if (moving) {
    const f = [[0, 0, 2, 0], [2, 0, 0, 0], [0, 0, 0, 2], [0, 2, 0, 0]][frame];
    ctx.fillRect(1 + f[0], 13, 4, 3); ctx.fillRect(7 + f[2], 13 - f[3] * 2, 4, 3);
  } else {
    ctx.fillRect(1, 13, 4, 3); ctx.fillRect(7, 13, 4, 3);
  }
  // body
  ctx.fillStyle = c;
  ctx.fillRect(2, 6, 8, 7);
  ctx.fillStyle = ch.accent;
  ctx.fillRect(4, 7, 4, 2);
  ctx.fillRect(2, 9, 8, 1);
  // arms
  ctx.fillStyle = c;
  ctx.fillRect(0, 7, 2, 3);
  ctx.fillRect(10, 7, 2, 3);
  // head
  ctx.fillStyle = SKIN;
  ctx.fillRect(3, 2, 6, 4);
  // headwear
  const style = ch.style || 'cap';
  if (style === 'keffiyeh') {
    ctx.fillStyle = c;                     // sand-colored cloth
    ctx.fillRect(2, 0, 8, 2);
    ctx.fillRect(1, 2, 2, 5);              // side drapes
    ctx.fillRect(9, 2, 2, 5);
    ctx.fillStyle = DARK;                  // agal cord
    ctx.fillRect(2, 0, 8, 1);
    ctx.fillStyle = ch.accent;             // red pattern
    ctx.fillRect(2, 1, 8, 1);
    ctx.fillRect(1, 4, 2, 1);
    ctx.fillRect(9, 3, 2, 1);
  } else if (style === 'fletch') {
    ctx.fillStyle = c;                     // cap with arrow fletching
    ctx.fillRect(2, 0, 8, 2);
    ctx.fillRect(7, 2, 5, 1);
    ctx.fillStyle = ch.accent;
    ctx.fillRect(0, 0, 3, 1);
    ctx.fillRect(0, -1, 2, 1);
  } else {
    ctx.fillStyle = c;
    ctx.fillRect(2, 0, 8, 2);
    ctx.fillRect(7, 2, 5, 1);
  }
  // eye
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(6, 3, 3, 2);
  ctx.fillStyle = DARK;
  ctx.fillRect(8, 3, 1, 2);
  // moustache
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(5, 5, 4, 1);
  ctx.restore();
}

// 16x14 box
export function drawGoomba(ctx, x, y, t, dead) {
  x = Math.round(x); y = Math.round(y);
  if (dead) {
    ctx.fillStyle = '#8a5a2a';
    ctx.fillRect(x + 1, y + 10, 14, 4);
    ctx.fillStyle = '#f2d8b0';
    ctx.fillRect(x + 3, y + 12, 10, 2);
    return;
  }
  const step = Math.floor(t / 8) % 2 ? 1 : -1;
  ctx.fillStyle = '#f2d8b0';
  ctx.fillRect(x + 2 + step, y + 11, 4, 3);
  ctx.fillRect(x + 10 - step, y + 11, 4, 3);
  ctx.fillStyle = '#96591f';
  ctx.fillRect(x + 2, y + 2, 12, 8);
  ctx.fillRect(x + 1, y + 4, 14, 5);
  ctx.fillStyle = '#6e3f14';
  ctx.fillRect(x + 2, y + 1, 12, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 3, y + 5, 3, 3);
  ctx.fillRect(x + 10, y + 5, 3, 3);
  ctx.fillStyle = DARK;
  ctx.fillRect(x + 5, y + 4, 2, 2);
  ctx.fillRect(x + 9, y + 4, 2, 2);
  ctx.fillRect(x + 4, y + 6, 1, 1);
  ctx.fillRect(x + 11, y + 6, 1, 1);
}

// 13x17 box, standing koopa
export function drawKoopa(ctx, x, y, dir, t) {
  x = Math.round(x); y = Math.round(y);
  const step = Math.floor(t / 10) % 2;
  ctx.fillStyle = '#e8b23a';
  ctx.fillRect(x + 1 + step, y + 14, 4, 3);
  ctx.fillRect(x + 8 - step, y + 14, 4, 3);
  // shell
  ctx.fillStyle = '#1e9a3e';
  ctx.fillRect(x + 1, y + 4, 11, 9);
  ctx.fillRect(x, y + 6, 13, 5);
  ctx.fillStyle = '#57d06f';
  ctx.fillRect(x + 2, y + 5, 9, 3);
  ctx.fillStyle = '#0e6e2c';
  ctx.fillRect(x + 1, y + 12, 11, 2);
  // head
  const hx = dir < 0 ? x - 3 : x + 8;
  ctx.fillStyle = '#e8b23a';
  ctx.fillRect(hx, y, 5, 6);
  ctx.fillStyle = DARK;
  ctx.fillRect(dir < 0 ? hx : hx + 3, y + 2, 1, 2);
}

// 13x12 shell
export function drawShell(ctx, x, y, moving, t) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#1e9a3e';
  ctx.fillRect(x + 1, y + 1, 11, 9);
  ctx.fillRect(x, y + 4, 13, 5);
  ctx.fillStyle = '#57d06f';
  ctx.fillRect(x + 2, y + 2, 9, 3);
  ctx.fillStyle = '#e8d8a0';
  ctx.fillRect(x + 1, y + 9, 11, 2);
  if (moving) {
    ctx.fillStyle = '#c8f0c8';
    const f = Math.floor(t / 3) % 2;
    ctx.fillRect(x + 2 + f, y + 5, 2, 1);
    ctx.fillRect(x + 7 - f, y + 7, 2, 1);
  }
}

// 13x12 box
export function drawFlyer(ctx, x, y, t) {
  x = Math.round(x); y = Math.round(y);
  const flap = Math.floor(t / 6) % 2 ? -2 : 1;
  ctx.fillStyle = '#e8e8f8';
  ctx.fillRect(x - 3, y + 3 + flap, 4, 3);
  ctx.fillRect(x + 12, y + 3 - flap, 4, 3);
  ctx.fillStyle = '#8a4ad0';
  ctx.fillRect(x + 1, y + 2, 11, 8);
  ctx.fillRect(x + 3, y + 1, 7, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 3, y + 4, 3, 3);
  ctx.fillRect(x + 8, y + 4, 3, 3);
  ctx.fillStyle = DARK;
  ctx.fillRect(x + 4, y + 5, 2, 2);
  ctx.fillRect(x + 8, y + 5, 2, 2);
}

// 14x13 box
export function drawSpiny(ctx, x, y, t) {
  x = Math.round(x); y = Math.round(y);
  const step = Math.floor(t / 9) % 2 ? 1 : -1;
  ctx.fillStyle = '#f2c027';
  ctx.fillRect(x + 2 + step, y + 10, 3, 3);
  ctx.fillRect(x + 9 - step, y + 10, 3, 3);
  ctx.fillStyle = '#d03030';
  ctx.fillRect(x + 1, y + 4, 12, 7);
  ctx.fillRect(x + 3, y + 2, 8, 9);
  ctx.fillStyle = '#f0e8dc';
  for (let i = 0; i < 3; i++) {
    const sx = x + 3 + i * 3;
    ctx.fillRect(sx + 1, y - 1, 1, 3);
    ctx.fillRect(sx, y + 1, 3, 1);
  }
  ctx.fillStyle = DARK;
  ctx.fillRect(x + 4, y + 6, 2, 2);
  ctx.fillRect(x + 9, y + 6, 2, 2);
}

// 16x16 coin
export function drawCoin(ctx, x, y, t) {
  const bob = Math.sin(t * 0.08 + x * 0.3) * 1.5;
  const wob = Math.abs(Math.sin(t * 0.06 + x * 0.7));
  const w = Math.max(1, Math.round(wob * 8));
  x = Math.round(x) + (8 - w) / 2; y = Math.round(y + bob);
  ctx.fillStyle = '#f8c81c';
  ctx.fillRect(x + 1, y + 3, w, 10);
  ctx.fillRect(x, y + 5, w + 2, 6);
  ctx.fillStyle = '#ffe87a';
  ctx.fillRect(x + 1, y + 5, Math.max(1, w - 2), 3);
}

// 16x16 flag tile (base) — pole drawn upward
export function drawFlag(ctx, x, y, t, poleCol = '#c8c8d4') {
  const px = x + 7;
  ctx.fillStyle = poleCol;
  ctx.fillRect(px, y - 80, 2, 82);
  ctx.fillStyle = '#f8d832';
  ctx.beginPath(); ctx.arc(px + 1, y - 80, 4, 0, 7); ctx.fill();
  const wave = Math.sin(t * 0.1) * 2;
  ctx.fillStyle = '#2ec84e';
  ctx.beginPath();
  ctx.moveTo(px + 2, y - 78);
  ctx.lineTo(px + 26 + wave, y - 70);
  ctx.lineTo(px + 2, y - 60);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px - 3, y - 4, 8, 4);
}

export function drawPlatform(ctx, p, color, nightMix) {
  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y, p.w, 10);
  ctx.fillStyle = lerpLite(color);
  ctx.fillRect(p.x, p.y, p.w, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(p.x, p.y + 8, p.w, 2);
  ctx.fillStyle = '#3a3a4a';
  for (let i = 4; i < p.w; i += 12) {
    ctx.fillRect(p.x + i, p.y + 4, 2, 2);
  }
}

function lerpLite(c) {
  return c === '#ffffff' ? '#dfe6ff' : '#ffffff55';
}
