import { DOT_TILE_HALF_W, DOT_TILE_HALF_H } from './pixel.js';

export const P = (fc, fr, { dx = 0, dy = 0, lift = 0 } = {}) => (c, r, dz = 0) => [
  (c - r - (fc - fr)) * DOT_TILE_HALF_W + dx,
  (c + r - (fc + fr)) * DOT_TILE_HALF_H - dz - lift + dy,
];

export const STONE = '#aca8a4';
