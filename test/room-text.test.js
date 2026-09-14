import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRoom, TEXT_STYLES, DEFAULT_TEXT_STYLE } from '../src/room.js';

test('bubbles stand per cell, independent of the person', () => {
  const svg = renderRoom({
    grid: { cols: 8, rows: 8 },
    bubbles: [{ text: 'hello', col: 1, row: 1 }, { text: 'there', col: 6, row: 6 }],
  });
  assert.equal((svg.match(/class="bubble-text"/g) ?? []).length, 2);
  assert.ok(!svg.includes('data-kind'), 'no editor markers outside editable mode');
});

test('type makes a clip and keyframes per line, each waiting for the last', () => {
  const svg = renderRoom({ grid: { cols: 6, rows: 6 }, texts: [{ text: 'typing animation works', col: 2, row: 2, anim: 'type' }] });
  const frames = svg.match(/@keyframes tw[\w-]+\{[^@]*?\}\}/g) ?? [];
  assert.equal(frames.length, 2, 'wraps to two lines, so two keyframes');

  const at = (frame, re) => [...frame.matchAll(re)].map((m) => Number(m[1]));
  const endOfFirst = at(frames[0], /([\d.]+)%\{transform:translateX\(0\)/g)[0];
  const waitsUntil = at(frames[1], /([\d.]+)%\{transform:translateX\(-/g).at(-1);
  assert.equal(waitsUntil, endOfFirst);

  assert.equal((svg.match(/<clipPath /g) ?? []).length, 2);
  assert.equal((svg.match(/animation:tw/g) ?? []).length, 2);
});

test('even with type, the clip at rest shows all the text', () => {
  const svg = renderRoom({ grid: { cols: 6, rows: 6 }, texts: [{ text: 'hello', col: 2, row: 2, anim: 'type' }] });
  const rect = svg.match(/<clipPath id="[^"]*"><rect [^>]*>/)[0];
  const num = (attr) => Number(rect.match(new RegExp(`${attr}="([\\d.-]+)"`))[1]);
  const textX = Number(svg.match(/class="bubble-text" x="([\d.-]+)"/)[1]);

  assert.ok(num('x') <= textX && textX <= num('x') + num('width'), 'the clip must cover the text');
  assert.ok(!rect.includes('transform='), 'a moved rest position hides text where animations do not run');
});

test('typing off builds no animation', () => {
  const svg = renderRoom({ grid: { cols: 6, rows: 6 }, bubbles: [{ text: 'hello', col: 2, row: 2 }] });
  assert.ok(!svg.includes('@keyframes tw'));
});

test('empty text draws no bubble', () => {
  const svg = renderRoom({ grid: { cols: 6, rows: 6 }, bubbles: [{ text: '', col: 2, row: 2 }, { text: '   ', col: 3, row: 3 }] });

  assert.equal((svg.match(/class="bubble-text"/g) ?? []).length, 0);
});

test('person.bubble still renders', () => {
  const svg = renderRoom({ grid: { cols: 6, rows: 6 }, person: { col: 2, row: 2, bubble: 'legacy' } });
  assert.ok(svg.includes('class="bubble-text"'));
});

test('styles differ in colors, Plain is boxless with a halo', () => {
  const draw = (style) => renderRoom({ grid: { cols: 6, rows: 6 }, texts: [{ text: 'hi', col: 2, row: 2, style }] });

  for (const [id, st] of Object.entries(TEXT_STYLES)) {
    const svg = draw(id);
    assert.ok(svg.includes(`fill="${st.fg}"`), `${id}: text color`);
    if (st.box) assert.ok(svg.includes(`fill="${st.bg}"`), `${id}: background color`);
  }

  const plain = draw('plain');
  const rectCount = (svg) => (svg.match(/<rect/g) ?? []).length;
  assert.ok(rectCount(plain) < rectCount(draw('bubble')), 'Plain must not keep a box');
  assert.ok(plain.includes('stroke-width="3"'), 'needs the halo to read on room patterns');

  assert.equal(draw('no-such-style'), draw(DEFAULT_TEXT_STYLE), 'typos fall to the default style');
});

test('motion is chosen apart from style', () => {
  const draw = (anim, style = 'plain') => renderRoom({ grid: { cols: 6, rows: 6 }, texts: [{ text: 'hi', col: 2, row: 2, style, anim }] });

  assert.ok(draw('float').includes('class="fx-bob"'));
  assert.ok(draw('blink').includes('class="fx-twinkle"'));
  assert.ok(draw('pulse').includes('class="fx-beat"'));
  assert.ok(!/class="fx-/.test(draw('none')), 'pinned gets no class at all');

  assert.ok(draw('type', 'plain').includes('<clipPath '));
  assert.ok(draw('type', 'bubble').includes('<clipPath '));
});

test('old names bubbles and typing still read', () => {
  const legacy = renderRoom({ grid: { cols: 6, rows: 6 }, bubbles: [{ text: 'hi', col: 2, row: 2, typing: true }] });
  const now = renderRoom({ grid: { cols: 6, rows: 6 }, texts: [{ text: 'hi', col: 2, row: 2, anim: 'type' }] });
  assert.equal(legacy, now);
});
