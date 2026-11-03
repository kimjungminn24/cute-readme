import { escapeXml, wrapText, plainText, measure, sizeAttrs, FONT_STACK } from './svg.js';
import { canDraw, dotText, dotWidth, dotWrap } from './dotfont.js';
import { REPO_CARD_THEMES, DEFAULT_REPO_CARD_THEME } from './repocard-themes.js';

export { REPO_CARD_THEMES, DEFAULT_REPO_CARD_THEME };

const PAD = 16;
const ICON = 16;
const DESC_SIZE = 12.5;
const DESC_LH = 18;
const DEFAULT_WIDTH = 400;

export const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Java: '#b07219',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Lua: '#000080',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Scala: '#c22d40',
  'Jupyter Notebook': '#da5b0b',
};

const LANG_FALLBACK = '#8b949e';

const ICONS = {
  book: (x, y, c) => bookIcon(x, y, c),
  star: (cx, cy, r, c) => star(cx, cy, r, c),
  fork: (x, y, c) => forkIcon(x, y, c),
  dot: (x, y, c) => `<circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${c}"/>`,
};

export function compact(n) {
  const v = Number(n) || 0;
  if (v < 1000) return String(v);
  if (v < 1_000_000) return `${(v / 1000).toFixed(v < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
}

function patternId(seed) {
  let h = 0x811c9dc5;
  for (const ch of String(seed)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `rc${h.toString(36)}`;
}

function star(cx, cy, r, fill) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 ? r * 0.46 : r;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

const bookIcon = (x, y, c) =>
  `<g fill="none" stroke="${c}" stroke-width="1.5">`
  + `<path d="M${x + 2} ${y + 2}h${ICON - 5}v${ICON - 4}h-${ICON - 7}a2 2 0 0 1-2-2z"/>`
  + `<path d="M${x + 2} ${y + ICON - 4}a2 2 0 0 1 2-2h${ICON - 7}"/>`
  + `</g>`;

const forkIcon = (x, y, c) =>
  `<g fill="none" stroke="${c}" stroke-width="1.5">`
  + `<circle cx="${x + 3.5}" cy="${y + 3.5}" r="1.9"/>`
  + `<circle cx="${x + 11.5}" cy="${y + 3.5}" r="1.9"/>`
  + `<circle cx="${x + 7.5}" cy="${y + 12.5}" r="1.9"/>`
  + `<path d="M${x + 3.5} ${y + 5.4}v1.4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V${y + 5.4}M${x + 7.5} ${y + 8.8}v1.8"/>`
  + `</g>`;

function textWriter(t, dots) {
  const font = t.font ?? FONT_STACK;

  const drawn = (text) => dots && canDraw(dots, text);

  const width = (text, size, bold) =>
    (drawn(text) ? dotWidth(dots, text, bold) : Math.ceil(measure(text) * size));

  const write = (text, x, y, color, size, { bold = false, mid = false } = {}) => {
    const at = mid ? x - width(text, size, bold) / 2 : x;
    if (drawn(text)) return dotText(dots, text, Math.round(at), y, color, { bold });
    return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}"`
      + `${bold ? ' font-weight="600"' : ''}${mid ? ' text-anchor="middle"' : ''}`
      + ` fill="${color}">${escapeXml(text)}</text>`;
  };

  return { drawn, width, write };
}

function repoCardLayout(repo, options) {
  const t = REPO_CARD_THEMES[options.theme] ?? REPO_CARD_THEMES[DEFAULT_REPO_CARD_THEME];
  const w = Math.max(240, Math.round(options.width ?? DEFAULT_WIDTH));
  const name = repo.name || 'repository';
  const id = patternId(`${options.theme ?? ''}|${repo.owner ?? ''}/${name}|${w}`);

  const dots = t.dot && options.dots ? options.dots : null;
  const text = textWriter(t, dots);

  const plain = plainText(repo.description ?? '');
  const desc = dots && canDraw(dots, plain)
    ? dotWrap(dots, plain, w - PAD * 2, 2)
    : wrapText(plain, (w - PAD * 2) / DESC_SIZE, 2);

  const headY = PAD + 4;
  const descY = headY + ICON + 18;
  const metaY = descY + desc.length * DESC_LH + 8;

  const chipText = repo.archived ? 'Archived' : repo.fork ? 'Fork' : 'Public';

  return {
    repo, t, w, id, name, text, desc,
    headY, descY, metaY,
    h: metaY + 12 + (t.grow ?? 0),
    title: options.full && repo.owner ? `${repo.owner}/${name}` : name,
    chipText,

    chipW: text.width(chipText, 11) + (dots ? 20 : 16),
    stroke: t.thick ? 2 : 1,
    round: t.radius ? ` rx="${t.radius}"` : '',
    ic: t.icons ?? ICONS,
  };
}

