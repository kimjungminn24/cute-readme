import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.......XXXXYY........',
  '.....XXZZZZXYYYT.....',
  '....XZXZZZZXXXYYYV...',
  '...XZZZZZXZZXXYVYV...',
  '..YZXZXXZXXZXYYYYTT..',
  '..YZXXXXXXXXXXYYYWT..',
  '.XZXZZXXXYXXXXYYYTWW.',
  '.YZZZZXXXYXXYYYYVSWW.',
  '.VYZZXZXXXXXXYYYVVSWW',
  'YYVXXXXXXXXXXYYVVWSWW',
  'VYYYXXXYXXYYYYVVWWSWT',
  'VVYYYYYXXYYYYVVWSWWWS',
  '.TYVVYYYYYYTYTVWWWWS.',
  '.TVYVVVYYYYTTTWWWWS..',
  '...TTVVVVTTTTTWWSS...',
  '.....WWWVTTSSSSSS....',
  '.........SSSS........',
  '.........UQQQ........',
  '.........UQUU........',
  '.........RQUU........',
  '........RRUUU........',
  '........RRUUU........',
  '.......RRRUUUU.......',
  '......RRPRUQUQU......',
  '.....RPUURUOOUUU.....',
  '.....PP..RU.QQ.......',
  '.........PQ..........',
];

export const palette = {'X': '#93d24d', 'Y': '#60ac3a', 'Z': '#c8ef70', 'W': '#2f6c27', 'V': '#3d892c', 'U': '#664f32', 'T': '#3a7b2e', 'S': '#225a1b', 'R': '#b68f62', 'Q': '#43301b', 'P': '#8d6f45', 'O': '#2d2413'};

export const art = `<g transform="scale(1.75)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 21, h: 27, scale: 1.75 };
