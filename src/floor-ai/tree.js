import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '......XXXXY.......',
  '....XXZZZZXYYT....',
  '...XZZZZZZXXYYYV..',
  '..YXZZZZXZZXYYYT..',
  '..YZXXXXXXXXYYYTT.',
  '.XZZZXXXYXXXYYYTW.',
  '.YZZZXXXYXXYYYVSWW',
  '.VYZXZXXXXXYYYVVSW',
  'YYVXXXXXXXXYYVVWSW',
  'VYYYXXYXYYYYVVWWWW',
  'VVYYYYYYYYYYVWWWWS',
  '.TVVVVYYYYTTWWWWS.',
  '...TVVVVTTTTWWSS..',
  '....WWWVTTSSSSS...',
  '........SSS.......',
  '........UQQ.......',
  '........UQU.......',
  '.......RRUU.......',
  '.......RRUU.......',
  '......RRRUUU......',
  '.....RRPRUUQU.....',
  '....RPUURUOUUU....',
  '.....P..RU.Q......',
  '........P.........',
];

export const palette = {'X': '#93d24d', 'Y': '#60ac3a', 'Z': '#c8ef70', 'W': '#2f6c27', 'V': '#3d892c', 'U': '#664f32', 'T': '#3a7b2e', 'S': '#225a1b', 'R': '#b68f62', 'Q': '#43301b', 'P': '#8d6f45', 'O': '#2d2413'};

export const art = `<g transform="scale(2)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 18, h: 24, scale: 2 };
