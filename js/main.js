// Bootstrap: canvas, integer scaling, fixed-timestep loop, touch controls.
import Game from './game.js';
import Input from './input.js';
import TouchUI from './touchui.js';
import audio from './audio.js';
import { view, fitView, VIEW_H } from './view.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
canvas.width = view.w;
canvas.height = VIEW_H;

// Fit mode (default): canvas fills the window at fractional scale.
// Press F for pixel-perfect integer scaling. Persisted.
const isTouchDevice = matchMedia('(hover: none) and (pointer: coarse)').matches;
const footer = document.querySelector('footer');
let fit = localStorage.getItem('pixelbros_fit') !== '0';

function resize() {
  const m = isTouchDevice ? 4 : 16; // phones: every pixel of scale counts
  const fh = footer ? footer.offsetHeight + 12 : 34;
  const availW = window.innerWidth - m;
  const availH = window.innerHeight - fh - m;
  fitView(availW, availH); // widen the view on wide screens (480-640)
  if (canvas.width !== view.w) {
    canvas.width = view.w; // resizing clears canvas state
    ctx.imageSmoothingEnabled = false;
  }
  const raw = Math.min(availW / view.w, availH / VIEW_H);
  let f = fit ? raw : Math.floor(raw);
  if (f < 1) f = raw; // tiny windows always fall back to fit
  canvas.style.width = Math.round(view.w * f) + 'px';
  canvas.style.height = Math.round(VIEW_H * f) + 'px';
}
addEventListener('resize', resize);
resize();

addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' && !e.repeat) {
    fit = !fit;
    localStorage.setItem('pixelbros_fit', fit ? '1' : '0');
    resize();
  }
});

// ------------------------------------------------------------ touch controls
// On-screen gamepad: ◀ ▶ + jump / pause buttons (menus run on canvas UI).
// Auto-enabled on coarse-pointer devices; T toggles and persists.
let touchOn = localStorage.getItem('pixelbros_touch');
if (touchOn === null) touchOn = isTouchDevice ? '1' : '0';
applyTouch(touchOn === '1');

// Phone in a browser tab: the first tap goes fullscreen, hiding Chrome's
// toolbars (no-op on iOS / desktop). Installed PWAs skip this — their
// manifest already requests fullscreen display.
if (isTouchDevice && !matchMedia('(display-mode: standalone)').matches) {
  addEventListener('pointerdown', () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  }, { once: true });
}

function applyTouch(on) {
  document.body.classList.toggle('touch', on);
  TouchUI.setMode(on);
  localStorage.setItem('pixelbros_touch', on ? '1' : '0');
}

addEventListener('keydown', (e) => {
  if (e.code === 'KeyT' && !e.repeat) applyTouch(!document.body.classList.contains('touch'));
});

function bindHold(id, code) {
  const el = document.getElementById(id);
  if (!el) return;
  const down = (e) => { e.preventDefault(); Input.press(code); el.blur(); };
  const up = (e) => { e.preventDefault(); Input.release(code); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}
bindHold('btnL', 'ArrowLeft');
bindHold('btnR', 'ArrowRight');
bindHold('btnJump', 'Space');
bindHold('btnPause', 'Escape');
bindHold('btnTitle', 'KeyQ');

addEventListener('contextmenu', (e) => {
  if (document.body.classList.contains('touch')) e.preventDefault();
});

const game = new Game();

const unlock = () => audio.unlock();
addEventListener('keydown', unlock);

// Canvas gestures -> the same edge-triggered Input codes as the keyboard.
// tap: a registered menu hot spot's code, else Enter (the classic
// click-to-confirm behavior). Horizontal swipe: Left/Right on carousel
// screens (select, map). Hot spots are registered by the screens when they
// draw, so hit areas always match the art.
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * view.w,
    y: ((e.clientY - r.top) / r.height) * VIEW_H,
  };
}
const SWIPE_STATES = new Set(['select', 'map']);
canvas.addEventListener('pointerdown', (e) => {
  unlock();
  const p = toCanvas(e);
  TouchUI.pointerDown(p.x, p.y);
});
canvas.addEventListener('pointerup', (e) => {
  const p = toCanvas(e);
  const g = TouchUI.pointerUp(p.x, p.y);
  if (g.type === 'tap') Input.tap(TouchUI.hitTest(g.x, g.y) || 'Enter');
  else if (SWIPE_STATES.has(game.state)) {
    Input.tap(g.type === 'swipeL' ? 'ArrowLeft' : 'ArrowRight');
  }
});

const STEP = 1000 / 60;
let last = performance.now();
let acc = 0;
let lastState = '';

function loop(now) {
  requestAnimationFrame(loop);
  acc += Math.min(now - last, 250);
  last = now;
  while (acc >= STEP) {
    game.update();
    acc -= STEP;
  }
  game.render(ctx);
  if (game.state !== lastState) {
    lastState = game.state;
    document.body.dataset.state = game.state; // CSS shows pause/map buttons
  }
  Input.endFrame();
}
requestAnimationFrame(loop);

// PWA: offline-capable once installed. Skipped on localhost so the SW can
// never fight the no-store dev server (see AGENTS.md cache warning).
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
