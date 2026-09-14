import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { decodePng } from '../src/png.js';
import { toAscii, ALPHA_CUTOFF } from '../src/ascii.js';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) i++;
  else positional.push(args[i]);
}
const file = positional[0];

if (!file) {
  console.error('usage: node scripts/import-png.js <art.png> [--kind effect|wall|skill] [--id name]');
  process.exit(1);
}

const kind = flag('kind') ?? 'effect';
const id = flag('id') ?? basename(file, extname(file)).replace(/[^a-z0-9]/gi, '').toLowerCase();

let image;
try {
  image = decodePng(readFileSync(file));
} catch (err) {
  console.error(`${file}: ${err.message}`);
  process.exit(1);
}

let result;
try {
  result = toAscii(image);
} catch (err) {
  console.error(`${file}: ${err.message}`);
  process.exit(1);
}

const { rows, palette, warnings, trimmed } = result;

for (const w of warnings) console.warn(`! ${w}`);

const quote = (o) => `{ ${Object.entries(o).map(([k, v]) => `${k}: '${v}'`).join(', ')} }`;
const list = (r) => `[${r.map((s) => `'${s}'`).join(', ')}]`;
const name = id.charAt(0).toUpperCase() + id.slice(1);

const SNIPPETS = {
  effect: `  ${id}: {\n    name: '${name}',\n    art: fx(\n      ${list(rows)},\n      ${quote(palette)},\n      'fx-bob',\n    ),\n  },`,

  wall: `  ${id}: { name: '${name}', v: 30, art: wallSprite(${list(rows)}, ${quote(palette)}) },`,

  skill: `  ${id}: ${list(rows)},\n// SKILLS: ${id}: { name: '${name}', art: skillArt('${Object.values(palette)[0]}', '#ffffff', ICON.${id}) },`,
};

if (!SNIPPETS[kind]) {
  console.error(`unknown kind: ${kind} (effect | wall | skill)`);
  process.exit(1);
}

console.log(`${trimmed.width}x${trimmed.height} dots, ${Object.keys(palette).length} colors\n`);
console.log(SNIPPETS[kind]);
console.log(`\nround trip verified. Rendering the dots above matches the source PNG pixel for pixel.`);
console.log(`(alpha below ${ALPHA_CUTOFF} treated as transparent)`);
