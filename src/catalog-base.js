import { pxBox, DOT_TILE_HALF_W, DOT_TILE_HALF_H } from './pixel.js';

export const off = (fc, fr, c, r) => ({ dx: (c - r - (fc - fr)) * DOT_TILE_HALF_W, dy: (c + r - (fc + fr)) * DOT_TILE_HALF_H });

export const P = (fc, fr, { dx = 0, dy = 0, lift = 0 } = {}) => (c, r, dz = 0) => [
  (c - r - (fc - fr)) * DOT_TILE_HALF_W + dx,
  (c + r - (fc + fr)) * DOT_TILE_HALF_H - dz - lift + dy,
];

export function legs(dots, fc, fr, h, color, { inset = 0.06, s = 0.16, dx = 0, dy = 0 } = {}) {
  const corners = [
    [inset + s, inset + s],
    [inset + s, fr - inset],
    [fc - inset, inset + s],
    [fc - inset, fr - inset],
  ];
  for (const [c, r] of corners) {
    const o = off(fc, fr, c, r);
    pxBox(dots, s, s, h, color, { dx: o.dx + dx, dy: o.dy + dy });
  }
}

export const OAK = '#b19275';
export const OAK_DARK = '#987c63';
export const STONE = '#aca8a4';
export const METAL = '#aaa8a9';
export const SCREEN = '#3b3a3f';
