import { escapeXml, measure, plainText, sizeAttrs, wrapText, FONT_STACK } from './svg.js';
import { canDraw, dotText, dotWidth, dotWrap } from './dotfont.js';

// A guestbook drawn from the comments on one GitHub Discussion.
// One sheet of lined paper: each comment is a row with the visitor's avatar,
// name, date and message.

// Same stepped-corner frame as the pixel repo card, so the two sit well together.
function cutRect(x, y, w, h, q) {
  const [l, r, t, b] = [x, x + w, y, y + h];
  return `M${l + q} ${t}H${r - q}V${t + q}H${r}V${b - q}H${r - q}V${b}`
    + `H${l + q}V${b - q}H${l}V${t + q}H${l + q}Z`;
}

const CARD_INK = '#17171a';
const CARD_FACE = '#ffffff';
const CARD_SHADE = '#d5d5da';

export const GUESTBOOK_THEMES = {
  card: {
    label: 'Pixel card',
    paper: CARD_FACE,
    ink: CARD_INK,
    sub: '#4a4a52',
    accent: CARD_INK,
    rule: CARD_SHADE,
    frame: CARD_INK,
    radius: 0,
    crisp: true,
    dots: true,
    sheet: (w, h) => {
      const q = 4;
      return `<path d="${cutRect(0, 0, w, h, q)}" fill="${CARD_INK}"/>`
        + `<path d="${cutRect(3, 3, w - 6, h - 6, q)}" fill="${CARD_FACE}"/>`
        + `<rect x="${3 + q}" y="${h - 5}" width="${w - 6 - q * 2}" height="2" fill="${CARD_SHADE}"/>`
        + `<rect x="${w - 5}" y="${3 + q}" width="2" height="${h - 6 - q * 2}" fill="${CARD_SHADE}"/>`;
    },
  },
  pixel: {
    label: 'Pixel',
    paper: '#fffaf5',
    ink: '#3b2f33',
    sub: '#9a8a8e',
    accent: '#c05b76',
    rule: '#efdfe2',
    frame: '#3b2f33',
    radius: 0,
    crisp: true,
    dots: true,
  },
  light: {
    label: 'Light',
    paper: '#ffffff',
    ink: '#1f2328',
    sub: '#8c959f',
    accent: '#c05b76',
    rule: '#eaeef2',
    frame: '#d0d7de',
    radius: 8,
    crisp: false,
    dots: false,
  },
  dark: {
    label: 'Dark',
    paper: '#0d1117',
    ink: '#e6edf3',
    sub: '#7d8590',
    accent: '#e48aa3',
    rule: '#21262d',
    frame: '#30363d',
    radius: 8,
    crisp: false,
    dots: false,
  },
};

export const DEFAULT_GUESTBOOK_THEME = 'pixel';

const DEFAULTS = {
  title: 'guestbook',
  theme: DEFAULT_GUESTBOOK_THEME,
  width: 520,
  scale: 1,
  limit: 8,
  lines: 3,
  hint: 'leave a note',
};

const WIDTH_MIN = 280;
const WIDTH_MAX = 1200;
const PAD = 18;
const HEAD = 44;
const AVATAR = 24;
const LINE = 15;
const ROW_PAD = 12;

const n = (v) => Math.round(v * 100) / 100;

