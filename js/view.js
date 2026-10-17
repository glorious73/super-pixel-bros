// Runtime viewport size. Height is fixed at 272 (17 rows); width starts at
// 480 and grows up to 640 (tile-snapped) on wide screens, so a phone in
// landscape shows more of the world instead of black side bars. Physics are
// untouched — only visibility and layout widen.
// RULE: drawing code anchors on view.w (center = view.w / 2), never on a
// hardcoded 480/240, and never assumes view.w === VIEW_MIN_W.
export const VIEW_H = 272;
export const VIEW_MIN_W = 480;
export const VIEW_MAX_W = 640;

export const view = { w: VIEW_MIN_W, h: VIEW_H };

// Fit the view into an available box: pick the widest tile-snapped width
// whose aspect still fits, clamped to [480, 640]. Call before scaling.
export function fitView(availW, availH) {
  const raw = Math.floor((VIEW_H * availW) / availH / 16) * 16;
  view.w = Math.max(VIEW_MIN_W, Math.min(VIEW_MAX_W, raw));
  return view.w;
}
