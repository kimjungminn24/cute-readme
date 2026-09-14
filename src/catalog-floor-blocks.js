import { sprite, pxBox, drawAscii, fillPoly } from './pixel.js';
import { shade } from './iso.js';
import { off, P, OAK, OAK_DARK, STONE } from './catalog-base.js';

/* c and r are face coordinates from 0 to 1; z is height in pixels. */
const CUBE_H = 12;
const pc = P(1, 1);
const topFace = (dots, c0, r0, c1, r1, color, z = CUBE_H) =>
  fillPoly(dots, [pc(c0, r0, z), pc(c1, r0, z), pc(c1, r1, z), pc(c0, r1, z)], color);
const leftFace = (dots, c0, z0, c1, z1, color) =>
  fillPoly(dots, [pc(c0, 1, z0), pc(c1, 1, z0), pc(c1, 1, z1), pc(c0, 1, z1)], color);
const rightFace = (dots, r0, z0, r1, z1, color) =>
  fillPoly(dots, [pc(1, r0, z0), pc(1, r1, z0), pc(1, r1, z1), pc(1, r0, z1)], color);

export const rug = sprite((dots) => {
  pxBox(dots, 2, 2, 1, '#c56f6b', { noise: 0.07 });
  pxBox(dots, 1.4, 1.4, 0.8, '#ad6561', { ...off(2, 2, 1.7, 1.7), lift: 0.6, noise: 0.06 });
});

export const bed = sprite((dots) => {
  pxBox(dots, 2, 1, 2.5, OAK_DARK, { noise: 0.08 });
  pxBox(dots, 2, 1, 3, '#c56f6b', { lift: 2.5, noise: 0.06 });
  pxBox(dots, 0.55, 1, 2.5, '#f3ede4', { ...off(2, 1, 0.55, 1), lift: 5.5 });
});

export const chest = sprite((dots) => {
  const o = off(1, 1, 0.92, 0.92);
  pxBox(dots, 0.84, 0.84, 8, '#b99771', { ...o, noise: 0.09 });
  pxBox(dots, 0.84, 0.84, 3, '#c5a07a', { ...o, lift: 8, noise: 0.09 });
  drawAscii(dots, ['GG', 'GG', 'DD'], { G: '#ddc175', D: '#554537' }, { dx: 0, dy: -5 });
});

export const bookshelf = sprite((dots) => {
  pxBox(dots, 1, 1, 12, OAK, { noise: 0.08 });
  const p = P(1, 1);
  const shelf = (z1, z2) => {
    fillPoly(dots, [p(0.08, 1, z2), p(0.92, 1, z2), p(0.92, 1, z1), p(0.08, 1, z1)], '#86705b');
    const colors = ['#c88577', '#8a99cc', '#ddc175', '#a0b898', '#b98dcf'];
    colors.forEach((c, i) => {
      const a = 0.1 + i * 0.16;
      fillPoly(dots, [p(a, 1, z2 - 0.5), p(a + 0.13, 1, z2 - 0.5), p(a + 0.13, 1, z1), p(a, 1, z1)], c);
    });
  };
  shelf(6.5, 11);
  shelf(1, 5.5);
});

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
