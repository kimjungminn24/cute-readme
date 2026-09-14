import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRoom } from '../src/room.js';
import {
  personArt, personHeight, HAIR_STYLES, OUTFITS, SHAPE_STYLES, POSE_STYLES, ACCESSORY_STYLES,
  EXPRESSION_STYLES, ACCESSORIES, SHAPES, hairsForShape, DEFAULT_PERSON, DEFAULT_SHAPE,
} from '../src/catalog.js';
import { FRAME } from './room-helpers.js';

test('pre-existing hair and outfit ids are still there', () => {
  for (const id of ['short', 'long', 'bun', 'ponytail', 'pigtails', 'curly', 'bald']) {
    assert.ok(id in HAIR_STYLES, `hair ${id} vanished`);
  }
  for (const id of ['tee', 'hoodie', 'shirt', 'dress', 'overalls']) {
    assert.ok(id in OUTFITS, `outfit ${id} vanished`);
  }
});

test('display names do not collide', () => {
  for (const table of [HAIR_STYLES, OUTFITS]) {
    const labels = Object.values(table);
    assert.equal(new Set(labels).size, labels.length, `duplicates: ${labels.join(', ')}`);
  }
});

test('outfits do not change the person height', () => {
  const heights = Object.keys(OUTFITS).map((outfit) => {
    const svg = renderRoom({ grid: { cols: 6, rows: 6 }, person: { col: 2, row: 2, outfit, bubble: 'x' } });
    return Number(svg.match(/class="fx-bob">\s*<rect x="[-\d.]+" y="([-\d.]+)"/)[1]);
  });
  assert.equal(new Set(heights).size, 1, `bubble height differs per outfit: ${heights.join(', ')}`);
});

test('unset shape/pose/anim equals the defaults', () => {
  const base = { grid: { cols: 6, rows: 6 }, person: { col: 2, row: 2 } };
  const draw = (over) => renderRoom({ ...base, person: { ...base.person, ...over } });
  assert.equal(draw({}), draw({ shape: DEFAULT_SHAPE }));
  assert.equal(draw({}), draw({ pose: 'stand' }));
  assert.equal(draw({}), draw({ anim: 'none' }));
});

test('each shape and pose draws differently, unknown falls to the default', () => {
  const draw = (over) => personArt({ ...DEFAULT_PERSON, ...over });

  const shapes = Object.keys(SHAPE_STYLES).map((shape) => draw({ shape }));
  assert.equal(new Set(shapes).size, shapes.length, 'shapes must not collide');
  assert.equal(draw({ shape: 'no-such-shape' }), draw({ shape: DEFAULT_SHAPE }));

  const poses = Object.keys(POSE_STYLES).map((pose) => draw({ shape: 'pixel', pose }));
  assert.equal(new Set(poses).size, poses.length, 'poses must not collide');
  assert.equal(draw({ shape: 'chibi', pose: 'no-such-pose' }), draw({ shape: 'chibi', pose: 'stand' }));
});

const drawnWhole = (shape) => !!SHAPES[shape].looks;

test('colors, poses and accessories work on all three shapes', () => {
  for (const shape of Object.keys(SHAPE_STYLES)) {
    const base = { ...DEFAULT_PERSON, shape };
    assert.ok(personArt({ ...base, accessory: 'glasses' }).includes(FRAME), `${shape}: glasses`);
    assert.ok(personArt({ ...base, accessory: 'crown' }).includes('#e9ce81'), `${shape}: crown`);
    assert.notEqual(personArt({ ...base, size: 'big' }), personArt(base), `${shape}: size`);
    assert.notEqual(personArt({ ...base, pose: 'back' }), personArt(base), `${shape}: turning away`);
    assert.ok(personArt({ ...base, top: '#123456' }).includes('#123456'), `${shape}: top color`);
    if (shape !== 'stick') {   /* Stick figures use one color for the whole body. */
      assert.notEqual(personArt({ ...base, skin: '#123456' }), personArt(base), `${shape}: skin color`);
      assert.notEqual(personArt({ ...base, hair: '#123456' }), personArt(base), `${shape}: hair color`);
    }
    if (drawnWhole(shape)) continue;

    assert.notEqual(personArt({ ...base, pose: 'sit' }), personArt(base), `${shape}: sitting`);

    if (shape !== 'stick') {
      assert.ok(personArt({ ...base, bottom: '#654321' }).includes('#654321'), `${shape}: bottom color`);
    }
  }
});

