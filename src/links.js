import { shade } from './iso.js';
import { escapeXml, sizeAttrs, hexColor } from './svg.js';
import { makeGrid, toMarkup, speckle, SCALE } from './pixel.js';

const GLYPHS = {
  A: ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'],
  B: ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'],
  C: ['.XX', 'X..', 'X..', 'X..', '.XX'],
  D: ['XX.', 'X.X', 'X.X', 'X.X', 'XX.'],
  E: ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
  F: ['XXX', 'X..', 'XX.', 'X..', 'X..'],
  G: ['.XX', 'X..', 'X.X', 'X.X', '.XX'],
  H: ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'],
  I: ['XXX', '.X.', '.X.', '.X.', 'XXX'],
  J: ['..X', '..X', '..X', 'X.X', '.X.'],
  K: ['X.X', 'X.X', 'XX.', 'X.X', 'X.X'],
  L: ['X..', 'X..', 'X..', 'X..', 'XXX'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
  N: ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X'],
  O: ['.X.', 'X.X', 'X.X', 'X.X', '.X.'],
  P: ['XX.', 'X.X', 'XX.', 'X..', 'X..'],
  Q: ['.X.', 'X.X', 'X.X', 'XX.', '.XX'],
  R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
  S: ['.XX', 'X..', '.X.', '..X', 'XX.'],
  T: ['XXX', '.X.', '.X.', '.X.', '.X.'],
  U: ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
  V: ['X.X', 'X.X', 'X.X', 'X.X', '.X.'],
  W: ['X...X', 'X...X', 'X.X.X', 'XX.XX', 'X...X'],
  X: ['X.X', 'X.X', '.X.', 'X.X', 'X.X'],
  Y: ['X.X', 'X.X', '.X.', '.X.', '.X.'],
  Z: ['XXX', '..X', '.X.', 'X..', 'XXX'],
  0: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  1: ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  2: ['XX.', '..X', '.X.', 'X..', 'XXX'],
  3: ['XX.', '..X', '.X.', '..X', 'XX.'],
  4: ['X.X', 'X.X', 'XXX', '..X', '..X'],
  5: ['XXX', 'X..', 'XX.', '..X', 'XX.'],
  6: ['.XX', 'X..', 'XXX', 'X.X', 'XXX'],
  7: ['XXX', '..X', '.X.', 'X..', 'X..'],
  8: ['.X.', 'X.X', '.X.', 'X.X', '.X.'],
  9: ['XXX', 'X.X', 'XXX', '..X', 'XX.'],
  '.': ['.', '.', '.', '.', 'X'],
  '-': ['...', '...', 'XXX', '...', '...'],
  '+': ['...', '.X.', 'XXX', '.X.', '...'],
  '/': ['..X', '..X', '.X.', 'X..', 'X..'],
  '!': ['X', 'X', 'X', '.', 'X'],
  '?': ['XX.', '..X', '.X.', '...', '.X.'],
  ' ': ['..', '..', '..', '..', '..'],
};

export const LINK_ICONS = {
  link: ['..XXXX', '....XX', '...X.X', '..X...', '.X....', 'X.....'],
  mail: ['XXXXXXX', 'XX...XX', 'X.X.X.X', 'X..X..X', 'XXXXXXX'],
  doc: ['XXXXX.', 'X...XX', 'X....X', 'X.XX.X', 'X....X', 'X.XX.X', 'X....X', 'XXXXXX'],
  play: ['X....', 'XX...', 'XXX..', 'XXXX.', 'XXX..', 'XX...', 'X....'],
  cam: ['..XX...', 'XXXXXXX', 'X.XXX.X', 'X.X.X.X', 'X.XXX.X', 'XXXXXXX'],
  chat: ['XXXXXXX', 'X.....X', 'X.....X', 'XXXXXXX', '.XX....', '.X.....'],
  user: ['.XXX.', 'X...X', 'X...X', '.XXX.', '.....', 'XXXXX', 'X...X'],
  code: ['..X.X..', '.X...X.', 'X.....X', '.X...X.', '..X.X..'],
};

export const LINK_PRESETS = {
  link: { label: 'Link', color: '#8a5aa8', fg: '#ffffff', icon: 'link', url: 'https://' },
  blog: { label: 'Blog', color: '#3aa0a8', fg: '#ffffff', icon: 'doc', url: 'https://' },
  github: { label: 'GitHub', color: '#20232a', fg: '#ffffff', icon: 'code', url: 'https://github.com/' },
  mail: { label: 'Mail', color: '#d97757', fg: '#ffffff', icon: 'mail', url: 'mailto:' },
  linkedin: { label: 'LinkedIn', color: '#0a66c2', fg: '#ffffff', icon: 'user', url: 'https://linkedin.com/in/' },
  notion: { label: 'Notion', color: '#2f2f2f', fg: '#ffffff', icon: 'doc', url: 'https://' },
  velog: { label: 'Velog', color: '#20c997', fg: '#ffffff', icon: 'doc', url: 'https://velog.io/@' },
  tistory: { label: 'Tistory', color: '#e8734e', fg: '#ffffff', icon: 'doc', url: 'https://' },
  youtube: { label: 'YouTube', color: '#c4302b', fg: '#ffffff', icon: 'play', url: 'https://youtube.com/@' },
  instagram: { label: 'Instagram', color: '#c13584', fg: '#ffffff', icon: 'cam', url: 'https://instagram.com/' },
  x: { label: 'X', color: '#1e1e1e', fg: '#ffffff', icon: null, url: 'https://x.com/' },
  discord: { label: 'Discord', color: '#5865f2', fg: '#ffffff', icon: 'chat', url: 'https://discord.gg/' },
};

const GAP = 1;
const PAD_X = 4;
const BADGE_H = 13;

const glyph = (ch) => GLYPHS[ch] ?? null;

const glyphs = (text) => [...text.toUpperCase()].map(glyph).filter(Boolean);

function textWidth(gs) {
  return gs.length ? gs.reduce((w, g) => w + g[0].length, 0) + GAP * (gs.length - 1) : 0;
}

function stamp(dots, rows, x0, y0, color) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === 'X') dots.set(`${x0 + x},${y0 + y}`, color);
  });
}

