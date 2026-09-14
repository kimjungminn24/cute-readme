/* Limit the palette to 60 colors to fit the ASCII character set. */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const API = 'https://api.pixellab.ai/v2';
/* Use separate prompts for front and back views to avoid faces on the back. */
const KEEP = {
  south: 'keep the face, eyes, skin, pose and everything else exactly the same',
  north: 'this is the back view of the character seen from behind, no face is visible, keep the body, pose and everything else exactly the same',
};

/* The base image uses bob hair and a tee. */
export const HAIRS = {
  long: 'change the hair into long straight dark brown hair reaching the waist, same bangs',
  ponytail: 'change the hair into a high ponytail tied at the back, same dark brown color and same bangs',
  bun: 'change the hair into a round bun on top of the head, same dark brown color and same bangs',
};
export const OUTFITS = {
  hoodie: 'change the t-shirt into an oversized light blue hoodie with a white drawstring, keep the shorts',
  cardigan: 'change the t-shirt into a cream knit cardigan over a white t-shirt, light blue denim shorts',
  dress: 'change the clothes into a simple pale pink dress with short sleeves reaching the knees',
  shirt: 'change the t-shirt into a white collared shirt with a small navy necktie, navy shorts',
};

function apiKey() {
  let key = process.env.PIXELLAB_API_KEY;
  if (!key && process.platform === 'win32') key = execFileSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('PIXELLAB_API_KEY','User')"], { encoding: 'utf8' }).trim();
  if (!key) { console.error('PIXELLAB_API_KEY 가 없다'); process.exit(1); }
  return key;
}

const argv = process.argv.slice(2);
const opt = { base: 'bob_tee', seed: 4 };
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]; const next = () => argv[++i];
  if (a === '--base') opt.base = next();
  else if (a === '--seed') opt.seed = Number(next());
  else pos.push(a);
}
const [dir] = pos;
if (!dir) { console.error('usage: node scripts/edit-character.js <dir> [--base bob_tee] [--seed 4]'); process.exit(1); }
const H = { Authorization: `Bearer ${apiKey()}`, 'content-type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function edit(inFile, outFile, description, d) {
  const r = await fetch(`${API}/edit-image-pixen`, { method: 'POST', headers: H, body: JSON.stringify({ image: { type: 'base64', base64: readFileSync(inFile).toString('base64'), format: 'png' }, description: `${description}, ${KEEP[d]}`, seed: opt.seed, no_background: true }) });
  if (!r.ok) throw new Error(`PixelLab ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const q = await r.json();
  let job;
  for (let i = 0; i < 100; i++) { await sleep(2000); job = await (await fetch(`${API}/background-jobs/${q.background_job_id}`, { headers: H })).json(); if (job.status !== 'processing') break; }
  if (job.status !== 'completed') throw new Error(`작업 실패: ${JSON.stringify(job).slice(0, 300)}`);
  let found = null;
  const walk = (v) => { if (found || !v || typeof v !== 'object') return; if (typeof v.base64 === 'string') { found = Buffer.from(v.base64, 'base64'); return; } for (const x of Object.values(v)) { if (typeof x === 'string' && /^https?:\/\/.*\.png/i.test(x) && !found) found = x; else walk(x); } };
  walk(job.last_response ?? job);
  if (typeof found === 'string') found = Buffer.from(await (await fetch(found)).arrayBuffer());
  if (!found) throw new Error('결과 그림이 없다');
  writeFileSync(outFile, found);
}

const [baseHair] = opt.base.split('_');
const hairs = [baseHair, ...Object.keys(HAIRS)];
let n = 0;
for (const h of Object.keys(HAIRS)) for (const d of ['south', 'north']) {
  const out = `${dir}/${h}_tee-${d}.png`;
  if (existsSync(out)) continue;
  try { await edit(`${dir}/${opt.base}-${d}.png`, out, HAIRS[h], d); n++; console.error(`머리 ${h} ${d}`); } catch (e) { console.error(`실패 ${h}_tee-${d}: ${e.message}`); }
}
for (const h of hairs) for (const o of Object.keys(OUTFITS)) for (const d of ['south', 'north']) {
  const out = `${dir}/${h}_${o}-${d}.png`;
  if (existsSync(out)) continue;
  try { await edit(`${dir}/${h}_tee-${d}.png`, out, OUTFITS[o], d); n++; console.error(`의상 ${h}/${o} ${d}`); } catch (e) { console.error(`실패 ${h}_${o}-${d}: ${e.message}`); }
}
console.error(`편집 ${n}장. 다음: npm run import:character -- ${dir}`);
