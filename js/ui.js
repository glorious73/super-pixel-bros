// Menu screens: title, character select (carousel), clear, game over, victory.
import { palette, drawBackdrop } from './theme.js';
import { drawHero, drawTrophy } from './sprites.js';
import { text } from './renderer.js';
import { CHARACTERS } from './entities.js';
import { NAME_KEYS } from './levels.js';
import { t, isArabic, otherLang } from './i18n.js';

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
  text(ctx, t('app.title').split(' ').slice(1).join(' '), 240, 116 + bob, '#ff5a4e', 34);
  text(ctx, 'SUPER', 240, 83 + bob, '#fff0a0', 26);
  text(ctx, t('app.title').split(' ').slice(1).join(' '), 240, 115 + bob, '#ffb0a0', 34);

  if (Math.floor(g.t / 30) % 2) {
    centerText(ctx, t('press_enter'), 240, 168, '#ffffff', 12);
  }
  centerText(ctx, t('controls.move'), 240, 196, '#e8e8f8', 9);
  centerText(ctx, t('controls.actions'), 240, 210, '#e8e8f8', 9);
  centerText(ctx, t('best', { n: String(g.best).padStart(6, '0') }), 240, 236, '#ffd83d', 10);
  centerText(ctx, t('cast_line'), 240, 252, '#c8c8e0', 9);
}

// ---------------------------------------------------------------- select
// Carousel: center card + neighbors peeking from both sides.
export function drawSelect(ctx, g) {
  menuBg(ctx, g);
  centerText(ctx, t('choose_hero'), 240, 32, '#ffffff', 16);

  const n = CHARACTERS.length;
  // draw neighbors (behind), then the selected card on top
  const order = [];
  for (let d = 1; d <= 2; d++) {
    order.push((g.selIdx - d + n) % n);
    order.push((g.selIdx + d) % n);
  }
  order.push(g.selIdx);

  for (const i of order) {
    let d = i - g.selIdx;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    if (Math.abs(d) > 2) continue;
    const ch = CHARACTERS[i];
    if (d !== 0) drawSideCard(ctx, ch, d);
    else drawMainCard(ctx, ch, g.t);
  }

  // nav arrows
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  tri(ctx, 14, 132, -1);
  tri(ctx, 466, 132, 1);

  centerText(ctx, t('select_hint'), 240, 240, '#ffffff', 10);
  centerText(ctx, `L  ${otherLang() === 'ar' ? 'عربي' : 'ENGLISH'}`, 240, 256, '#a8b8ff', 9);
}

function tri(ctx, x, y, dir) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dir * 10, y - 7);
  ctx.lineTo(x + dir * 10, y + 7);
  ctx.closePath();
  ctx.fill();
}

function drawSideCard(ctx, ch, d) {
  const cx = 240 + d * 148;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(cx - 45, 72, 90, 122);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeRect(cx - 45.5, 71.5, 91, 123);
  ctx.save();
  ctx.translate(cx, 96);
  ctx.scale(2, 2);
  drawHero(ctx, ch, -6, 0, d > 0 ? 1 : -1, false, true, 0);
  ctx.restore();
  ctx.textAlign = 'center';
  text(ctx, t(`hero.${ch.id}.name`), cx, 178, '#ffffff', 10);
  hearts(ctx, ch, cx - ch.hp * 4, 188, 5);
  ctx.restore();
}

function drawMainCard(ctx, ch, time) {
  const x = 165, w = 150, y = 46, h = 168;
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffd83d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

  ctx.save();
  ctx.translate(x + w / 2, y + 12);
  ctx.scale(3, 3);
  drawHero(ctx, ch, -6, 0, 1, false, true, time);
  ctx.restore();

  ctx.textAlign = 'center';
  text(ctx, t(`hero.${ch.id}.name`), x + w / 2, y + 88, '#ffd83d', 12);
  ctx.textAlign = 'left';
  statBar(ctx, t('spd'), (ch.speed - 1.6) / 2.0, x + 14, y + 100, '#ff8a4e');
  statBar(ctx, t('jmp'), (-ch.jump - 6.2) / 1.8, x + 14, y + 112, '#5ab0ff');
  hearts(ctx, ch, x + 52, y + 124, 6);
  ctx.textAlign = 'center';
  ctx.font = 'bold 7px "DejaVu Sans Mono", "Amiri", monospace';
  ctx.fillStyle = '#c8c8e0';
  ctx.fillText(t(`hero.${ch.id}.blurb`), x + w / 2, y + 150);
  ctx.textAlign = 'left';
}

