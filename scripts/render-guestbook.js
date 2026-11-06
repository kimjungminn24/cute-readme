import { readFileSync, writeFileSync } from 'node:fs';
import { renderGuestbook, toEntries, GUESTBOOK_THEMES, DEFAULT_GUESTBOOK_THEME } from '../src/guestbook.js';
import { fetchGuestbook, withAvatars } from '../src/github.js';
import { readDotFont } from '../src/dotfont.js';

const [repoArg, outFile = 'guestbook.svg'] = process.argv.slice(2);
const [owner, repo] = (repoArg ?? '').split('/');

const env = process.env;
const theme = env.GUESTBOOK_THEME || DEFAULT_GUESTBOOK_THEME;
const limit = Number(env.GUESTBOOK_LIMIT) || 8;
const options = {
  theme,
  limit,
  title: env.GUESTBOOK_TITLE || undefined,
  hint: env.GUESTBOOK_HINT ?? undefined,
  width: Number(env.GUESTBOOK_WIDTH) || undefined,
  scale: Number(env.GUESTBOOK_SCALE) || undefined,
  lines: Number(env.GUESTBOOK_LINES) || undefined,
};

if (!owner || !repo) {
  console.error('usage: node scripts/render-guestbook.js <owner/repo> [outfile]');
  process.exit(1);
}
if (!(theme in GUESTBOOK_THEMES)) {
  console.error(`unknown theme "${theme}", pick one of: ${Object.keys(GUESTBOOK_THEMES).join(', ')}`);
  process.exit(1);
}

let dots = null;
try {
  dots = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));
} catch (err) {
  console.warn(`could not read the dot font (${err.message}). Text goes out as <text>.`);
}

const book = await fetchGuestbook({
  owner,
  repo,
  token: env.GITHUB_TOKEN,
  number: env.GUESTBOOK_DISCUSSION,
  match: env.GUESTBOOK_MATCH || 'guestbook',
});

if (!book) {
  console.warn('found no guestbook discussion. Open one with "Guestbook" in its title, or set GUESTBOOK_DISCUSSION.');
}

const entries = await withAvatars(toEntries(book?.comments ?? [], limit), null);
const svg = renderGuestbook(entries, { ...options, dots });

writeFileSync(outFile, svg);
console.log(`${outFile} (${svg.length.toLocaleString()} bytes, ${entries.length} notes, ${theme})`
  + (book ? `, from ${book.url}` : ''));
