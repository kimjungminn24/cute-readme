import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderRoom, DEMO_ROOM, gridPoint, gridCell, geometry, WALL_STYLES, DEFAULT_WALL_STYLE,
  FLOOR_STYLES, DEFAULT_FLOOR_STYLE,
} from '../src/room.js';
import { personArt, personHeight, HAIR_STYLES, OUTFITS, DEFAULT_PERSON } from '../src/catalog.js';
import { shade } from '../src/iso.js';
import { pos, FRAME, shellDots } from './room-helpers.js';

test('gridPoint maps grid to screen correctly', () => {
  const g = { ox: 100, oy: 50 };
  assert.deepEqual(gridPoint(0, 0, g), { x: 100, y: 50 });
  assert.deepEqual(gridPoint(2, 0, g), { x: 148, y: 74 });
  assert.deepEqual(gridPoint(0, 2, g), { x: 52, y: 74 });
  assert.deepEqual(gridPoint(2, 2, g), { x: 100, y: 98 });
});

test('gridCell inverts gridPoint for every cell', () => {
  const g = geometry({ cols: 8, rows: 8 });
  for (let c = 0; c < g.cols; c++) {
    for (let r = 0; r < g.rows; r++) {
      const p = gridPoint(c + 0.5, r + 0.5, g);
      const back = gridCell(p.x, p.y, g);
      assert.deepEqual([Math.floor(back.c), Math.floor(back.r)], [c, r]);
    }
  }
});

test('demo room renders as valid SVG', () => {
  const svg = renderRoom(DEMO_ROOM);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('viewBox'));
  assert.ok(svg.includes('shape-rendering="crispEdges"'));
});

test('empty data still renders the room shell', () => {
  const svg = renderRoom({});
  const subpaths = (svg.match(/m-?\d/g) || []).length;
  assert.ok(subpaths > 100, `subpaths: ${subpaths}`);
});

test('demo room stays small enough for a README', () => {
  const bytes = renderRoom(DEMO_ROOM).length;
  assert.ok(bytes < 130_000, `${bytes} bytes`);
});

test('largest room stays under the README budget', () => {
  const bytes = renderRoom({ ...DEMO_ROOM, grid: { cols: 12, rows: 12 } }).length;
  assert.ok(bytes < 200_000, `${bytes} bytes`);
});

test('z-order: layer 0 rug draws before items', () => {
  const svg = renderRoom(
    { items: [{ id: 'bed', col: 0, row: 0 }, { id: 'rug', col: 6, row: 6 }] },
    { editable: true },
  );
  assert.ok(
    pos(svg, 'data-kind="item" data-idx="1"') < pos(svg, 'data-kind="item" data-idx="0"'),
  );
});

test('z-order: nearer items draw later', () => {
  const svg = renderRoom(
    { items: [{ id: 'grassblock', col: 5, row: 5 }, { id: 'ore', col: 0, row: 0 }] },
    { editable: true },
  );
  assert.ok(
    pos(svg, 'data-kind="item" data-idx="1"') < pos(svg, 'data-kind="item" data-idx="0"'),
  );
});

test('bubble text is stripped of tags and escaped', () => {
  const svg = renderRoom({ person: { col: 1, row: 1, bubble: '<script>x</script> A & B' } });
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('x A &amp; B'));
});

test('unknown item ids are skipped silently', () => {
  const svg = renderRoom({ items: [{ id: 'dragon', col: 1, row: 1 }], effects: [{ id: 'nope' }] });
  assert.ok(svg.startsWith('<svg'));
});

test('person custom colors appear in output', () => {
  const svg = renderRoom({ person: { col: 2, row: 2, shape: 'chibi', top: '#123456', hair: '#654321', hairStyle: 'long' } });
  assert.ok(svg.includes('#123456'));
  assert.ok(svg.includes('#654321'));
});

