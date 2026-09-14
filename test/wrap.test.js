import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wrapText, measure, plainText } from '../src/svg.js';
import { readDotFont, dotWrap, dotWidth, canDraw } from '../src/dotfont.js';

const font = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

const ALPHABETS = ['1 가가', 'WM ', '가나다 abc ', 'aA가1 ', 'abcdefghij '];

function* corpus(seed, count) {
  const rnd = seeded(seed);
  for (let i = 0; i < count; i++) {
    const abc = ALPHABETS[Math.floor(rnd() * ALPHABETS.length)];
    let t = '';
    const n = 1 + Math.floor(rnd() * 40);
    for (let k = 0; k < n; k++) t += abc[Math.floor(rnd() * abc.length)];

    const text = plainText(t);
    if (text) yield { text, rnd };
  }
}

test('appending to the carry re-measures the width', () => {
  const lines = dotWrap(font, '1 가가', 23, 3);
  for (const line of lines) {
    assert.ok(dotWidth(font, line) <= 23, `"${line}" exceeds 23 (${dotWidth(font, line)})`);
  }
});

test('breaking at a space still emits no empty line', () => {
  assert.deepEqual(wrapText('accc abab a baabc ac', 2.34, 3).includes(''), false);
  assert.deepEqual(dotWrap(font, 'WM W WWWM MMM M', 36, 3).includes(''), false);
});

test('wrapText: no line over the max width, no empty lines', () => {
  for (const { text } of corpus(20260831, 4000)) {
    const maxEm = 2 + (text.length % 11);
    const maxLines = 1 + (text.length % 3);
    const lines = wrapText(text, maxEm, maxLines);
    assert.ok(lines.length <= maxLines, `over ${maxLines} lines: ${JSON.stringify(lines)}`);
    for (const line of lines) {
      assert.notEqual(line, '', `empty line: ${JSON.stringify({ text, maxEm, lines })}`);

      if ([...line].length <= 1) continue;
      assert.ok(measure(line) <= maxEm + 1e-9, `over width: ${JSON.stringify({ text, maxEm, line })}`);
    }
  }
});

test('dotWrap: no line over the max width, no empty lines', () => {
  for (const { text } of corpus(20260901, 4000)) {
    if (!canDraw(font, text)) continue;
    const maxW = 20 + (text.length % 100);
    const maxLines = 1 + (text.length % 3);
    const lines = dotWrap(font, text, maxW, maxLines);
    assert.ok(lines.length <= maxLines, `over ${maxLines} lines: ${JSON.stringify(lines)}`);
    for (const line of lines) {
      assert.notEqual(line, '', `empty line: ${JSON.stringify({ text, maxW, lines })}`);
      if ([...line].length <= 1) continue;
      assert.ok(dotWidth(font, line) <= maxW, `over width: ${JSON.stringify({ text, maxW, line })}`);
    }
  }
});

test('untruncated output loses no characters', () => {
  const strip = (s) => s.replace(/\s+/g, '');
  for (const { text } of corpus(20260902, 2000)) {
    const lines = wrapText(text, 8, Infinity);
    assert.equal(strip(lines.join('')), strip(text), `characters changed: ${JSON.stringify(text)}`);
    if (canDraw(font, text)) {
      const dl = dotWrap(font, text, 90, Infinity);
      assert.equal(strip(dl.join('')), strip(text), `characters changed (dot): ${JSON.stringify(text)}`);
    }
  }
});
