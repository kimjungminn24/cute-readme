import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import { decodePng } from '../src/png.js';

export const PALETTE = [
  '#f2d9a6', '#d9a86c', '#b57a45', '#7a4a2a',
  '#ffffff', '#e6e6e6', '#b8b8b8',
  '#cfe9f7', '#7fc3e8', '#3f8fc7',
  '#b8e07a', '#5fa83f',
  '#e05a4a', '#f09a3c', '#f5d84a',
  '#4a3324',
];

const STYLE = 'cute isometric pixel art furniture sprite, one piece of furniture only, centered, simple rounded shapes, soft colors, 2000s korean web avatar style';
const NEGATIVE = 'text, watermark, character, person, multiple objects, room, interior, background, floor, walls, window, diorama';

function apiKey() {
  let key = process.env.PIXELLAB_API_KEY;
  if (!key && process.platform === 'win32') {
    key = execFileSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('PIXELLAB_API_KEY','User')"], { encoding: 'utf8' }).trim();
  }
  if (!key) { console.error('PIXELLAB_API_KEY 가 없다. setx PIXELLAB_API_KEY "..." 로 넣고 앱을 다시 켜라'); process.exit(1); }
  return key;
}

export function palettePng(colors = PALETTE) {
  const W = colors.length * 2; const H = 2;
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    colors.forEach((h, i) => {
      const [r, g, b] = [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
      for (let dx = 0; dx < 2; dx++) { const o = y * (W * 3 + 1) + 1 + (i * 2 + dx) * 3; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; }
    });
  }
  return png(W, H, raw, 2);
}

function png(W, H, raw, colorType) {
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = colorType;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const b64 = (buf) => ({ type: 'base64', base64: buf.toString('base64'), format: 'png' });

/* Pad reference images to the requested dimensions. */
export function padPng(buf, W, H) {
  const im = decodePng(buf);
  if (im.width === W && im.height === H) return buf;
  if (im.width > W || im.height > H) throw new Error(`참조 그림(${im.width}x${im.height})이 요청 크기(${W}x${H})보다 크다`);
  const ox = Math.floor((W - im.width) / 2); const oy = H - im.height;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const i = (y * im.width + x) * 4; const o = (oy + y) * (W * 4 + 1) + 1 + (ox + x) * 4;
    raw[o] = im.pixels[i]; raw[o + 1] = im.pixels[i + 1]; raw[o + 2] = im.pixels[i + 2]; raw[o + 3] = im.pixels[i + 3];
  }
  return png(W, H, raw, 6);
}

export async function createImage({ what, w, h, seed, styleImage, palette = false, outline = 'selective outline', shading = 'flat shading', model = 'bitforge', guidance = 8, iso = true, view = null, raw = false, init = null, initStrength = 300, key = apiKey() }) {
  const body = {
    description: raw ? what : `${STYLE}, ${what}`,
    negative_description: NEGATIVE,
    image_size: { width: w, height: h },
    text_guidance_scale: guidance,
    isometric: iso,
    ...(view ? { view } : {}),
    no_background: true,
    outline,
    shading,
    detail: 'low detail',
    seed,
  };
  if (palette) body.color_image = b64(palettePng());
  if (init) { body.init_image = b64(padPng(init, w, h)); body.init_image_strength = initStrength; }
  if (styleImage) { body.style_image = b64(padPng(styleImage, w, h)); body.style_strength = 20; }
  if (model === 'pixflux') { delete body.negative_description; delete body.style_image; delete body.style_strength; }
  const r = await fetch(`https://api.pixellab.ai/v2/create-image-${model}`, {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PixelLab ${r.status}: ${(await r.text()).slice(0, 400)}`);
  const j = await r.json();
  return { png: Buffer.from(j.image.base64, 'base64'), usage: j.usage };
}

if (process.argv[1] && /gen-pixellab\.js$/.test(process.argv[1])) {
  const argv = process.argv.slice(2);
  const opt = { w: 32, h: 32, seeds: [1], style: null, out: 'pixellab-out', palette: false, outline: 'selective outline', shading: 'flat shading', model: 'bitforge', guidance: 8, iso: true, view: null, raw: false, init: null, initStrength: 300 };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]; const next = () => argv[++i];
    if (a === '--w') opt.w = Number(next());
    else if (a === '--h') opt.h = Number(next());
    else if (a === '--seeds') opt.seeds = next().split(',').map(Number);
    else if (a === '--style') opt.style = next();
    else if (a === '--out') opt.out = next();
    else if (a === '--palette') opt.palette = true;
    else if (a === '--outline') opt.outline = next();
    else if (a === '--shading') opt.shading = next();
    else if (a === '--model') opt.model = next();
    else if (a === '--guidance') opt.guidance = Number(next());
    else if (a === '--no-iso') opt.iso = false;
    else if (a === '--view') opt.view = next();
    else if (a === '--raw') opt.raw = true;
    else if (a === '--init') opt.init = next();
    else if (a === '--init-strength') opt.initStrength = Number(next());
    else pos.push(a);
  }
  const [id, what] = pos;
  if (!id || !what) { console.error('usage: node scripts/gen-pixellab.js <id> "<what>" [--w 40 --h 32] [--seeds 1,2,3] [--style ref.png] [--out dir]'); process.exit(1); }
  mkdirSync(opt.out, { recursive: true });
  const styleImage = opt.style ? readFileSync(opt.style) : null;
  for (const seed of opt.seeds) {
    const { png: out, usage } = await createImage({ what, w: opt.w, h: opt.h, seed, styleImage, palette: opt.palette, outline: opt.outline, shading: opt.shading, model: opt.model, guidance: opt.guidance, iso: opt.iso, view: opt.view, raw: opt.raw, init: opt.init ? readFileSync(opt.init) : null, initStrength: opt.initStrength });
    const file = `${opt.out}/${id}-${seed}.png`;
    writeFileSync(file, out);
    console.error(`${file} (${usage ? `$${usage.usd}` : '체험'})`);
  }
}
