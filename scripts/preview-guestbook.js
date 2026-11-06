import { readFileSync, writeFileSync } from 'node:fs';
import { renderGuestbook, toEntries, GUESTBOOK_THEMES, DEFAULT_GUESTBOOK_THEME } from '../src/guestbook.js';
import { sampleAvatar } from '../src/suika.js';
import { readDotFont } from '../src/dotfont.js';

// Draws guestbook.preview[-theme].svg from made-up sample notes.
// The names are fictional and the avatars are generated, so no real account shows up.

const FIXTURE = [
  { login: 'mochi', body: 'the little rug in your room is so cute', createdAt: '2026-11-06T09:00:00Z' },
  { login: 'dubu', body: '놀러 왔다 갑니다. 미니룸 구경 잘 했어요', createdAt: '2026-11-05T12:00:00Z' },
  { login: 'pixel-cat', body: 'found this from your blog. say hi to the frog for me', createdAt: '2026-11-04T08:00:00Z' },
  { login: 'hana', body: '갈무리 폰트 쓰니까 진짜 옛날 홈피 느낌 나네요. 저도 따라 만들어 볼게요', createdAt: '2026-11-03T08:00:00Z' },
  { login: 'sora', body: 'hello from the other side of the internet', createdAt: '2026-11-01T08:00:00Z' },
].map((c) => ({ ...c, author: { login: c.login, avatarUrl: null }, url: null }));

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const themeArg = flag('theme') ?? DEFAULT_GUESTBOOK_THEME;
const width = Number(flag('width')) || undefined;

const ids = Object.keys(GUESTBOOK_THEMES);
if (themeArg !== 'all' && !ids.includes(themeArg)) {
  console.error(`unknown theme "${themeArg}", pick one of: ${ids.join(', ')}, all`);
  process.exit(1);
}

const dots = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));
let entries = toEntries(FIXTURE);
entries = entries.map((e, i) => ({ ...e, avatar: sampleAvatar(e.login, i) }));

for (const theme of themeArg === 'all' ? ids : [themeArg]) {
  const file = themeArg === 'all' ? `guestbook.preview-${theme}.svg` : 'guestbook.preview.svg';
  writeFileSync(file, renderGuestbook(entries, { theme, width, dots }));
  console.log(file);
}
