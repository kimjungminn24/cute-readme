import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readDotFont, canDraw, dotWidth, dotWrap, dotText } from '../src/dotfont.js';
import { renderRepoCard } from '../src/repocard.js';

const font = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));

test('throws on a non-blob', () => {
  assert.throws(() => readDotFont(new Uint8Array(8)), /dot font/);
});

test('draws Hangul and Latin, and admits what it cannot draw', () => {
  for (const ok of ['hello-world', '리포지토리 카드', 'A pixel card 1.2k', 'ㄱㄴㄷ', '…—’']) {
    assert.ok(canDraw(font, ok), ok);
  }
  for (const no of ['漢字', '🙂', 'Ω≈ç']) assert.ok(!canDraw(font, no), no);
});

test('spaces take up width', () => {
  const gap = dotWidth(font, '가 가') - dotWidth(font, '가가');
  assert.ok(gap > 0, `a space takes no room (${gap})`);
  assert.ok(canDraw(font, ' '));
});

test('bold runs slightly wider', () => {
  assert.ok(dotWidth(font, 'hello', true) > dotWidth(font, 'hello', false));
});

test('wrapping measures real advances and stays in width', () => {
  const fits = '리포지토리 카드 설명이 두 줄까지 들어가면 이렇게 보입니다. 세 줄째는 버려집니다.';
  const lines = dotWrap(font, fits, 368, 2);
  assert.equal(lines.length, 2);
  for (const line of lines) assert.ok(dotWidth(font, line) <= 368, line);
  assert.ok(!lines[1].endsWith('…'), 'nothing to cut when two lines fit');

  const over = `${fits} ${fits}`;
  const cut = dotWrap(font, over, 368, 2);
  assert.equal(cut.length, 2);
  assert.ok(cut[1].endsWith('…'), 'truncation appends an ellipsis');
  assert.ok(dotWidth(font, cut[1]) <= 368, 'must fit the width even with the ellipsis');
});

test('short text comes out as one untouched line', () => {
  assert.deepEqual(dotWrap(font, '한 줄', 368, 2), ['한 줄']);
  assert.deepEqual(dotWrap(font, '', 368, 2), []);
});

test('dots merge into a single <path>', () => {
  const path = dotText(font, '가나다 ABC', 10, 20, '#000');
  assert.equal((path.match(/<path/g) ?? []).length, 1, 'a rect per dot multiplies the file size');
  assert.ok(path.includes('fill="#000"'));
  assert.equal(dotText(font, '   ', 0, 0, '#000'), '', 'nothing to stamp draws nothing');
});

const REPO = {
  owner: 'octocat', name: 'hello-world', description: '한글 설명도 도트로 찍힙니다',
  language: 'Rust', stars: 1234, forks: 56,
};

test('passing the font to a dot theme turns text into shapes', () => {
  const on = renderRepoCard(REPO, { theme: 'pixel', dots: font });
  assert.ok(!on.includes('<text'), 'leftover <text> varies with the viewer fonts');
  assert.ok(on.includes('한글') === false, 'glyphs are shapes, no literal text remains');
  assert.ok(on.includes('<title>'), 'must stay readable via title and aria-label instead');
  assert.ok(on.includes('aria-label'));
});

test('without the font it quietly falls back to <text>', () => {
  const off = renderRepoCard(REPO, { theme: 'pixel' });
  assert.ok(off.includes('<text'));
  assert.ok(off.includes('한글 설명도'));
});

test('non-dot themes ignore the font', () => {
  const light = renderRepoCard(REPO, { theme: 'light', dots: font });
  assert.equal(light, renderRepoCard(REPO, { theme: 'light' }));
});

test('only lines with undrawable glyphs stay <text>', () => {
  const svg = renderRepoCard({ ...REPO, description: '한자 漢字가 섞인 설명' }, { theme: 'pixel', dots: font });
  assert.ok(svg.includes('<text'), 'the description falls back');
  assert.ok(svg.includes('漢字'));
  assert.ok(!svg.includes('>hello-world<'), 'the title is drawable, so it stays dots');
});