test('sitting shortens the height and the bubble follows', () => {
  const stand = personHeight({ ...DEFAULT_PERSON, shape: 'chibi' });
  const sit = personHeight({ ...DEFAULT_PERSON, shape: 'chibi', pose: 'sit' });
  assert.ok(sit < stand, `${sit} vs ${stand}`);

  const bubbleY = (pose) => {
    const svg = renderRoom({ person: { col: 2, row: 2, shape: 'chibi', pose, bubble: 'hi' } });
    return Number(svg.match(/class="fx-bob">\s*<rect x="[-\d.]+" y="([-\d.]+)"/)[1]);
  };
  assert.ok(bubbleY('sit') > bubbleY('stand'), 'the bubble must not stay standing while sitting');
});

test('motion and mirroring go on different layers', () => {
  const art = personArt({ ...DEFAULT_PERSON, anim: 'bob', flip: true });
  assert.ok(art.startsWith('<g class="p-bob">'), 'motion on the outer layer');
  assert.ok(art.includes('<g class="person" transform="scale(-1,1)">'), 'mirroring on the inner layer');
  assert.ok(renderRoom({ person: { col: 1, row: 1, anim: 'bob' } }).includes('@keyframes pbob'));
});

test('every shape x hair x pose draws an intact sprite', () => {
  for (const shape of Object.keys(SHAPE_STYLES)) {
    const base = personArt({ ...DEFAULT_PERSON, shape }).length;
    for (const hairStyle of Object.keys(hairsForShape(shape))) {
      for (const pose of Object.keys(POSE_STYLES)) {
        const art = personArt({ ...DEFAULT_PERSON, shape, hairStyle, pose });
        const where = `${shape}/${hairStyle}/${pose}`;
        assert.ok(!art.includes('undefined'), `${where} has a letter outside the palette`);
        assert.ok(art.length > base * 0.5, `${where} lost half its dots`);
      }
    }
  }
});

test('accessories draw on all three shapes, unknown counts as none', () => {
  const draw = (over) => personArt({ ...DEFAULT_PERSON, ...over });
  const bare = draw({});

  for (const id of Object.keys(ACCESSORY_STYLES)) {
    for (const shape of Object.keys(SHAPE_STYLES)) {
      const art = draw({ shape, accessory: id });
      assert.ok(!art.includes('undefined'), `${shape}/${id} has a letter outside the palette`);
      if (id !== 'none') {
        assert.notEqual(art, draw({ shape }), `${shape}/${id} drew nothing`);
      }
    }
  }
  assert.equal(draw({ accessory: 'no-such-accessory' }), bare);
});

test('expressions change the face on all three shapes', () => {
  const draw = (over) => personArt({ ...DEFAULT_PERSON, ...over });

  for (const shape of Object.keys(SHAPE_STYLES)) {
    const base = draw({ shape });
    for (const expression of Object.keys(EXPRESSION_STYLES)) {
      const art = draw({ shape, expression });
      assert.ok(!art.includes('undefined'), `${shape}/${expression} has a letter outside the palette`);
      if (expression !== 'normal' && !drawnWhole(shape)) {
        assert.notEqual(art, base, `${shape}/${expression} changed nothing`);
      }
    }
  }

  assert.equal(draw({ expression: 'no-such-expression' }), draw({ expression: 'normal' }));
});

