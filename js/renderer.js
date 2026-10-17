// Draws the game world: tiles, platforms, entities, player, HUD.
import { T } from './levels.js';
import { view } from './view.js';
import { t, isArabic } from './i18n.js';
import { palette, drawBackdrop } from './theme.js';
import {
  drawHero, drawGoomba, drawKoopa, drawShell, drawFlyer, drawSpiny,
  drawCoin, drawFlag, drawPlatform,
} from './sprites.js';

export function drawWorld(ctx, g) {
  const pal = palette(g.level.theme, g.nightMix);
  drawBackdrop(ctx, pal, g.nightMix, g.level.theme, g.cam.x, g.t);

  ctx.save();
  ctx.translate(-Math.round(g.cam.x), -Math.round(g.cam.y + (g.shake > 0 ? (Math.random() - 0.5) * g.shake : 0)));

  drawTiles(ctx, g, pal);

  for (const p of g.platforms) drawPlatform(ctx, p, pal.plat, g.nightMix);
  for (const e of g.entities) drawEnemy(ctx, e, g.t);

  const pl = g.player;
  if (pl && !(pl.invuln > 0 && Math.floor(g.t / 4) % 2)) {
    ctx.save();
    if (pl.dying) {
      ctx.translate(pl.x + pl.w / 2, pl.y + pl.h / 2);
      ctx.rotate((80 - pl.dieT) * 0.22);
      ctx.translate(-(pl.x + pl.w / 2), -(pl.y + pl.h / 2));
    }
    drawHero(ctx, pl.ch, pl.x - 1, pl.y - 2, pl.facing,
      Math.abs(pl.vx) > 0.3 && pl.onGround, pl.onGround, g.t);
    ctx.restore();
  }

  for (const pt of g.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.col;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  // coins popping out of bumped ? blocks
  if (g.popCoins) {
    for (const c of g.popCoins) {
      ctx.globalAlpha = Math.min(1, c.t / 8);
      drawCoin(ctx, c.x, c.y, g.t);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // night tint ties everything together (caves already dark)
  if (g.level.theme !== 2 && g.nightMix > 0.02) {
    ctx.fillStyle = `rgba(8,14,46,${0.22 * g.nightMix})`;
    ctx.fillRect(0, 0, view.w, 272);
  }
}

function drawTiles(ctx, g, pal) {
  const x0 = Math.max(0, Math.floor(g.cam.x / T));
  const x1 = Math.min(g.w - 1, x0 + Math.ceil(view.w / T));
  for (let ty = 0; ty < g.h; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = g.rows[ty][tx];
      if (ch === ' ') continue;
      drawTile(ctx, ch, tx, ty, g, pal);
    }
  }
}

function drawTile(ctx, ch, tx, ty, g, pal) {
  let x = tx * T, y = ty * T;
  // ?-block bump: nudge up and snap back over 10 frames
  if (g.bumps) {
    for (const b of g.bumps) {
      if (b.tx === tx && b.ty === ty) {
        y -= Math.round(Math.sin(((10 - b.t) / 10) * Math.PI) * 4);
        break;
      }
    }
  }
  switch (ch) {
    case '#': {
      ctx.fillStyle = pal.ground;
      ctx.fillRect(x, y, T, T);
      const above = g.rows[ty - 1] ? g.rows[ty - 1][tx] : ' ';
      if (above !== '#') {
        ctx.fillStyle = pal.groundTop;
        ctx.fillRect(x, y, T, 4);
        ctx.fillRect(x, y + 4, 2, 2);
        ctx.fillRect(x + T - 3, y + 4, 3, 2);
      }
      if ((tx * 7 + ty * 13) % 5 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 4, y + 8, 3, 3);
      }
      if ((tx * 11 + ty * 3) % 7 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x + 9, y + 6, 4, 2);
      }
      break;
    }
    case 'B': {
      ctx.fillStyle = pal.brick;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y + 7, T, 1);
      ctx.fillRect(x + 7, y, 1, 7);
      ctx.fillRect(x + 3, y + 8, 1, 8);
      ctx.fillRect(x + 12, y + 8, 1, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x, y, T, 1);
      break;
    }
    case '?': {
      const pulse = 0.75 + 0.25 * Math.sin(g.t * 0.1 + tx);
      ctx.fillStyle = pal.block;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x, y + T - 2, T, 2);
      ctx.fillRect(x + T - 2, y, 2, T);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x + 1, y + 1, T - 2, 2);
      ctx.fillStyle = `rgba(255,255,255,${pulse})`;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + 8, y + 12);
      break;
    }
    case 'x': {
      ctx.fillStyle = pal.ground;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      break;
    }
    case 'P': {
      const capAbove = ty === 0 || (g.rows[ty - 1] ? g.rows[ty - 1][tx] !== 'P' : true);
      ctx.fillStyle = pal.pipe;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 2, y, 3, T);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + T - 3, y, 3, T);
      if (capAbove) {
        const left = tx === 0 || (g.rows[ty][tx - 1] !== 'P');
        ctx.fillStyle = pal.pipe;
        if (left) ctx.fillRect(x - 2, y, T + 2, 6);
        else ctx.fillRect(x, y, T + 2, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        if (left) ctx.fillRect(x - 2, y, T + 2, 2);
        else ctx.fillRect(x, y, T + 2, 2);
      }
      break;
    }
    case 'o':
      drawCoin(ctx, x, y, g.t);
      break;
    case '^': {
      ctx.fillStyle = pal.spike;
      for (let i = 0; i < 3; i++) {
        const sx = x + i * 6;
        ctx.beginPath();
        ctx.moveTo(sx, y + T);
        ctx.lineTo(sx + 3, y + 3);
        ctx.lineTo(sx + 6, y + T);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let i = 0; i < 3; i++) {
        const sx = x + i * 6;
        ctx.beginPath();
        ctx.moveTo(sx + 3, y + 3);
        ctx.lineTo(sx + 6, y + T);
        ctx.lineTo(sx + 3, y + T);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'L': {
      const top = ty === 0 || g.rows[ty - 1][tx] !== 'L';
      ctx.fillStyle = '#d84018';
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#f87030';
      ctx.fillRect(x, y, T, T);
      if (top) {
        const wob = Math.sin(g.t * 0.07 + tx * 0.8) * 2;
        ctx.fillStyle = '#ffb040';
        ctx.fillRect(x, y + 2 + wob, T, 3);
        ctx.fillStyle = '#ffe08a';
        ctx.fillRect(x, y + wob, T, 2);
      }
      break;
    }
    case 'F':
      drawFlag(ctx, x, y + T, g.t, pal.pole);
      break;
  }
}

