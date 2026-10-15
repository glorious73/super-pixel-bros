// Menu screens: title, character select, clear, game over, victory.
import { palette, drawBackdrop } from './theme.js';
import { drawHero } from './sprites.js';
import { text } from './renderer.js';
import { CHARACTERS } from './entities.js';

function menuBg(ctx, g) {
  const pal = palette(0, g.nightMix);
  drawBackdrop(ctx, pal, g.nightMix, 0, g.t * 0.4, g.t);
}

function centerText(ctx, str, x, y, col, size) {
  ctx.textAlign = 'center';
  text(ctx, str, x, y, col, size);
}

export function drawTitle(ctx, g) {
  menuBg(ctx, g);
  const bob = Math.sin(g.t * 0.04) * 4;
  ctx.textAlign = 'center';
  text(ctx, 'SUPER', 240, 84 + bob, '#ffd83d', 26);
  text(ctx, 'PIXEL BROS', 240, 116 + bob, '#ff5a4e', 34);
  text(ctx, 'SUPER', 240, 83 + bob, '#fff0a0', 26);
  text(ctx, 'PIXEL BROS', 240, 115 + bob, '#ffb0a0', 34);

  if (Math.floor(g.t / 30) % 2) {
    centerText(ctx, 'PRESS  ENTER  TO  START', 240, 168, '#ffffff', 12);
  }
  centerText(ctx, 'ARROWS/WASD MOVE    SPACE JUMP', 240, 196, '#e8e8f8', 9);
  centerText(ctx, 'N DAY/NIGHT  M MUTE  R RETRY  F SCALE', 240, 210, '#e8e8f8', 9);
  centerText(ctx, `BEST ${String(g.best).padStart(6, '0')}`, 240, 236, '#ffd83d', 10);
  centerText(ctx, '3 HEROES   5 WORLDS   DAY OR NIGHT', 240, 252, '#c8c8e0', 9);
}

export function drawSelect(ctx, g) {
  menuBg(ctx, g);
  ctx.textAlign = 'center';
  text(ctx, 'CHOOSE YOUR HERO', 240, 34, '#ffffff', 16);

  for (let i = 0; i < 3; i++) {
    const ch = CHARACTERS[i];
    const sel = i === g.selIdx;
    const x = 60 + i * 130;
    const y = sel ? 58 : 66;
    const w = 110, h = sel ? 152 : 144;
    ctx.fillStyle = sel ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.4)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = sel ? '#ffd83d' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);

    ctx.save();
    ctx.translate(x + w / 2, y + 16);
    ctx.scale(3, 3);
    drawHero(ctx, ch, -6, 0, 1, false, true, sel ? g.t : 0);
    ctx.restore();

    text(ctx, ch.name, x + w / 2, y + 84, sel ? '#ffd83d' : '#ffffff', 11);
    ctx.textAlign = 'left';
    statBar(ctx, 'SPD', (ch.speed - 1.6) / 1.8, x + 10, y + 98, '#ff8a4e');
    statBar(ctx, 'JMP', (-ch.jump - 6.2) / 1.8, x + 10, y + 110, '#5ab0ff');
    for (let hIdx = 0; hIdx < 2; hIdx++) {
      ctx.fillStyle = hIdx < ch.hp ? '#ff5a6e' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 46 + hIdx * 10, y + 121, 7, 6);
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.fillStyle = '#c8c8e0';
    ctx.fillText(ch.blurb, x + w / 2, y + 140);
    ctx.textAlign = 'left';
  }
  ctx.textAlign = 'center';
  text(ctx, '←  →  SELECT          ENTER  GO!', 240, 240, '#ffffff', 10);
  text(ctx, 'N SWITCHES DAY / NIGHT', 240, 256, '#a8b8ff', 8);
}

function statBar(ctx, label, val, x, y, col) {
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.fillStyle = '#c8c8e0';
  ctx.fillText(label, x, y + 5);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + 24, y, 62, 6);
  ctx.fillStyle = col;
  ctx.fillRect(x + 24, y, Math.max(4, Math.min(62, val * 62)), 6);
}

function dim(ctx, a) {
  ctx.fillStyle = `rgba(0,0,8,${a})`;
  ctx.fillRect(0, 0, 480, 272);
}

export function drawClear(ctx, g) {
  dim(ctx, 0.45);
  ctx.textAlign = 'center';
  text(ctx, 'COURSE CLEAR!', 240, 100, '#5aff8a', 24);
  text(ctx, 'STAGE BONUS  +1000', 240, 132, '#ffd83d', 12);
  text(ctx, `SCORE  ${g.score}`, 240, 154, '#ffffff', 12);
  if (Math.floor(g.t / 24) % 2) {
    text(ctx, g.levelIdx + 1 < g.levelCount ? 'PRESS ENTER FOR NEXT STAGE' : 'PRESS ENTER', 240, 190, '#ffffff', 10);
  }
}

export function drawGameOver(ctx, g) {
  dim(ctx, 0.6);
  ctx.textAlign = 'center';
  text(ctx, 'GAME OVER', 240, 110, '#ff5a4e', 26);
  text(ctx, `SCORE  ${g.score}`, 240, 140, '#ffffff', 12);
  if (Math.floor(g.t / 24) % 2) {
    text(ctx, 'ENTER RETRY STAGE    ESC TITLE', 240, 180, '#ffffff', 10);
  }
}

export function drawVictory(ctx, g) {
  menuBg(ctx, g);
  const t = g.t;
  for (let i = 0; i < 30; i++) {
    const x = (i * 53 + t * 1.3) % 480;
    const y = (i * 97 + t * 0.7) % 272;
    ctx.fillStyle = ['#ffd83d', '#ff5a4e', '#5aff8a', '#5ab0ff'][i % 4];
    ctx.fillRect(x, y, 3, 3);
  }
  ctx.textAlign = 'center';
  text(ctx, 'THANK YOU!', 240, 84, '#ffd83d', 28);
  text(ctx, 'THE PIXEL KINGDOM IS SAVED', 240, 116, '#ffffff', 13);
  drawHero(ctx, g.char, 234, 132, 1, true, true, t);
  text(ctx, `FINAL SCORE  ${g.score}`, 240, 178, '#ffffff', 14);
  text(ctx, `BEST  ${String(g.best).padStart(6, '0')}`, 240, 196, '#ffd83d', 10);
  text(ctx, `COINS  ${g.coins}      MODE  ${g.night ? 'NIGHT' : 'DAY'}`, 240, 212, '#c8c8e0', 10);
  if (Math.floor(t / 24) % 2) {
    text(ctx, 'PRESS ENTER FOR TITLE', 240, 244, '#ffffff', 10);
  }
}

export function drawIntro(ctx, g) {
  const a = Math.min(1, g.introT / 30, (120 - g.introT) / 30);
  if (a <= 0) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,8,0.55)';
  ctx.fillRect(0, 100, 480, 52);
  ctx.textAlign = 'center';
  text(ctx, `WORLD ${g.levelIdx + 1}   ${g.level.name}`, 240, 124, '#ffffff', 15);
  text(ctx, g.night ? 'NIGHT — MORE FOES, COINS x2' : 'DAYTIME — STANDARD RISK', 240, 142, '#a8b8ff', 9);
  ctx.globalAlpha = 1;
}

export function drawPause(ctx, g) {
  dim(ctx, 0.5);
  ctx.textAlign = 'center';
  text(ctx, 'PAUSED', 240, 130, '#ffffff', 22);
  text(ctx, 'ESC RESUME   N DAY/NIGHT   M MUTE', 240, 158, '#c8c8e0', 9);
}
