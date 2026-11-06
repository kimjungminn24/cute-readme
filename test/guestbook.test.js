import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderGuestbook, toEntries, guestbookSnippet, GUESTBOOK_THEMES } from '../src/guestbook.js';
import { readDotFont } from '../src/dotfont.js';

const dots = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));

const comment = (login, body, createdAt, extra = {}) => ({
  author: login ? { login, avatarUrl: `https://avatars.example/${login}` } : null,
  body,
  createdAt,
  url: `https://github.com/o/r/discussions/1#c-${login}`,
  isMinimized: false,
  ...extra,
});

const COMMENTS = [
  comment('old', 'first!', '2026-01-01T00:00:00Z'),
  comment('new', 'hello **there**', '2026-03-01T00:00:00Z'),
  comment('mid', '안녕하세요', '2026-02-01T00:00:00Z'),
];

test('entries come newest first with markdown stripped', () => {
  const got = toEntries(COMMENTS);
  assert.deepEqual(got.map((e) => e.login), ['new', 'mid', 'old']);
  assert.equal(got[0].message, 'hello there');
  assert.equal(got[0].date, '2026-03-01');
});

test('hidden comments, bots and empty notes are left out', () => {
  const got = toEntries([
    ...COMMENTS,
    comment('spammer', 'buy now', '2026-04-01T00:00:00Z', { isMinimized: true }),
    comment('github-actions[bot]', 'beep', '2026-04-02T00:00:00Z'),
    comment('quiet', '   ', '2026-04-03T00:00:00Z'),
  ]);
  assert.deepEqual(got.map((e) => e.login), ['new', 'mid', 'old']);
});

test('a deleted account shows up as ghost', () => {
  const [e] = toEntries([comment(null, 'still here', '2026-01-01T00:00:00Z')]);
  assert.equal(e.login, 'ghost');
});

test('limit keeps only the newest notes', () => {
  assert.deepEqual(toEntries(COMMENTS, 2).map((e) => e.login), ['new', 'mid']);
});

test('every theme draws every note with its name', () => {
  const entries = toEntries(COMMENTS);
  for (const theme of Object.keys(GUESTBOOK_THEMES)) {
    const svg = renderGuestbook(entries, { theme });
    assert.match(svg, /^<svg [^>]*viewBox="0 0 520 \d+"/);
    for (const e of entries) assert.ok(svg.includes(`<title>${e.login}: `), `${theme}: ${e.login} missing`);
  }
});

test('the pixel theme draws text with the dot font', () => {
  const entries = toEntries(COMMENTS).map((e) => ({ ...e, avatar: 'data:image/png;base64,AA==' }));
  const svg = renderGuestbook(entries, { theme: 'pixel', dots });
  assert.ok(!svg.includes('<text'), 'pixel text fell back to <text>');
  assert.match(svg, /shape-rendering="crispEdges"/);
});

test('messages are escaped', () => {
  const svg = renderGuestbook(toEntries([comment('x', '<script>alert(1)</script> & co', '2026-01-01')]), { theme: 'light' });
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('&amp; co'));
});

test('an empty guestbook asks for the first note', () => {
  const svg = renderGuestbook([], { theme: 'light' });
  assert.ok(svg.includes('no notes yet'));
});

test('long messages stop at the line limit', () => {
  const long = 'word '.repeat(200);
  const short = renderGuestbook(toEntries([comment('a', 'hi', '2026-01-01')]), { theme: 'light', lines: 3 });
  const tall = renderGuestbook(toEntries([comment('a', long, '2026-01-01')]), { theme: 'light', lines: 3 });
  const height = (svg) => Number(svg.match(/viewBox="0 0 \d+ (\d+)"/)[1]);
  assert.equal(height(tall) - height(short), 30, 'three lines should add exactly two extra line heights');
  assert.ok(tall.includes('…'));
});

test('narrow widths wrap into more lines', () => {
  const entries = toEntries([comment('a', 'a message that is long enough to wrap on a narrow sheet of paper', '2026-01-01')]);
  const narrow = renderGuestbook(entries, { theme: 'light', width: 320 });
  const wide = renderGuestbook(entries, { theme: 'light', width: 520 });
  const height = (svg) => Number(svg.match(/viewBox="0 0 \d+ (\d+)"/)[1]);
  assert.ok(height(narrow) > height(wide));
});

test('snippet links to the discussion', () => {
  assert.equal(
    guestbookSnippet('https://github.com/o/r/discussions/1'),
    '<a href="https://github.com/o/r/discussions/1"><img src="./guestbook.svg" width="100%" alt="Guestbook"></a>',
  );
});