export function renderLinkBadge(link = {}, options = {}) {
  const bg = hexColor(link.color, LINK_PRESETS.link.color);
  const fg = hexColor(link.fg, '#ffffff');
  const label = link.label ?? '';
  const gs = glyphs(label);
  const icon = LINK_ICONS[link.icon] ?? null;
  const iconW = icon ? Math.max(...icon.map((r) => r.length)) : 0;

  const inner = iconW + (icon && gs.length ? 3 : 0) + textWidth(gs);
  const w = Math.max(PAD_X * 2 + inner, 8);

  const dots = makeGrid();
  const fill = speckle(bg, 0.05);
  const edge = shade(bg, 0.55);
  for (let y = 0; y < BADGE_H; y++) {
    for (let x = 0; x < w; x++) {
      if ((x === 0 || x === w - 1) && (y === 0 || y === BADGE_H - 1)) continue;
      const border = y === 0 || y === BADGE_H - 1 || x === 0 || x === w - 1;
      dots.set(`${x},${y}`, border ? edge : fill(x, y));
    }
  }

  let x = PAD_X;
  if (icon) {
    stamp(dots, icon, x, Math.round((BADGE_H - icon.length) / 2), fg);
    x += iconW + (gs.length ? 3 : 0);
  }
  for (const g of gs) {
    stamp(dots, g, x, Math.round((BADGE_H - 5) / 2), fg);
    x += g[0].length + GAP;
  }

  const title = label || link.url || 'link';
  return `<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttrs(w * SCALE, BADGE_H * SCALE, options.scale ?? link.scale)} shape-rendering="crispEdges" role="img" aria-label="${escapeXml(title)}"><title>${escapeXml(title)}</title>${toMarkup(dots)}</svg>`;
}

export function badgeFiles(links = []) {
  const used = new Set();
  return links.map((link, i) => {
    const base = String(link.label ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `link${i + 1}`;
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}-${n}`;
    used.add(name);
    return { link, file: `${name}.svg` };
  });
}

export function linksSnippet(links = [], dir = 'links') {
  return badgeFiles(links)
    .filter(({ link }) => link.url)
    .map(
      ({ link, file }) =>
        `<a href="${escapeXml(link.url)}"><img src="./${dir}/${file}" alt="${escapeXml(link.label ?? '')}"></a>`,
    )
    .join('\n');
}