test('every hair x outfit draws a full sprite', () => {
  const base = personArt(DEFAULT_PERSON);
  for (const hairStyle of Object.keys(HAIR_STYLES)) {
    for (const outfit of Object.keys(OUTFITS)) {
      const art = personArt({ ...DEFAULT_PERSON, hairStyle, outfit });
      assert.ok(!art.includes('undefined'), `${hairStyle}/${outfit} has an unpainted char`);
      assert.ok(art.length > base.length * 0.5, `${hairStyle}/${outfit} lost most of its dots`);
    }
  }
});

test('glasses draw over the hair, not under it', () => {
  const p = { ...DEFAULT_PERSON, hairStyle: 'cap', glasses: true };
  assert.ok(personArt(p).includes(FRAME));
  assert.ok(!personArt({ ...p, glasses: false }).includes(FRAME));
});

test('facing away, glasses are not drawn', () => {
  const p = { ...DEFAULT_PERSON, glasses: true };
  assert.ok(personArt(p).includes(FRAME));
  assert.ok(!personArt({ ...p, pose: 'back' }).includes(FRAME), 'no glasses on the back of the head');
});

test('bubble is lifted by tall hair', () => {
  const bubbleY = (hairStyle) => {
    const svg = renderRoom({ person: { col: 2, row: 2, shape: 'chibi', hairStyle, bubble: 'hi' } });
    return Number(svg.match(/class="fx-bob">\s*<rect x="[-\d.]+" y="([-\d.]+)"/)[1]);
  };
  assert.ok(personHeight({ shape: 'chibi', hairStyle: 'bun' }) > personHeight({ shape: 'chibi', hairStyle: 'short' }));
  assert.ok(bubbleY('bun') < bubbleY('short'));
});

test('wall items are sheared per wall', () => {
  const one = (wallItems) => renderRoom({ wallItems }, { editable: true });
  const left = one([{ id: 'painting', wall: 'left', u: 1 }]);
  const right = one([{ id: 'painting', wall: 'right', u: 1 }]);
  const body = (s) => s.slice(s.indexOf('data-kind="wallItem"'), s.indexOf('data-cell'));
  assert.ok(left.includes('data-kind="wallItem"'));
  assert.notEqual(body(left), body(right));
});

test('editable adds cell and wall hotspots', () => {
  const svg = renderRoom({ grid: { cols: 5, rows: 4 } }, { editable: true });
  assert.equal((svg.match(/data-cell=/g) || []).length, 20);
  assert.equal((svg.match(/data-wall="left"/g) || []).length, 4);
  assert.equal((svg.match(/data-wall="right"/g) || []).length, 5);
  assert.ok(!renderRoom({}).includes('data-cell'));
});

test('theme colors apply to walls and floor', () => {
  const svg = renderRoom({ theme: { wall: '#aabbcc', floor: '#112233' } });
  assert.ok(svg.includes('#aabbcc'));
  assert.ok(svg.includes('#112233'));
});

test('every wall style renders a different wall', () => {
  const frames = new Map();
  for (const id of Object.keys(WALL_STYLES)) {
    const svg = renderRoom({ theme: { wallStyle: id } });
    assert.ok(svg.startsWith('<svg'), `${id} must render`);
    const dup = [...frames].find(([, s]) => s === svg)?.[0];
    assert.ok(!dup, `${id} looks identical to ${dup}`);
    frames.set(id, svg);
  }
});

test('unknown wall style falls back instead of throwing', () => {
  assert.equal(
    renderRoom({ theme: { wallStyle: 'nope' } }),
    renderRoom({ theme: { wallStyle: DEFAULT_WALL_STYLE } }),
  );
  assert.equal(renderRoom({}), renderRoom({ theme: { wallStyle: DEFAULT_WALL_STYLE } }));
});

test('skill badges render and unknown ids are skipped', () => {
  const svg = renderRoom(
    { skills: [{ id: 'claude', col: 1, row: 1 }, { id: 'cobol', col: 2, row: 2 }] },
    { editable: true },
  );
  assert.equal((svg.match(/data-kind="skill"/g) || []).length, 1);
  assert.ok(svg.includes('fx-bob'));
});