function backgroundParts(L) {
  const { t, w, h, id, round } = L;

  if (t.frame) return [t.frame(w, h)];

  const parts = [`<rect width="${w}" height="${h}" fill="${t.bg}"${round}/>`];

  if (t.deco) {
    const clip = `${id}c`;
    parts.push(
      `<defs><clipPath id="${clip}">`
      + `<rect width="${w}" height="${h}"${round}/></clipPath></defs>`
      + `<g clip-path="url(#${clip})">${t.deco(w, h, id)}</g>`,
    );
  }

  return parts;
}

function animParts(L, options) {
  const { t, w, h, id } = L;
  if (!t.anim || options.sparkle === false) return [];

  return [
    `<style>${t.anim(w, id, h)}`
    + `@media(prefers-reduced-motion:reduce){#${id} *{animation:none}}</style>`,
  ];
}

function borderParts(L) {
  const { t, w, h, stroke, round } = L;
  if (t.frame) return [];

  const inset = stroke / 2;
  return [
    `<rect x="${inset}" y="${inset}" width="${w - stroke}" height="${h - stroke}" fill="none"`
    + ` stroke="${t.border}" stroke-width="${stroke}"${round}/>`,
  ];
}

function headParts(L) {
  const { t, w, id, ic, text, title, headY, chipText, chipW } = L;

  const titleFill = typeof t.title === 'function' ? t.title(id) : t.title;

  const chipBox = t.chipBox ?? ((cx, cy, cw, ch) =>
    `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${t.radius ? 9 : 0}"`
    + ` fill="${t.chipFill ?? 'none'}" stroke="${t.chipBorder}"/>`);

  return [
    ic.book(PAD, headY, t.text),
    text.write(title, PAD + ICON + 8, headY + 13, titleFill, 15, { bold: true }),
    chipBox(w - PAD - chipW, headY + 1, chipW, 18)
      // Dot glyphs fill the full 11 rows above the baseline, so they sit 2 lower to centre in the chip.
      + text.write(chipText, w - PAD - chipW / 2, headY + (text.drawn(chipText) ? 16 : 14), t.chip, 11, { mid: true }),
  ];
}

function descParts(L) {
  const { t, text, desc, descY } = L;
  return desc.map((line, i) => text.write(line, PAD, descY + i * DESC_LH, t.text, DESC_SIZE));
}

function metaParts(L) {
  const { repo, t, ic, text, metaY } = L;
  const parts = [];
  let x = PAD;

  if (repo.language) {
    const dot = LANG_COLORS[repo.language] ?? LANG_FALLBACK;
    parts.push(ic.dot(x, metaY, dot));
    parts.push(text.write(repo.language, x + 16, metaY, t.meta, 12));
    x += 16 + text.width(repo.language, 12) + 18;
  }

  for (const [icon, value] of [
    ['star', repo.stars],
    ['fork', repo.forks],
  ]) {
    if (!value) continue;
    const label = compact(value);
    parts.push(
      icon === 'star'
        ? ic.star(x + 7, metaY - 4, 7, t.meta)
        : ic.fork(x, metaY - 12, t.meta),
    );
    parts.push(text.write(label, x + 19, metaY, t.meta, 12));
    x += 19 + text.width(label, 12) + 18;
  }

  return parts;
}

export function renderRepoCard(repo = {}, options = {}) {
  const L = repoCardLayout(repo, options);
  const { t, w, h, id, name } = L;
  const label = `${repo.owner ? `${repo.owner}/` : ''}${name}`;

  const parts = [
    ...backgroundParts(L),
    ...animParts(L, options),
    ...borderParts(L),
    ...headParts(L),
    ...descParts(L),
    ...metaParts(L),
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttrs(w, h, options.scale)}`
    + `${t.deco ? ` id="${id}"` : ''}`
    + `${t.crisp ? ' shape-rendering="crispEdges"' : ''} role="img" aria-label="${escapeXml(label)}">`
    + `<title>${escapeXml(label)}</title>${parts.join('')}</svg>`;
}

export function parseRepo(input) {
  const s = String(input ?? '').trim().replace(/\.git$/, '');
  const m = s.match(/(?:github\.com\/)?([\w.-]+)\/([\w.-]+)\/?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

export function cardFile(repo) {
  const base = String(repo?.name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'repo';
  return `${base}.svg`;
}

export function cardSnippet(repos = [], dir = 'cards') {
  return repos
    .map(
      (r) => `<a href="https://github.com/${r.owner}/${r.name}">`
        + `<img src="./${dir}/${cardFile(r)}" alt="${escapeXml(`${r.owner}/${r.name}`)}"></a>`,
    )
    .join('\n');
}
