import { sprite, pxBox, drawAscii, fillPoly } from './pixel.js';
import { shade } from './iso.js';
import { off, P, legs, OAK, OAK_DARK, METAL, SCREEN } from './catalog-base.js';

export const table = sprite((dots) => {
  legs(dots, 1, 1, 8, OAK_DARK);
  pxBox(dots, 1, 1, 1.6, OAK, { lift: 8, noise: 0.07 });
});

const MONITOR = { ...off(1.5, 0.8, 1.15, 0.36), lift: 9.8 };

export const desk = sprite((dots) => {
  legs(dots, 1.5, 0.8, 7, OAK_DARK, { s: 0.14 });
  pxBox(dots, 1.5, 0.8, 1.6, OAK, { lift: 7, noise: 0.07 });
  pxBox(dots, 0.12, 0.12, 1.2, '#6d696b', { ...off(1.5, 0.8, 0.86, 0.32), lift: 8.6 });
  pxBox(dots, 0.7, 0.12, 6, SCREEN, MONITOR);
  const p = P(0.7, 0.12, MONITOR);
  fillPoly(dots, [p(0.06, 0.12, 5.4), p(0.64, 0.12, 5.4), p(0.64, 0.12, 0.6), p(0.06, 0.12, 0.6)], '#6a839c');
  for (const [z, w] of [[4.2, 0.3], [3.2, 0.44], [2.2, 0.22]]) {
    fillPoly(dots, [p(0.14, 0.12, z + 0.6), p(0.14 + w, 0.12, z + 0.6), p(0.14 + w, 0.12, z), p(0.14, 0.12, z)], '#a5d4e7');
  }
  pxBox(dots, 0.55, 0.2, 0.6, '#e1dbcf', { ...off(1.5, 0.8, 1.02, 0.74), lift: 8.6 });
});

const TV_BODY = { ...off(1, 0.6, 0.92, 0.32), lift: 5 };

export const tv = sprite((dots) => {
  pxBox(dots, 1, 0.6, 5, OAK_DARK, { noise: 0.07 });
  pxBox(dots, 0.84, 0.18, 7, SCREEN, TV_BODY);
  const p = P(0.84, 0.18, TV_BODY);
  fillPoly(dots, [p(0.07, 0.18, 6.3), p(0.77, 0.18, 6.3), p(0.77, 0.18, 0.9), p(0.07, 0.18, 0.9)], '#789aaf');
  fillPoly(dots, [p(0.07, 0.18, 6.3), p(0.3, 0.18, 6.3), p(0.42, 0.18, 0.9), p(0.07, 0.18, 0.9)], '#89bbdd');
});

const FRIDGE = off(1, 1, 0.9, 0.9);

export const fridge = sprite((dots) => {
  pxBox(dots, 0.8, 0.8, 13, '#e9e4dc', { ...FRIDGE, noise: 0.04 });
  const p = P(0.8, 0.8, FRIDGE);
  fillPoly(dots, [p(0, 0.8, 8.6), p(0.8, 0.8, 8.6), p(0.8, 0.8, 7.8), p(0, 0.8, 7.8)], '#b5afa5');
  for (const [z0, z1] of [[9.6, 12], [4.4, 6.8]]) {
    fillPoly(dots, [p(0.48, 0.8, z1), p(0.72, 0.8, z1), p(0.72, 0.8, z0), p(0.48, 0.8, z0)], METAL);
  }

  for (const [c, z, col] of [[0.12, 10.6, '#c56f6b'], [0.3, 9.4, '#8a99cc'], [0.14, 4.4, '#ddc175']]) {
    fillPoly(dots, [p(c, 0.8, z + 1.2), p(c + 0.14, 0.8, z + 1.2), p(c + 0.14, 0.8, z), p(c, 0.8, z)], col);
  }
});

const STOOL = off(1, 1, 0.78, 0.78);

export const stool = sprite((dots) => {
  legs(dots, 0.56, 0.56, 5, OAK_DARK, { inset: 0.04, s: 0.11, ...STOOL });
  pxBox(dots, 0.56, 0.56, 1.4, OAK, { ...STOOL, lift: 5, noise: 0.06 });
});

export const drawer = sprite((dots) => {
  pxBox(dots, 1, 0.7, 9, OAK, { noise: 0.07 });
  const p = P(1, 0.7);

  for (const z of [1.6, 5.2]) {
    fillPoly(dots, [p(0.12, 0.7, z + 2.8), p(0.88, 0.7, z + 2.8), p(0.88, 0.7, z), p(0.12, 0.7, z)], shade(OAK, 1.18));
    fillPoly(dots, [p(0.12, 0.7, z + 2.8), p(0.88, 0.7, z + 2.8), p(0.88, 0.7, z + 2.5), p(0.12, 0.7, z + 2.5)], shade(OAK, 0.7));
    fillPoly(dots, [p(0.34, 0.7, z + 1.7), p(0.66, 0.7, z + 1.7), p(0.66, 0.7, z + 1.1), p(0.34, 0.7, z + 1.1)], '#797576');
  }
});

export const books = sprite((dots) => {
  const stack = [
    { c: '#c88577', w: 0.56, d: 0.42, jx: 0 },
    { c: '#8a99cc', w: 0.52, d: 0.38, jx: -2 },
    { c: '#ddc175', w: 0.48, d: 0.34, jx: 2 },
  ];
  let lift = 0;
  for (const { c, w, d, jx } of stack) {
    const o = off(1, 1, 0.5 + w / 2, 0.5 + d / 2);
    pxBox(dots, w, d, 2, c, { dx: o.dx + jx, dy: o.dy, lift, noise: 0.03 });
    lift += 2;
  }
});

export const cactus = sprite((dots) => {
  drawAscii(
    dots,
    [
      '..GG..',
      '..GG..',
      'G.GG.G',
      'GGGGGG',
      'G.GG.G',
      '..GG..',
      '..GG..',
      '..GG..',
      'PPPPPP',
      'PPPPPP',
      '.pppp.',
    ],
    { G: '#82a477', P: '#c88d71', p: '#b27d64' },
  );
});
