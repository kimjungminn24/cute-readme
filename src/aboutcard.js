import { escapeXml, measure, wrapText, FONT_STACK } from './svg.js';
import { canDraw, dotText, dotWidth, dotWrap } from './dotfont.js';

// An "about me" card: a little pixel window with one row per line,
// each row a pixel icon, a short label and a value.

export const ABOUT_THEMES = {
  pixel: {
    label: 'Pixel',
    bg: '#ffffff', ink: '#17171a', sub: '#4a4a52', accent: '#c05b76',
    bar: '#17171a', barInk: '#ffffff', frame: '#17171a', shade: '#d5d5da',
  },
  candy: {
    label: 'Candy',
    bg: '#fff6f9', ink: '#5b3a48', sub: '#9b7a86', accent: '#e0607e',
    bar: '#ffc2d4', barInk: '#5b3a48', frame: '#5b3a48', shade: '#f6d3de',
  },
  soda: {
    label: 'Soda',
    bg: '#f3fbff', ink: '#234a5c', sub: '#6b8a97', accent: '#2f95d0',
    bar: '#bfe6ff', barInk: '#234a5c', frame: '#234a5c', shade: '#d2eaf7',
  },
  matcha: {
    label: 'Matcha',
    bg: '#f7fbef', ink: '#34482a', sub: '#7a8a6c', accent: '#5f9a3a',
    bar: '#d6ecb8', barInk: '#34482a', frame: '#34482a', shade: '#e2efcf',
  },
  light: {
    label: 'Light',
    bg: '#ffffff', ink: '#1f2328', sub: '#8c959f', accent: '#c05b76',
    bar: '#f6f8fa', barInk: '#1f2328', frame: '#d0d7de', shade: null, plain: true,
  },
  dark: {
    label: 'Dark',
    bg: '#0d1117', ink: '#e6edf3', sub: '#7d8590', accent: '#e48aa3',
    bar: '#161b22', barInk: '#e6edf3', frame: '#30363d', shade: null, plain: true,
  },
  night: {
    label: 'Night',
    bg: '#1d1933', ink: '#f3eefe', sub: '#a59cc4', accent: '#ff9ec4',
    bar: '#3a3266', barInk: '#f3eefe', frame: '#0d0b1a', shade: '#2b2549',
  },
};

export const DEFAULT_ABOUT_THEME = 'pixel';

// 8x8 icons. '#' takes the accent colour, 'o' the ink colour, '+' white.
export const ABOUT_ICONS = {
  rocket: [
    '...#....',
    '..###...',
    '..#+#...',
    '..###...',
    '.#####..',
    '.#.#.#..',
    '...o....',
    '..o.o...',
  ],
  sprout: [
    '........',
    '.##..##.',
    '###.###.',
    '.####...',
    '...#....',
    '...#....',
    '.ooooo..',
    '..ooo...',
  ],
  heart: [
    '........',
    '.##.##..',
    '#######.',
    '#+#####.',
    '.#####..',
    '..###...',
    '...#....',
    '........',
  ],
  chat: [
    '........',
    '.#####..',
    '#######.',
    '#+#+#+#.',
    '#######.',
    '.#####..',
    '.##.....',
    '.#......',
  ],
  mail: [
    '........',
    '#######.',
    '#+###+#.',
    '##+#+##.',
    '###+###.',
    '#######.',
    '#######.',
    '........',
  ],
  star: [
    '...#....',
    '...#....',
    '..###...',
    '#######.',
    '.#####..',
    '..###...',
    '.##.##..',
    '.#...#..',
  ],
  code: [
    '........',
    '..#..#..',
    '.#..#...',
    '#...#...',
    '.#..#...',
    '..##....',
    '........',
    '........',
  ],
  game: [
    '........',
    '.######.',
    '########',
    '#o##+#+#',
    'ooo#####',
    '#o####+#',
    '.##..##.',
    '........',
  ],
  music: [
    '...####.',
    '...#..#.',
    '...#..#.',
    '...#..#.',
    '.###.##.',
    '####.##.',
    '.##.....',
    '........',
  ],
  coffee: [
    '..o.o...',
    '...o.o..',
    '######..',
    '#++++###',
    '#++++#.#',
    '#++++###',
    '.####...',
    '........',
  ],
  book: [
    '........',
    '###.###.',
    '#++#++#.',
    '#++#++#.',
    '#++#++#.',
    '###.###.',
    '...o....',
    '........',
  ],
  sparkle: [
    '...#....',
    '...#....',
    '..#+#...',
    '##+++##.',
    '..#+#...',
    '...#....',
    '...#....',
    '........',
  ],
};

