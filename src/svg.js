const WIDE = /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-｠]/;

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

function isForbidden(cp) {
  if (cp === 0x09 || cp === 0x0a || cp === 0x0d) return false;
  return cp < 0x20 || cp === 0x7f;
}

export function escapeXml(value) {
  let out = '';
  for (const ch of String(value)) {
    if (isForbidden(ch.codePointAt(0))) continue;
    out += ENTITIES[ch] ?? ch;
  }
  return out;
}

function charWidth(ch) {
  return WIDE.test(ch) ? 1 : 0.55;
}

export function measure(text) {
  let w = 0;
  for (const ch of text) w += charWidth(ch);
  return w;
}

export function wrapText(text, maxEm, maxLines = Infinity) {
  const lines = [];
  let line = '';
  let width = 0;
  let breakAt = -1;
  let overflowed = false;

  for (const ch of text) {
    const cw = charWidth(ch);

    while (width + cw > maxEm && line !== '') {
      let carry = '';
      if (breakAt > 0 && !WIDE.test(ch)) {
        carry = line.slice(breakAt).trimStart();
        line = line.slice(0, breakAt);
      }
      lines.push(line.trimEnd());
      line = carry;
      width = measure(carry);
      breakAt = -1;
      if (lines.length >= maxLines) {
        overflowed = true;
        break;
      }
    }
    if (overflowed) break;

    if (line === '' && ch === ' ') continue;

    line += ch;
    width += cw;
    if (ch === ' ') breakAt = line.length;
  }

  if (!overflowed && line !== '') lines.push(line.trimEnd());

  if (overflowed) {
    const last = lines[maxLines - 1];
    const room = measure(last) + 1 > maxEm ? last.slice(0, -1) : last;
    lines[maxLines - 1] = room.trimEnd() + '…';
  }

  return lines.slice(0, maxLines);
}

export function plainText(markdown) {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/:[a-z0-9_+-]+:/gi, ' ')
    .replace(/^\s*[>#-]+\s?/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toBase64(bytes) {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isHexColor(value) {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

export function hexColor(value, fallback) {
  return isHexColor(value) ? value.toLowerCase() : fallback;
}

export const SCALE_MIN = 0.25;
export const SCALE_MAX = 4;

export function clampScale(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(n * 100) / 100));
}

export function sizeAttrs(w, h, scale = 1) {
  const s = clampScale(scale);
  const out = s === 1 ? { w, h } : { w: Math.round(w * s), h: Math.round(h * s) };
  return `width="${out.w}" height="${out.h}" viewBox="0 0 ${w} ${h}"`;
}

export const SCALE_STOPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];

export function snapScale(value) {
  const n = clampScale(value);
  return SCALE_STOPS.reduce((best, s) => (Math.abs(s - n) < Math.abs(best - n) ? s : best), SCALE_STOPS[0]);
}
