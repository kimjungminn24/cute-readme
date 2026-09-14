import { writeFileSync } from 'node:fs';
import { renderSuika, SUIKA_THEMES, DEFAULT_SUIKA_THEME } from '../src/suika.js';
import { fetchContributors, withAvatars } from '../src/github.js';

const [repoArg, outFile = 'suika.svg', themeArg] = process.argv.slice(2);
const [owner, repo] = (repoArg ?? '').split('/');

const theme = themeArg || process.env.SUIKA_THEME || DEFAULT_SUIKA_THEME;
const title = process.env.SUIKA_TITLE || 'Contributors';

const limit = Number(process.env.SUIKA_LIMIT) || undefined;
const width = Number(process.env.SUIKA_WIDTH) || undefined;
const scale = Number(process.env.SUIKA_SCALE) || undefined;

const drop = process.env.SUIKA_DROP !== 'false';
const names = process.env.SUIKA_NAMES !== 'false';

if (!owner || !repo) {
  console.error('usage: node scripts/render-suika.js <owner/repo> [outfile] [theme]');
  process.exit(1);
}

if (!(theme in SUIKA_THEMES)) {
  console.error(`unknown theme "${theme}", pick one of: ${Object.keys(SUIKA_THEMES).join(', ')}`);
  process.exit(1);
}

const raw = await fetchContributors({ owner, repo, token: process.env.GITHUB_TOKEN, limit: limit ?? 15 });

const people = await withAvatars(raw, null);

const svg = renderSuika(people, { title, theme, limit, width, scale, drop, names });

writeFileSync(outFile, svg);
const size = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
const top = people[0];
console.log(
  `${outFile} (${svg.length.toLocaleString()} bytes, ${people.length} eggs, ${theme}, ${size[1]}x${size[2]})`
  + (top ? `, 🍉 ${top.login} ${top.contributions} commits` : ''),
);
