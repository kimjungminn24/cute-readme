import { writeFileSync } from 'node:fs';
import { renderSuika, sampleAvatar, SUIKA_THEMES, DEFAULT_SUIKA_THEME } from '../src/suika.js';
import { fetchContributors, withAvatars } from '../src/github.js';

const FIXTURE = [
  { login: 'kimjungminn24', contributions: 412 },
  { login: 'octocat', contributions: 96 },
  { login: 'defunkt', contributions: 54 },
  { login: 'mojombo', contributions: 31 },
  { login: 'pjhyett', contributions: 18 },
  { login: 'ivy', contributions: 11 },
  { login: 'hubot', contributions: 7 },
  { login: 'tater', contributions: 4 },
  { login: 'bark', contributions: 3 },
  { login: 'nori', contributions: 2 },
  { login: 'mono', contributions: 1 },
  { login: 'newbie', contributions: 1 },
].map((c, i) => ({ ...c, avatar: sampleAvatar(c.login, i) }));

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const themeArg = flag('theme') ?? DEFAULT_SUIKA_THEME;
const width = Number(flag('width')) || undefined;
const target = args.find((a) => !a.startsWith('--'));

const ids = Object.keys(SUIKA_THEMES);
if (themeArg !== 'all' && !ids.includes(themeArg)) {
  console.error(`unknown theme "${themeArg}", pick one of: ${ids.join(', ')}, all`);
  process.exit(1);
}

let people = FIXTURE;

if (target) {
  const [owner, repo] = target.split('/');
  if (!owner || !repo) {
    console.error('usage: npm run preview:suika -- [owner/repo] [--theme=dark|all]');
    process.exit(1);
  }
  const raw = await fetchContributors({ owner, repo, token: process.env.GITHUB_TOKEN });
  people = await withAvatars(raw, null);
}

for (const theme of themeArg === 'all' ? ids : [themeArg]) {
  const file = themeArg === 'all' ? `suika-${theme}.svg` : 'suika.svg';
  const svg = renderSuika(people, { theme, width });
  writeFileSync(file, svg);
  const size = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  console.log(`${file} (${svg.length.toLocaleString()} bytes, ${people.length} eggs, ${theme}, ${size[1]}x${size[2]})`);
}
