function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

const n1 = (v) => Math.round(v * 10) / 10;

function starField(w, h, count) {
  const rnd = seeded(20260814);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = Math.round(rnd() * w);
    const y = Math.round(rnd() * h);
    const cls = i % 7 === 3 ? ` class="tw t${(i % 3) + 1}"` : '';

    out += `<circle${cls} cx="${x}" cy="${y}" r="${n1(0.5 + rnd() * 0.9)}"`
      + ` fill="#ffffff" opacity="${n1(0.2 + rnd() * 0.5)}"/>`;
  }
  return out;
}

const CONTINENTS = [
  'M-16-7L-13-11L-8-12L-3-9L-5-4L-9-3L-8-6L-12-4Z',
  'M0-13L6-11L9-12L13-6L9-2L11 3L7 9L4 4L6 0L1-3L3-7L-1-9Z',
  'M-12 1L-8-1L-5 3L-7 7L-6 12L-9 10L-11 5Z',
  'M7 11L12 9L13 12L9 13Z',
];

const globe = (cx, cy, r, id) =>
  `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#3d8ec4" opacity="0.18"/>`
  + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}e)"/>`

  + `<g clip-path="url(#${id}p)" fill="#4fae72">`
  + `<g transform="translate(${cx} ${cy}) scale(${n1(r / 20)})">`
  + CONTINENTS.map((d) => `<path d="${d}"/>`).join('')
  + `</g></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#8fd6ff" stroke-opacity="0.45"/>`;

const px = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;

const PIXEL_INK = '#17171a';
const PIXEL_FACE = '#ffffff';
const PIXEL_SHADE = '#d5d5da';

function cutRect(x, y, w, h, q) {
  const [l, r, t, b] = [x, x + w, y, y + h];
  return `M${l + q} ${t}H${r - q}V${t + q}H${r}V${b - q}H${r - q}V${b}`
    + `H${l + q}V${b - q}H${l}V${t + q}H${l + q}Z`;
}

const PIXEL_ICONS = {
  book: (x, y, c) =>
    px(x + 2, y + 3, 12, 10, c) + px(x + 4, y + 5, 3, 6, PIXEL_FACE) + px(x + 9, y + 5, 3, 6, PIXEL_FACE),

  star: (cx, cy, r, c) =>
    [
      [[5, 2]], [[5, 2]], [[4, 4]], [[0, 12]], [[0, 12]], [[1, 10]],
      [[2, 8]], [[3, 6]], [[2, 8]], [[2, 8]], [[2, 2], [8, 2]], [[2, 1], [9, 1]],
    ]
      .flatMap((runs, row) => runs.map(([col, n]) => px(cx - 6 + col, cy - 6 + row, n, 1, c)))
      .join(''),
  fork: (x, y, c) =>
    px(x + 1, y + 1, 4, 4, c) + px(x + 11, y + 1, 4, 4, c) + px(x + 6, y + 11, 4, 4, c)
    + px(x + 2, y + 5, 2, 3, c) + px(x + 12, y + 5, 2, 3, c)
    + px(x + 2, y + 8, 12, 2, c) + px(x + 7, y + 10, 2, 2, c),
  dot: (x, y, c) => px(x, y - 9, 10, 10, c),
};

const ZEBRA_STRIPES = [
  'M10 0C22 14 2 28 10 40L26 40C18 28 38 14 26 0Z',
  'M40 0C50 12 34 28 40 40L52 40C46 28 62 12 52 0Z',
  'M66 0C76 14 60 26 66 40L78 40C72 26 88 14 78 0Z',
];

const spark = (cx, cy, r, fill, cls = '') => {
  const k = (r * 0.16).toFixed(2);
  return `<path class="${cls}" d="M${cx} ${cy - r}Q${cx + +k} ${cy - +k} ${cx + r} ${cy}`
    + `Q${cx + +k} ${cy + +k} ${cx} ${cy + r}Q${cx - +k} ${cy + +k} ${cx - r} ${cy}`
    + `Q${cx - +k} ${cy - +k} ${cx} ${cy - r}Z" fill="${fill}"/>`;
};

const plate = (w, h, m, r, fill, extra = '') =>
  `<rect x="${m}" y="${m}" width="${w - m * 2}" height="${h - m * 2}" rx="${r}" fill="${fill}"${extra}/>`;

const shadow = (id, color) =>
  `<filter id="${id}f" x="-10%" y="-10%" width="120%" height="130%">`
  + `<feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="${color}" flood-opacity="0.4"/></filter>`;

const SHEEN_W = 70;

const sheen = (h, id, alpha) =>
  `<defs><linearGradient id="${id}s" x1="0" x2="1">`
  + `<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>`
  + `<stop offset="0.5" stop-color="#ffffff" stop-opacity="${alpha}"/>`
  + `<stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`
  + `<rect class="sh" x="${-SHEEN_W}" y="${-h}" width="${SHEEN_W}" height="${h * 3}" fill="url(#${id}s)"/>`;