function hash(seed) {
  let h = 0x811c9dc5;
  for (const ch of String(seed)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const BOTS = /\[bot\]$|^(github-actions|dependabot)$/i;

// Turns GraphQL discussion comments into guestbook entries, newest first.
// Hidden (minimized) comments, bots and empty messages are left out.
export function toEntries(comments = [], limit = DEFAULTS.limit) {
  return comments
    .filter((c) => c && !c.isMinimized)
    .map((c) => ({
      login: c.author?.login ?? 'ghost',
      avatarUrl: c.author?.avatarUrl ?? null,
      url: c.url ?? (c.author?.login ? `https://github.com/${c.author.login}` : null),
      message: plainText(c.body ?? ''),
      date: String(c.createdAt ?? '').slice(0, 10),
    }))
    .filter((e) => e.message && !BOTS.test(e.login))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, Math.max(1, limit));
}

function writer(dots) {
  const drawn = (text) => !!dots && canDraw(dots, text);

  const width = (text, size, bold = false) =>
    (drawn(text) ? dotWidth(dots, text, bold) : Math.ceil(measure(text) * size));

  const write = (text, x, y, color, size, { bold = false, end = false } = {}) => {
    if (drawn(text)) {
      const at = end ? x - dotWidth(dots, text, bold) : x;
      return dotText(dots, text, Math.round(at), y, color, { bold });
    }
    return `<text x="${n(x)}" y="${y}" font-family="${FONT_STACK}" font-size="${size}"`
      + `${bold ? ' font-weight="700"' : ''}${end ? ' text-anchor="end"' : ''}`
      + ` fill="${color}">${escapeXml(text)}</text>`;
  };

  const wrap = (text, maxWidth, size, maxLines) =>
    (drawn(text) ? dotWrap(dots, text, maxWidth, maxLines) : wrapText(text, maxWidth / size, maxLines));

  return { drawn, width, write, wrap };
}

function formatDate(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(2).replaceAll('-', '.') : '';
}

// A small pixel heart, 7 by 6 cells.
const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];

function heart(x, y, cell, color) {
  let d = '';
  HEART.forEach((row, r) => {
    [...row].forEach((on, c) => {
      if (on === '1') d += `M${x + c * cell} ${y + r * cell}h${cell}v${cell}h${-cell}z`;
    });
  });
  return `<path d="${d}" fill="${color}"/>`;
}

function avatarParts(entry, x, y, clipId, t) {
  const parts = [];
  if (entry.avatar) {
    parts.push(
      `<image href="${escapeXml(entry.avatar)}" x="${x}" y="${y}" width="${AVATAR}" height="${AVATAR}"`
      + ` preserveAspectRatio="xMidYMid slice"${t.radius ? ` clip-path="url(#${clipId})"` : ''}`
      + `${t.crisp ? ' style="image-rendering:pixelated"' : ''}/>`,
    );
  } else {
    parts.push(
      `<rect x="${x}" y="${y}" width="${AVATAR}" height="${AVATAR}"${t.radius ? ` rx="${AVATAR / 2}"` : ''}`
      + ` fill="${t.rule}"/>`,
      `<text x="${x + AVATAR / 2}" y="${y + 17}" text-anchor="middle" font-family="${FONT_STACK}"`
      + ` font-size="12" font-weight="700" fill="${t.sub}">${escapeXml([...entry.login][0].toUpperCase())}</text>`,
    );
  }
  if (t.crisp) {
    parts.push(
      `<rect x="${x - 1}" y="${y - 1}" width="${AVATAR + 2}" height="${AVATAR + 2}" fill="none"`
      + ` stroke="${t.frame}" stroke-width="2"/>`,
    );
  }
  return parts.join('');
}

function rowParts(entry, i, row, ctx) {
  const { theme: t, text, id, W } = ctx;
  const { y, lines } = row;
  const clipId = `${id}c${i}`;
  const textX = PAD + AVATAR + 10;
  const parts = [];

  if (t.radius) {
    parts.push(
      `<defs><clipPath id="${clipId}"><circle cx="${PAD + AVATAR / 2}" cy="${y + AVATAR / 2}"`
      + ` r="${AVATAR / 2}"/></clipPath></defs>`,
    );
  }
  parts.push(avatarParts(entry, PAD, y, clipId, t));

  const date = formatDate(entry.date);
  const dateW = date ? text.width(date, 10) + 12 : 0;
  const name = text.wrap(entry.login, W - textX - PAD - dateW, 12, 1)[0] ?? entry.login;
  parts.push(text.write(name, textX, y + 10, t.accent, 12, { bold: true }));
  if (date) parts.push(text.write(date, W - PAD, y + 10, t.sub, 10, { end: true }));

  lines.forEach((line, k) => {
    parts.push(text.write(line, textX, y + 27 + k * LINE, t.ink, 12));
  });

  const body = `<g><title>${escapeXml(`${entry.login}: ${entry.message}`)}</title>${parts.join('')}</g>`;
  return entry.url ? `<a href="${escapeXml(entry.url)}" target="_blank" rel="noopener">${body}</a>` : body;
}

