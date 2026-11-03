import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '...........XX........',
  '.........XXXXX.......',
  '.......XXXXXXXXX.....',
  '.....XXXXXXXXXXXXX...',
  '...XXXXXXXXXXXXXXXXX.',
  '.XXXXXXXXXXXXXXXXXXVQ',
  'QQXXXXXXXXXXXXXXXXYY.',
  'UUOXXXXXXXXXXXXPTTZP.',
  '.YURXXXXXXXXXXTTZZUV.',
  '.YYYYUOXXXXPTTZZZRUS.',
  '.YUWWWUQXXTTZZZY..WS.',
  '.YV.RRYWWTZZZY....WS.',
  '.YV...RRWZYRY.....WS.',
  '.YV.....UZ.YV.....WS.',
  '.YV.....WZ.YV.....WS.',
  '.YV.....YZ.WV.....WS.',
  '.YV.....YZ........WS.',
  '.YV.....YZ........WS.',
  '.YV.....WZ........YV.',
  '.YP.....WZ...........',
  '........YZ...........',
  '........YZ...........',
  '........WZ...........',
  '........YZ...........',
];

export const palette = {'X': '#d6915e', 'Y': '#6c4935', 'Z': '#c88253', 'W': '#664432', 'V': '#a76a41', 'U': '#4a2b21', 'T': '#744931', 'S': '#9c603c', 'R': '#5c392a', 'Q': '#80573e', 'P': '#b2774b', 'O': '#966a48'};

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 21, h: 24, scale: 0.5 };
