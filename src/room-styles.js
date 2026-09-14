import { shade } from './iso.js';
import { makeGrid, toMarkup, speckle, DOT_TILE_HALF_W, DOT_TILE_HALF_H, SCALE } from './pixel.js';

export const PAD = 26;

export const WALL_H = 72;

export const GRID_MIN = 4;
export const GRID_MAX = 12;

export const DEFAULT_THEME = { wall: '#ffffff', floor: '#f0eeea' };

const frac = (v) => v - Math.floor(v);

export const WALL_STYLES = {
  block: {
    name: 'Block',
    pattern: (u, d) => (frac(u) < 0.08 || d % 12 < 1 ? 0.8 : null),
    corner: 0.8,
  },
  brick: {
    name: 'Brick',

    pattern: (u, d) => (d % 6 < 1 || frac(u * 2 + (Math.floor(d / 6) % 2) * 0.5) < 0.17 ? 0.72 : null),
    corner: 0.72,
  },
  plank: {
    name: 'Plank',

    pattern: (u, d) => (d % 5 < 1 || frac((u + Math.floor(d / 5) * 0.9) / 2) < 0.05 ? 0.74 : null),
    corner: 0.74,
  },
  stripe: {
    name: 'Stripe',
    pattern: (u) => (frac(u * 2) < 0.5 ? 1.07 : null),
    corner: 0.8,
  },
  panel: {
    name: 'Panel',

    pattern: (u, d) => {
      if (d < 14) return frac(u * 2) < 0.17 ? 0.66 : 0.85;
      return d < 17 ? 1.14 : null;
    },
    corner: 0.66,
  },
  tile: {
    name: 'Tile',
    pattern: (u, d) => {
      if (frac(u * 2) < 0.17 || d % 6 < 1) return 0.82;
      return d % 6 > 4.5 ? 1.06 : null;
    },
    corner: 0.82,
  },

  plain: {
    name: 'Plain',
    pattern: () => null,
    corner: 0.82,
  },
  solid: {
    name: 'Solid',
    pattern: () => 1,
    corner: 0.82,
  },

  none: {
    name: 'None',
    off: true,
    pattern: () => null,
  },
};

export const DEFAULT_WALL_STYLE = 'solid';

export const DEFAULT_CORNER = 0.8;

const evenCell = (c, r) => ((Math.floor(c) + Math.floor(r)) % 2 + 2) % 2 === 0;

export const FLOOR_STYLES = {
  grid: {
    name: 'Grid',
    pattern: (c, r) => (frac(c) < 0.06 || frac(r) < 0.06 ? 0.78 : null),
  },
  tile: {
    name: 'Tile',

    pattern: (c, r) => (frac(c * 2) < 0.1 || frac(r * 2) < 0.1 ? 0.8 : null),
  },
  checker: {
    name: 'Checker',

    pattern: (c, r) => (evenCell(c, r) ? null : 0.86),
  },
  plank: {
    name: 'Plank',

    pattern: (c, r) => (frac(r * 2) < 0.08 || frac(c / 2 + Math.floor(r * 2) * 0.37) < 0.02 ? 0.76 : null),
  },
  brick: {
    name: 'Brick',

    pattern: (c, r) => (frac(r) < 0.06 || frac(c + (((Math.floor(r) % 2) + 2) % 2) * 0.5) < 0.06 ? 0.78 : null),
  },

  plain: {
    name: 'Plain',
    pattern: () => null,
  },
  solid: {
    name: 'Solid',
    pattern: () => 1,
  },
  none: {
    name: 'None',
    off: true,
    pattern: () => null,
  },
};

export const DEFAULT_FLOOR_STYLE = 'solid';

export const ROOM_SKINS = [
  { id: 'paper', name: 'Paper', ...DEFAULT_THEME },
  { id: 'cocoa', name: 'Cocoa', wall: '#c4a875', floor: '#b8945f' },
  { id: 'sand', name: 'Sand', wall: '#e4d3b6', floor: '#c9b189' },
  { id: 'cream', name: 'Cream', wall: '#eee1bf', floor: '#d8c495' },
  { id: 'lemon', name: 'Lemon', wall: '#f2e4a8', floor: '#dcc87c' },
  { id: 'peach', name: 'Peach', wall: '#f4cdb4', floor: '#e0a98a' },
  { id: 'rose', name: 'Rose', wall: '#f0c4cb', floor: '#d79dab' },
  { id: 'lilac', name: 'Lilac', wall: '#d2c6e8', floor: '#ab9ccd' },
  { id: 'sky', name: 'Sky', wall: '#bcd4ec', floor: '#93aecd' },
  { id: 'mint', name: 'Mint', wall: '#bcded1', floor: '#8fc2b0' },
  { id: 'sage', name: 'Sage', wall: '#cdd9ae', floor: '#a5b784' },
  { id: 'slate', name: 'Slate', wall: '#aab3c0', floor: '#838f9f' },
  { id: 'night', name: 'Night', wall: '#7b7d92', floor: '#585a6d' },
];

export function shader(base) {
  const cache = new Map();
  return (f) => {
    let c = cache.get(f);
    if (c === undefined) cache.set(f, (c = shade(base, f)));
    return c;
  };
}

function swatchSvg(dots, size) {
  const side = size * SCALE;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side}" height="${side}" shape-rendering="crispEdges" aria-hidden="true">${toMarkup(dots)}</svg>`;
}

function noneSwatch(size) {
  const dots = makeGrid();
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      dots.set(`${x},${y}`, (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? '#e6dfcd' : '#fbf8f0');
    }
  }
  return swatchSvg(dots, size);
}

export function wallSwatch(id, color = DEFAULT_THEME.wall, size = 24) {
  const style = WALL_STYLES[id] ?? WALL_STYLES[DEFAULT_WALL_STYLE];
  if (style.off) return noneSwatch(size);

  const pattern = style.pattern;
  const base = speckle(color, 0.07);
  const shaded = shader(color);
  const dots = makeGrid();

  for (let x = 0; x < size; x++) {
    const u = x / DOT_TILE_HALF_W;
    for (let y = 0; y < size; y++) {
      const d = size - 1 - y;
      const f = pattern(u, d);
      dots.set(`${x},${y}`, f === null ? base(x, y) : shaded(f));
    }
  }

  return swatchSvg(dots, size);
}

export function floorSwatch(id, color = DEFAULT_THEME.floor, size = 24) {
  const style = FLOOR_STYLES[id] ?? FLOOR_STYLES[DEFAULT_FLOOR_STYLE];
  if (style.off) return noneSwatch(size);

  const pattern = style.pattern;
  const base = speckle(color, 0.08);
  const shaded = shader(color);
  const dots = makeGrid();

  for (let x = 0; x < size; x++) {
    const cx = x - size / 2 + 0.5;
    for (let y = 0; y < size; y++) {
      const cy = y + 0.5;
      const col = (cy / DOT_TILE_HALF_H + cx / DOT_TILE_HALF_W) / 2;
      const row = (cy / DOT_TILE_HALF_H - cx / DOT_TILE_HALF_W) / 2;
      const f = pattern(col, row);
      dots.set(`${x},${y}`, f === null ? base(x, y) : shaded(f));
    }
  }

  return swatchSvg(dots, size);
}
