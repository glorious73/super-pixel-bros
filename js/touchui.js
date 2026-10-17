// Canvas UI layer: tappable hot spots + tap/swipe gesture recognition.
// Menu draw code registers hot spots (rect + Input code) while drawing the
// button art, so art and hit-area never drift. Pointer events are turned
// into gestures; main.js turns gestures into `Input.tap(code)` so game.js
// keeps reading one edge-triggered input pipeline. Canvas coords (480x272).

let spots = [];
let mode = false; // touch UI visible (mirrors body.touch)

// gesture recognition state (canvas coords)
let downPt = null;
const TAP_SLOP = 14;  // max px drift for a tap
const SWIPE_MIN = 34; // min px travel for a horizontal swipe

const TouchUI = {
  setMode(on) { mode = on; },
  get mode() { return mode; },

  // called once per render before any screen draws its hot spots
  beginDraw() { spots.length = 0; },
  hotspot(x, y, w, h, code) { spots.push({ x, y, w, h, code }); },
  hitTest(x, y) {
    for (let i = spots.length - 1; i >= 0; i--) {
      const s = spots[i];
      if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return s.code;
    }
    return null;
  },

  pointerDown(x, y) { downPt = { x, y }; },
  // -> { type: 'tap', x, y } | { type: 'swipeL' | 'swipeR' } | { type: 'none' }
  pointerUp(x, y) {
    const d = downPt;
    downPt = null;
    if (!d) return { type: 'tap', x, y }; // up without down: treat as tap
    const dx = x - d.x, dy = y - d.y;
    if (Math.abs(dx) <= TAP_SLOP && Math.abs(dy) <= TAP_SLOP) {
      return { type: 'tap', x, y };
    }
    if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.4) {
      return { type: dx > 0 ? 'swipeR' : 'swipeL' };
    }
    return { type: 'none' };
  },
};

export default TouchUI;