export function renderGuestbook(entries = [], options = {}) {
  // Options left undefined (an unset env var, say) keep their defaults.
  const given = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined));
  const opts = { ...DEFAULTS, ...given };
  const themeId = opts.theme in GUESTBOOK_THEMES ? opts.theme : DEFAULT_GUESTBOOK_THEME;
  const t = GUESTBOOK_THEMES[themeId];
  const text = writer(t.dots ? opts.dots : null);

  const W = Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(Number(opts.width) || DEFAULTS.width)));
  const list = entries.slice(0, Math.max(1, opts.limit));
  const id = `gb${hash(`${themeId}|${W}|${list.map((e) => e.login + e.date).join('|')}`).toString(36)}`;

  const textW = W - PAD * 2 - AVATAR - 10;
  const rows = [];
  let y = HEAD + ROW_PAD;
  for (const e of list) {
    const lines = text.wrap(e.message, textW, 12, opts.lines);
    const h = Math.max(AVATAR, 17 + lines.length * LINE);
    rows.push({ y, h, lines });
    y += h + ROW_PAD * 2;
  }

  const H = list.length ? y - ROW_PAD + 4 : HEAD + 52;

  const parts = [
    t.sheet
      ? t.sheet(W, H)
      : `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${t.paper}" stroke="${t.frame}"`
        + ` stroke-width="${t.crisp ? 2 : 1}"${t.radius ? ` rx="${t.radius}"` : ''}/>`,
  ];

  // header: heart, title, count, hint
  const heartCell = 2;
  parts.push(heart(PAD, 16, heartCell, t.accent));
  const titleX = PAD + 7 * heartCell + 8;
  if (text.drawn(opts.title)) {
    parts.push(
      text.write(opts.title, titleX, 27, t.ink, 15, { bold: true }),
      text.write(String(list.length), titleX + text.width(opts.title, 15, true) + 6, 27, t.sub, 11),
    );
  } else {
    parts.push(
      `<text x="${titleX}" y="27" font-family="${FONT_STACK}" fill="${t.ink}">`
      + `<tspan font-size="15" font-weight="700">${escapeXml(opts.title)}</tspan>`
      + `<tspan dx="6" font-size="11" fill="${t.sub}">${list.length}</tspan></text>`,
    );
  }
  if (opts.hint) parts.push(text.write(opts.hint, W - PAD, 27, t.sub, 11, { end: true }));
  parts.push(`<path d="M${PAD} ${HEAD - 4}H${W - PAD}" stroke="${t.frame}" stroke-width="${t.crisp ? 2 : 1}"/>`);

  if (!list.length) {
    parts.push(text.write('no notes yet', PAD, HEAD + 28, t.sub, 12));
  } else {
    const ctx = { theme: t, text, id, W };
    list.forEach((e, i) => {
      parts.push(rowParts(e, i, rows[i], ctx));
      if (i < list.length - 1) {
        const ly = rows[i].y + rows[i].h + ROW_PAD;
        parts.push(
          `<path d="M${PAD} ${ly}H${W - PAD}" stroke="${t.rule}" stroke-width="1"`
          + `${t.crisp ? ' stroke-dasharray="2 2"' : ''}/>`,
        );
      }
    });
  }

  const label = `${opts.title} ${list.length}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttrs(W, H, opts.scale)} id="${id}"`
    + `${t.crisp ? ' shape-rendering="crispEdges"' : ''} role="img" aria-label="${escapeXml(label)}">`
    + `<title>${escapeXml(label)}</title>${parts.join('')}</svg>`;
}

export function guestbookSnippet(discussionUrl, file = 'guestbook.svg') {
  const href = discussionUrl || '../../discussions';
  return `<a href="${escapeXml(href)}"><img src="./${escapeXml(file)}" width="100%" alt="Guestbook"></a>`;
}
