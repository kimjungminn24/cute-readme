import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  renderMusicCard, parseYouTube, youtubeUrl, thumbnailUrl, musicFile, MUSIC_CARD_THEMES,
} from '../src/musiccard.js';
import { readDotFont } from '../src/dotfont.js';

const dots = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));
const ID = 'abcDEF12_-x';

test('finds the video id in the usual link shapes', () => {
  for (const link of [
    ID,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42s&list=xyz`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}?si=share`,
    `youtu.be/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
  ]) assert.equal(parseYouTube(link), ID, link);
});

test('rejects links that are not YouTube videos', () => {
  for (const bad of ['', 'hello', 'https://vimeo.com/123', 'https://www.youtube.com/@channel', 'https://youtu.be/short']) {
    assert.equal(parseYouTube(bad), null, bad);
  }
});

test('builds the watch and thumbnail links', () => {
  assert.equal(youtubeUrl(ID), `https://www.youtube.com/watch?v=${ID}`);
  assert.equal(thumbnailUrl(ID), `https://i.ytimg.com/vi/${ID}/mqdefault.jpg`);
});

test('file names come from the title, or the id when the title has no latin letters', () => {
  assert.equal(musicFile({ id: ID, title: 'Magnetic (Official MV)' }), 'magnetic-official-mv.svg');
  assert.equal(musicFile({ id: ID, title: '체포하겠어' }), `${ID}.svg`);
});

test('every theme shows the title and artist', () => {
  for (const theme of Object.keys(MUSIC_CARD_THEMES)) {
    const svg = renderMusicCard({ id: ID, title: 'Song', artist: 'Band' }, { theme });
    assert.match(svg, /^<svg [^>]*viewBox="0 0 400 112"/);
    assert.ok(svg.includes('<title>Song by Band</title>'), theme);
  }
});

test('the pixel theme writes with the dot font', () => {
  const svg = renderMusicCard({ id: ID, title: '체포하겠어', artist: 'ILLIT' }, { theme: 'pixel', dots });
  assert.ok(!svg.includes('<text'), 'fell back to <text>');
});

test('a thumbnail replaces the default cover', () => {
  const cover = 'data:image/jpeg;base64,AAAA';
  const withCover = renderMusicCard({ id: ID, title: 'a', cover }, { theme: 'light' });
  const plain = renderMusicCard({ id: ID, title: 'a' }, { theme: 'light' });
  assert.ok(withCover.includes(`href="${cover}"`));
  assert.ok(!plain.includes('<image'));
});

test('text is escaped', () => {
  const svg = renderMusicCard({ title: '<b>& co</b>', artist: '"x"' }, { theme: 'light' });
  assert.ok(!svg.includes('<b>'));
  assert.ok(svg.includes('&amp; co'));
});

test('the cover is a 16:9 box with or without a thumbnail', () => {
  assert.match(renderMusicCard({ title: 'a' }, { theme: 'light' }), /<rect x="16" y="20" width="128" height="72"/);
  const svg = renderMusicCard({ title: 'a', cover: 'data:image/jpeg;base64,AAAA' }, { theme: 'light' });
  assert.match(svg, /<image [^>]*width="128" height="72"/);
});

test('motion stops for reduced motion', () => {
  const svg = renderMusicCard({ title: 'a' }, { theme: 'pixel' });
  assert.match(svg, /prefers-reduced-motion:reduce/);
});

test('the square layout puts the title under a full-width thumbnail', () => {
  const svg = renderMusicCard({ title: 'a', artist: 'b' }, { theme: 'light', layout: 'square' });
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
  assert.equal(w, 220);
  assert.ok(Math.abs(w - h) <= 12, `${w}x${h} is not close to square`);
  assert.match(svg, /<rect x="16" y="16" width="188" height="106"/);
});