export const DEFAULT_ABOUT_ROWS = [
  { icon: 'rocket', label: 'working on', text: 'something cute' },
  { icon: 'sprout', label: 'learning', text: 'something new' },
  { icon: 'heart', label: 'interested in', text: 'pixel art' },
  { icon: 'mail', label: 'reach me', text: 'github.com/you' },
];

const PAD = 16;
const BAR = 24;
const ROW = 30;
const CELL = 2;

const n = (v) => Math.round(v * 100) / 100;

function hash(seed) {
  let h = 0x811c9dc5;
  for (const ch of String(seed)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function cutRect(x, y, w, h, q) {
  const [l, r, t, b] = [x, x + w, y, y + h];
  return `M${l + q} ${t}H${r - q}V${t + q}H${r}V${b - q}H${r - q}V${b}`
    + `H${l + q}V${b - q}H${l}V${t + q}H${l + q}Z`;
}

function writer(dots) {
  const drawn = (text) => !!dots && canDraw(dots, text);
  const width = (text, size, bold = false) =>
    (drawn(text) ? dotWidth(dots, text, bold) : Math.ceil(measure(text) * size * (bold ? 1.08 : 1)));
  const write = (text, x, y, color, size, { bold = false } = {}) => {
    if (drawn(text)) return dotText(dots, text, Math.round(x), y, color, { bold });
    return `<text x="${n(x)}" y="${y}" font-family="${FONT_STACK}" font-size="${size}"`
      + `${bold ? ' font-weight="700"' : ''} fill="${color}">${escapeXml(text)}</text>`;
  };
  const fit = (text, maxWidth, size) =>
    (drawn(text) ? dotWrap(dots, text, maxWidth, 1) : wrapText(text, maxWidth / size, 1))[0] ?? '';
  return { width, write, fit };
}

export function iconArt(id, x, y, t) {
  const rows = ABOUT_ICONS[id] ?? ABOUT_ICONS.star;
  const paths = { '#': '', o: '', '+': '' };
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch in paths) paths[ch] += `M${x + c * CELL} ${y + r * CELL}h${CELL}v${CELL}h${-CELL}z`;
  }));
  const fill = { '#': t.accent, o: t.ink, '+': '#ffffff' };
  return Object.entries(paths)
    .filter(([, d]) => d)
    .map(([ch, d]) => `<path d="${d}" fill="${fill[ch]}"/>`)
    .join('');
}

// A tiny four-point twinkle for the corners.
function twinkle(x, y, color) {
  return `<path d="M${x} ${y - 4}h2v4h4v2h-4v4h-2v-4h-4v-2h4z" fill="${color}"/>`;
}

