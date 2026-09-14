import { geometry, gridCell, DEFAULT_TEXT_STYLE } from '../src/room.js';
import { TILE_HALF_W } from '../src/iso.js';
import { SCALE } from '../src/pixel.js';
import { FLOOR_ITEMS, DEFAULT_PERSON } from '../src/catalog.js';
import { isHexColor } from '../src/svg.js';

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function covers(it, def, c, r) {
  return c >= it.col && c < it.col + Math.ceil(def.fc) && r >= it.row && r < it.row + Math.ceil(def.fr);
}

export function topItemAt(items, c, r) {
  let best = -1;
  let bestKey = -1;
  items.forEach((it, i) => {
    const def = FLOOR_ITEMS[it.id];
    if (!def || !covers(it, def, c, r)) return;
    const key = def.layer * 1000 + it.col + def.fc + it.row + def.fr;
    if (key >= bestKey) { bestKey = key; best = i; }
  });
  return best;
}

export function stackLift(items, c, r, skip = null) {
  let best = 0;
  for (const it of items) {
    if (it === skip) continue;
    const def = FLOOR_ITEMS[it.id];
    if (!def || def.top == null || !covers(it, def, c, r)) continue;
    best = Math.max(best, (it.lift ?? 0) + def.top);
  }
  return best;
}

/* Test support heights from highest to lowest before falling back to the floor. */
export function cellAtPoint(items, p, geo, skip = null) {
  const heights = new Set();
  for (const it of items) {
    if (it === skip) continue;
    const def = FLOOR_ITEMS[it.id];
    if (def?.top != null) heights.add((it.lift ?? 0) + def.top);
  }
  for (const h of [...heights].sort((a, b) => b - a)) {
    const cell = gridCell(p.x, p.y + h * SCALE, geo);
    const c = Math.floor(cell.c);
    const r = Math.floor(cell.r);
    if (c < 0 || r < 0 || c >= geo.cols || r >= geo.rows) continue;
    if (stackLift(items, c, r, skip) === h) return cell;
  }
  return gridCell(p.x, p.y, geo);
}

export function fitToGrid(state) {
  const { cols, rows } = state.grid;
  const fit = (o, w = 1, h = 1) => {
    o.col = clamp(o.col ?? 0, 0, Math.max(0, cols - w));
    o.row = clamp(o.row ?? 0, 0, Math.max(0, rows - h));
  };

  for (const it of state.items) {
    const def = FLOOR_ITEMS[it.id];
    fit(it, Math.ceil(def?.fc ?? 1), Math.ceil(def?.fr ?? 1));
  }
  for (const list of [state.effects, state.skills, state.texts]) for (const o of list ?? []) fit(o);
  if (state.person) fit(state.person);
  for (const w of state.wallItems) {
    if (w.wall === 'floor') fit(w);
    else w.u = clamp(w.u ?? 0, 0, (w.wall === 'left' ? rows : cols) - 1);
  }
}

export function moveToPoint(state, p, t) {
  const geo = geometry(state.grid);
  const { obj } = t;

  if (t.wall) {
    const d = (p.x - geo.ox) / TILE_HALF_W;
    const wall = d < 0 ? 'left' : 'right';
    const u = clamp(Math.floor(Math.abs(d)), 0, (wall === 'left' ? geo.rows : geo.cols) - 1);
    if (obj.wall === wall && obj.u === u) return false;
    obj.wall = wall;
    obj.u = u;
    return true;
  }

  const cell = cellAtPoint(state.items, p, geo, obj);
  const col = clamp(Math.floor(cell.c) - t.dc, 0, geo.cols - Math.ceil(t.def?.fc ?? 1));
  const row = clamp(Math.floor(cell.r) - t.dr, 0, geo.rows - Math.ceil(t.def?.fr ?? 1));
  if (obj.col === col && obj.row === row) return false;
  obj.col = col;
  obj.row = row;

  if (t.def) {
    const lift = stackLift(state.items, col, row, obj);
    if (lift) obj.lift = lift;
    else delete obj.lift;
  }
  return true;
}

export function normalizeRoom(state) {
  state.items ??= [];
  state.wallItems ??= [];
  state.effects ??= [];
  state.skills ??= [];
  state.links ??= [];

  state.texts ??= state.bubbles ?? [];
  delete state.bubbles;
  for (const t of state.texts) {
    if (t.typing) { t.anim ??= 'type'; delete t.typing; }
  }
  state.grid ??= { cols: 8, rows: 8 };
  state.theme ??= {};

  for (const key of ['wall', 'floor']) {
    if (key in state.theme && !isHexColor(state.theme[key])) delete state.theme[key];
  }
  if (state.person) {
    for (const key of ['skin', 'hair', 'top', 'bottom']) {
      if (key in state.person && !isHexColor(state.person[key])) delete state.person[key];
    }
  }
  for (const link of state.links) {
    for (const key of ['color', 'fg']) {
      if (key in link && !isHexColor(link[key])) delete link[key];
    }
  }

  if (state.person?.bubble) {
    state.texts.push({
      text: state.person.bubble,
      col: state.person.col ?? DEFAULT_PERSON.col,
      row: state.person.row ?? DEFAULT_PERSON.row,
      style: DEFAULT_TEXT_STYLE,
      anim: 'float',
    });
    delete state.person.bubble;
  }
  return state;
}

export function embedRoom(svg, state) {
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(state))));
  return svg.replace('</svg>', `<metadata id="gitroom">${b64}</metadata></svg>`);
}

export function parseRoomText(text) {
  const m = text.match(/<metadata id="gitroom">([A-Za-z0-9+/=]+)<\/metadata>/);
  if (m) return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0))));
  return JSON.parse(text);
}
