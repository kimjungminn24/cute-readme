import { sprite, pxBox, drawAscii, fillPoly } from './pixel.js';
import { shade } from './iso.js';
import { P, STONE } from './catalog-base.js';

/* c and r are face coordinates from 0 to 1; z is height in pixels. */
const CUBE_H = 12;
const pc = P(1, 1);
const topFace = (dots, c0, r0, c1, r1, color, z = CUBE_H) =>
  fillPoly(dots, [pc(c0, r0, z), pc(c1, r0, z), pc(c1, r1, z), pc(c0, r1, z)], color);
const leftFace = (dots, c0, z0, c1, z1, color) =>
  fillPoly(dots, [pc(c0, 1, z0), pc(c1, 1, z0), pc(c1, 1, z1), pc(c0, 1, z1)], color);
const rightFace = (dots, r0, z0, r1, z1, color) =>
  fillPoly(dots, [pc(1, r0, z0), pc(1, r1, z0), pc(1, r1, z1), pc(1, r0, z1)], color);

const DIAMOND = '#89d8ca';

export const ore = sprite((dots) => {
  pxBox(dots, 1, 1, 12, STONE, { noise: 0.1 });
  const p = P(1, 1);
  const spotL = (c, z) =>
    fillPoly(dots, [p(c - 0.07, 1, z + 1.3), p(c + 0.07, 1, z + 1.3), p(c + 0.07, 1, z - 1.3), p(c - 0.07, 1, z - 1.3)], DIAMOND);
  const spotR = (r, z) =>
    fillPoly(dots, [p(1, r - 0.07, z + 1.3), p(1, r + 0.07, z + 1.3), p(1, r + 0.07, z - 1.3), p(1, r - 0.07, z - 1.3)], '#7cc4b8');
  spotL(0.28, 8.5);
  spotL(0.66, 5);
  spotL(0.44, 2.2);
  spotR(0.35, 7);
  spotR(0.7, 3);
  fillPoly(dots, [p(0.4, 0.3, 12), p(0.56, 0.3, 12), p(0.56, 0.48, 12), p(0.4, 0.48, 12)], '#8de3d7');
});

export const creeper = sprite((dots) => {
  drawAscii(
    dots,
    [
      'gGGgGGGGgGGG',
      'GGGGGgGGGGGG',
      'GGgGGGGGGgGG',
      'GGDDDGGDDDGG',
      'GGDDDGGDDDGG',
      'GGDDDGGDDDGG',
      'GGgGGDDGGGgG',
      'GGGDDDDDDGGG',
      'GGgDDDDDDGGG',
      'GGGDDGGDDgGG',
      'GGGDDGGDDGGG',
      'GGGGGGGGGGGG',
      '..GGGGGGGG..',
      '..GgGGGGgG..',
      '..GGGGgGGG..',
      '..GGgGGGGG..',
      '..GGGGGGgG..',
      '..gGGGGGGG..',
      '..GGGGgGGG..',
      '..GGgGGGGG..',
      '..GGGGGGGG..',
      '.GGGG..GGGG.',
      '.GgGG..GGgG.',
      '.GGGG..GGGG.',
    ],
    { G: '#8fc27d', g: '#82b070', D: '#2f2e2d' },
    { dy: -1 },
  );
}, 'creeper');


const DIRT = '#9a7150';

export const dirt = sprite((dots) => {
  pxBox(dots, 1, 1, CUBE_H, DIRT, { noise: 0.12 });
  for (const [c, r] of [[0.18, 0.26], [0.6, 0.18], [0.3, 0.68], [0.7, 0.62]]) {
    topFace(dots, c, r, c + 0.12, r + 0.12, shade(DIRT, 1.14));
  }
  leftFace(dots, 0.14, 6.5, 0.34, 8, shade(DIRT, 1.06));
  leftFace(dots, 0.6, 2.5, 0.8, 4, shade(DIRT, 0.82));
  rightFace(dots, 0.22, 7, 0.42, 8.5, shade(DIRT, 0.84));
  rightFace(dots, 0.64, 3, 0.84, 4.5, shade(DIRT, 0.62));
});
const GRASS_TOP = '#7cb356';

