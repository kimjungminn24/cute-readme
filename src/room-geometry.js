import { TILE_HALF_W, TILE_HALF_H, shade } from './iso.js';
import { makeGrid, toMarkup, speckle, DOT_TILE_HALF_W, DOT_TILE_HALF_H, SCALE } from './pixel.js';
import { WALL_ITEMS, DEFAULT_PERSON } from './catalog.js';
import { DEFAULT_CORNER, DEFAULT_FLOOR_STYLE, DEFAULT_THEME, DEFAULT_WALL_STYLE, FLOOR_STYLES, GRID_MAX, GRID_MIN, PAD, WALL_H, WALL_STYLES, shader } from './room-styles.js';

export const DEMO_ROOM = {
  v: 1,
  grid: { cols: 8, rows: 8 },
  theme: { ...DEFAULT_THEME },
  items: [
    { id: 'bed', col: 0, row: 2 },
    { id: 'rug', col: 3, row: 3 },
    { id: 'grassblock', col: 4, row: 0 },
    { id: 'ore', col: 5, row: 0 },
    { id: 'bookshelf', col: 1, row: 0 },
    { id: 'chest', col: 7, row: 2 },
    { id: 'books', col: 4, row: 4 },
    { id: 'creeper', col: 6, row: 5 },
    { id: 'plant', col: 2, row: 0 },
    { id: 'lamp', col: 6, row: 3 },
  ],
  wallItems: [
    { id: 'window', wall: 'right', u: 4 },
    { id: 'painting', wall: 'left', u: 4 },
  ],
  person: { ...DEFAULT_PERSON, col: 3, row: 6, bubble: 'welcome!' },
  effects: [{ id: 'heart', col: 4, row: 6 }],
  skills: [
    { id: 'java', col: 7, row: 7 },
    { id: 'js', col: 5, row: 7 },
    { id: 'claude', col: 2, row: 7 },
  ],

  links: [
    { label: 'Blog', url: 'https://example.com', color: '#3aa0a8', fg: '#ffffff', icon: 'doc' },
    { label: 'GitHub', url: 'https://github.com/', color: '#20232a', fg: '#ffffff', icon: 'code' },
    { label: 'Mail', url: 'mailto:you@example.com', color: '#d97757', fg: '#ffffff', icon: 'mail' },
  ],
};

export const EMPTY_ROOM = {
  v: 1,
  grid: { cols: 8, rows: 8 },
  theme: { ...DEFAULT_THEME },
  items: [],
  wallItems: [],
  person: { ...DEFAULT_PERSON },
  effects: [],
  skills: [],
  texts: [],
  links: [],
};

export function clampGrid(grid) {
  return {
    cols: Math.min(GRID_MAX, Math.max(GRID_MIN, grid?.cols ?? 8)),
    rows: Math.min(GRID_MAX, Math.max(GRID_MIN, grid?.rows ?? 8)),
  };
}

export function geometry(grid) {
  const { cols, rows } = clampGrid(grid);
  const ox = PAD + rows * TILE_HALF_W;
  const oy = PAD + WALL_H;
  return {
    cols,
    rows,
    ox,
    oy,
    width: PAD * 2 + (cols + rows) * TILE_HALF_W,
    height: oy + (cols + rows) * TILE_HALF_H + PAD,
  };
}

export function gridPoint(c, r, geo) {
  return { x: geo.ox + (c - r) * TILE_HALF_W, y: geo.oy + (c + r) * TILE_HALF_H };
}

export function gridCell(x, y, geo) {
  const dx = (x - geo.ox) / TILE_HALF_W;
  const dy = (y - geo.oy) / TILE_HALF_H;
  return { c: (dx + dy) / 2, r: (dy - dx) / 2 };
}

export function pointsAttr(list, geo, dy = 0) {
  return list.map(([c, r]) => {
    const p = gridPoint(c, r, geo);
    return `${p.x},${p.y + dy}`;
  }).join(' ');
}

export function shell(geo, theme) {
  const wall = theme.wall ?? DEFAULT_THEME.wall;
  const floor = theme.floor ?? DEFAULT_THEME.floor;

  const wallStyle = WALL_STYLES[theme.wallStyle] ?? WALL_STYLES[DEFAULT_WALL_STYLE];
  const floorStyle = FLOOR_STYLES[theme.floorStyle] ?? FLOOR_STYLES[DEFAULT_FLOOR_STYLE];
  const pattern = wallStyle.pattern;
  const floorPattern = floorStyle.pattern;
  const dots = makeGrid();

  const wallBase = speckle(wall, 0.07);
  const wallShade = shader(wall);
  const corner = shade(wall, wallStyle.corner ?? DEFAULT_CORNER);
  const floorT = speckle(floor, 0.08);
  const shadeF = shader(floor);

  const left = Math.floor(-geo.ox / SCALE);
  const right = Math.ceil((geo.width - geo.ox) / SCALE);
  const top = Math.floor(-geo.oy / SCALE);
  const bottom = Math.ceil((geo.height - geo.oy) / SCALE);

  for (let x = left; x <= right; x++) {
    const cx = x + 0.5;
    const edge = Math.abs(cx) / 2;

    const seam = Math.round(edge);

    const u = (Math.abs(cx) + (cx < 0 ? 1 : 0)) / DOT_TILE_HALF_W;

    if (!wallStyle.off) {
      const end = Math.min(seam, bottom + 1);
      for (let y = top; y < end; y++) {
        const d = seam - 1 - y;
        const f = pattern(u, d);
        dots.set(`${x},${y}`, f === null ? wallBase(x, y) : wallShade(f));
      }
      if (end - 1 >= top) dots.set(`${x},${end - 1}`, corner);
    }
    if (!floorStyle.off) {
      for (let y = Math.max(seam, top); y <= bottom; y++) {
        const cy = y + 0.5;
        const col = (cy / DOT_TILE_HALF_H + cx / DOT_TILE_HALF_W) / 2;
        const row = (cy / DOT_TILE_HALF_H - cx / DOT_TILE_HALF_W) / 2;
        const f = floorPattern(col, row);
        dots.set(`${x},${y}`, f === null ? floorT(x, y) : shadeF(f));
      }
    }
  }

  if (!wallStyle.off) {
    for (let y = top; y < 0; y++) dots.set(`0,${y}`, corner);
  }

  return `<g transform="translate(${geo.ox} ${geo.oy})">${toMarkup(dots)}</g>`;
}

export function wallItem(entry, geo, editable, idx) {
  const def = WALL_ITEMS[entry.id];
  if (!def) return '';
  const data = editable ? ` data-kind="wallItem" data-idx="${idx}"` : '';

  if (entry.wall === 'floor') {
    const col = Math.min(geo.cols - 1, Math.max(0, entry.col ?? 0));
    const row = Math.min(geo.rows - 1, Math.max(0, entry.row ?? 0));
    const p = gridPoint(col + 0.5, row + 0.5, geo);
    return `<g${data} transform="translate(${p.x} ${p.y + 6 - (entry.lift ?? 0) * SCALE})">${def.art('floor')}</g>`;
  }

  const wall = entry.wall === 'left' ? 'left' : 'right';
  const maxU = (wall === 'left' ? geo.rows : geo.cols) - 1;
  const u = Math.min(maxU, Math.max(0, entry.u ?? 0)) + 0.5;
  const v = entry.v ?? def.v;

  const base = wall === 'left' ? gridPoint(0, u, geo) : gridPoint(u, 0, geo);
  return `<g${data} transform="translate(${base.x} ${base.y - v})">${def.art(wall)}</g>`;
}
