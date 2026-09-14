import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './editor-dom.js';
import { renderRoom, EMPTY_ROOM, DEMO_ROOM, WALL_STYLES } from '../src/room.js';
import { normalizeRoom } from '../editor/editor-core.js';
import { hairsForShape } from '../src/catalog.js';
import { SCALE_STOPS, snapScale, SCALE_MIN, SCALE_MAX } from '../src/svg.js';

const { $ } = installFakeDom();
await import('../editor/editor.js');
/* Import the editor after installing the fake DOM. */
const { app } = await import('../editor/editor-shared.js');

const parsed = () => app.state;

function assertConsistent(label) {
  const want = renderRoom(parsed(), { editable: true, title: 'preview' });
  assert.equal($('#stage').innerHTML, want, `${label}: screen and state disagree`);
}

test('loading the demo room runs through every panel', () => {
  $('#demo').onclick();
  const want = renderRoom(normalizeRoom(structuredClone(DEMO_ROOM)), { editable: true, title: 'preview' });
  assert.equal($('#stage').innerHTML, want);
  assertConsistent('demo');
});

test('the minimi chip keeps the selected wardrobe valid', () => {
  const chip = $('#p-shapes').children.find((b) => b.dataset.id === 'pixel');
  assert.ok(chip, 'the minimi chip must exist');
  chip.onclick();
  const p = parsed().person;
  assert.equal(p.shape, 'pixel');
  assert.ok(p.hairStyle in hairsForShape('pixel'), `hair not in the minimi set: ${p.hairStyle}`);
  assertConsistent('shape chip');
});

test('minimi wardrobe controls preserve the other selections and update the room', () => {
  const choose = (panel, id) => {
    const chip = $(panel).children.find(b => b.dataset.id === id);
    assert.ok(chip, `${panel}/${id} is missing`);
    chip.onclick();
  };
  choose('#p-hairs', 'pigtails');
  choose('#p-outfits', 'dress');
  const standing = $('#stage').innerHTML;
  choose('#p-poses', 'sit');
  assert.equal(parsed().person.hairStyle, 'pigtails');
  assert.equal(parsed().person.outfit, 'dress');
  assert.equal(parsed().person.pose, 'sit');
  assert.notEqual($('#stage').innerHTML, standing);
  assertConsistent('seated minimi in a dress');
  choose('#p-poses', 'back');
  assert.equal(parsed().person.outfit, 'dress');
  assertConsistent('minimi in a dress seen from behind');
});

test('clicking a wall swatch applies to the whole room', () => {
  const ids = Object.keys(WALL_STYLES);
  const next = ids.find((id) => id !== (parsed().theme.wallStyle ?? 'solid'));
  const btn = $('#tools-pattern').children.find(
    (b) => b.className === 'swatch' && b.title === WALL_STYLES[next].name,
  );
  assert.ok(btn, `the ${next} swatch must exist`);
  btn.onclick();
  assert.equal(parsed().theme.wallStyle, next);
  assertConsistent('wall swatch');
});

test('picking weather writes state, the default drops out', () => {
  const sel = $('#t-weather');
  sel.value = 'snow';
  sel.onchange();
  assert.equal(parsed().weather, 'snow');
  assertConsistent('weather on');
  sel.value = 'none';
  sel.onchange();
  assert.ok(!('weather' in parsed()));
  assertConsistent('weather off');
});

test('shrinking the grid redraws with outsiders pulled in', () => {
  $('#rs-cols').value = '4';
  $('#rs-cols').oninput();
  const s = parsed();
  assert.equal(s.grid.cols, 4);
  for (const it of s.items) assert.ok(it.col <= 3, `${it.id} outside the grid: col=${it.col}`);
  assertConsistent('grid shrink');
});

test('adding text stands it next to the person and on screen', () => {
  const before = parsed().texts.length;
  $('#text-add').onclick();
  const s = parsed();
  assert.equal(s.texts.length, before + 1);
  assert.equal(s.texts.at(-1).text, 'hello~');
  assertConsistent('text add');
});


test('Reset needs two presses, links survive', () => {
  const links = parsed().links;
  $('#reset').onclick();
  assert.ok(parsed().items.length > 0, 'one press must not wipe it');
  $('#reset').onclick();
  const s = parsed();
  assert.deepEqual(s, { ...structuredClone(EMPTY_ROOM), links });
  assertConsistent('reset');
});

test('every scale slider walks the same stops', () => {
  for (const id of ['#rs-scale']) {
    const el = $(id);
    assert.equal(Number(el.min), 0, `${id}: sliders are indexed into SCALE_STOPS`);
    assert.equal(Number(el.max), SCALE_STOPS.length - 1, `${id}: one position per stop`);
    assert.equal(Number(el.step), 1, `${id}: one keypress moves one stop`);

    const out = $(`${id}-out`);
    const walked = [];
    for (let i = 0; i < SCALE_STOPS.length; i++) {
      el.value = String(i);
      el.oninput();
      walked.push(out.textContent);
    }
    assert.deepEqual(walked, SCALE_STOPS.map((s) => `×${s}`), `${id}: stops did not follow the slider`);
  }
});

test('the room scale slider writes stops through to the state', () => {
  const el = $('#rs-scale');

  el.value = String(SCALE_STOPS.indexOf(1));
  el.oninput();
  assert.equal(parsed().scale, undefined, '×1 is the default, it should not be stored');

  el.value = String(SCALE_STOPS.indexOf(1.25));
  el.oninput();
  assert.equal(parsed().scale, 1.25);
  assertConsistent('room scale');
});

test('a scale loaded from JSON snaps onto the nearest stop', () => {
  assert.equal(snapScale(1.3), 1.25);
  assert.equal(snapScale(3.9), 4);
  assert.equal(snapScale(0.1), SCALE_MIN);
  assert.equal(snapScale(99), SCALE_MAX);
});
