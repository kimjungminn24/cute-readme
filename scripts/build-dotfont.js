import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const [inFile, outFile = 'assets/galmuri11.dot'] = process.argv.slice(2);

if (!inFile) {
  console.error('usage: node scripts/build-dotfont.js <input.bdf> [output.dot]');
  process.exit(1);
}

const RANGES = [
  [0x0020, 0x007e],
  [0x00a0, 0x024f],
  [0x2010, 0x203a],
  [0x3131, 0x318e],
  [0xac00, 0xd7a3],
];

function parseBdf(text) {
  const lines = text.split(/\r?\n/);
  const glyphs = new Map();
  let ascent = 11;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('FONT_ASCENT ')) ascent = Number(line.slice(12));
    if (!line.startsWith('STARTCHAR U+')) continue;

    const cp = parseInt(line.slice(12), 16);
    let j = i;
    let bbx = null;
    let adv = 0;
    while (j < lines.length && !lines[j].startsWith('BITMAP')) {
      if (lines[j].startsWith('BBX ')) bbx = lines[j].split(/\s+/).slice(1).map(Number);
      if (lines[j].startsWith('DWIDTH ')) adv = Number(lines[j].split(/\s+/)[1]);
      j++;
    }
    const rows = [];
    for (j++; j < lines.length && lines[j] !== 'ENDCHAR'; j++) rows.push(lines[j].trim());
    if (bbx) glyphs.set(cp, { adv, w: bbx[0], h: bbx[1], xoff: bbx[2], yoff: bbx[3], rows });
  }
  return { ascent, glyphs };
}

const { ascent, glyphs } = parseBdf(readFileSync(inFile, 'utf8'));

const kept = [];
for (const [start, end] of RANGES) {
  for (let cp = start; cp <= end; cp++) kept.push(glyphs.get(cp) ?? null);
}

const stride = (g) => (g ? Math.ceil(g.w / 8) * g.h : 0);
const dataSize = kept.reduce((n, g) => n + stride(g), 0);
const headSize = 8 + RANGES.length * 4;
const indexSize = kept.length * 8;

const out = new Uint8Array(headSize + indexSize + dataSize);
const view = new DataView(out.buffer);

out.set([0x44, 0x4f, 0x54, 0x46], 0);
view.setUint8(4, 1);
view.setUint8(5, ascent);
view.setUint16(6, RANGES.length);
RANGES.forEach(([start, end], i) => {
  view.setUint16(8 + i * 4, start);
  view.setUint16(10 + i * 4, end);
});

let cursor = headSize + indexSize;
kept.forEach((g, i) => {
  const at = headSize + i * 8;
  if (!g) return;
  view.setUint32(at, cursor);
  view.setUint8(at + 4, g.adv);
  view.setUint8(at + 5, g.w);
  view.setUint8(at + 6, g.h);
  view.setInt8(at + 7, g.yoff);
  for (const row of g.rows) {
    for (let b = 0; b < Math.ceil(g.w / 8); b++) {
      out[cursor++] = parseInt(row.slice(b * 2, b * 2 + 2).padEnd(2, '0'), 16);
    }
  }
});

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, out);

const found = kept.filter(Boolean).length;
console.log(`${outFile}: ${found} glyphs / ${kept.length} slots, ${(out.length / 1024).toFixed(0)}KB (baseline ${ascent})`);
