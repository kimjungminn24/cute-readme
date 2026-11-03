import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '..........XX..........',
  '........XXXXXX........',
  '......XXXXXXXXXX......',
  '....XXXXXXXXXXXXXX....',
  '..XXXXXXXXXXXXXXXXXX..',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXX',
  '..XXXXXXXXXXXXXXXXXX..',
  '....XXXXXXXXXXXXXX....',
  '......XXXXXXXXXX......',
  '........XXXXXX........',
  '..........XX..........',
];

export const palette = {'X': '#99b87c'};

export const art = `<g transform="scale(1)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 22, h: 12, scale: 1 };