export function renderAboutCard(rows = DEFAULT_ABOUT_ROWS, options = {}) {
  const themeId = options.theme in ABOUT_THEMES ? options.theme : DEFAULT_ABOUT_THEME;
  const t = ABOUT_THEMES[themeId];
  const text = writer(t.plain ? null : options.dots);
  const W = Math.min(800, Math.max(280, Math.round(Number(options.width) || 460)));
  const title = String(options.title ?? 'about me');
  const list = (Array.isArray(rows) ? rows : []).filter((r) => r && (r.label || r.text)).slice(0, 8);

  const natural = BAR + 18 + list.length * ROW + 8;
  const H = Math.max(natural, Math.round(Number(options.height) || 0), BAR + 60);
  const id = `ab${hash(`${themeId}|${W}|${H}|${title}|${JSON.stringify(list)}`).toString(36)}`;

  const parts = [];
  if (t.plain) {
    const clip = `${id}c`;
    parts.push(
      `<defs><clipPath id="${clip}"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10"/></clipPath></defs>`,
      `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${t.bg}"/>`,
      `<rect x="0" y="0" width="${W}" height="${BAR + 4}" fill="${t.bar}" clip-path="url(#${clip})"/>`,
      `<path d="M0 ${BAR + 4.5}H${W}" stroke="${t.frame}"/>`,
      `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="${t.frame}"/>`,
    );
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      parts.push(`<circle cx="${PAD + i * 14}" cy="${(BAR + 4) / 2}" r="5" fill="${c}"/>`);
    });
    parts.push(text.write(title, W / 2 - text.width(title, 12, true) / 2, 19, t.barInk, 12, { bold: true }));
  } else {
    parts.push(
      `<path d="${cutRect(0, 0, W, H, 4)}" fill="${t.frame}"/>`,
      `<path d="${cutRect(3, 3, W - 6, H - 6, 4)}" fill="${t.bg}"/>`,
      // title bar
      `<path d="M7 3H${W - 7}V7H${W - 3}V${BAR + 3}H3V7H7Z" fill="${t.bar}"/>`,
      `<rect x="3" y="${BAR + 3}" width="${W - 6}" height="2" fill="${t.frame}"/>`,
      // shade
      `<rect x="7" y="${H - 5}" width="${W - 14}" height="2" fill="${t.shade}"/>`,
      `<rect x="${W - 5}" y="${BAR + 7}" width="2" height="${H - BAR - 14}" fill="${t.shade}"/>`,
    );
    // a small heart before the title, three buttons on the right
    parts.push(iconArt('heart', PAD - 4, 7, { ...t, ink: t.barInk }));
    parts.push(text.write(title, PAD + 16, 20, t.barInk, 12, { bold: true }));
    ['#ff8fab', '#ffd166', '#7cd3a4'].forEach((c, i) => {
      const bx = W - PAD - 30 + i * 11;
      parts.push(
        `<rect x="${bx - 1}" y="9" width="10" height="10" fill="${t.frame}"/>`,
        `<rect x="${bx + 1}" y="11" width="6" height="6" fill="${c}"/>`,
      );
    });
  }

  // rows, spread over the card when it is taller than it needs to be
  const labels = list.map((r) => String(r.label ?? ''));
  const labelW = Math.max(0, ...labels.map((l) => text.width(l, 12, true)));
  const valueX = PAD + 26 + labelW + 12;
  const top = BAR + 18;
  const step = list.length ? Math.max(ROW, Math.floor((H - top - 12) / list.length)) : ROW;

  list.forEach((r, i) => {
    const y = top + i * step + Math.floor((step - ROW) / 2);
    parts.push(iconArt(r.icon, PAD, y, t));
    parts.push(text.write(String(r.label ?? ''), PAD + 26, y + 12, t.accent, 12, { bold: true }));
    const value = text.fit(String(r.text ?? ''), W - valueX - PAD, 12);
    parts.push(text.write(value, valueX, y + 12, t.ink, 12));
  });

  // corner twinkles
  parts.push(
    `<g class="${id}tw">${twinkle(W - PAD - 6, BAR + 20, t.accent)}</g>`,
    `<g class="${id}tw ${id}tw2">${twinkle(W - PAD - 20, H - 18, t.sub)}</g>`,
  );

  const css = `@keyframes ${id}k{0%,100%{opacity:1}50%{opacity:.25}}`
    + `#${id} .${id}tw{animation:${id}k 2.4s steps(2) infinite}`
    + `#${id} .${id}tw2{animation-delay:-1.2s}`
    + `@media(prefers-reduced-motion:reduce){#${id} .${id}tw{animation:none}}`;

  const scale = Number(options.scale) > 0 ? Number(options.scale) : 1;
  const size = scale === 1 ? `width="${W}" height="${H}"` : `width="${Math.round(W * scale)}" height="${Math.round(H * scale)}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="0 0 ${W} ${H}" id="${id}"`
    + `${t.plain ? '' : ' shape-rendering="crispEdges"'} role="img" aria-label="${escapeXml(title)}">`
    + `<title>${escapeXml(title)}</title><style>${css}</style>${parts.join('')}</svg>`;
}