function hearts(ctx, ch, x, y, s) {
  for (let i = 0; i < ch.hp; i++) {
    ctx.fillStyle = '#ff5a6e';
    ctx.fillRect(x + i * (s + 3), y, s, s - 1);
    ctx.fillRect(x + i * (s + 3) + 1, y - 1, s - 2, 1);
  }
}

function statBar(ctx, label, val, x, y, col) {
  ctx.font = 'bold 8px "DejaVu Sans Mono", "Amiri", monospace';
  ctx.fillStyle = '#c8c8e0';
  ctx.fillText(label, x, y + 5);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + 28, y, 70, 6);
  ctx.fillStyle = col;
  ctx.fillRect(x + 28, y, Math.max(4, Math.min(70, val * 70)), 6);
}

// ---------------------------------------------------------------- adv. map
// Winding path from bottom-left to top-right; hero walks node to node.
const MAP_NODES = [[52, 198], [148, 168], [240, 146], [332, 112], [414, 82]];
const MAP_COLS = ['#5aff8a', '#ffd83d', '#a8b8ff', '#5ab0ff', '#ff8a4e'];

export function drawMap(ctx, g) {
  menuBg(ctx, g);
  ctx.textAlign = 'center';
  text(ctx, t('map.title'), 240, 24, '#ffd83d', 14);
  ctx.textAlign = 'left';
  text(ctx, t('score', { n: g.score }), 8, 14, '#ffffff', 9);
  ctx.textAlign = 'right';
  text(ctx, g.night ? t('hud.night') : t('hud.day'), 472, 14,
    g.night ? '#a8b8ff' : '#ffe14d', 9);
  ctx.textAlign = 'center';

  // dashed path
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  for (let i = 0; i < MAP_NODES.length - 1; i++) {
    const [x0, y0] = MAP_NODES[i];
    const [x1, y1] = MAP_NODES[i + 1];
    const n = Math.max(2, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 12));
    for (let k = 1; k < n; k++) {
      ctx.fillRect(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, 3, 3);
    }
  }

  // castle above the final node
  ctx.fillStyle = '#8a90ae';
  ctx.fillRect(402, 42, 24, 18);
  ctx.fillRect(400, 36, 5, 8);
  ctx.fillRect(423, 36, 5, 8);
  ctx.fillRect(410, 38, 8, 6);
  ctx.fillStyle = '#3a3a52';
  ctx.fillRect(410, 50, 8, 10);              // door

  // stage nodes
  for (let i = 0; i < MAP_NODES.length; i++) {
    const [x, y] = MAP_NODES[i];
    const open = i <= g.node || i === g.cursor;
    const cleared = !!g.cleared[i];
    if (i === g.node && !g.mapWalk) {        // frontier pulse
      ctx.beginPath();
      ctx.arc(x, y, 12 + Math.sin(g.t * 0.12) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd83d';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = open ? MAP_COLS[i] : 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.strokeStyle = open ? '#ffffff' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, String(i + 1), x, y + 4, open ? '#1c1c28' : '#77779a', 11);
    if (cleared) {                            // mini victory flag
      ctx.fillStyle = '#d8d8e4';
      ctx.fillRect(x + 8, y - 14, 1, 14);
      ctx.fillStyle = '#5aff8a';
      ctx.fillRect(x + 9, y - 14, 6, 4);
    }
    text(ctx, t(NAME_KEYS[i]), x, y + 22, open ? '#ffffff' : '#8888a8', 7);
  }

  // hero: standing on frontier node, or walking along the path
  let hx, hy, moving = false;
  if (g.mapWalk) {
    const e = g.mapWalk.t * g.mapWalk.t * (3 - 2 * g.mapWalk.t); // smoothstep
    const [x0, y0] = MAP_NODES[g.mapWalk.from];
    const [x1, y1] = MAP_NODES[g.mapWalk.to];
    hx = x0 + (x1 - x0) * e;
    hy = y0 + (y1 - y0) * e;
    moving = true;
  } else {
    [hx, hy] = MAP_NODES[g.node];
  }
  ctx.save();
  ctx.translate(hx, hy - 2);
  ctx.scale(2, 2);
  drawHero(ctx, g.char, -6, -15, 1, moving, true, g.t);
  ctx.restore();

  // selection cursor (idle only)
  if (!g.mapWalk) {
    const [cx, cy] = MAP_NODES[g.cursor];
    const bob = Math.abs(Math.sin(g.t * 0.15)) * 4;
    ctx.fillStyle = '#ffd83d';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16 - bob);
    ctx.lineTo(cx - 5, cy - 23 - bob);
    ctx.lineTo(cx + 5, cy - 23 - bob);
    ctx.closePath();
    ctx.fill();
  }

  if (Math.floor(g.t / 24) % 2) {
    text(ctx, t('map.hint'), 240, 262, '#ffffff', 9);
  }
}

