import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const API = 'https://api.pixellab.ai/v2';

function apiKey() {
  let key = process.env.PIXELLAB_API_KEY;
  if (!key && process.platform === 'win32') {
    key = execFileSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('PIXELLAB_API_KEY','User')"], { encoding: 'utf8' }).trim();
  }
  if (!key) { console.error('PIXELLAB_API_KEY 가 없다'); process.exit(1); }
  return key;
}

const argv = process.argv.slice(2);
const opt = { size: 48, seed: 1, out: 'pixellab-out', proportions: 'chibi', guidance: 11, head: null, body: 1 };
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]; const next = () => argv[++i];
  if (a === '--size') opt.size = Number(next());
  else if (a === '--seed') opt.seed = Number(next());
  else if (a === '--out') opt.out = next();
  else if (a === '--proportions') opt.proportions = next();
  else if (a === '--guidance') opt.guidance = Number(next());
  else if (a === '--head') opt.head = Number(next());   // Head size: 0.5 to 2. Overrides the preset.
  else if (a === '--body') opt.body = Number(next());   // Shoulder and hip width: 0.5 to 2.
  else pos.push(a);
}
const [id, what] = pos;
if (!id || !what) { console.error('usage: node scripts/gen-character.js <id> "<description>" [--size 48] [--seed N] [--out dir]'); process.exit(1); }

const key = apiKey();
const headers = { Authorization: `Bearer ${key}`, 'content-type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const body = {
  description: what,
  image_size: { width: opt.size, height: opt.size },
  text_guidance_scale: opt.guidance,
  outline: 'selective outline',
  shading: 'flat shading',
  detail: 'low detail',
  view: 'low top-down',
  proportions: opt.head ? { type: 'custom', head_size: opt.head, arms_length: 1, legs_length: 1, shoulder_width: opt.body, hip_width: opt.body } : { type: 'preset', name: opt.proportions },
  seed: opt.seed,
};
const r = await fetch(`${API}/create-character-with-4-directions`, { method: 'POST', headers, body: JSON.stringify(body) });
if (!r.ok) { console.error(`PixelLab ${r.status}: ${(await r.text()).slice(0, 500)}`); process.exit(1); }
const q = await r.json();
console.error(`큐에 넣음: job ${q.background_job_id}, character ${q.character_id}`);

let job;
for (let i = 0; i < 120; i++) {
  await sleep(3000);
  job = await (await fetch(`${API}/background-jobs/${q.background_job_id}`, { headers })).json();
  process.stderr.write(job.status === 'processing' ? '.' : `\n상태: ${job.status}\n`);
  if (job.status !== 'processing') break;
}
if (job.status !== 'completed') { console.error(JSON.stringify(job).slice(0, 800)); process.exit(1); }

const ch = await (await fetch(`${API}/characters/${q.character_id}`, { headers })).json();
mkdirSync(opt.out, { recursive: true });
writeFileSync(`${opt.out}/${id}-character.json`, JSON.stringify(ch, null, 2));
const found = [];
const walk = (v, path) => {
  if (!v || typeof v !== 'object') return;
  if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string' && /^https?:\/\//.test(val) && /\.png(\?|$)/i.test(val)) found.push({ path: `${path}.${k}`, url: val, ctx: v });
    else walk(val, `${path}.${k}`);
  }
};
walk(ch, 'character');
let n = 0;
for (const f of found) {
  const dir = f.ctx.direction ?? f.ctx.name ?? (f.path.match(/(south|north|east|west)/i) || [])[1] ?? `img${n}`;
  const png = Buffer.from(await (await fetch(f.url)).arrayBuffer());
  writeFileSync(`${opt.out}/${id}-${String(dir).toLowerCase()}.png`, png);
  console.error(`${opt.out}/${id}-${String(dir).toLowerCase()}.png  (${f.path})`);
  n++;
}
if (!n) console.error('그림 URL 을 못 찾았다. ' + `${opt.out}/${id}-character.json` + ' 을 열어 봐라');
