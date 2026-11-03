import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  covers, topItemAt, stackLift, fitToGrid, moveToPoint, cellAtPoint, normalizeRoom,
  embedRoom, parseRoomText,
} from '../editor/editor-core.js';
import { FLOOR_ITEMS } from '../src/catalog.js';
import { geometry, gridPoint, gridCell, DEFAULT_TEXT_STYLE } from '../src/room.js';
import { SCALE } from '../src/pixel.js';

test('stacks only on items with a top', () => {
  const items = [{ id: 'table', col: 1, row: 1 }];
  assert.equal(stackLift(items, 1, 1), FLOOR_ITEMS.table.top);
  assert.equal(stackLift(items, 2, 2), 0);
  assert.equal(stackLift([{ id: 'rug', col: 1, row: 1 }], 1, 1), 0);
});

test('stacking on a stack accumulates height', () => {
  const items = [
    { id: 'table', col: 1, row: 1 },
    { id: 'books', col: 1, row: 1, lift: FLOOR_ITEMS.table.top },
  ];
  assert.equal(stackLift(items, 1, 1), FLOOR_ITEMS.table.top + FLOOR_ITEMS.books.top);

  assert.equal(stackLift(items, 1, 1, items[1]), FLOOR_ITEMS.table.top);
});

test('a multi-cell footprint supports on every cell', () => {
  const bed = { id: 'bed', col: 0, row: 2 };
  assert.ok(covers(bed, FLOOR_ITEMS.bed, 1, 2));
  assert.ok(!covers(bed, FLOOR_ITEMS.bed, 2, 2));
  assert.equal(stackLift([bed], 1, 2), FLOOR_ITEMS.bed.top);
});

test('topItemAt picks the layer drawn on top', () => {
  const items = [
    { id: 'rug', col: 0, row: 0 },
    { id: 'bed', col: 0, row: 0 },
  ];
  assert.equal(topItemAt(items, 0, 0), 1);
  assert.equal(topItemAt(items, 1, 1), 0);
  assert.equal(topItemAt(items, 5, 5), -1);
  assert.equal(topItemAt([{ id: 'no-such-item', col: 0, row: 0 }], 0, 0), -1);
});

const centerOf = (state, c, r) => gridPoint(c + 0.5, r + 0.5, geometry(state.grid));

test('a moved item re-seats on the new cell support', () => {
  const state = {
    grid: { cols: 8, rows: 8 },
    items: [
      { id: 'table', col: 1, row: 1 },
      { id: 'books', col: 5, row: 5 },
    ],
  };
  const books = state.items[1];
  const t = { obj: books, kind: 'item', def: FLOOR_ITEMS.books, dc: 0, dr: 0 };

  assert.equal(moveToPoint(state, centerOf(state, 1, 1), t), true);
  assert.equal(books.col, 1);
  assert.equal(books.lift, FLOOR_ITEMS.table.top);

  assert.equal(moveToPoint(state, centerOf(state, 6, 6), t), true);
  assert.ok(!('lift' in books));

  assert.equal(moveToPoint(state, centerOf(state, 6, 6), t), false);
});

test('cannot leave the grid, stops a footprint short of the edge', () => {
  const state = { grid: { cols: 8, rows: 8 }, items: [{ id: 'bed', col: 0, row: 0 }] };
  const t = { obj: state.items[0], kind: 'item', def: FLOOR_ITEMS.bed, dc: 0, dr: 0 };
  moveToPoint(state, centerOf(state, 7, 7), t);
  assert.equal(state.items[0].col, 8 - Math.ceil(FLOOR_ITEMS.bed.fc));
  assert.equal(state.items[0].row, 7);
});

test('wall items move by wall and slot, not coords', () => {
  const state = { grid: { cols: 8, rows: 8 }, items: [] };
  const obj = { id: 'window', wall: 'right', u: 2 };
  const geo = geometry(state.grid);

  assert.equal(moveToPoint(state, { x: geo.ox - 99 * 48, y: geo.oy }, { obj, wall: true }), true);
  assert.equal(obj.wall, 'left');
  assert.equal(obj.u, state.grid.rows - 1);
});

