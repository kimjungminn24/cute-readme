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

// A contribution graph laid on the floor: 7 weeks by 7 days of grass tiles; days with commits stand a dot taller.
// One row per day, one digit per week (0 empty .. 4 busiest); a space is a day still to come.
const ACTIVITY = [
  '2103212',
  '3012431',
  '0231342',
  '1324234',
  '2143123',
  '102134 ',
  '021221 ',
];
const GRASS_FC = 3;
const GRASS_FR = 3;
const GRASS_LEVELS = ['#e3e6da', '#c3e3b1', '#98cf86', '#6fb167', '#4d8f52'];

export const grassgraph = sprite((dots) => {
  const at = P(GRASS_FC, GRASS_FR);
  pxBox(dots, GRASS_FC, GRASS_FR, 1, '#efe6d4');

  const weeks = ACTIVITY[0].length;
  const days = ACTIVITY.length;
  const pc = (GRASS_FC - 0.2) / weeks;
  const pr = (GRASS_FR - 0.2) / days;
  const s = Math.min(pc, pr) * 0.78;
  const cells = [];
  for (let d = 0; d < days; d++) {
    for (let w = 0; w < weeks; w++) {
      const level = '01234'.indexOf(ACTIVITY[d][w]);
      if (level >= 0) cells.push({ c: 0.1 + w * pc + (pc + s) / 2, r: 0.1 + d * pr + (pr + s) / 2, level });
    }
  }
  // Back to front, so nearer tiles cover the ones behind.
  cells.sort((a, b) => a.c + a.r - (b.c + b.r));
  for (const { c, r, level } of cells) {
    const [dx, dy] = at(c, r);
    pxBox(dots, s, s, level ? 2 : 1, GRASS_LEVELS[level], { dx, dy, lift: 1 });
  }
});
