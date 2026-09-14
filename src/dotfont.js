import { mergeRects } from './pixel.js';

const MAGIC = 0x444f5446;

export function readDotFont(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (u8.length < 8 || view.getUint32(0) !== MAGIC) throw new Error('not a dot font blob');

  const ascent = view.getUint8(5);
  const ranges = [];
  let base = 0;
  for (let i = 0; i < view.getUint16(6); i++) {
    const start = view.getUint16(8 + i * 4);
    const end = view.getUint16(10 + i * 4);
    ranges.push({ start, end, base });
    base += end - start + 1;
  }
  return { u8, view, ascent, indexAt: 8 + ranges.length * 4, ranges };
}

function glyph(font, cp) {
  const range = font.ranges.find((r) => cp >= r.start && cp <= r.end);
  if (!range) return null;

  const at = font.indexAt + (range.base + cp - range.start) * 8;
  const adv = font.view.getUint8(at + 4);
  const w = font.view.getUint8(at + 5);

  if (!adv && !w) return null;

  return {
    off: font.view.getUint32(at),
    adv,
    w,
    h: font.view.getUint8(at + 6),
    yoff: font.view.getInt8(at + 7),
  };
}

export function canDraw(font, text) {
  for (const ch of String(text)) {
    if (ch === ' ') continue;
    if (!glyph(font, ch.codePointAt(0))) return false;
  }
  return true;
}

export function dotWidth(font, text, bold = false) {
  let w = 0;
  for (const ch of String(text)) {
    const g = glyph(font, ch.codePointAt(0));
    w += g ? g.adv + (bold ? 1 : 0) : 0;
  }
  return w;
}

export function dotWrap(font, text, maxWidth, maxLines = Infinity) {
  const lines = [];
  let line = '';
  let width = 0;
  let breakAt = -1;

  for (const ch of String(text)) {
    const g = glyph(font, ch.codePointAt(0));
    const cw = g ? g.adv : 0;

    while (width + cw > maxWidth && line !== '') {
      let carry = '';
      if (breakAt > 0 && ch !== ' ') {
        carry = line.slice(breakAt).trimStart();
        line = line.slice(0, breakAt);
      }
      lines.push(line.trimEnd());
      line = carry;
      width = dotWidth(font, carry);
      breakAt = -1;
      if (lines.length >= maxLines) {
        const dots = dotWidth(font, '…');
        let last = lines[maxLines - 1];
        while (last && dotWidth(font, last) + dots > maxWidth) last = last.slice(0, -1);
        lines[maxLines - 1] = `${last.trimEnd()}…`;
        return lines.slice(0, maxLines);
      }
    }

    if (line === '' && ch === ' ') continue;

    line += ch;
    width += cw;
    if (ch === ' ') breakAt = line.length;
  }

  if (line !== '') lines.push(line.trimEnd());
  return lines.slice(0, maxLines);
}

export function dotText(font, text, x, y, color, { bold = false } = {}) {
  const on = new Map();

  let penX = x;
  for (const ch of String(text)) {
    const g = glyph(font, ch.codePointAt(0));
    if (!g) continue;
    const bytes = Math.ceil(g.w / 8);

    const top = y - g.h - g.yoff;
    for (let row = 0; row < g.h; row++) {
      for (let col = 0; col < g.w; col++) {
        const byte = font.u8[g.off + row * bytes + (col >> 3)];
        if (!(byte & (0x80 >> (col & 7)))) continue;
        const py = top + row;
        if (!on.has(py)) on.set(py, []);

        on.get(py).push([penX + col]);
        if (bold) on.get(py).push([penX + col + 1]);
      }
    }
    penX += g.adv + (bold ? 1 : 0);
  }

  const done = mergeRects(on);

  if (!done.length) return '';
  const d = done.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`).join('');
  return `<path d="${d}" fill="${color}"/>`;
}
