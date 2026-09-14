import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './editor-dom.js';

const { $ } = installFakeDom();
const el = () => document.createElement('div');
document.head = el();
document.body = el();
document.getElementById = () => el();
document.documentElement = { style: { setProperty() {} } };
globalThis.ResizeObserver = class { observe() {} };
globalThis.alert = () => {};

await import('../readme/readme.js');

const { app, BLOCKS } = await import('../readme/readme-shared.js');
const { markdown } = await import('../readme/readme-markdown.js');

test('with nothing saved, the builder opens on the starter document', () => {
  assert.equal(app.doc.length, 2);
  assert.deepEqual(app.doc.map((r) => r.cells[0][0].type), ['heading', 'text']);
});

test('the palette offers every registered block, and only those', () => {
  const labels = $('#palette').children.map((b) => b.textContent);
  assert.equal(labels.length, Object.keys(BLOCKS).length);
  assert.ok(labels.includes('+ Heading') && labels.includes('+ Link badges') && labels.includes('+ Repo cards'));
});

test('the first render fills the board and the markdown box', () => {
  assert.equal($('#blocks').children.length, 5, 'gap, row, gap, row, gap');
  assert.equal($('#md').value, markdown());
  assert.match($('#md').value, /^<h1 align="center">Hi there, I am \.\.\.<\/h1>\n\nI build small things that work\.\n$/);
});

test('adding from the palette grows the document and redraws', () => {
  const before = $('#blocks').children.length;
  $('#palette').children.find((b) => b.textContent === '+ Divider').onclick();
  assert.equal(app.doc.length, 3);
  assert.equal($('#blocks').children.length - before, 7, 'the fake DOM keeps old children, so count the new ones');
  assert.match($('#md').value, /\n\n---\n$/);
});
