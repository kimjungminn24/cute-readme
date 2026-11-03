import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './editor-dom.js';

installFakeDom();
document.body = document.createElement('body');
globalThis.location = { origin: 'http://builder.test' };

const sent = [];
const alerts = [];
let onMessage = null;
globalThis.alert = (msg) => alerts.push(msg);
globalThis.addEventListener = (type, fn) => { if (type === 'message') onMessage = fn; };
globalThis.window.parent = { postMessage: (data) => sent.push(structuredClone(data)) };
const quiet = console.error;
console.error = () => {};

await import('../editor/editor.js');

const deliver = (room) => onMessage({ origin: location.origin, data: { type: 'room-load', room } });
const changes = () => sent.filter((m) => m.type === 'room-change');

test('the embedded editor says it is ready', () => {
  assert.ok(sent.some((m) => m.type === 'room-ready'));
});

test('a room that fails to load is never replaced by the empty editor', () => {
  deliver({ items: 5 });
  assert.equal(alerts.length, 1);
  assert.equal(changes().length, 0, 'nothing is sent back');
});

test('a room that loads is sent back once, already cleaned up', () => {
  deliver({ items: [{ id: 'bed', col: 0, row: 0 }, { id: 'gone', col: 1, row: 1 }] });
  const last = changes().at(-1);
  assert.ok(last, 'the loaded room is reported');
  assert.deepEqual(last.room.items.map((o) => o.id), ['bed']);
  console.error = quiet;
});
