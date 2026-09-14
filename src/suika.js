import { escapeXml, measure, sizeAttrs, FONT_STACK } from './svg.js';

export const TIERS = [0.041, 0.062, 0.084, 0.097, 0.116, 0.147, 0.169, 0.2, 0.241, 0.275, 0.325];

export const TOP_TIER = TIERS.length - 1;

export function tierOf(commits, top, bottom) {
  const c = Math.max(1, Number(commits) || 0);
  const hi = Math.max(1, Number(top) || 1);
  const lo = Math.max(1, Number(bottom) || 1);
  if (c >= hi) return TOP_TIER;

  if (hi <= lo) return TOP_TIER;
  const t = (Math.log(c) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
  return Math.max(0, Math.min(TOP_TIER, Math.round(t * TOP_TIER)));
}

export function assignTiers(contributors = [], limit = 15) {
  const list = [...contributors]
    .filter((c) => c && c.login)
    .sort((a, b) => (b.contributions ?? 0) - (a.contributions ?? 0))
    .slice(0, Math.max(1, limit));

  if (!list.length) return [];

  const top = list[0].contributions ?? 1;
  const bottom = list[list.length - 1].contributions ?? 1;

  const cap = TOP_TIER - (list.length >= 3 ? 0 : 4 - list.length);

  return list.map((c, rank) => {
    const byCommits = top === bottom ? TOP_TIER : tierOf(c.contributions, top, bottom);

    const tier = Math.max(0, Math.min(byCommits, TOP_TIER - rank, cap));
    return { ...c, rank, tier, ratio: TIERS[tier] };
  });
}

export function sampleAvatar(seed, index = null) {
  const h = hash(seed);

  const hue = index === null
    ? h % 360
    : Math.round(index * 137.508 + (h % 24)) % 360;
  const fg = `hsl(${hue} 58% 47%)`;
  let cells = '';

  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 5; row++) {
      if (!((h >>> ((col * 5 + row) % 30)) & 1)) continue;
      for (const c of col === 2 ? [2] : [col, 4 - col]) {
        cells += `<rect x="${10 + c * 14}" y="${10 + row * 14}" width="14" height="14"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">`
    + `<rect width="80" height="80" fill="#e4e4ea"/><g fill="${fg}">${cells}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function seeded(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

const EPS = 1e-6;

function dropY(x, r, placed, floor) {
  let y = floor - r;
  for (const p of placed) {
    const dx = x - p.x;
    const reach = r + p.r;
    if (Math.abs(dx) >= reach) continue;

    const top = p.y - Math.sqrt(reach * reach - dx * dx);
    if (top < y) y = top;
  }
  return y;
}

function contacts(x, y, r, placed) {
  const out = [];
  for (const p of placed) {
    const dx = x - p.x;
    const dy = y - p.y;
    const reach = r + p.r;
    if (dx * dx + dy * dy < reach * reach + 1e-3) out.push(p);
  }
  return out;
}

function roll(start, r, placed, floor, W) {
  let { x, y } = start;

  for (let step = 0; step < 400; step++) {
    if (y >= floor - r - EPS) return { x, y: floor - r };

    const on = contacts(x, y, r, placed);

    if (!on.length) {
      const ny = dropY(x, r, placed, floor);
      if (ny <= y + EPS) return { x, y };
      y = ny;
      continue;
    }

    if (on.length > 1) return { x, y };

    const p = on[0];
    const reach = p.r + r;

    let a = Math.atan2(y - p.y, x - p.x);

    if (Math.abs(Math.cos(a)) < 1e-4) return { x, y: p.y - reach };

    const dir = Math.cos(a) > 0 ? 1 : -1;
    a += dir * 0.04;
    const nx = p.x + Math.cos(a) * reach;
    const ny = p.y + Math.sin(a) * reach;

    if (nx < r || nx > W - r) {
      const wall = nx < r ? r : W - r;
      return { x: wall, y: dropY(wall, r, placed, floor) };
    }

    if (contacts(nx, ny, r, placed.filter((q) => q !== p)).length) return { x, y };

    if (ny < p.y) {
      x = nx;
      y = ny;
    } else {
      x = nx;
      y = dropY(nx, r, placed, floor);
    }
  }
  return { x, y };
}

export function pack(items, W, floor, seed = 1) {
  const rnd = seeded(seed);
  const placed = [];

  for (const item of items) {
    const r = item.r;

    const rr = Math.min(r, W / 2 - 1);

    const xs = [rr, W - rr, W / 2];
    for (const p of placed) {
      xs.push(p.x - (p.r + rr), p.x + (p.r + rr), p.x);
    }
    for (let i = 0; i < 6; i++) xs.push(rr + rnd() * (W - rr * 2));

    let best = null;
    for (const raw of xs) {
      const x = Math.min(W - rr, Math.max(rr, raw));
      const settled = roll({ x, y: dropY(x, rr, placed, floor) }, rr, placed, floor, W);

      if (!best || settled.y > best.y + EPS || (Math.abs(settled.y - best.y) <= EPS && settled.x < best.x)) {
        best = settled;
      }
    }

    placed.push({ ...item, r: rr, x: best.x, y: best.y });
  }

  return placed;
}

export const SUIKA_THEMES = {
  suika: {
    label: 'Suika (original)',
    bg: '#fdf3dd',
    ink: '#5b3a1e',
    sub: '#9a7a52',
    jar: '#8a5a2b',
    jarLip: '#b07c42',
    jarFace: '#fffdf5',
    jarShade: '#c9a06a',
    line: '#e5b96b',
    radius: 14,
    glass: true,
  },
  dark: {
    label: 'Dark',
    bg: '#0d1117',
    ink: '#e6edf3',
    sub: '#9198a1',
    jar: '#316dca',
    jarLip: '#58a6ff',
    jarFace: '#0b0f14',
    jarShade: '#1c2b3d',
    line: '#3d444d',
    radius: 14,
    glass: true,
  },

  pixel: {
    label: 'Pixel dots',
    bg: '#ffffff',
    ink: '#17171a',
    sub: '#4a4a52',
    jar: '#17171a',
    jarLip: '#8a8a94',
    jarFace: '#ffffff',
    jarShade: '#d5d5da',
    line: '#c9c9d1',
    radius: 0,
    crisp: true,
    thick: true,
    glass: false,
  },
};

export const DEFAULT_SUIKA_THEME = 'suika';

const n = (v) => Math.round(v * 100) / 100;

function hash(seed) {
  let h = 0x811c9dc5;
  for (const ch of String(seed)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const cardId = (seed) => `sk${hash(seed).toString(36)}`;

const FALLBACK = ['#e0364f', '#f2822c', '#f5a623', '#7fae3a', '#3f9e4a', '#2f8fa8', '#4a6cd4', '#9b5bc4', '#c94f8e'];

function ball(c, id, i, theme, showName) {
  const { r } = c;
  const ring = Math.max(1.5, r * 0.07);
  const parts = [];

  if (c.avatar) {
    parts.push(
      `<image href="${escapeXml(c.avatar)}" x="${n(-r)}" y="${n(-r)}"`
      + ` width="${n(r * 2)}" height="${n(r * 2)}" clip-path="url(#${id}a${i})"`
      + ` preserveAspectRatio="xMidYMid slice"/>`,
    );
  } else {
    const bg = FALLBACK[hash(c.login) % FALLBACK.length];

    const size = Math.max(9, r * 0.78);
    parts.push(
      `<circle cx="0" cy="0" r="${n(r)}" fill="${bg}"/>`,
      `<text x="0" y="${n(size * 0.35)}" text-anchor="middle" font-size="${n(size)}"`
      + ` font-family="${theme.font ?? FONT_STACK}" font-weight="700" fill="#ffffff"`
      + `>${escapeXml([...c.login][0].toUpperCase())}</text>`,
    );
  }

  parts.push(
    `<circle cx="0" cy="0" r="${n(r - ring / 2)}" fill="none"`
    + ` stroke="${theme.jarFace}" stroke-width="${n(ring)}"/>`,
  );

  if (showName) {
    const size = Math.max(8, Math.min(13, r * 0.26));

    parts.push(
      `<text x="0" y="${n(r - ring - size * 0.5)}" text-anchor="middle" font-size="${n(size)}"`
      + ` font-family="${theme.font ?? FONT_STACK}" font-weight="700" fill="#ffffff"`
      + ` stroke="#00000099" stroke-width="${n(size * 0.32)}" paint-order="stroke"`
      + `>${escapeXml(c.login)}</text>`,
    );
  }

  return parts.join('');
}

const PAD = 16;
const HEAD = 46;
const JAR_W = 4;

const WALL_OUT = 8;
const PX = JAR_W + WALL_OUT;
const STEPS = 2;

const DEFAULTS = {
  width: 520,
  scale: 1,
  limit: 15,
  title: 'Contributors',
  theme: DEFAULT_SUIKA_THEME,
  drop: true,
  names: true,
  links: true,
};

const profileUrl = (c) => c.url || `https://github.com/${encodeURIComponent(c.login)}`;

const WIDTH_MIN = 280;
const WIDTH_MAX = 1200;

const uPath = (top, left, right, bottom) => {
  const d = [`M${n(left)} ${n(top)}`, `V${n(bottom - STEPS * PX)}`];
  for (let i = 1; i <= STEPS; i++) {
    d.push(`V${n(bottom - (STEPS - i) * PX)}`, `H${n(left + i * PX)}`);
  }
  d.push(`H${n(right - STEPS * PX)}`);
  for (let i = 1; i <= STEPS; i++) {
    d.push(`H${n(right - (STEPS - i) * PX)}`, `V${n(bottom - i * PX)}`);
  }
  return d.join('') + `V${n(top)}`;
};

function suikaLayout(contributors, opts) {
  const themeId = opts.theme in SUIKA_THEMES ? opts.theme : DEFAULT_SUIKA_THEME;
  const theme = SUIKA_THEMES[themeId];

  const W = Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(Number(opts.width) || DEFAULTS.width)));

  const people = assignTiers(contributors, opts.limit);
  const total = people.reduce((s, c) => s + (c.contributions ?? 0), 0);

  const inner = W - PAD * 2 - JAR_W * 2;
  const sized = people.map((c) => ({ ...c, r: c.ratio * inner }));

  const FLOOR = 100000;

  const seedText = people.map((c) => `${c.login}:${c.contributions}`).join('|');
  const id = cardId(`${themeId}|${W}|${seedText}`);
  const placed = pack(sized, inner, FLOOR, hash(`${W}|${seedText}`));

  const headroom = Math.max(28, inner * 0.12);
  const pileTop = placed.length ? Math.min(...placed.map((p) => p.y - p.r)) : FLOOR;
  let jarH = FLOOR - pileTop + headroom;

  const minH = inner * 0.62;
  const lift = Math.max(0, minH - jarH);

  jarH = Math.ceil(Math.max(minH, jarH));

  const jarX = PAD;
  const jarY = HEAD;
  const jl = jarX;
  const jr = W - PAD;
  const jb = jarY + jarH + JAR_W * 2;

  return {
    theme, id, W, inner, people, placed, total,
    H: jarY + jarH + JAR_W * 2 + PAD,
    jarX, jarY, jarH, headroom,
    dy: jarY + JAR_W + lift - (pileTop - headroom),
    jl, jr, jb,
    il: jl + JAR_W,
    ir: jr - JAR_W,
    ib: jb - JAR_W,
  };
}

function jarParts(L) {
  const { theme: t, id, jarY, jarH, headroom, jl, jr, jb, il, ir, ib } = L;

  const parts = [
    `<defs><clipPath id="${id}j"><path d="${uPath(jarY, il, ir, ib)}V${n(jarY)}Z"/></clipPath>`

    + `<linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0" stop-color="${t.jarShade}" stop-opacity="0"/>`
    + `<stop offset="1" stop-color="${t.jarShade}" stop-opacity="0.55"/></linearGradient></defs>`,
    `<path d="${uPath(jarY, jl - WALL_OUT, jr + WALL_OUT, jb + WALL_OUT)}" fill="${t.jarFace}"/>`,
    `<g clip-path="url(#${id}j)"><rect x="${n(il)}" y="${n(ib - jarH * 0.35)}"`
    + ` width="${n(ir - il)}" height="${n(jarH * 0.35)}" fill="url(#${id}v)"/></g>`,
    `<path d="${uPath(jarY, jl - WALL_OUT, jr + WALL_OUT, jb + WALL_OUT)}Z`
    + `${uPath(jarY, il, ir, ib)}Z" fill-rule="evenodd" fill="${t.jar}"/>`,
    `<path d="${uPath(jarY, il, ir, ib)}" fill="none" stroke="${t.jarLip}"`
    + ` stroke-width="2" stroke-linejoin="miter" opacity="0.7"/>`,
  ];

  const lipW = PX * 2;
  const lipH = PX;
  for (const lx of [jl, jr]) {
    parts.push(
      `<rect x="${n(lx - lipW / 2)}" y="${n(jarY - lipH / 2)}" width="${n(lipW)}" height="${lipH}"`
      + ` fill="${t.jar}"/>`,
    );
  }

  parts.push(
    `<path d="M${n(il)} ${n(jarY + headroom * 0.7)}H${n(ir)}" stroke="${t.line}"`
    + ` stroke-width="2" stroke-dasharray="7 6" opacity="0.9"/>`,
  );

  return parts;
}

function ballParts(L, opts) {
  const { theme: t, id, inner, placed, jarX, dy } = L;

  const clips = placed
    .map((c, i) => (c.avatar
      ? `<clipPath id="${id}a${i}"><circle cx="0" cy="0" r="${n(c.r)}"/></clipPath>`
      : ''))
    .join('');

  const parts = clips ? [`<defs>${clips}</defs>`] : [];

  placed.forEach((c, i) => {
    const cx = c.x + jarX + JAR_W;
    const cy = c.y + dy;

    const showName = opts.names && c.r >= inner * 0.13;

    const body = `<g transform="translate(${n(cx)} ${n(cy)})">`
      + `<title>${escapeXml(`${c.login} (${c.contributions ?? 0} commits)`)}</title>`
      + `<g class="f f${i}">${ball(c, id, i, t, showName)}</g>`
      + `</g>`;

    parts.push(opts.links === false
      ? body
      : `<a href="${escapeXml(profileUrl(c))}" target="_blank" rel="noopener">${body}</a>`);
  });

  return parts;
}

function glassParts(L) {
  const { theme: t, id, inner, jarY, il, ib } = L;
  if (!t.glass) return [];

  const gw = inner * 0.3;
  return [
    `<g clip-path="url(#${id}j)" fill="#ffffff" opacity="0.12">`
    + `<path d="M${n(il + gw * 0.15)} ${n(jarY)}L${n(il + gw * 0.55)} ${n(jarY)}`
    + `L${n(il + gw * 0.2)} ${n(ib)}L${n(il)} ${n(ib)}Z"/>`
    + `<path d="M${n(il + gw * 0.72)} ${n(jarY)}L${n(il + gw * 0.88)} ${n(jarY)}`
    + `L${n(il + gw * 0.5)} ${n(ib)}L${n(il + gw * 0.34)} ${n(ib)}Z"/>`
    + `</g>`,
  ];
}

function headerParts(L, opts) {
  const { theme: t, W, people, total } = L;
  const font = t.font ?? FONT_STACK;

  return [
    `<text x="${PAD}" y="${28}" font-family="${font}" font-size="16" font-weight="700" fill="${t.ink}">`
    + `${escapeXml(opts.title)}</text>`,
    `<text x="${PAD + Math.round(measure(opts.title) * 16) + 8}" y="${28}" font-family="${font}"`
    + ` font-size="13" fill="${t.sub}">${people.length}</text>`,
    `<text x="${W - PAD}" y="${20}" text-anchor="end" font-family="${font}" font-size="10"`
    + ` font-weight="700" fill="${t.sub}" letter-spacing="1.5">SCORE</text>`,
    `<text x="${W - PAD}" y="${36}" text-anchor="end" font-family="${font}" font-size="16"`
    + ` font-weight="700" fill="${t.ink}">${total.toLocaleString('en-US')}</text>`,
  ];
}

function dropStyleParts(L, opts) {
  const { id, jarH, headroom, placed } = L;
  if (!opts.drop || !placed.length) return [];

  const fall = Math.round(jarH + headroom);
  const css = placed
    .map((c, i) => `#${id} .f${i}{animation-delay:${n(i * 0.12)}s}`)
    .join('');

  return [
    `<style>@keyframes ${id}d{from{transform:translateY(${-fall}px)}to{transform:translateY(0)}}`
    + `#${id} .f{animation:${id}d 0.55s cubic-bezier(.5,0,.75,.3) both}`
    + css
    + `@media(prefers-reduced-motion:reduce){#${id} .f{animation:none}}</style>`,
  ];
}

export function renderSuika(contributors = [], options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const L = suikaLayout(contributors, opts);
  const t = L.theme;
  const label = `${opts.title}  ${L.people.length}`;

  const parts = [
    `<rect width="${L.W}" height="${L.H}" fill="${t.bg}"${t.radius ? ` rx="${t.radius}"` : ''}/>`,
    ...jarParts(L),
    ...ballParts(L, opts),
    ...glassParts(L),
    ...headerParts(L, opts),
    ...dropStyleParts(L, opts),
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttrs(L.W, L.H, opts.scale)} id="${L.id}"`
    + `${t.crisp ? ' shape-rendering="crispEdges"' : ''} role="img" aria-label="${escapeXml(label)}">`
    + `<title>${escapeXml(label)}</title>${parts.join('')}</svg>`;
}

export function suikaSnippet(repo, file = 'suika.svg') {
  const graph = repo
    ? `https://github.com/${repo}/graphs/contributors`
    : '../../graphs/contributors';
  return `<a href="${escapeXml(graph)}"><img src="./${escapeXml(file)}" width="100%" alt="Contributors"></a>`;
}
