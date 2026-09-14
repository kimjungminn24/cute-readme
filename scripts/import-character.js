import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { decodePng } from '../src/png.js';

const HAIR_LABEL = { bob: 'Bob', long: 'Long', ponytail: 'Ponytail', bun: 'Bun' };
const OUTFIT_LABEL = { tee: 'T-shirt', hoodie: 'Hoodie', cardigan: 'Cardigan', dress: 'Dress', shirt: 'Shirt & tie' };

const [dir] = process.argv.slice(2);
if (!dir) { console.error('usage: node scripts/import-character.js <dir>'); process.exit(1); }

const files = readdirSync(dir).filter((f) => /^[a-z]+_[a-z]+-south\.png$/.test(f));
const HAIR_ORDER = ['bob', 'long', 'ponytail', 'bun']; const OUTFIT_ORDER = ['tee', 'hoodie', 'cardigan', 'dress', 'shirt'];
const rank = (list, k) => (list.indexOf(k) + 1 || 99);
const ids = files.map((f) => f.replace(/-south\.png$/, '')).sort((a, b) => {
  const [ha, oa] = a.split('_'); const [hb, ob] = b.split('_');
  return rank(HAIR_ORDER, ha) - rank(HAIR_ORDER, hb) || rank(OUTFIT_ORDER, oa) - rank(OUTFIT_ORDER, ob) || a.localeCompare(b);
});
if (!ids.length) { console.error(`${dir} 에 <머리>_<의상>-south.png 가 없다`); process.exit(1); }

/* Limit the palette to 60 colors to fit the ASCII character set. */
function quantize(im, limit = 60) {
  const { width: w, height: h, pixels: p } = im;
  const freq = new Map();
  for (let i = 0; i < w * h; i++) if (p[i * 4 + 3] >= 128) { const k = (p[i * 4] << 16) | (p[i * 4 + 1] << 8) | p[i * 4 + 2]; freq.set(k, (freq.get(k) ?? 0) + 1); }
  if (freq.size <= limit) return;
  const ordered = [...freq].sort((a, b) => b[1] - a[1]).map(([k]) => [k >> 16, (k >> 8) & 255, k & 255]);
  const dist = (a, b) => 2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2;
  let map;
  for (let t = 6; ; t += 3) {
    const kept = []; map = new Map();
    for (const c of ordered) {
      const hit = kept.find((k) => dist(c, k) < 9 * t * t);
      map.set((c[0] << 16) | (c[1] << 8) | c[2], hit ?? c);
      if (!hit) kept.push(c);
    }
    if (kept.length <= limit) break;
  }
  for (let i = 0; i < w * h; i++) if (p[i * 4 + 3] >= 128) {
    const c = map.get((p[i * 4] << 16) | (p[i * 4 + 1] << 8) | p[i * 4 + 2]);
    p[i * 4] = c[0]; p[i * 4 + 1] = c[1]; p[i * 4 + 2] = c[2];
  }
}

/* Classify colors by position and brightness using thresholds for the base character. */
const lumOf = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
const satOf = (c) => Math.max(...c) - Math.min(...c);
const redOf = (c) => c[0] - c[2];
const hexOf = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const key = (c) => c.join(',');
const dist = (a, b) => 2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2;

const isOutline = (c) => lumOf(c) < 58;
const isWhite = (c) => lumOf(c) > 242 && satOf(c) < 40;
const isSkin = (c) => lumOf(c) >= 188 && lumOf(c) <= 242 && redOf(c) >= 20 && redOf(c) <= 75;
const isBlush = (c) => redOf(c) > 75 && lumOf(c) >= 140 && lumOf(c) <= 205;

function pixelsOf(im) {
  const out = [];
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const i = (y * im.width + x) * 4;
    if (im.pixels[i + 3] >= 128) out.push({ c: [im.pixels[i], im.pixels[i + 1], im.pixels[i + 2]], x, y });
  }
  return out;
}

const tally = (list) => { const m = new Map(); for (const k of list) m.set(k, (m.get(k) ?? 0) + 1); return m; };
const top1 = (m) => (m.size ? [...m].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number) : null);

