import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './editor-dom.js';
import { renderRoom, DEMO_ROOM } from '../src/room.js';
import { normalizeRoom } from '../editor/editor-core.js';
import { FLOOR_ITEMS, EFFECTS } from '../src/catalog.js';

const { $ } = installFakeDom();
await import('../editor/editor.js');
/* Import the editor after installing the fake DOM. */
const { app } = await import('../editor/editor-shared.js');

const demo = () => normalizeRoom(structuredClone(DEMO_ROOM));

test('a first visit with nothing saved opens on the demo room', () => {
  const want = renderRoom(demo(), { editable: true, title: 'preview' });
  assert.equal($('#stage').innerHTML, want);
});

test('the editor state matches what is on screen', () => {
  assert.deepEqual(app.state, demo());
});

test('the palette is built from the whole catalog', () => {
  const items = Object.keys(FLOOR_ITEMS).length + Object.keys(EFFECTS).length;
  assert.equal($('#tools-item').children.length, items);
  assert.equal($('#tools-edit').children.length, 3);
});
