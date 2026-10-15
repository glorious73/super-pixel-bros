// Bootstrap: canvas, integer scaling, fixed-timestep loop.
import Game from './game.js';
import Input from './input.js';
import audio from './audio.js';
import { VIEW_W, VIEW_H } from './levels.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
canvas.width = VIEW_W;
canvas.height = VIEW_H;

// Fit mode (default): canvas fills the window at fractional scale.
// Press F for pixel-perfect integer scaling. Persisted.
const footer = document.querySelector('footer');
let fit = localStorage.getItem('pixelbros_fit') !== '0';

function resize() {
  const fh = footer ? footer.offsetHeight + 12 : 34;
  const raw = Math.min(
    (window.innerWidth - 16) / VIEW_W,
    (window.innerHeight - fh - 16) / VIEW_H,
  );
  let f = fit ? raw : Math.floor(raw);
  if (f < 1) f = raw; // tiny windows always fall back to fit
  canvas.style.width = Math.round(VIEW_W * f) + 'px';
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

const game = new Game();

const unlock = () => audio.unlock();
addEventListener('keydown', unlock);
canvas.addEventListener('pointerdown', () => {
  unlock();
  Input.touchConfirm();
});

const STEP = 1000 / 60;
let last = performance.now();
let acc = 0;

function loop(now) {
  requestAnimationFrame(loop);
  acc += Math.min(now - last, 250);
  last = now;
  while (acc >= STEP) {
    game.update();
    acc -= STEP;
  }
  game.render(ctx);
  Input.endFrame();
}
requestAnimationFrame(loop);
