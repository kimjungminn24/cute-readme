import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRoom } from '../src/room.js';
import { FLOOR_ITEMS } from '../src/catalog.js';

test('no lift means same as sitting on the floor', () => {
  const base = { grid: { cols: 5, rows: 5 }, items: [{ id: 'books', col: 1, row: 1 }] };
  assert.equal(renderRoom(base), renderRoom({ ...base, items: [{ id: 'books', col: 1, row: 1, lift: 0 }] }));
});

test('draws raised by lift', () => {
  const at = (lift) => {
    const svg = renderRoom({ grid: { cols: 5, rows: 5 }, items: [{ id: 'books', col: 1, row: 1, lift }] }, { editable: true });
    return Number(svg.match(/data-kind="item" data-idx="0" transform="translate\([\d.]+ ([-\d.]+)\)/)[1]);
  };

  assert.equal(at(0) - at(10), 20);
});

test('supporting items keep top within their body height', () => {
  const surfaces = Object.entries(FLOOR_ITEMS).filter(([, d]) => d.top != null);
  assert.ok(surfaces.length >= 8, `only ${surfaces.length} supports`);
  for (const [id, def] of surfaces) {
    assert.ok(def.top > 0 && def.top <= 16, `${id}: top=${def.top} looks wrong`);
  }
});

test('floor item definitions are intact', () => {
  for (const [id, def] of Object.entries(FLOOR_ITEMS)) {
    assert.ok(def.name, `${id}: missing name`);
    assert.ok(def.fc > 0 && def.fr > 0, `${id}: bad footprint (fc=${def.fc}, fr=${def.fr})`);
    assert.ok(def.layer === 0 || def.layer === 1, `${id}: layer is neither 0 nor 1`);
    assert.equal(typeof def.art, 'string', `${id}: art is not a string`);
    assert.ok(def.art.includes('<path'), `${id}: the art is empty`);
  }
});

test('floor item names do not collide', () => {
  const names = Object.values(FLOOR_ITEMS).map((d) => d.name);
  assert.equal(new Set(names).size, names.length, 'names collide');
});
