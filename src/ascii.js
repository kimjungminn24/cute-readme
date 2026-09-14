const CHARS = 'XYZWVUTSRQPONMLKJIHGFEDCBAabcdefghijklmnopqrstuvwxyz0123456789';

export const ALPHA_CUTOFF = 128;

const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

export function fromAscii(rows, palette) {
  const out = new Map();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (color) out.set(`${x},${y}`, color);
    }
  });
  return out;
}

export function toAscii({ width, height, pixels }) {
  const warnings = [];
  let partial = 0;

  const opaque = new Map();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = pixels[i + 3];
      if (a > 0 && a < 255) partial++;
      if (a < ALPHA_CUTOFF) continue;
      opaque.set(`${x},${y}`, hex(pixels[i], pixels[i + 1], pixels[i + 2]));
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!opaque.size) throw new Error('no opaque pixels at all');

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  const freq = new Map();
  for (const color of opaque.values()) freq.set(color, (freq.get(color) ?? 0) + 1);
  const ordered = [...freq].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  if (ordered.length > CHARS.length) {
    throw new Error(`${ordered.length} colors is more than the ${CHARS.length} palette letters. Reduce the colors in the pixel art.`);
  }

  const charOf = new Map(ordered.map((c, i) => [c, CHARS[i]]));
  const palette = Object.fromEntries(ordered.map((c, i) => [CHARS[i], c]));

  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const color = opaque.get(`${x + minX},${y + minY}`);
      row += color ? charOf.get(color) : '.';
    }
    rows.push(row);
  }

  const back = fromAscii(rows, palette);
  if (back.size !== opaque.size) {
    throw new Error(`round trip failed: pixel count changed ${opaque.size} -> ${back.size}`);
  }
  for (const [key, color] of opaque) {
    const [x, y] = key.split(',').map(Number);
    const got = back.get(`${x - minX},${y - minY}`);
    if (got !== color) throw new Error(`round trip failed: (${x},${y}) went ${color} -> ${got}`);
  }

  if (partial) warnings.push(`${partial} translucent pixels binarized at alpha ${ALPHA_CUTOFF}`);
  if (ordered.length > 16) warnings.push(`${ordered.length} colors. The more colors, the worse the path merging`);
  if (Math.max(w, h) > 48) warnings.push(`${w}x${h} is big for a room. Effects are usually around 8x8`);

  return { rows, palette, warnings, trimmed: { width: w, height: h } };
}