export const grassblock = sprite((dots) => {
  pxBox(dots, 1, 1, CUBE_H, '#9a7150', { noise: 0.1 });
  topFace(dots, 0, 0, 1, 1, GRASS_TOP);
  for (const [c, r] of [[0.16, 0.28], [0.58, 0.16], [0.32, 0.68], [0.72, 0.56]]) {
    topFace(dots, c, r, c + 0.14, r + 0.14, shade(GRASS_TOP, 1.12));
  }
  leftFace(dots, 0, 10.5, 1, CUBE_H, shade(GRASS_TOP, 0.9));
  rightFace(dots, 0, 10.5, 1, CUBE_H, shade(GRASS_TOP, 0.7));
  for (const c of [0.1, 0.44, 0.74]) leftFace(dots, c, 8.5, c + 0.16, 10.5, shade(GRASS_TOP, 0.9));
  for (const r of [0.2, 0.52, 0.82]) rightFace(dots, r, 8.5, r + 0.16, 10.5, shade(GRASS_TOP, 0.7));
});

// Contribution graphs laid on the floor: grass tiles, one per day, and days with commits stand a dot taller.
// One row per day, one digit per week (0 empty .. 4 busiest); a space is a day still to come.
const SQUARE_WEEKS = [
  '2103212',
  '3012431',
  '0231342',
  '1324234',
  '2143123',
  '102134 ',
  '021221 ',
];
const LONG_WEEKS = [
  '01001030130334',
  '20200311011012',
  '01103201212221',
  '01001123302432',
  '20202200220043',
  '0011122234210 ',
  '3002022010013 ',
];
const GRASS_LEVELS = ['#d4d4c4', '#c3e3b1', '#98cf86', '#6fb167', '#4d8f52'];
const TILE_W = 8;
// Each day takes half a floor tile, so a graph covers weeks / 2 by days / 2 tiles.
const DAY = 0.5;

// A whole-dot iso tile, TILE_W wide and raised h dots: T top, L left side, R right side.
function grassTile(h) {
  const half = TILE_W / 2;
  const tall = TILE_W / 4;
  const inside = (px, py, cy) => Math.abs(px - half) / half + Math.abs(py - cy) / tall <= 1;
  const rows = [];
  for (let y = 0; y < half + h; y++) {
    let row = '';
    for (let x = 0; x < TILE_W; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      if (inside(px, py, tall)) row += 'T';
      else if (Array.from({ length: h * 4 + 1 }, (_, k) => tall + k / 4).some((cy) => inside(px, py, cy))) row += px < half ? 'L' : 'R';
      else row += '.';
    }
    rows.push(row);
  }
  return rows;
}
const FLAT_TILE = grassTile(0);
const RAISED_TILE = grassTile(1);

const grassSize = (activity) => ({ fc: activity[0].length * DAY, fr: activity.length * DAY });

function grassField(activity) {
  const { fc, fr } = grassSize(activity);
  return sprite((dots) => {
    const at = P(fc, fr);
    const cells = [];
    activity.forEach((days, d) => [...days].forEach((ch, w) => {
      const level = '01234'.indexOf(ch);
      if (level >= 0) cells.push({ w, d, level });
    }));
    // Back to front, so nearer tiles cover the ones behind.
    cells.sort((a, b) => a.w + a.d - (b.w + b.d));
    for (const { w, d, level } of cells) {
      // Half-tile steps from a quarter-tile edge keep every tile on whole dots.
      const [x, y] = at(DAY / 2 + w * DAY, DAY / 2 + d * DAY);
      const c = GRASS_LEVELS[level];
      drawAscii(dots, level ? RAISED_TILE : FLAT_TILE, { T: c, L: shade(c, 0.86), R: shade(c, 0.72) }, { dx: x, dy: y + TILE_W / 4 });
    }
  });
}

export const GRASS_SQUARE = grassSize(SQUARE_WEEKS);
export const GRASS_LONG = grassSize(LONG_WEEKS);
export const grassgraph = grassField(SQUARE_WEEKS);
export const grasslong = grassField(LONG_WEEKS);
