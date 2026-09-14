import test from 'node:test';
import assert from 'node:assert/strict';
import { miniGrid, MINI_HAIRS, MINI_OUTFITS, MINI_POSES } from '../src/person-minimi.js';
import { personArt, personHeight, DEFAULT_PERSON } from '../src/catalog.js';

test('every modular hair, outfit and pose combination has an intact grounded body', () => {
  for (const hairStyle of Object.keys(MINI_HAIRS)) {
    for (const outfit of Object.keys(MINI_OUTFITS)) {
      for (const pose of Object.keys(MINI_POSES)) {
        const p = { ...DEFAULT_PERSON, hairStyle, outfit, pose };
        const dots = miniGrid(p);
        const ys = [...dots.keys()].map(k => Number(k.split(',')[1]));
        assert.ok(dots.size > 200, `${hairStyle}/${outfit}/${pose}: missing body`);
        assert.equal(Math.max(...ys), -1, 'feet must stay on the floor');
        assert.ok(-Math.min(...ys) * 2 <= personHeight(p), 'bubble must clear the hair');
        for (const color of dots.values()) assert.match(color, /^#[\da-f]{6}$/i);
      }
    }
  }
});

test('changing clothes preserves every face pixel', () => {
  const base = miniGrid(DEFAULT_PERSON);
  for (const outfit of Object.keys(MINI_OUTFITS)) {
    const dressed = miniGrid({ ...DEFAULT_PERSON, outfit });
    for (let y = -24; y <= -16; y++) for (let x = -7; x <= 6; x++) {
      const key = `${x},${y}`;
      assert.equal(dressed.get(key), base.get(key), `${outfit} altered the face at ${key}`);
    }
  }
});

test('all wardrobe pieces and poses are distinct, including sitting and waving', () => {
  for (const [key, choices] of [['hairStyle', MINI_HAIRS], ['outfit', MINI_OUTFITS], ['pose', MINI_POSES]]) {
    const arts = Object.keys(choices).map(id => personArt({ ...DEFAULT_PERSON, [key]: id }));
    assert.equal(new Set(arts).size, arts.length, `${key} contains duplicate drawings`);
  }
  assert.ok(personHeight({ ...DEFAULT_PERSON, pose: 'sit' }) < personHeight(DEFAULT_PERSON));
});

test('each color control changes only its material without changing the silhouette', () => {
  const base = miniGrid(DEFAULT_PERSON);
  for (const key of ['skin', 'hair', 'top', 'bottom']) {
    const changed = miniGrid({ ...DEFAULT_PERSON, [key]: '#123456' });
    assert.deepEqual([...changed.keys()], [...base.keys()]);
    assert.ok([...changed.values()].includes('#123456'), key);
    assert.notDeepEqual(changed, base);
  }
});
