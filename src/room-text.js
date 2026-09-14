import { escapeXml, wrapText, plainText, measure } from './svg.js';
import { PAD } from './room-styles.js';

export const TEXT_STYLES = {
  bubble: { label: 'Bubble', box: true, bg: '#ffffff', border: '#1a1a1a', fg: '#1a1a1a' },
  paper: { label: 'Paper', box: true, bg: '#fffdf6', border: '#b8862e', fg: '#4a3c22' },
  mint: { label: 'Mint', box: true, bg: '#0d2b25', border: '#35d6a8', fg: '#e6fff7' },
  rose: { label: 'Rose', box: true, bg: '#2b0f1c', border: '#ff6b9d', fg: '#ffe6f0' },
  slate: { label: 'Slate', box: true, bg: '#1c2029', border: '#8fa3bf', fg: '#e8eef7' },
  plain: { label: 'Plain', box: false, fg: '#ffffff', halo: '#20191a' },
};

export const DEFAULT_TEXT_STYLE = 'bubble';

export const TEXT_ANIMS = {
  none: { label: 'None' },
  type: { label: 'Type', type: true },
  float: { label: 'Float', cls: 'fx-bob' },
  blink: { label: 'Blink', cls: 'fx-twinkle' },
  pulse: { label: 'Pulse', cls: 'fx-beat' },
};

export const DEFAULT_TEXT_ANIM = 'none';

const CHAR_S = 0.09;
const HOLD_S = 1.6;

function typingAnim(key, lines, widths) {
  const counts = lines.map((l) => Math.max(1, l.length));
  const total = counts.reduce((a, b) => a + b, 0) * CHAR_S + HOLD_S;
  const pct = (v) => ((v / total) * 100).toFixed(2);

  let css = '';
  const names = [];
  let at = 0;
  counts.forEach((n, i) => {
    const start = at;
    at += n * CHAR_S;
    const name = `tw${key}-${i}`;

    const hidden = `transform:translateX(-${Math.ceil(widths[i])}px);animation-timing-function:steps(${n})`;
    css += `@keyframes ${name}{0%{${hidden}}`
      + (start > 0 ? `${pct(start)}%{${hidden}}` : '')
      + `${pct(at)}%{transform:translateX(0)}100%{transform:translateX(0)}}`;
    names.push(name);
  });

  return { css, names, dur: total.toFixed(2) };
}

export function textCard(text, x, topY, geo, { key = 'p', style, anim, attrs = '' } = {}) {
  const flat = plainText(text ?? '').trim();
  if (!flat) return null;

  const lines = wrapText(flat, 10, 2);
  if (!lines.length) return null;

  const st = TEXT_STYLES[style] ?? TEXT_STYLES[DEFAULT_TEXT_STYLE];
  const an = TEXT_ANIMS[anim] ?? TEXT_ANIMS[DEFAULT_TEXT_ANIM];

  const FS = 12;
  const w = Math.ceil((Math.max(...lines.map((l) => measure(l))) * FS + 22) / 4) * 4;
  const h = lines.length * 16 + 14;
  const bx = Math.round(Math.min(geo.width - PAD - w, Math.max(PAD, x - w / 2)) / 2) * 2;
  const by = topY - h - 12;
  const cx = bx + w / 2;

  const widths = lines.map((l) => Math.ceil(measure(l) * FS) + 4);
  const typing = an.type ? typingAnim(key, lines, widths) : null;

  const clips = [];
  const body = lines
    .map((l, i) => {
      const y = by + 20 + i * 16;
      const glyph = escapeXml(l);

      const halo = st.halo
        ? `<text class="bubble-text" x="${cx}" y="${y}" text-anchor="middle" fill="${st.halo}"`
          + ` stroke="${st.halo}" stroke-width="3" stroke-linejoin="round">${glyph}</text>`
        : '';
      const face = `<text class="bubble-text" x="${cx}" y="${y}" text-anchor="middle" fill="${st.fg}">${glyph}</text>`;
      if (!typing) return halo + face;

      const id = `${typing.names[i]}-c`;
      clips.push(
        `<clipPath id="${id}"><rect x="${cx - widths[i] / 2}" y="${y - 14}" width="${widths[i]}" height="20"`
        + ` style="animation:${typing.names[i]} ${typing.dur}s linear infinite"/></clipPath>`,
      );
      return `<g clip-path="url(#${id})">${halo}${face}</g>`;
    })
    .join('');

  const BW = 1;
  /* Narrow the tail by at most one pixel per row to keep its border connected. */
  const TAIL = [[-5, 5], [-5, 5], [-4, 4], [-4, 4], [-3, 3], [-3, 3], [-2, 2], [-2, 2], [-1, 1], [-1, 1]];
  const rect = (x0, y0, w0, h0, fill) => `<rect x="${x0}" y="${y0}" width="${w0}" height="${h0}" fill="${fill}"/>`;
  const tail = TAIL.map(([a, b], i) => rect(x + a, by + h + i, b - a + 1, 1, st.border)).join('')
    + TAIL.map(([a, b], i) => {
      if (b - 1 < a + 1) return '';
      const lid = i ? 0 : BW;
      return rect(x + a + BW, by + h + i - lid, (b - 1) - (a + 1) + 1, 1 + lid, st.bg);
    }).join('');

  const box = st.box
    ? rect(bx - BW, by - BW, w + BW * 2, h + BW * 2, st.border)
      + rect(bx, by, w, h, st.bg)
      + tail
    : '';

  return {
    css: typing?.css ?? '',
    markup: `<g${an.cls ? ` class="${an.cls}"` : ''}${attrs}>${clips.join('')}${box}${body}</g>`,
  };
}
