import { escapeXml, sizeAttrs, FONT_STACK } from './svg.js';
import { SCALE } from './pixel.js';
import { FLOOR_ITEMS, EFFECTS, SKILLS, personArt, personHeight, DEFAULT_PERSON } from './catalog.js';
import { DEFAULT_THEME, WALL_H } from './room-styles.js';
import { geometry, gridPoint, pointsAttr, shell, wallItem } from './room-geometry.js';
import { DEFAULT_TEXT_ANIM, textCard } from './room-text.js';
import { DEFAULT_WEATHER, weather } from './room-weather.js';

export { geometry, gridPoint } from './room-geometry.js';
export { DEFAULT_TEXT_ANIM } from './room-text.js';
export { DEFAULT_WEATHER } from './room-weather.js';
export { DEFAULT_FLOOR_STYLE, DEFAULT_WALL_STYLE, FLOOR_STYLES, ROOM_SKINS, WALL_STYLES, floorSwatch, wallSwatch } from './room-styles.js';
export { DEMO_ROOM, EMPTY_ROOM, clampGrid, gridCell } from './room-geometry.js';
export { DEFAULT_TEXT_STYLE, TEXT_ANIMS, TEXT_STYLES } from './room-text.js';
export { WEATHER_STYLES } from './room-weather.js';

function hotspots(geo) {
  let out = '';
  for (let c = 0; c < geo.cols; c++) {
    for (let r = 0; r < geo.rows; r++) {
      out += `<polygon points="${pointsAttr([[c, r], [c + 1, r], [c + 1, r + 1], [c, r + 1]], geo)}" data-cell="${c},${r}" fill="transparent"/>`;
    }
  }
  for (let u = 0; u < geo.rows; u++) {
    out += `<polygon points="${pointsAttr([[0, u], [0, u + 1]], geo, -WALL_H)} ${pointsAttr([[0, u + 1], [0, u]], geo)}" data-wall="left" data-u="${u}" fill="transparent"/>`;
  }
  for (let u = 0; u < geo.cols; u++) {
    out += `<polygon points="${pointsAttr([[u, 0], [u + 1, 0]], geo, -WALL_H)} ${pointsAttr([[u + 1, 0], [u, 0]], geo)}" data-wall="right" data-u="${u}" fill="transparent"/>`;
  }
  return out;
}

export const STYLE = `
  text { shape-rendering: geometricPrecision; }
  .bubble-text { font: 500 12px ${FONT_STACK}; }
  .glow { animation: glowk 2.2s ease-in-out infinite; }
  .tail { transform-box: fill-box; transform-origin: 20% 90%; animation: wag 2s steps(2) infinite; }
  .fx-beat { transform-box: fill-box; transform-origin: center; animation: beat 1.3s steps(2) infinite; }
  .fx-twinkle { animation: glowk 1.6s steps(2) infinite; }
  .fx-bob { animation: bob 2.4s steps(3) infinite; }
  @keyframes beat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.25); } }
  @keyframes glowk { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes wag { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(16deg); } }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }


  .spin { animation: gspin 2s steps(1) infinite; }
  @keyframes gspin {
    0% { transform: scaleX(1); }
    25% { transform: scaleX(0.35); }
    50% { transform: scaleX(-1); }
    75% { transform: scaleX(-0.35); }
    100% { transform: scaleX(1); }
  }
  .swim { animation: swim 3.6s steps(1) infinite; }
  @keyframes swim {
    0%, 45% { transform: translateX(-6px); }
    50%, 95% { transform: translateX(6px) scaleX(-1); }
    100% { transform: translateX(-6px); }
  }


  .sway { animation: sway 5.2s ease-in-out infinite; }
  @keyframes sway {
    0%, 100% { transform: rotate(-1.3deg); }
    50% { transform: rotate(1.3deg); }
  }


  .petal { animation-name: petalfall; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes petalfall {
    0% { transform: translate(0, 0); opacity: 0; }
    12% { opacity: 1; }
    85% { opacity: 1; }
    100% { transform: translate(-16px, 40px); opacity: 0; }
  }


  .p-bob, .p-fly { transform-box: fill-box; transform-origin: 50% 100%; }
  .p-bob { animation: pbob 1.6s steps(2) infinite; }
  @keyframes pbob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

  .p-fly { animation: pfly 2.6s ease-in-out infinite; }
  @keyframes pfly {
    0%, 100% { transform: translateY(-14px); }
    50% { transform: translateY(-24px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .glow, .tail, .fx-beat, .fx-twinkle, .fx-bob, .spin, .swim, .sway, .petal,
    .p-bob, .p-fly { animation: none; }
  }
`;

function cssBlocks(css) {
  const blocks = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      blocks.push(css.slice(start, i + 1));
      start = i + 1;
    }
  }
  return blocks;
}

function classesIn(markup) {
  const found = new Set();
  for (const m of markup.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) found.add(c);
  return found;
}

function selectorUsed(selector, classes, hasText) {
  const s = selector.trim();
  if (s === 'text') return hasText;
  const names = s.match(/\.[\w-]+/g) ?? [];
  return names.length > 0 && names.every((n) => classes.has(n.slice(1)));
}

