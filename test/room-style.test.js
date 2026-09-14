import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRoom, styleFor, STYLE, DEMO_ROOM, EMPTY_ROOM } from '../src/room.js';
import { FLOOR_ITEMS, EFFECTS, personArt, DEFAULT_PERSON } from '../src/catalog.js';

const rules = (css) => (css.match(/^[ \t]*[^\s{@][^{]*\{/gm) ?? []).map((m) => m.replace(/\s*\{$/, '').trim());
const keyframes = (css) => (css.match(/@keyframes ([\w-]+)/g) ?? []).map((m) => m.split(' ')[1]);

test('a still sprite needs no style at all', () => {
  assert.equal(styleFor(FLOOR_ITEMS.chest.art), '');
  assert.equal(styleFor('<g><path d="M0 0h1v1h-1z"/></g>'), '');
});

test('a moving sprite keeps its own rules, its keyframes and nothing else', () => {
  const css = styleFor(EFFECTS.note.art);
  assert.deepEqual(rules(css), ['.fx-bob', '.fx-bob']);
  assert.deepEqual(keyframes(css), ['bob']);
  assert.match(css, /prefers-reduced-motion/);
  assert.ok(!css.includes('.fx-beat'), 'unrelated rules leaked in');
});

test('a shared keyframe stays while any user of it is present', () => {
  const css = styleFor(EFFECTS.heart.art);
  assert.ok(css.includes('.fx-beat'));
  assert.deepEqual(keyframes(css), ['beat']);
});

test('the person animation classes come with the shared transform rule', () => {
  const css = styleFor(personArt({ ...DEFAULT_PERSON, anim: 'bob' }));
  assert.ok(css.includes('.p-bob {'), 'the bob rule is missing');
  assert.ok(css.includes('transform-origin: 50% 100%'), 'the pivot rule is missing');
  assert.ok(!css.includes('.p-fly'), 'other person motions leaked in');
  assert.deepEqual(keyframes(css), ['pbob']);
});

test('text rules follow text', () => {
  assert.equal(styleFor('<g class="bubble-text"></g>').includes('.bubble-text'), true);
  assert.equal(styleFor('<text>hi</text>').includes('text {'), true);
  assert.equal(styleFor('<g></g>').includes('text {'), false);
});

test('the full style block is a superset of everything a room can use', () => {
  const full = styleFor(`<g class="${[...STYLE.matchAll(/\.([\w-]+)/g)].map((m) => m[1]).join(' ')}"><text/></g>`);
  assert.deepEqual(keyframes(full), keyframes(STYLE));
  assert.equal(rules(full).length, rules(STYLE).length);
});

test('a rendered room only carries the rules it draws', () => {
  const empty = renderRoom(structuredClone(EMPTY_ROOM));
  assert.ok(!empty.includes('@keyframes'), 'an empty room has nothing to animate');

  const demo = renderRoom(structuredClone(DEMO_ROOM));
  const css = demo.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.ok(keyframes(css).length > 0, 'the demo room animates');
  assert.ok(keyframes(css).length < keyframes(STYLE).length, 'the demo room does not use every animation');
  assert.match(css, /prefers-reduced-motion/);
});
