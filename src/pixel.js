import { shade } from './iso.js';
import { escapeXml } from './svg.js';

export const SCALE = 2;
export const DOT_TILE_HALF_W = 12;
export const DOT_TILE_HALF_H = 6;
export const OUTLINE = '#4a3626';

export function makeGrid() {
  return new Map();
}

const key = (x, y) => `${x},${y}`;

export function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

export function speckle(base, amp = 0.08) {
  const dark = shade(base, 1 - amp);
  const light = shade(base, 1 + amp);
  return (x, y) => {
    const h = hash(Math.floor(x / 3), y >> 1);
    return h < 0.1 ? dark : h > 0.92 ? light : base;
  };
}

export function fillPoly(dots, pts, color) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs));
  const x1 = Math.ceil(Math.max(...xs));
  const y0 = Math.floor(Math.min(...ys));
  const y1 = Math.ceil(Math.max(...ys));

  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5;
    for (let x = x0; x <= x1; x++) {
      const cx = x + 0.5;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > cy !== yj > cy && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) dots.set(key(x, y), typeof color === 'function' ? color(x, y) : color);
    }
  }
}

export function pxBox(dots, footprintCols, footprintRows, h, color, { lift = 0, dx = 0, dy = 0, noise = 0 } = {}) {
  const fc = footprintCols;
  const fr = footprintRows;
  const p = (c, r, dz = 0) => [
    (c - r - (fc - fr)) * DOT_TILE_HALF_W + dx,
    (c + r - (fc + fr)) * DOT_TILE_HALF_H - dz - lift + dy,
  ];
  const face = (f) => (noise ? speckle(shade(color, f), noise) : shade(color, f));
  fillPoly(dots, [p(0, fr), p(fc, fr), p(fc, fr, h), p(0, fr, h)], face(0.9));
  fillPoly(dots, [p(fc, 0), p(fc, fr), p(fc, fr, h), p(fc, 0, h)], face(0.7));
  fillPoly(dots, [p(0, 0, h), p(fc, 0, h), p(fc, fr, h), p(0, fr, h)], face(1.14));
}

export function drawAscii(dots, rows, palette, { dx = 0, dy = 0, ax, ay, shear = 0 } = {}) {
  const w = Math.max(...rows.map((r) => r.length));
  const ox = ax ?? Math.floor(w / 2);
  const oy = ay ?? rows.length;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const c = palette[ch];
      if (!c) continue;
      const sy = shear ? Math.floor(((x - ox) * shear) / 2 + 0.5) : 0;
      dots.set(key(x - ox + dx, y - oy + dy + sy), c);
    }
  });
}

function outline(dots, color = OUTLINE) {
  const edge = [];
  for (const k of dots.keys()) {
    const [x, y] = k.split(',').map(Number);
    if (!dots.has(key(x + 1, y)) || !dots.has(key(x - 1, y)) || !dots.has(key(x, y + 1)) || !dots.has(key(x, y - 1))) {
      edge.push(k);
    }
  }
  for (const k of edge) dots.set(k, color);
}

export function mergeRects(rows) {
  const done = [];
  let open = new Map();

  for (const [y, cells] of [...rows].sort((a, b) => a[0] - b[0])) {
    cells.sort((a, b) => a[0] - b[0]);
    const runs = [];
    let run = null;
    for (const [x, c] of cells) {
      if (run && run.c === c && x === run.x + run.w) run.w++;
      else runs.push((run = { x, w: 1, c }));
    }

    const next = new Map();
    for (const r of runs) {
      const k = `${r.x}:${r.w}:${r.c}`;
      const prev = open.get(k);
      if (prev && prev.y + prev.h === y) {
        prev.h++;
        next.set(k, prev);
        open.delete(k);
      } else {
        next.set(k, { ...r, y, h: 1 });
      }
    }
    done.push(...open.values());
    open = next;
  }
  done.push(...open.values());
  return done;
}

export function toMarkup(dots, cls = '') {
  const rows = new Map();
  for (const [k, c] of dots) {
    const [x, y] = k.split(',').map(Number);
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push([x, c]);
  }
  const done = mergeRects(rows);

  if (!done.length) return '';

  const byColor = new Map();
  for (const r of done) {
    let s = byColor.get(r.c);

    if (!s) byColor.set(r.c, (s = { d: '', x: 0, y: 0 }));
    const dx = r.x - s.x;
    const dy = r.y - s.y;

    s.d += `m${dx}${dy < 0 ? '' : ' '}${dy}h${r.w}v${r.h}h-${r.w}`;
    s.x = r.x;
    s.y = r.y + r.h;
  }

  let out = '';
  for (const [c, s] of byColor) out += `<path fill="${escapeXml(c)}" d="${s.d}"/>`;

  const scaled = `<g transform="scale(${SCALE})">${out}</g>`;
  return cls ? `<g class="${cls}">${scaled}</g>` : scaled;
}

export function sprite(build, cls = '', useOutline = false) {
  const dots = makeGrid();
  build(dots);
  if (useOutline) outline(dots);
  return toMarkup(dots, cls);
}
