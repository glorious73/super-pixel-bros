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

function resize() {
  const f = Math.max(1, Math.floor(Math.min(
    window.innerWidth / VIEW_W,
    (window.innerHeight - 34) / VIEW_H,
  )));
  canvas.style.width = VIEW_W * f + 'px';
  canvas.style.height = VIEW_H * f + 'px';
}
addEventListener('resize', resize);
resize();

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