const sheenCss = (w, id, dur) =>
  `@keyframes ${id}k{0%{transform:translateX(0) skewX(-14deg)}`
  + `28%,100%{transform:translateX(${w + SHEEN_W * 2}px) skewX(-14deg)}}`
  + `#${id} .sh{animation:${id}k ${dur}s linear infinite}`;

export const REPO_CARD_THEMES = {
  light: {
    label: 'Light',
    bg: '#ffffff',
    border: '#d1d9e0',
    title: '#0969da',
    text: '#59636e',
    meta: '#59636e',
    chip: '#59636e',
    chipBorder: '#d1d9e0',
    radius: 6,
  },
  dark: {
    label: 'Dark',
    bg: '#0d1117',
    border: '#3d444d',
    title: '#4493f8',
    text: '#9198a1',
    meta: '#9198a1',
    chip: '#9198a1',
    chipBorder: '#3d444d',
    radius: 6,
  },

  pixel: {
    label: 'Pixel',
    bg: PIXEL_FACE,
    border: PIXEL_INK,
    title: PIXEL_INK,
    text: '#4a4a52',
    meta: '#4a4a52',
    chip: PIXEL_INK,
    chipBorder: PIXEL_INK,
    radius: 0,
    thick: true,
    crisp: true,
    dot: true,

    font: "'Neo둥근모', 'NeoDunggeunmo', 'DungGeunMo', 'Galmuri14', 'Galmuri11', 'Courier New', monospace",
    icons: PIXEL_ICONS,
    frame: (w, h) => {
      const q = 4;
      const cut = (i) => cutRect(i, i, w - i * 2, h - i * 2, q);

      return `<path d="${cut(0)}" fill="${PIXEL_INK}"/><path d="${cut(3)}" fill="${PIXEL_FACE}"/>`
        + px(3 + q, h - 5, w - 6 - q * 2, 2, PIXEL_SHADE)
        + px(w - 5, 3 + q, 2, h - 6 - q * 2, PIXEL_SHADE);
    },

    chipBox: (x, y, w, h) =>
      `<path d="${cutRect(x, y, w, h, 2)}" fill="${PIXEL_INK}"/>`
      + `<path d="${cutRect(x + 2, y + 2, w - 4, h - 4, 2)}" fill="${PIXEL_FACE}"/>`,
  },

  zebra: {
    label: 'Zebra',
    bg: '#ffffff',
    border: '#17171a',
    title: '#17171a',
    text: '#45454e',
    meta: '#45454e',
    chip: '#17171a',
    chipBorder: '#17171a',
    chipFill: '#ffffff',
    radius: 3,
    thick: true,
    grow: 10,
    deco: (w, h, id) =>
      `<defs><pattern id="${id}" width="92" height="40" patternUnits="userSpaceOnUse">`
      + `<rect width="92" height="40" fill="#ffffff"/>`
      + `<g fill="#17171a">${ZEBRA_STRIPES.map((d) => `<path d="${d}"/>`).join('')}</g>`
      + `</pattern></defs>`
      + `<rect width="${w}" height="${h}" fill="url(#${id})"/>`
      + plate(w, h, 13, 2, '#ffffff')
      + plate(w, h, 13, 2, 'none', ' stroke="#17171a"')
      + sheen(h, id, 0.55),
    anim: (w, id) => sheenCss(w, id, 5.5),
  },

  retro: {
    label: 'Retro 70s',
    bg: '#fdf0d5',
    border: '#7f4145',
    title: (id) => `url(#${id}t)`,
    text: '#6b3a2a',
    meta: '#a1543b',
    chip: '#fff3d6',
    chipBorder: '#7f4145',
    chipFill: '#7f4145',
    radius: 10,
    thick: true,
    grow: 18,
    deco: (w, h, id) => {
      const cx = w - 46;
      const hz = h - 16;
      const r = 24;

      const sun = `<circle class="glow" cx="${cx}" cy="${hz}" r="${r + 12}" fill="#f6bd60" opacity="0.28"/>`
        + `<circle cx="${cx}" cy="${hz}" r="${r}" fill="#f2913b"/>`
        + `<g clip-path="url(#${id}u)">`
        + [[6, 2], [12, 3], [19, 4]].map(([up, t]) => px(cx - r, hz - up, r * 2, t, '#fdf0d5')).join('')
        + `</g>`;

      const rail = [[16, 6, '#f6bd60'], [10, 5, '#ef8354'], [5, 5, '#d9534f']]
        .map(([up, t, c]) => px(0, h - up, w, t, c))
        .join('');
      const top = ['#d9534f', '#ef8354', '#f6bd60']
        .map((c, i) => px(0, i * 2, w, 2, c))
        .join('');
      return `<defs><linearGradient id="${id}t" x1="0" x2="1">`
        + `<stop offset="0" stop-color="#d8572a"/><stop offset="1" stop-color="#7f4145"/></linearGradient>`
        + `<clipPath id="${id}u"><circle cx="${cx}" cy="${hz}" r="${r}"/></clipPath></defs>`
        + top + sun + rail + sheen(h, id, 0.45);
    },
    anim: (w, id) =>
      sheenCss(w, id, 7)
      + `@keyframes ${id}g{0%,100%{opacity:0.25}50%{opacity:0.6}}`
      + `#${id} .glow{animation:${id}g 4s ease-in-out infinite}`,
  },

  earth: {
    label: 'Earth',
    bg: '#050c16',
    border: '#1e3c58',
    title: (id) => `url(#${id}t)`,
    text: '#cfe0ef',
    meta: '#7fa6c9',
    chip: '#eaf4ff',
    chipBorder: '#3f7fa8',
    chipFill: '#0c1f33',
    radius: 10,
    thick: true,

    grow: 20,
    deco: (w, h, id) => {
      const cx = w - 36;
      const cy = h - 20;
      const r = 16;
      return `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">`
        + `<stop offset="0" stop-color="#0d2440"/><stop offset="1" stop-color="#050c16"/></linearGradient>`
        + `<radialGradient id="${id}e" cx="0.35" cy="0.3" r="0.8">`
        + `<stop offset="0" stop-color="#57b0e8"/><stop offset="1" stop-color="#11476f"/></radialGradient>`
        + `<linearGradient id="${id}t" x1="0" x2="1">`
        + `<stop offset="0" stop-color="#8fd6ff"/><stop offset="1" stop-color="#57c7a3"/></linearGradient>`
        + `<clipPath id="${id}p"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>`
        + `<rect width="${w}" height="${h}" fill="url(#${id}g)"/>`
        + starField(w, h, Math.round((w * h) / 950))
        + `<circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="none" stroke="#58b6f0" stroke-opacity="0.35"/>`
        + globe(cx, cy, r, id)
        + `<g class="sat"><circle cx="${cx + r + 8}" cy="${cy}" r="2.5" fill="#e8f2fb"/></g>`;
    },
    anim: (w, id, h) => {
      const cx = w - 38;
      const cy = h - 20;

      return `@keyframes ${id}o{to{transform:rotate(360deg)}}`
        + `#${id} .sat{transform-box:view-box;transform-origin:${cx}px ${cy}px;`
        + `animation:${id}o 9s linear infinite}`
        + `@keyframes ${id}w{0%,100%{opacity:0.85}50%{opacity:0.15}}`
        + `#${id} .tw{animation:${id}w 3s ease-in-out infinite}`
        + `#${id} .t2{animation-delay:1s}#${id} .t3{animation-delay:2s}`;
    },
  },

  y2k: {
    label: 'Y2K',
    bg: '#ffffff',
    border: '#c9a7ff',
    title: (id) => `url(#${id}t)`,
    text: '#4a3a6b',
    meta: '#7059a6',
    chip: '#7b2ff7',
    chipBorder: '#c9a7ff',
    chipFill: '#ffffff',
    radius: 16,
    thick: true,
    grow: 12,
    deco: (w, h, id) =>

      `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0.4">`
      + `<stop offset="0" stop-color="#3fe0ff"/><stop offset="0.34" stop-color="#8f6dff"/>`
      + `<stop offset="0.67" stop-color="#ff4fbe"/><stop offset="1" stop-color="#4dffc8"/>`
      + `</linearGradient>`

      + `<linearGradient id="${id}t" x1="0" x2="1"><stop offset="0" stop-color="#6d28d9"/>`
      + `<stop offset="0.5" stop-color="#db2777"/><stop offset="1" stop-color="#2563eb"/></linearGradient>`
      + `${shadow(id, '#5b21b6')}</defs>`
      + `<rect width="${w}" height="${h}" fill="url(#${id}g)"/>`
      + plate(w, h, 9, 11, '#ffffff', ` opacity="0.84" filter="url(#${id}f)"`)

      + `<rect x="13" y="13" width="${w - 26}" height="1.5" rx="0.75" fill="#ffffff" opacity="0.9"/>`
      + spark(w - 26, h - 27, 8, '#ff5fd2', 'tw')
      + spark(w - 44, h - 17, 4.5, '#00d5ff', 'tw t2')
      + spark(w - 14, h - 14, 3.5, '#ff5fd2', 'tw t3')
      + sheen(h, id, 0.75),
    anim: (w, id) =>
      sheenCss(w, id, 4.5)

      + `@keyframes ${id}t{0%,100%{transform:scale(1);opacity:0.95}50%{transform:scale(0.4);opacity:0.45}}`
      + `#${id} .tw{transform-box:fill-box;transform-origin:center;animation:${id}t 2.4s ease-in-out infinite}`
      + `#${id} .t2{animation-delay:0.8s}#${id} .t3{animation-delay:1.6s}`,
  },
};

export const DEFAULT_REPO_CARD_THEME = 'light';