function drawEnemy(ctx, e, t) {
  switch (e.type) {
    case 'goomba': drawGoomba(ctx, e.x - 1, e.y - 1, t, e.dying); break;
    case 'koopa': drawKoopa(ctx, e.x, e.y, e.dir, t); break;
    case 'shell': drawShell(ctx, e.x, e.y, Math.abs(e.vx) > 0.5, t); break;
    case 'flyer': drawFlyer(ctx, e.x - 1, e.y, t); break;
    case 'spiny': drawSpiny(ctx, e.x - 1, e.y, t); break;
  }
}

// ---------------------------------------------------------------- HUD
export function drawHUD(ctx, g) {
  const W = view.w;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, W, 18);
  ctx.textAlign = 'left';
  text(ctx, t('hud.score', { n: String(g.score).padStart(6, '0') }), 8, 13, '#ffffff', 9);
  ctx.fillStyle = '#f8c81c';
  ctx.fillRect(118, 6, 6, 6);
  ctx.fillStyle = '#ffe87a';
  ctx.fillRect(119, 7, 2, 2);
  text(ctx, `x${g.coins}`, 128, 13, '#ffffff', 9);
  ctx.textAlign = 'center';
  text(ctx, t('level', { n: g.levelIdx + 1, name: t(g.level.nameKey) }), W / 2, 13, '#ffffff', 9);
  ctx.textAlign = 'right';
  for (let i = 0; i < g.lives; i++) heart(ctx, W - 160 + i * 12, 5, g.player.ch.color);
  text(ctx, g.night ? t('hud.night') : t('hud.day'), W - 10, 10, g.night ? '#a8b8ff' : '#ffe14d', 9);
  text(ctx, g.muted ? t('hud.sound_off') : t('hud.sound_on'), W - 10, 17, '#c8c8d8', 9);
}

function heart(ctx, x, y, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x + 1, y, 3, 2);
  ctx.fillRect(x + 6, y, 3, 2);
  ctx.fillRect(x, y + 2, 10, 3);
  ctx.fillRect(x + 1, y + 5, 8, 2);
  ctx.fillRect(x + 3, y + 7, 4, 2);
  ctx.fillRect(x + 5, y + 9, 1, 1);
}

export function text(ctx, str, x, y, col, size = 10) {
  ctx.font = `bold ${size}px "Courier New", "DejaVu Sans Mono", "Amiri", monospace`;
  ctx.direction = isArabic() ? 'rtl' : 'ltr';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = col;
  ctx.fillText(str, x, y);
}