test('facing away, expressions are not drawn', () => {
  const back = { ...DEFAULT_PERSON, pose: 'back' };
  assert.equal(personArt({ ...back, expression: 'love' }), personArt(back));
});

test('accessories carry their anchor coordinates', () => {
  for (const [id, s] of Object.entries(SHAPES)) {
    assert.ok(Number.isInteger(s.eyeRow) && s.eyeRow < s.headH, `${id}: eyeRow is outside the skull`);
    assert.ok(Number.isInteger(s.hand?.row) && Number.isInteger(s.hand?.col), `${id}: hand coords missing`);
  }

  for (const [id, acc] of Object.entries(ACCESSORIES)) {
    if (!acc.art) continue;

    if (acc.on === 'hand') {
      const [row, col] = acc.grip ?? [];
      assert.ok(Number.isInteger(row) && Number.isInteger(col), `${id}: grip point missing`);
      assert.ok(row < acc.art.length, `${id}: grip row outside the art`);
      assert.ok(col < Math.max(...acc.art.map((r) => r.length)), `${id}: grip col outside the art`);
    }

    if (acc.on === 'face') {
      for (const shape of Object.keys(SHAPES)) {
        const art = acc.art[shape] ?? acc.art[SHAPES[shape].fallback];
        assert.ok(art?.length, `${id}: no art for ${shape}`);
        assert.equal(art.length % 2, 1, `${id}/${shape}: an even row count misses the eye line by half a cell`);
      }
    }
  }
});

test('the crown rises above the hair', () => {
  const top = (hairStyle) => {
    const svg = renderRoom({ person: { col: 2, row: 2, shape: 'chibi', hairStyle, accessory: 'crown' } });

    return Number(svg.match(/<path fill="#e9ce81" d="m-?\d+ ?(-?\d+)/)[1]);
  };
  assert.ok(top('bun') < top('short'), 'on a bun the crown must rise as much');
});

test('the old name glasses:true still reads', () => {
  const old = personArt({ ...DEFAULT_PERSON, glasses: true, accessory: undefined });
  assert.equal(old, personArt({ ...DEFAULT_PERSON, accessory: 'glasses' }));
});

test('fly lifts via CSS only, raising the bubble height with it', () => {
  const flying = { ...DEFAULT_PERSON, anim: 'fly' };
  assert.ok(personArt(flying).startsWith('<g class="p-fly">'));
  assert.ok(!personArt(flying).includes('translate(0 -'), 'the art itself must not move up');
  assert.ok(renderRoom({ person: { col: 1, row: 1, anim: 'fly' } }).includes('@keyframes pfly'));

  assert.ok(personHeight(flying) > personHeight(DEFAULT_PERSON), 'the bubble goes above the risen head');
});

test('size grows from the feet and the bubble follows', () => {
  const at = (size) => personHeight({ ...DEFAULT_PERSON, size });
  assert.ok(at('small') < at('normal') && at('normal') < at('big'));
  assert.ok(personArt({ ...DEFAULT_PERSON, size: 'big' }).includes('<g transform="scale(1.3)">'));
  assert.equal(personArt({ ...DEFAULT_PERSON, size: 'normal' }), personArt(DEFAULT_PERSON));
  assert.equal(personArt({ ...DEFAULT_PERSON, size: 'no-such-size' }), personArt(DEFAULT_PERSON));
});

test('retired shapes load as minimi while preserving custom colors', () => {
  for (const shape of ['round', 'square', 'stick', 'chibi']) {
    const p = { ...DEFAULT_PERSON, top: '#123456', skin: '#654321', hair: '#abcdef', bottom: '#135790' };
    assert.equal(personArt({ ...p, shape }), personArt(p));
    for (const color of ['#123456', '#654321', '#abcdef', '#135790']) assert.ok(personArt({ ...p, shape }).includes(color));
  }
});