// ---------------------------------------------------------------- results
function dim(ctx, a) {
  ctx.fillStyle = `rgba(0,0,8,${a})`;
  ctx.fillRect(0, 0, 480, 272);
}

export function drawClear(ctx, g) {
  dim(ctx, 0.45);
  ctx.textAlign = 'center';
  text(ctx, t('course_clear'), 240, 100, '#5aff8a', 24);
  text(ctx, t('stage_bonus'), 240, 132, '#ffd83d', 12);
  text(ctx, t('score', { n: g.score }), 240, 154, '#ffffff', 12);
  if (Math.floor(g.t / 24) % 2) {
    text(ctx, g.levelIdx + 1 < g.levelCount ? t('next_stage') : t('press_enter2'), 240, 190, '#ffffff', 10);
  }
}

export function drawGameOver(ctx, g) {
  dim(ctx, 0.6);
  ctx.textAlign = 'center';
  text(ctx, t('game_over'), 240, 110, '#ff5a4e', 26);
  text(ctx, t('score', { n: g.score }), 240, 140, '#ffffff', 12);
  if (Math.floor(g.t / 24) % 2) {
    text(ctx, t('retry_hint'), 240, 180, '#ffffff', 10);
  }
}

export function drawVictory(ctx, g) {
  menuBg(ctx, g);
  const tme = g.t;
  for (let i = 0; i < 30; i++) {
    const x = (i * 53 + tme * 1.3) % 480;
    const y = (i * 97 + tme * 0.7) % 272;
    ctx.fillStyle = ['#ffd83d', '#ff5a4e', '#5aff8a', '#5ab0ff'][i % 4];
    ctx.fillRect(x, y, 3, 3);
  }
  ctx.textAlign = 'center';
  text(ctx, t('thanks'), 240, 56, '#ffd83d', 28);
  text(ctx, t('kingdom_saved'), 240, 76, '#ffffff', 13);
  // hero holding the trophy overhead
  const bob = Math.sin(tme * 0.08) * 2;
  drawTrophy(ctx, 234, 114 + bob, tme);
  ctx.save();
  ctx.translate(240, 130 + bob * 0.5);
  ctx.scale(2, 2);
  drawHero(ctx, g.char, -6, 0, 1, false, true, tme);
  ctx.restore();
  text(ctx, t('final_score', { n: g.score }), 240, 186, '#ffffff', 14);
  text(ctx, t('best', { n: String(g.best).padStart(6, '0') }), 240, 202, '#ffd83d', 10);
  text(ctx, `${t('coins', { n: g.coins })}      ${t('mode', { m: g.night ? t('hud.night') : t('hud.day') })}`, 240, 216, '#c8c8e0', 10);
  if (Math.floor(tme / 24) % 2) {
    text(ctx, t('title_back'), 240, 244, '#ffffff', 10);
  }
}

export function drawIntro(ctx, g) {
  const a = Math.min(1, g.introT / 30, (120 - g.introT) / 30);
  if (a <= 0) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,8,0.55)';
  ctx.fillRect(0, 100, 480, 52);
  ctx.textAlign = 'center';
  text(ctx, t('level', { n: g.levelIdx + 1, name: t(g.level.nameKey) }), 240, 124, '#ffffff', 15);
  text(ctx, g.night ? t('intro.night') : t('intro.day'), 240, 142, '#a8b8ff', 9);
  ctx.globalAlpha = 1;
}

export function drawPause(ctx, g) {
  dim(ctx, 0.5);
  ctx.textAlign = 'center';
  text(ctx, t('paused'), 240, 130, '#ffffff', 22);
  text(ctx, t('pause_hint'), 240, 158, '#c8c8e0', 9);
}
