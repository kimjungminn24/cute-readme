import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampScale, sizeAttrs, SCALE_MIN, SCALE_MAX } from '../src/svg.js';
import { renderRoom, geometry, DEMO_ROOM } from '../src/room.js';
import { renderRepoCard } from '../src/repocard.js';
import { renderLinkBadge } from '../src/links.js';

const RENDERERS = [
  ['room', (scale) => renderRoom(DEMO_ROOM, { scale })],
  ['repo card', (scale) => renderRepoCard({ name: 'hello', stars: 3 }, { scale })],
  ['link badge', (scale) => renderLinkBadge({ label: 'Blog', icon: 'doc' }, { scale })],
];

const size = (svg) => {
  const m = svg.match(/width="(\d+)" height="(\d+)" viewBox="0 0 (\d+) (\d+)"/);
  assert.ok(m, `size attributes not found: ${svg.slice(0, 120)}`);
  return { w: +m[1], h: +m[2], vw: +m[3], vh: +m[4] };
};

test('scale 1 leaves the size alone (the default is the old output)', () => {
  for (const [name, render] of RENDERERS) {
    assert.equal(render(1), render(undefined), name);
    const s = size(render(1));
    assert.deepEqual([s.w, s.h], [s.vw, s.vh], name);
  }
});

test('scale grows width/height only, art coords untouched', () => {
  for (const [name, render] of RENDERERS) {
    const one = size(render(1));
    const two = size(render(2));
    assert.deepEqual([two.w, two.h], [one.w * 2, one.h * 2], name);

    assert.deepEqual([two.vw, two.vh], [one.vw, one.vh], name);
    assert.equal(render(2).length, render(1).length + String(two.w).length - String(one.w).length
      + String(two.h).length - String(one.h).length, `${name}: scaling redrew the shapes`);
  }
});

test('bad scales fall to 1 without throwing (a typo must not kill the workflow)', () => {
  for (const bad of [undefined, null, 0, -3, NaN, 'big', {}]) assert.equal(clampScale(bad), 1);
  for (const [name, render] of RENDERERS) {
    assert.equal(render('big'), render(1), name);
    assert.equal(render(0), render(1), name);
  }
});

test('scale clamps into its limits', () => {
  assert.equal(clampScale(99), SCALE_MAX);
  assert.equal(clampScale(0.01), SCALE_MIN);
  assert.equal(clampScale(1.234), 1.23);
  const s = size(renderRoom(DEMO_ROOM, { scale: 99 }));
  assert.equal(s.w, Math.round(geometry(DEMO_ROOM.grid).width * SCALE_MAX));
});

test('sizeAttrs multiplies then rounds', () => {
  assert.equal(sizeAttrs(100, 50, 1), 'width="100" height="50" viewBox="0 0 100 50"');
  assert.equal(sizeAttrs(101, 51, 1.5), 'width="152" height="77" viewBox="0 0 101 51"');
});

test('room scale works from inside room.json', () => {
  assert.equal(renderRoom({ ...DEMO_ROOM, scale: 2 }), renderRoom(DEMO_ROOM, { scale: 2 }));

  assert.equal(renderRoom({ ...DEMO_ROOM, scale: 2 }, { scale: 3 }), renderRoom(DEMO_ROOM, { scale: 3 }));
});

test('badge scale is also read from link.scale', () => {
  const link = { label: 'Blog', icon: 'doc' };
  assert.equal(renderLinkBadge({ ...link, scale: 2 }), renderLinkBadge(link, { scale: 2 }));
});

test('card width changes the text layout, scale the finished card', () => {
  const repo = { name: 'hello', description: '설명이 제법 길어서 두 줄로 접히는 문장입니다. 정말로 깁니다.' };
  const narrow = size(renderRepoCard(repo, { width: 260 }));
  const wide = size(renderRepoCard(repo, { width: 600 }));
  assert.equal(narrow.vw, 260);
  assert.equal(wide.vw, 600);
  assert.ok(narrow.vh >= wide.vh, 'a narrower card cannot be shorter');
});
