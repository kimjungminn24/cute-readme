import { sprite, pxBox, drawAscii } from './pixel.js';
import { off, P, OAK_DARK } from './catalog-base.js';

const TT = off(1, 1, 0.975, 0.975);

const TT_DY = -6;

const TT_PLATE = [
  '.....PPPPPPP.....',
  '..ppppppPPPPPPP..',
  '.PPPPP.....PPPPP.',
  'PPPPPP.....PPPPPP',
  '.PPPPP.....PPPPP.',
  '..PPPPPPPPPPPPP..',
  '.....PPPPPPP.....',
];

const TT_ARM = [
  '..............KK.',
  '.............A...',
  '............A....',
  '...........A.....',
  '.................',
  '.................',
  '.................',
];

const TT_LABEL = [
  '.................',
  '.................',
  '......LLLLL......',
  '......LLhLL..tt..',
  '......LLLLL......',
  '.................',
  '.................',
];

export const turntable =
  sprite((dots) => {
    pxBox(dots, 0.95, 0.95, 4, OAK_DARK, { ...TT, noise: 0.07 });
    drawAscii(dots, TT_PLATE, { P: '#2d2c2f', p: '#434149' }, { dy: TT_DY });
    drawAscii(dots, TT_ARM, { K: '#868486', A: '#d0d2d6' }, { dy: TT_DY });
  }) +
  `<g class="spin" style="transform-origin:0px -20px">${sprite((dots) =>
    drawAscii(dots, TT_LABEL, { L: '#d78971', h: '#f3ede4', t: '#a9a4a8' }, { dy: TT_DY }),
  )}</g>`;

export const plant = sprite((dots) => {
  const o = off(1, 1, 0.76, 0.76);
  pxBox(dots, 0.52, 0.52, 4.5, '#c88d71', { ...o, noise: 0.06 });
  pxBox(dots, 0.52, 0.52, 0.8, '#826e61', { ...o, lift: 4.5 });
  drawAscii(
    dots,
    [
      '..G...G..',
      '.GGg.gGG.',
      'GGGGGGGgg',
      'GGGGGGGGg',
      '.GGGGGGg.',
      '..GGGGg..',
      '...sss...',
      '....s....',
    ],
    { G: '#8daf7b', g: '#7c9a6c', s: '#7d966b' },
    { dy: -10.5 + o.dy },
  );
});

const lampGlow = '<g class="glow">'
  + '<ellipse cx="0" cy="-21" rx="24" ry="13" fill="#fbeab9" opacity="0.25"/>'
  + '<ellipse cx="0" cy="-22" rx="14" ry="8" fill="#fdf5d8" opacity="0.45"/>'
  + '</g>';

export const lamp = lampGlow + sprite((dots) => {
  const o = off(1, 1, 0.7, 0.7);
  pxBox(dots, 0.4, 0.4, 1.2, '#79757a', o);
  pxBox(dots, 0.14, 0.14, 13, '#918d91', { ...off(1, 1, 0.57, 0.57), lift: 1.2 });
  drawAscii(
    dots,
    ['...YYYYY...', '..YYYYYYY..', '.YYYYYYYYY.', 'yyyyyyyyyyy'],
    { Y: '#f9dba1', y: '#ebc685' },
    { dy: -14 },
  );
});

const CAT = '#e0ae7d';
