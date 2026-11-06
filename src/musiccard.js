import { escapeXml, measure, sizeAttrs, wrapText, FONT_STACK } from './svg.js';
import { canDraw, dotText, dotWidth, dotWrap } from './dotfont.js';

// A "now playing" card for a song on YouTube. The README wraps it in a link to the video,
// so it needs no workflow: the card is drawn once in the builder and committed.

const INK = '#17171a';
const FACE = '#ffffff';
const SHADE = '#d5d5da';

export const MUSIC_CARD_THEMES = {
  pixel: {
    label: 'Pixel',
    bg: FACE, ink: INK, sub: '#4a4a52', track: SHADE, accent: '#c05b76',
    border: INK, edge: INK, radius: 0, crisp: true, dots: true, stepped: true,
  },
  light: {
    label: 'Light',
    bg: '#ffffff', ink: '#1f2328', sub: '#656d76', track: '#eaeef2', accent: '#c05b76',
    border: '#d0d7de', edge: INK, radius: 10, crisp: false, dots: false, stepped: false,
  },
  dark: {
    label: 'Dark',
    bg: '#0d1117', ink: '#e6edf3', sub: '#9198a1', track: '#30363d', accent: '#e48aa3',
    border: '#30363d', edge: '#484f58', radius: 10, crisp: false, dots: false, stepped: false,
  },
};

export const DEFAULT_MUSIC_THEME = 'pixel';

const H = 112;
const COVER = 72;
const PAD = 20;

const n = (v) => Math.round(v * 100) / 100;

function hash(seed) {
  let h = 0x811c9dc5;
  for (const ch of String(seed)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const ID = /^[A-Za-z0-9_-]{11}$/;

// Pulls the 11-character video id out of the usual YouTube URL shapes, or a bare id.
export function parseYouTube(input) {
  const s = String(input ?? '').trim();
  if (ID.test(s)) return s;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v')
      ?? url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1]
      ?? null;
  }
  return id && ID.test(id) ? id : null;
}

export const youtubeUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
export const thumbnailUrl = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

export function musicFile(song) {
  const base = String(song?.title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || song?.id || 'song'}.svg`;
}

function cutRect(x, y, w, h, q) {
  const [l, r, t, b] = [x, x + w, y, y + h];
  return `M${l + q} ${t}H${r - q}V${t + q}H${r}V${b - q}H${r - q}V${b}`
    + `H${l + q}V${b - q}H${l}V${t + q}H${l + q}Z`;
}

function writer(dots) {
  const drawn = (text) => !!dots && canDraw(dots, text);
  const width = (text, size, bold = false) =>
    (drawn(text) ? dotWidth(dots, text, bold) : Math.ceil(measure(text) * size));
  const write = (text, x, y, color, size, { bold = false, spacing = 0 } = {}) => {
    if (drawn(text)) return dotText(dots, text, Math.round(x), y, color, { bold });
    return `<text x="${n(x)}" y="${y}" font-family="${FONT_STACK}" font-size="${size}"`
      + `${bold ? ' font-weight="700"' : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}`
      + ` fill="${color}">${escapeXml(text)}</text>`;
  };
  const fit = (text, maxWidth, size) =>
    (drawn(text) ? dotWrap(dots, text, maxWidth, 1) : wrapText(text, maxWidth / size, 1))[0] ?? '';
  return { width, write, fit };
}

// A pixel disc: one rect per row, so it stays crisp at any size.
function disc(cx, cy, r, color) {
  let d = '';
  for (let y = -r; y < r; y++) {
    const half = Math.floor(Math.sqrt(r * r - (y + 0.5) ** 2));
    if (half > 0) d += `M${cx - half} ${cy + y}h${half * 2}v1h${-half * 2}z`;
  }
  return `<path d="${d}" fill="${color}"/>`;
}

function vinyl(x, y, t, label, id) {
  const cx = x + COVER / 2;
  const cy = y + COVER / 2;
  const r = COVER / 2;
  // Only the label turns: a whole pixel disc goes jagged when it rotates.
  return disc(cx, cy, r, t.edge)
    + disc(cx, cy, r - 1, INK)
    + `<path d="M${cx - r + 6} ${cy}h${r - 18}M${cx + 12} ${cy}h${r - 18}" stroke="#3a3a40" stroke-width="1"/>`
    + disc(cx, cy, r - 8, '#2a2a30')
    + disc(cx, cy, r - 11, INK)
    + `<g class="${id}spin">`
    + disc(cx, cy, 12, label)
    + `<rect x="${cx - 6}" y="${cy - 9}" width="4" height="3" fill="#ffffff" opacity="0.6"/>`
    + `</g>`
    + disc(cx, cy, 2, t.bg);
}

function cover(song, x, y, t, id) {
  if (!song.cover) {
    const labels = ['#c05b76', '#f2a541', '#5fa8d3', '#7fb069', '#9b72cf'];
    return vinyl(x, y, t, labels[hash(song.title || song.id) % labels.length], id);
  }
  const clip = `${id}cv`;
  return `<defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${COVER}" height="${COVER}"`
    + `${t.radius ? ' rx="8"' : ''}/></clipPath></defs>`
    + `<image href="${escapeXml(song.cover)}" x="${x - 32}" y="${y}" width="${COVER + 64}" height="${COVER}"`
    + ` preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})"/>`
    + (t.stepped
      ? `<rect x="${x - 1}" y="${y - 1}" width="${COVER + 2}" height="${COVER + 2}" fill="none" stroke="${t.ink}" stroke-width="2"/>`
      : '');
}