export function chinRow(im) {
  const px = pixelsOf(im);
  const ys = px.map((p) => p.y);
  const top0 = Math.min(...ys); const bot = Math.max(...ys);
  const H = bot - top0 + 1;
  const xs = px.map((p) => p.x);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  /* Use contiguous skin rows to exclude isolated patches below the chin. */
  const ok = (y) => px.filter((p) => p.y === y && Math.abs(p.x - cx) < im.width * 0.1 && isSkin(p.c)).length >= 3;
  let chin = top0 + Math.round(H * 0.45);
  for (let y = top0; y < top0 + H * 0.62; y++) {
    if (!ok(y)) continue;
    let end = y;
    while (end + 1 < top0 + H && ok(end + 1)) end++;
    chin = end;
    break;
  }
  return chin;
}

function toRoleArt(im, chin, back) {
  const px = pixelsOf(im);
  const ys = px.map((p) => p.y); const xs = px.map((p) => p.x);
  const y0 = Math.min(...ys); const bot = Math.max(...ys);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs);
  const cx = Math.round((x0 + x1) / 2);

  const hairSet = new Set(px.filter((p) => p.y <= chin && !isOutline(p.c) && !isWhite(p.c) && !isSkin(p.c) && !isBlush(p.c)).map((p) => key(p.c)));
  const skinList = [...new Set(px.filter((p) => isSkin(p.c)).map((p) => key(p.c)))].map((k) => k.split(',').map(Number));

  const garment = (p) => !isOutline(p.c) && !isWhite(p.c) && !hairSet.has(key(p.c)) && !isSkin(p.c) && !isBlush(p.c) && !skinList.some((c) => dist(p.c, c) < 900);

  let waist = bot + 1;
  let first = null;
  for (let y = chin + 1; y <= bot - 5; y++) {
    const mid = px.filter((p) => p.y === y && Math.abs(p.x - cx) <= 1 && garment(p));
    if (!mid.length) continue;
    const c = top1(tally(mid.map((p) => key(p.c))));
    if (!first) { first = c; continue; }
    if (dist(c, first) > 2600) { waist = y; break; }
  }

  const roleOf = (p) => {
    if (isOutline(p.c) || isWhite(p.c)) return null;
    if (p.y <= chin) return isBlush(p.c) && !back ? 'blush' : isSkin(p.c) ? 'skin' : 'hair';
    if (hairSet.has(key(p.c))) return 'hair';
    if (isSkin(p.c) || skinList.some((c) => dist(p.c, c) < 900)) return 'skin';
    if (isBlush(p.c) && !back) return 'blush';
    if (p.y > bot - 5) return null;
    return p.y < waist ? 'top' : 'bottom';
  };

  const byRole = {};
  for (const p of px) { const r = roleOf(p); if (r) (byRole[r] ??= []).push(key(p.c)); }
  const refs = {};
  for (const [r, list] of Object.entries(byRole)) refs[r] = top1(tally(list));

  const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'];
  const letterOf = new Map();
  const palette = {}; const roles = {};
  const grid = [];
  for (let y = y0; y <= bot; y++) {
    let row = '';
    for (let x = x0; x <= x1; x++) {
      const p = px.find((q) => q.x === x && q.y === y);
      if (!p) { row += '.'; continue; }
      const r = roleOf(p);
      let k;
      if (!r) k = `fixed|${key(p.c)}`;
      else {
        const ref = refs[r === 'blush' ? 'skin' : r] ?? refs.skin ?? p.c;
        const f = +Math.max(0.25, Math.min(1.9, lumOf(p.c) / (lumOf(ref) || 1))).toFixed(2);
        k = `${r}|${f}`;
      }
      let ch = letterOf.get(k);
      if (!ch) {
        ch = LETTERS[letterOf.size];
        if (!ch) throw new Error('역할 조합이 62개를 넘었다');
        letterOf.set(k, ch);
        palette[ch] = hexOf(p.c);
        if (r) roles[ch] = [r, Number(k.split('|')[1])];
      }
      row += ch;
    }
    grid.push(row);
  }
  return { rows: grid, palette, roles, refs, w: x1 - x0 + 1, h: bot - y0 + 1, waist };
}

mkdirSync('src/person-pixel', { recursive: true });
/* Reuse the first front view palette for all combinations. */
const refIm = decodePng(readFileSync(`${dir}/${ids[0]}-south.png`));
quantize(refIm);
const chin = chinRow(refIm);
const baseArt = toRoleArt(refIm, chin, false);
const ref = baseArt.refs;
console.error(`턱 ${chin}줄, 허리 ${baseArt.waist}줄, 기준색: ` + Object.entries(ref).map(([r, c]) => `${r} ${hexOf(c)}`).join(' '));

