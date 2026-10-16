// Headless smoke: stub browser, drive Game through every state, both langs.
// node tools/headless.mjs
const noop = () => {};
const gradient = { addColorStop: noop };
const ctx = new Proxy({}, {
  get(t, p) {
    if (p === 'createLinearGradient') return () => gradient;
    if (p === 'canvas') return canvas;
    // methods return undefined; property reads return '' / 0
    return t[p] !== undefined ? t[p] : noop;
  },
  set(t, p, v) { t[p] = v; return true; },
});
const canvas = { width: 480, height: 272, style: {}, getContext: () => ctx,
  addEventListener: noop };

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
globalThis.document = {
  readyState: 'complete',
  documentElement: { lang: 'en', dir: 'ltr' },
  getElementById: () => ({ textContent: '' }),
};
globalThis.addEventListener = noop;
globalThis.window = globalThis;
globalThis.performance = { now: () => Date.now() };
const elems = { 'game': canvas };
globalThis.document.querySelector = (s) => elems[s.replace('#', '')] || null;
globalThis.document.getElementById = (id) => elems[id] || null;
// capture rAF callbacks so we never actually loop
globalThis.requestAnimationFrame = noop;

const base = '../js';
const Game = (await import(`${base}/game.js`)).default;
const i18n = await import(`${base}/i18n.js`);
const Input = (await import(`${base}/input.js`)).default;
const { CHARACTERS } = await import(`${base}/entities.js`);
const { LEVEL_COUNT } = await import(`${base}/levels.js`);

function frames(g, n) {
  for (let i = 0; i < n; i++) { g.update(); g.render(ctx); Input.endFrame(); }
}
function tap(g, code) {
  Input.press(code);
  g.update(); g.render(ctx); Input.release(code); Input.endFrame();
}

// full adventure-map flow (once, en)
{
  const g = new Game();
  g.startRun();
  if (g.state !== 'map') throw new Error('startRun should land on map');
  tap(g, 'Enter');                       // node 0 -> stage 1
  if (g.state !== 'play' || g.levelIdx !== 0) throw new Error('map Enter should start stage 1');
  g.state = 'clear';
  tap(g, 'Enter');                       // finish stage -> walk to node 1
  if (!g.mapWalk) throw new Error('clear should schedule a walk');
  frames(g, 100);
  if (g.node !== 1 || g.mapWalk) throw new Error('walk should reach node 1');
  g.cursor = 0;                          // replay cleared stage 1
  tap(g, 'Enter');
  if (g.levelIdx !== 0) throw new Error('cursor replay broken');
  g.state = 'clear';
  tap(g, 'Enter');                       // replay: no walk, stay at frontier
  if (g.mapWalk) throw new Error('replay should not walk backwards');
  g.levelIdx = LEVEL_COUNT - 1;          // final stage cleared -> trophy
  g.state = 'clear';
  tap(g, 'Enter');
  if (g.state !== 'victory') throw new Error('final stage should trigger victory');
  g.render(ctx);
  g.state = 'map';                       // Q from map quits to title
  tap(g, 'KeyQ');
  if (g.state !== 'title') throw new Error('Q on map should quit to title');
  console.log('adventure-map flow OK');
}

for (const lang of ['en', 'ar']) {
  i18n.setLang(lang);
  for (const ci of [0, 3, 4]) { // include both new heroes faris(3), sahm(4)
    const g = new Game();
    g.selIdx = ci;
    g.startRun();
    frames(g, 30);                       // map with walking cursor etc.
    tap(g, 'Enter');                     // into stage 1
    frames(g, 30);                       // play with intro
    // force each result state and render it
    for (const st of ['map', 'clear', 'gameover', 'victory', 'pause', 'title', 'select']) {
      g.state = st; frames(g, 3);
    }
    // exercise night + shell + enemy paths quickly
    g.state = 'play'; g.setNight(true); frames(g, 20); g.setNight(false);
    g.loadLevel(4); frames(g, 15);
    // virtual touch buttons feed the same edge triggers
    Input.press('ArrowRight'); frames(g, 3); Input.release('ArrowRight');
    Input.press('Space'); frames(g, 3); Input.release('Space');
    console.log(`${lang}/hero[${ci}=${CHARACTERS[ci].id}] OK`);
  }
}
console.log('\nHeadless render pass: no runtime errors.');
