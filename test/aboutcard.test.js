import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderAboutCard, ABOUT_THEMES, ABOUT_ICONS, DEFAULT_ABOUT_ROWS } from '../src/aboutcard.js';
import { readDotFont } from '../src/dotfont.js';

const dots = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));
const size = (svg) => svg.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);

test('every icon is 8 by 8', () => {
  for (const [id, rows] of Object.entries(ABOUT_ICONS)) {
    assert.equal(rows.length, 8, id);
    for (const row of rows) assert.equal(row.length, 8, `${id}: ${row}`);
  }
});

test('every theme draws every row', () => {
  for (const theme of Object.keys(ABOUT_THEMES)) {
    const svg = renderAboutCard(DEFAULT_ABOUT_ROWS, { theme });
    for (const r of DEFAULT_ABOUT_ROWS) assert.ok(svg.includes(r.label), `${theme}: ${r.label}`);
  }
});

test('light and dark use the system font and rounded corners', () => {
  for (const theme of ['light', 'dark']) {
    const svg = renderAboutCard(DEFAULT_ABOUT_ROWS, { theme, dots });
    assert.ok(svg.includes('<text') && svg.includes('rx="10"'), theme);
    assert.ok(!svg.includes('crispEdges'), theme);
  }
});

test('the pixel themes write with the dot font', () => {
  const svg = renderAboutCard(DEFAULT_ABOUT_ROWS, { theme: 'candy', dots });
  assert.ok(!svg.includes('<text'));
});

test('height grows with rows and can be stretched to match another card', () => {
  const [, two] = size(renderAboutCard(DEFAULT_ABOUT_ROWS.slice(0, 2)));
  const [, four] = size(renderAboutCard(DEFAULT_ABOUT_ROWS));
  assert.ok(four > two);
  assert.deepEqual(size(renderAboutCard(DEFAULT_ABOUT_ROWS, { width: 460, height: 211 })), [460, 211]);
});

test('empty rows are dropped and the list stops at eight', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ icon: 'star', label: `l${i}`, text: 't' }));
  const svg = renderAboutCard([{ icon: 'star', label: '', text: '' }, ...rows]);
  assert.ok(svg.includes('l7') && !svg.includes('l8'));
});

test('unknown icons fall back to a star', () => {
  assert.doesNotThrow(() => renderAboutCard([{ icon: 'nope', label: 'a', text: 'b' }]));
});

test('text is escaped', () => {
  const svg = renderAboutCard([{ icon: 'star', label: '<b>', text: '& co' }], { title: '"hi"' });
  assert.ok(!svg.includes('<b>'));
  assert.ok(svg.includes('&amp; co'));
});

test('frame: false leaves only the icons and words', () => {
  const svg = renderAboutCard(DEFAULT_ABOUT_ROWS, { frame: false, dots });
  assert.ok(!svg.includes('M4 0H'), 'frame drawn');
  assert.ok(!svg.includes('tw'), 'twinkles drawn');
  const [, h] = size(svg);
  assert.equal(h, 30 + DEFAULT_ABOUT_ROWS.length * 30);
  const [, noTitle] = size(renderAboutCard(DEFAULT_ABOUT_ROWS, { frame: false, title: '' }));
  assert.ok(noTitle < h);
});

test('typing reveals each value in steps and ends with a cursor', () => {
  const rows = [{ icon: 'star', label: 'a', text: 'abc' }, { icon: 'star', label: 'b', text: 'de' }];
  const still = renderAboutCard(rows, { frame: false, dots });
  const typed = renderAboutCard(rows, { frame: false, typing: true, dots });
  assert.ok(!still.includes('<animate'));
  const anims = typed.match(/<animate attributeName="width"[^>]*>/g);
  assert.equal(anims.length, 2);
  assert.match(anims[0], /values="0;\d+;\d+;\d+"/);
  assert.match(anims[0], /calcMode="discrete"/);
  const begins = anims.map((a) => Number(a.match(/begin="([\d.]+)s"/)[1]));
  assert.ok(begins[1] > begins[0], 'second row starts after the first');
  assert.match(typed, /attributeName="opacity"[^>]*repeatCount="indefinite"/);
  assert.match(typed, /prefers-reduced-motion:reduce\)\{[^}]*clip-path:none/);
});
