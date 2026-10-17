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
const TouchUI = (await import(`${base}/touchui.js`)).default;
const { view, fitView } = await import(`${base}/view.js`);
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

// touch UI: hot spots, node taps, pause/game-over cards, gestures
{
  TouchUI.setMode(true);
  const hit = (x, y) => TouchUI.hitTest(x, y);
  const g = new Game();

  // title: option bar (392,4) — mute / night / lang icons
  g.render(ctx);
  if (hit(404, 16) !== 'KeyM' || hit(432, 16) !== 'KeyN' || hit(460, 16) !== 'KeyL')
    throw new Error('title option bar hot spots missing');
  const wasMuted = g.muted;
  tap(g, 'KeyM');
  if (g.muted === wasMuted) throw new Error('mute tap did not toggle');
  tap(g, 'KeyM');

  // select: arrows + center card reachable by tap
  g.state = 'select';
  g.render(ctx);
  if (hit(20, 132) !== 'ArrowLeft' || hit(460, 132) !== 'ArrowRight')
    throw new Error('select arrows not tappable');
  if (hit(240, 130) !== 'Enter') throw new Error('center card not tappable');
  const sel0 = g.selIdx;
  tap(g, 'ArrowLeft');
  if (g.selIdx === sel0) throw new Error('touch carousel broken');

  // map: node taps ('Node<i>' codes), locked nodes guarded by game
  g.startRun();
  g.render(ctx);
  if (hit(52, 198) !== 'Node0' || hit(414, 82) !== 'Node4')
    throw new Error('map nodes not tappable');
  tap(g, 'Node4'); // beyond frontier: must be ignored
  if (g.state !== 'map' || g.cursor !== 0) throw new Error('locked node tap leaked');
  tap(g, 'Node0'); // selected node again -> launch
  if (g.state !== 'play') throw new Error('tapping selected node should start stage');

  // pause: three cards + centered option bar
  g.state = 'pause';
  g.render(ctx);
  if (hit(110, 122) !== 'Escape' || hit(240, 122) !== 'KeyR' || hit(360, 122) !== 'KeyQ')
    throw new Error('pause cards not tappable');
  if (hit(212, 170) !== 'KeyM' || hit(240, 170) !== 'KeyN' || hit(268, 170) !== 'KeyL')
    throw new Error('pause option bar not tappable');
  tap(g, 'KeyR'); // retry card resumes and dies (same as R key)
  if (g.state !== 'play') throw new Error('retry card should return to play');

  // game over: retry / title cards
  g.state = 'gameover';
  g.render(ctx);
  if (hit(160, 186) !== 'Enter' || hit(300, 186) !== 'Escape')
    throw new Error('game over cards not tappable');

  // gesture recognizer: tap vs swipe
  TouchUI.pointerDown(240, 140);
  let gest = TouchUI.pointerUp(245, 144);
  if (gest.type !== 'tap' || gest.x !== 245) throw new Error('small drag should be a tap');
  TouchUI.pointerDown(400, 140);
  gest = TouchUI.pointerUp(120, 148);
  if (gest.type !== 'swipeL') throw new Error('swipe left not recognized');
  TouchUI.pointerDown(100, 140);
  gest = TouchUI.pointerUp(380, 136);
  if (gest.type !== 'swipeR') throw new Error('swipe right not recognized');
  TouchUI.pointerDown(240, 60);
  gest = TouchUI.pointerUp(252, 180);
  if (gest.type !== 'none') throw new Error('vertical drag must not swipe');
  TouchUI.setMode(false);
  console.log('touch UI (hot spots, cards, gestures) OK');
}

// wide viewport: fitView math + every screen renders & hits at 640 wide
{
  if (fitView(1560, 676) !== 624) throw new Error('2.3:1 phone should give 624, got ' + view.w);
  if (fitView(1920, 480) !== 640) throw new Error('ultrawide should clamp to 640');
  if (fitView(480, 272) !== 480) throw new Error('16:9 box should stay 480');
  view.w = 640;

  TouchUI.setMode(true);
  const hit = (x, y) => TouchUI.hitTest(x, y);
  const g = new Game();
  g.render(ctx);                                     // title @640
  if (hit(564, 16) !== 'KeyM' || hit(620, 16) !== 'KeyL')
    throw new Error('option bar did not follow view width (title)');
  g.state = 'select';
  g.render(ctx);
  if (hit(620, 132) !== 'ArrowRight') throw new Error('right arrow stuck at 480');
  if (hit(320, 130) !== 'Enter') throw new Error('center card not centered @640');
  g.startRun();                                      // map
  g.render(ctx);
  if (hit(0.8625 * 640, 82) !== 'Node4') throw new Error('map nodes not stretched');
  g.loadLevel(0);
  g.state = 'pause';
  g.render(ctx);
  if (hit(192, 122) !== 'Escape' || hit(320, 122) !== 'KeyR' || hit(448, 122) !== 'KeyQ')
    throw new Error('pause cards not centered @640');
  if (hit(292, 170) !== 'KeyM' || hit(348, 170) !== 'KeyL')
    throw new Error('pause option bar not centered @640');
  g.state = 'gameover';
  g.render(ctx);
  if (hit(250, 186) !== 'Enter' || hit(390, 186) !== 'Escape')
    throw new Error('game over cards not centered @640');
  g.state = 'clear'; g.render(ctx);
  g.state = 'victory'; g.render(ctx);
  TouchUI.setMode(false);
  view.w = 480;
  console.log('wide viewport (fitView + 640-wide layout) OK');
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
