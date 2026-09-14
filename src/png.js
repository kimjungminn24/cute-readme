import { inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function unfilter(data, height, stride, bpp) {
  const out = Buffer.alloc(height * stride);
  let pos = 0;

  for (let y = 0; y < height; y++) {
    const type = data[pos++];
    const row = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    data.copy(row, 0, pos, pos + stride);
    pos += stride;

    if (type === 0) continue;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= bpp ? prev[i - bpp] : 0;
      if (type === 1) row[i] = (row[i] + a) & 0xff;
      else if (type === 2) row[i] = (row[i] + b) & 0xff;
      else if (type === 3) row[i] = (row[i] + ((a + b) >> 1)) & 0xff;
      else if (type === 4) row[i] = (row[i] + paeth(a, b, c)) & 0xff;
      else throw new Error(`unknown PNG filter type: ${type}`);
    }
  }
  return out;
}

export function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error('not a PNG file');

  let header = null;
  let palette = null;
  let alphas = null;
  const chunks = [];

  for (let pos = 8; pos + 8 <= buffer.length; ) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    const body = buffer.subarray(pos + 8, pos + 8 + length);
    pos += 12 + length;

    if (type === 'IHDR') {
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === 'PLTE') palette = body;
    else if (type === 'tRNS') alphas = body;
    else if (type === 'IDAT') chunks.push(body);
    else if (type === 'IEND') break;
  }

  if (!header) throw new Error('missing IHDR chunk');
  const { width, height, depth, colorType, interlace } = header;

  if (depth !== 8) throw new Error(`only 8-bit PNGs are supported (this one is ${depth}-bit)`);
  if (interlace !== 0) throw new Error('interlaced PNGs are not supported');
  const channels = CHANNELS[colorType];
  if (!channels) throw new Error(`unsupported color type: ${colorType}`);
  if (colorType === 3 && !palette) throw new Error('palette PNG without a PLTE chunk');

  const raw = unfilter(inflateSync(Buffer.concat(chunks)), height, width * channels, channels);
  const pixels = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    const d = i * 4;
    let r;
    let g;
    let b;
    let a = 255;

    if (colorType === 3) {
      const idx = raw[s];
      r = palette[idx * 3];
      g = palette[idx * 3 + 1];
      b = palette[idx * 3 + 2];
      if (alphas && idx < alphas.length) a = alphas[idx];
    } else if (colorType === 0 || colorType === 4) {
      r = g = b = raw[s];
      if (colorType === 4) a = raw[s + 1];
    } else {
      r = raw[s];
      g = raw[s + 1];
      b = raw[s + 2];
      if (colorType === 6) a = raw[s + 3];
    }

    pixels[d] = r;
    pixels[d + 1] = g;
    pixels[d + 2] = b;
    pixels[d + 3] = a;
  }

  return { width, height, pixels };
}