function usedRules(css, classes, hasText) {
  const kept = [];
  for (const block of cssBlocks(css)) {
    const open = block.indexOf('{');
    const head = block.slice(0, open).trim();
    const body = block.slice(open + 1, -1);
    if (head.startsWith('@keyframes')) {
      kept.push({ name: head.slice('@keyframes'.length).trim(), block: `  ${block.trim()}` });
    } else if (head.startsWith('@media')) {
      const inner = usedRules(body, classes, hasText);
      if (inner) kept.push({ body: inner, block: `  ${head} {\n${inner}\n  }` });
    } else {
      const sels = head.split(',').filter((sel) => selectorUsed(sel, classes, hasText));
      if (sels.length) kept.push({ body, block: `  ${sels.map((s) => s.trim()).join(', ')} {${body}}` });
    }
  }
  const bodies = kept.filter((r) => !r.name).map((r) => r.body).join('\n');
  return kept
    .filter((r) => !r.name || new RegExp(`animation(?:-name)?:[^;]*\\b${r.name}\\b`).test(bodies))
    .map((r) => r.block)
    .join('\n');
}

export function styleFor(markup) {
  const css = STYLE.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = usedRules(css, classesIn(markup), markup.includes('<text'));
  return out ? `\n${out}\n` : '';
}

export function renderRoom(data = {}, options = {}) {
  const geo = geometry(data.grid);
  const theme = { ...DEFAULT_THEME, ...data.theme };
  const editable = options.editable === true;

  const drawables = [];

  (data.items ?? []).forEach((it, idx) => {
    const def = FLOOR_ITEMS[it.id];
    if (!def) return;
    const col = Math.max(0, it.col ?? 0);
    const row = Math.max(0, it.row ?? 0);
    const p = gridPoint(col + def.fc, row + def.fr, geo);
    const flip = it.flip ? ' scale(-1,1)' : '';
    const data_ = editable ? ` data-kind="item" data-idx="${idx}"` : '';

    // Fractional footprints (0.6, 0.8 tiles) would land sprites between screen pixels and blur their edges.
    const x = Math.round(p.x);
    const y = Math.round(p.y - (it.lift ?? 0) * SCALE);
    drawables.push({
      layer: def.layer,
      depth: col + def.fc + row + def.fr,
      markup: `<g${data_} transform="translate(${x} ${y})${flip}">${def.art}</g>`,
    });
  });

  let personTop = null;
  if (data.person) {
    const p = { ...DEFAULT_PERSON, ...data.person };
    const c = gridPoint(p.col + 0.5, p.row + 0.5, geo);
    const feetY = c.y + 6;

    personTop = { x: c.x, y: feetY - personHeight(p) - 2 };
    drawables.push({
      layer: 1,
      depth: p.col + p.row + 1,
      markup: `<g${editable ? ' data-kind="person"' : ''} transform="translate(${c.x} ${feetY})"><path class="person-shadow" fill="#514133" opacity=".14" d="M-8-3h16v1h4v3h-4v1h-16v-1h-4v-3h4z"/>${personArt(p)}</g>`,
    });
  }

  for (const [kind, catalog, list] of [
    ['effect', EFFECTS, data.effects],
    ['skill', SKILLS, data.skills],
  ]) {
    (list ?? []).forEach((fx, idx) => {
      const def = catalog[fx.id];
      if (!def) return;
      const c = gridPoint((fx.col ?? 0) + 0.5, (fx.row ?? 0) + 0.5, geo);
      drawables.push({
        layer: 2,
        depth: (fx.col ?? 0) + (fx.row ?? 0) + 1,
        markup: `<g${editable ? ` data-kind="${kind}" data-idx="${idx}"` : ''} transform="translate(${c.x} ${c.y + 6})">${def.art}</g>`,
      });
    });
  }

  drawables.sort((a, b) => a.layer - b.layer || a.depth - b.depth);

  const walls = (data.wallItems ?? []).map((w, i) => wallItem(w, geo, editable, i)).join('\n  ');

  const talks = [];
  const talkCss = [];
  const speak = (text, x, topY, opts) => {
    const t = textCard(text, x, topY, geo, opts);
    if (!t) return;
    talks.push(t.markup);
    if (t.css) talkCss.push(t.css);
  };

  if (data.person?.bubble && personTop) {
    speak(data.person.bubble, personTop.x, personTop.y, { key: 'p', style: 'bubble', anim: 'float' });
  }

  (data.texts ?? data.bubbles ?? []).forEach((t, idx) => {
    const c = gridPoint((t.col ?? 0) + 0.5, (t.row ?? 0) + 0.5, geo);
    speak(t.text, c.x, c.y + 6, {
      key: `b${idx}`,
      style: t.style,
      anim: t.anim ?? (t.typing ? 'type' : DEFAULT_TEXT_ANIM),
      attrs: editable ? ` data-kind="text" data-idx="${idx}"` : '',
    });
  });

  const talk = talks.join('\n  ');
  const title = options.title ?? 'miniroom';

  const sky = weather(data.weather ?? DEFAULT_WEATHER, geo);

  const body = `${shell(geo, theme)}
  ${walls}
  ${drawables.map((d) => d.markup).join('\n  ')}
  ${talk}${sky.markup ? `\n  ${sky.markup}` : ''}
  ${editable ? hotspots(geo) : ''}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttrs(geo.width, geo.height, options.scale ?? data.scale)} shape-rendering="crispEdges" role="img" aria-label="${escapeXml(title)}">
  <title>${escapeXml(title)}</title>
  <style>${styleFor(body)}${sky.css}${talkCss.join('')}</style>
  ${body}
</svg>`;
}