// Four bars that bounce while the song "plays".
function equalizer(x, y, color, id) {
  const heights = [6, 10, 4, 8];
  return heights.map((h, i) =>
    `<rect class="${id}eq ${id}eq${i}" x="${x + i * 4}" y="${y - h}" width="2" height="${h}" fill="${color}"/>`).join('');
}

function controls(x, y, color) {
  // previous, play, next as small pixel shapes
  const tri = (ox, dir) => {
    let d = '';
    for (let i = 0; i < 4; i++) {
      const h = 8 - i * 2;
      const col = dir > 0 ? ox + i : ox + 3 - i;
      d += `M${col} ${y - 4 + i}h1v${h}h-1z`;
    }
    return d;
  };
  const prev = `M${x} ${y - 4}h2v8h-2z` + tri(x + 2, -1);
  const play = tri(x + 16, 1) + `M${x + 20} ${y - 1}h1v2h-1z`;
  const next = tri(x + 30, 1) + `M${x + 34} ${y - 4}h2v8h-2z`;
  return `<path d="${prev}${play}${next}" fill="${color}"/>`;
}

export function renderMusicCard(song = {}, options = {}) {
  const themeId = options.theme in MUSIC_CARD_THEMES ? options.theme : DEFAULT_MUSIC_THEME;
  const t = MUSIC_CARD_THEMES[themeId];
  const text = writer(t.dots ? options.dots : null);
  const W = Math.min(600, Math.max(300, Math.round(Number(options.width) || 400)));
  const title = String(song.title || 'Untitled');
  const artist = String(song.artist || '');
  const id = `mc${hash(`${themeId}|${W}|${title}|${artist}|${song.id ?? ''}`).toString(36)}`;
  const parts = [];

  // card body
  if (t.stepped) {
    parts.push(
      `<path d="${cutRect(0, 0, W, H, 4)}" fill="${t.border}"/>`,
      `<path d="${cutRect(3, 3, W - 6, H - 6, 4)}" fill="${t.bg}"/>`,
      `<rect x="7" y="${H - 5}" width="${W - 14}" height="2" fill="${SHADE}"/>`,
      `<rect x="${W - 5}" y="7" width="2" height="${H - 14}" fill="${SHADE}"/>`,
    );
  } else {
    parts.push(`<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${t.radius}" fill="${t.bg}" stroke="${t.border}"/>`);
  }

  parts.push(cover(song, PAD, (H - COVER) / 2, t, id));

  const tx = PAD + COVER + 16;
  const room = W - tx - PAD;

  parts.push(equalizer(tx, 30, t.accent, id));
  parts.push(text.write('NOW PLAYING', tx + 22, 30, t.sub, 9, { spacing: 1 }));
  parts.push(text.write(text.fit(title, room, 14), tx, 50, t.ink, 14, { bold: true }));
  if (artist) parts.push(text.write(text.fit(artist, room, 11), tx, 65, t.sub, 11));

  // progress bar with a square knob
  const barY = 80;
  const barW = room - 50;
  const done = Math.round(barW * 0.38);
  parts.push(
    `<rect x="${tx}" y="${barY}" width="${barW}" height="2" fill="${t.track}"/>`,
    `<rect x="${tx}" y="${barY}" width="${done}" height="2" fill="${t.accent}"/>`,
    `<rect x="${tx + done - 3}" y="${barY - 2}" width="6" height="6" fill="${t.ink}"/>`,
    controls(W - PAD - 36, barY + 1, t.ink),
  );

  const css = `@keyframes ${id}b{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}`
    + `@keyframes ${id}r{to{transform:rotate(360deg)}}`
    + `#${id} .${id}eq{transform-box:fill-box;transform-origin:bottom;animation:${id}b .9s ease-in-out infinite}`
    + [0, 1, 2, 3].map((i) => `#${id} .${id}eq${i}{animation-delay:${-i * 0.23}s}`).join('')
    + `#${id} .${id}spin{transform-box:fill-box;transform-origin:center;animation:${id}r 4s linear infinite}`
    + `@media(prefers-reduced-motion:reduce){#${id} .${id}eq,#${id} .${id}spin{animation:none}}`;

  const label = artist ? `${title} by ${artist}` : title;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttrs(W, H, options.scale)} id="${id}"`
    + `${t.crisp ? ' shape-rendering="crispEdges"' : ''} role="img" aria-label="${escapeXml(label)}">`
    + `<title>${escapeXml(label)}</title><style>${css}</style>${parts.join('')}</svg>`;
}