const looks = {};
for (const id of ids) {
  const [hair, outfit] = id.split('_');
  const dirs = {};
  for (const d of ['south', 'north']) {
    const im = decodePng(readFileSync(`${dir}/${id}-${d}.png`));
    quantize(im);
    dirs[d] = toRoleArt(im, chin, d === 'north');
  }
  const text = `
export const south = {
  rows: [
${dirs.south.rows.map((r) => `    '${r}',`).join('\n')}
  ],
  palette: ${JSON.stringify(dirs.south.palette).replace(/"/g, "'").replace(/,/g, ', ').replace(/:/g, ': ')},

  roles: ${JSON.stringify(dirs.south.roles).replace(/"/g, "'").replace(/,/g, ', ').replace(/:/g, ': ')},
};
export const north = {
  rows: [
${dirs.north.rows.map((r) => `    '${r}',`).join('\n')}
  ],
  palette: ${JSON.stringify(dirs.north.palette).replace(/"/g, "'").replace(/,/g, ', ').replace(/:/g, ': ')},
  roles: ${JSON.stringify(dirs.north.roles).replace(/"/g, "'").replace(/,/g, ', ').replace(/:/g, ': ')},
};
`;
  writeFileSync(`src/person-pixel/${id}.js`, text);
  (looks[hair] ??= {})[outfit] = dirs;
  console.error(`${id}: 앞 ${dirs.south.w}x${dirs.south.h}, 뒤 ${dirs.north.w}x${dirs.north.h}`);
}

const hairs = Object.keys(looks);
const first = looks[hairs[0]][Object.keys(looks[hairs[0]])[0]].south;
const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)); return 0.299 * r + 0.587 * g + 0.114 * b; };
const H = first.rows.length; const W = first.rows[0].length;
const darkest = Math.min(...Object.values(first.palette).map(lum));
let eyeRow = Math.round(H * 0.35); let best = 0;
for (let y = Math.round(H * 0.15); y < H * 0.45; y++) {
  let n = 0;
  for (let x = Math.round(W * 0.25); x < W * 0.75; x++) { const c = first.palette[first.rows[y][x]]; if (c && lum(c) <= darkest + 6) n++; }
  if (n > best) { best = n; eyeRow = y; }
}
const face = { height: H, eyeRow, eyeFromBottom: H - eyeRow, mouthFromBottom: H - eyeRow - 4, handFromBottom: Math.round(H * 0.38), handCol: Math.round(W * 0.42), crownSink: 2 };

const imports = ids.map((id) => `import * as ${id} from './person-pixel/${id}.js';`).join('\n');
const table = hairs.map((h) => `  ${h}: { ${Object.keys(looks[h]).map((o) => `${o}: ${h}_${o}`).join(', ')} },`).join('\n');
writeFileSync('src/catalog-person-pixel.js', `/* Generated by scripts/import-character.js. */
${imports}

export const PIXEL_LOOKS = {
${table}
};

export const PIXEL_HAIRS = {
${hairs.map((h) => `  ${h}: { label: '${HAIR_LABEL[h] ?? h}', art: [] },`).join('\n')}
};

export const PIXEL_OUTFITS = {
${Object.keys(looks[hairs[0]]).map((o) => `  ${o}: { label: '${OUTFIT_LABEL[o] ?? o}' },`).join('\n')}
};

export const PIXEL_FACE = ${JSON.stringify(face).replace(/"/g, '').replace(/,/g, ', ').replace(/:/g, ': ')};

export const PIXEL_COLORS = {
  skin: '${ref.skin ? hexOf(ref.skin) : '#f7dcc3'}',
  hair: '${ref.hair ? hexOf(ref.hair) : '#4a3320'}',
  top: '${ref.top ? hexOf(ref.top) : '#3aa0a8'}',
  bottom: '${ref.bottom ? hexOf(ref.bottom) : '#4a5ba8'}',
};
`);
console.error(`색인: 머리 ${hairs.length} × 의상 ${Object.keys(looks[hairs[0]]).length}, 눈 발끝에서 ${face.eyeFromBottom}줄 → src/catalog-person-pixel.js`);