test('shrinking the grid pulls outsiders in', () => {
  const state = {
    grid: { cols: 4, rows: 4 },
    items: [{ id: 'bed', col: 5, row: 5 }],
    effects: [{ id: 'heart', col: 9, row: 0 }],
    wallItems: [
      { id: 'window', wall: 'right', u: 9 },
      { id: 'pennant', wall: 'floor', col: 8, row: 8 },
    ],
    person: { col: 7, row: 1 },
    texts: [{ text: 'hi', col: 4, row: 4 }],
  };
  fitToGrid(state);
  assert.deepEqual([state.items[0].col, state.items[0].row], [2, 3]);
  assert.deepEqual([state.effects[0].col, state.effects[0].row], [3, 0]);
  assert.equal(state.wallItems[0].u, 3);
  assert.deepEqual([state.wallItems[1].col, state.wallItems[1].row], [3, 3]);
  assert.deepEqual([state.person.col, state.person.row], [3, 1]);
  assert.deepEqual([state.texts[0].col, state.texts[0].row], [3, 3]);
});

test('empty JSON is filled to what the editor handles', () => {
  const s = normalizeRoom({});
  assert.deepEqual(s.items, []);
  assert.deepEqual(s.texts, []);
  assert.deepEqual(s.grid, { cols: 8, rows: 8 });
  assert.deepEqual(s.theme, {});
});

test('old names bubbles and typing migrate to texts and anim', () => {
  const s = normalizeRoom({ bubbles: [{ text: 'hi', col: 1, row: 2, typing: true }] });
  assert.equal(s.bubbles, undefined);
  assert.deepEqual(s.texts, [{ text: 'hi', col: 1, row: 2, anim: 'type' }]);

  const kept = normalizeRoom({ texts: [{ text: 'a', col: 0, row: 0, typing: true, anim: 'float' }] });
  assert.equal(kept.texts[0].anim, 'float');
  assert.ok(!('typing' in kept.texts[0]));
});

test('pieces removed from the catalog are dropped when a room opens', () => {
  const s = normalizeRoom({
    items: [{ id: 'bed', col: 0, row: 0 }, { id: 'furnace', col: 1, row: 1 }, null],
    wallItems: [{ id: 'window', wall: 'left', u: 1 }, { id: 'torch', wall: 'left', u: 2 }],
    effects: [{ id: 'heart', col: 0, row: 0 }, { id: 'gone', col: 0, row: 0 }],
    skills: [{ id: 'js', col: 0, row: 0 }, { id: 'gone', col: 0, row: 0 }],
  });
  assert.deepEqual(s.items.map((o) => o.id), ['bed']);
  assert.deepEqual(s.wallItems.map((o) => o.id), ['window']);
  assert.deepEqual(s.effects.map((o) => o.id), ['heart']);
  assert.deepEqual(s.skills.map((o) => o.id), ['js']);
});

test('the old person bubble becomes a free text at that spot', () => {
  const s = normalizeRoom({ person: { col: 3, row: 4, bubble: 'yo' } });
  assert.ok(!('bubble' in s.person));
  assert.deepEqual(s.texts, [{ text: 'yo', col: 3, row: 4, style: DEFAULT_TEXT_STYLE, anim: 'float' }]);
});

test('embedRoom hides the state in the SVG and parseRoomText gets it back', () => {
  const state = { grid: { cols: 5, rows: 5 }, texts: [{ text: '한글 -- </svg> 💬', col: 1, row: 1 }] };
  const svg = embedRoom('<svg xmlns="http://www.w3.org/2000/svg">\n</svg>', state);
  assert.ok(svg.endsWith('</metadata></svg>'), 'metadata sits inside the document');
  assert.ok(!svg.includes('</svg></svg>'), 'original closing tag was replaced, not duplicated');
  assert.deepEqual(parseRoomText(svg), state);
});

test('parseRoomText still takes plain JSON', () => {
  assert.deepEqual(parseRoomText('{ "grid": { "cols": 4, "rows": 4 } }'), { grid: { cols: 4, rows: 4 } });
  assert.throws(() => parseRoomText('<svg>no save inside</svg>'));
});
