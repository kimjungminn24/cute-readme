import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app, migrate } from '../readme/readme-shared.js';
import { row, findBlock, detach, dropOnGap, dropOnBlock, allBlocks, imageName, ordinal } from '../readme/readme-doc.js';

const block = (id, type = 'text') => ({ id, type, text: id });
const shape = () => app.doc.map((r) => r.cells.map((c) => c.map((b) => b.id)));

function reset() {
  app.doc = [
    { id: 'r1', cells: [[block('a')]] },
    { id: 'r2', cells: [[block('b')], [block('c')]] },
    { id: 'r3', cells: [[block('d')]] },
  ];
}

test('detach drops the block and any row or cell it leaves empty', () => {
  reset();
  assert.equal(detach('a').id, 'a');
  assert.deepEqual(shape(), [[['b'], ['c']], [['d']]]);
  detach('b');
  assert.deepEqual(shape(), [[['c']], [['d']]]);
  assert.equal(findBlock('b'), null);
});

test('a gap drop counts the gap index before its own row disappears', () => {
  reset();
  dropOnGap(3, 'a');
  assert.deepEqual(shape(), [[['b'], ['c']], [['d']], [['a']]]);

  reset();
  dropOnGap(0, 'd');
  assert.deepEqual(shape(), [[['d']], [['a']], [['b'], ['c']]]);

  reset();
  dropOnGap(1, 'c');
  assert.deepEqual(shape(), [[['a']], [['c']], [['b']], [['d']]]);
});

test('dropping beside a block makes a column, up to three across', () => {
  reset();
  dropOnBlock('a', 'right', 'd');
  assert.deepEqual(shape(), [[['a'], ['d']], [['b'], ['c']]]);

  dropOnBlock('a', 'left', 'c');
  assert.deepEqual(shape(), [[['c'], ['a'], ['d']], [['b']]]);

  dropOnBlock('a', 'right', 'b');
  assert.deepEqual(shape(), [[['c'], ['a', 'b'], ['d']]], 'a fourth column goes into the cell instead');
});

test('dropping above or below stacks inside the cell', () => {
  reset();
  dropOnBlock('b', 'bottom', 'a');
  assert.deepEqual(shape(), [[['b', 'a'], ['c']], [['d']]]);
  dropOnBlock('b', 'top', 'd');
  assert.deepEqual(shape(), [[['d', 'b', 'a'], ['c']]]);
  dropOnBlock('d', 'top', 'd');
  assert.deepEqual(shape(), [[['d', 'b', 'a'], ['c']]], 'a block dropped on itself stays put');
});

test('allBlocks walks rows, cells and blocks in reading order', () => {
  reset();
  assert.deepEqual(allBlocks().map((b) => b.id), ['a', 'b', 'c', 'd']);
});

test('attached files with the same name get numbered, room files too', () => {
  const one = { id: '1', type: 'image', file: { name: 'my pic.png' } };
  const two = { id: '2', type: 'image', file: { name: 'my pic.png' } };
  const other = { id: '3', type: 'image', file: { name: 'other.png' } };
  const roomA = { id: '4', type: 'miniroom', room: {} };
  const roomB = { id: '5', type: 'miniroom', room: {} };
  app.doc = [
    { id: 'r1', cells: [[one, two]] },
    { id: 'r2', cells: [[other, roomA]] },
    { id: 'r3', cells: [[roomB]] },
  ];

  assert.equal(imageName(one), 'my-pic.png');
  assert.equal(imageName(two), 'my-pic-2.png');
  assert.equal(imageName(other), 'other.png');
  assert.equal(ordinal(roomA, 'miniroom', 'room'), 'room.svg');
  assert.equal(ordinal(roomB, 'miniroom', 'room'), 'room-2.svg');
});

test('row() wraps blocks into one row of one cell each, with ids', () => {
  const r = row({ type: 'text', text: 'x' }, { type: 'divider' });
  assert.equal(r.cells.length, 1);
  assert.equal(r.cells[0].length, 2);
  assert.ok(r.id && r.cells[0][0].id && r.cells[0][1].id);
});

test('migrate lifts old saves: flat lists, dead badges, sticker boards', () => {
  assert.equal(migrate(null), null);
  assert.equal(migrate([]), null);

  const flat = migrate([{ id: 'x', type: 'text', text: 'hi' }, { id: 'y', type: 'badges' }]);
  assert.deepEqual(flat.map((r) => r.cells.map((c) => c.map((b) => b.type))), [[['text']]]);

  const board = migrate([{
    id: 'r',
    cells: [[{ id: 's', type: 'stickers', align: 'left', items: [{ art: 'items:cat' }, { kind: 'art', value: 'lines:lace' }, { kind: 'text', value: 'no' }] }]],
  }]);
  const blocks = board[0].cells[0];
  assert.deepEqual(blocks.map((b) => [b.type, b.art, b.align]), [['sticker', 'items:cat', 'left'], ['line', 'lines:lace', 'left']]);

  const run = migrate([{ id: 'r', cells: [[{ id: 's', type: 'sticker', art: 'items:cat', repeat: 3 }]] }]);
  assert.equal(run[0].cells[0][0].type, 'line');

  assert.equal(migrate([{ id: 'r', cells: [[{ id: 'y', type: 'badges' }]] }]), null, 'nothing left is nothing');
});