test('wall and floor split the boundary cells', () => {
  const floor = '#b8945f';
  const svg = renderRoom({
    ...DEMO_ROOM,
    theme: { wall: '#c4a875', floor, wallStyle: 'solid', floorStyle: 'solid' },
  });
  const d = svg.match(new RegExp(`<path fill="${floor}" d="([^"]+)"`))[1];
  const widths = [...d.matchAll(/h(\d+)v1h-\d+/g)].map((m) => +m[1]);

  assert.deepEqual(widths.slice(0, 4), [2, 6, 10, 14], `floor vertex: ${widths.slice(0, 4)}`);
});

test('the wall-floor seam never breaks', () => {
  const wall = '#c4a875';
  const seam = shade(wall, 0.8);
  const svg = renderRoom({
    grid: { cols: 8, rows: 8 },
    person: null,
    theme: { wall, floor: '#b8945f', wallStyle: 'block', floorStyle: 'none' },
  });

  const lowest = new Map();
  for (const [k, fill] of shellDots(svg)) {
    const [x, y] = k.split(',').map(Number);
    if (!lowest.has(x) || y > lowest.get(x).y) lowest.set(x, { y, fill });
  }
  assert.ok(lowest.size > 200, `only ${lowest.size} columns`);

  const gaps = [...lowest].filter(([x, v]) => x !== 0 && v.fill !== seam).map(([x]) => x);
  assert.deepEqual(gaps, [], `baseboard broken in ${gaps.length} columns`);
});

test('the corner line is one dot, colored like the lines that pattern draws', () => {
  const wall = '#c4a875';
  const rows = [];
  for (let y = -40; y < 0; y++) rows.push(y);

  for (const [id, style] of Object.entries(WALL_STYLES)) {
    const svg = renderRoom({ grid: { cols: 8, rows: 8 }, person: null, theme: { wall, wallStyle: id } });
    const dots = shellDots(svg);

    if (style.off) {
      assert.equal(dots.get('0,-20'), undefined, `${id} draws no wall, so no corner either`);
      continue;
    }

    const line = shade(wall, style.corner);
    for (const y of rows) assert.equal(dots.get(`0,${y}`), line, `${id} corner breaks at y=${y}`);

    const thin = rows.filter((y) => dots.get(`-1,${y}`) !== line && dots.get(`1,${y}`) !== line);
    assert.ok(thin.length > rows.length * 0.55, `${id} corner is two dots in ${rows.length - thin.length} rows`);
  }
});

test('no pattern means solid', () => {
  const base = { grid: { cols: 6, rows: 6 }, theme: { wall: '#c4a875', floor: '#b8945f' } };
  assert.equal(
    renderRoom(base),
    renderRoom({ ...base, theme: { ...base.theme, wallStyle: 'solid', floorStyle: 'solid' } }),
  );
});

test('each floor pattern differs, unknown falls to the default', () => {
  const draw = (floorStyle) => renderRoom({ grid: { cols: 6, rows: 6 }, theme: { floorStyle } });
  const ids = Object.keys(FLOOR_STYLES);
  assert.equal(new Set(ids.map(draw)).size, ids.length, 'patterns must not collide');
  assert.equal(draw('no-such-pattern'), draw(DEFAULT_FLOOR_STYLE), 'throwing on a typo kills the workflow');
});

test('wallStyle/floorStyle none empties the shell, keeps the rest', () => {
  const base = { grid: { cols: 8, rows: 8 }, items: [{ id: 'bed', col: 0, row: 2 }] };

  const patterned = renderRoom({ ...base, theme: { wallStyle: 'block', floorStyle: 'grid' } });
  const bare = renderRoom({ ...base, theme: { wallStyle: 'none', floorStyle: 'none' } });

  assert.ok(bare.length < patterned.length / 3, `${bare.length} vs ${patterned.length}`);
  assert.ok(bare.startsWith('<svg') && bare.includes('viewBox'));

  const edit = renderRoom({ ...base, theme: { wallStyle: 'none', floorStyle: 'none' } }, { editable: true });
  assert.equal((edit.match(/data-cell/g) ?? []).length, 64, 'floor hit testing remains');
  assert.ok((edit.match(/data-wall/g) ?? []).length > 0, 'wall hit testing remains too');
});
