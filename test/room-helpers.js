import assert from 'node:assert/strict';

export const pos = (svg, sel) => {
  const i = svg.indexOf(sel);
  assert.ok(i >= 0, `${sel} missing from output`);
  return i;
};

export const FRAME = '#aaacb3';

export function shellDots(svg) {
  const dots = new Map();
  for (const [, fill, d] of svg.matchAll(/<path fill="(#[0-9a-f]{6})" d="([^"]+)"/g)) {
    let cx = 0, cy = 0;
    for (const m of d.matchAll(/m(-?\d+) ?(-?\d+)h(\d+)v(\d+)h-\d+/g)) {
      const x = cx + +m[1], y = cy + +m[2], w = +m[3], h = +m[4];
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) dots.set(`${x + i},${y + j}`, fill);
      cx = x;
      cy = y + h;
    }
  }
  return dots;
}
