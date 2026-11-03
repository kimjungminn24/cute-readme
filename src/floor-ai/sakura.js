import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '........YWZXXX..........',
  '.......XZZZZXXXXX.......',
  '......YZZZZZXXZZZYY.....',
  '.....XYZZXXXYZZZZXYY....',
  '....XXWXXXYXXZZZZXXYY...',
  '...YXXXXXXXXXXZZZXXXWY..',
  '..YYXZZZZZXXXXXXYXXXWZ..',
  '..YYZZZZZZXXZZXXXXYYYY..',
  '.YXXZXXZZZXZZZZXXXXYYYY.',
  '.YXZZZXXXXXZZZXXXXXXXYY.',
  'YXXZZZZXXXXZZXXXXXXXXWWY',
  'YXXXZZXXXXXXXXZZXXXWWWWY',
  'YXXXXXXXXXXZZZZZXXYWWWWY',
  'YYXXXXXXYXXXXXZXXXYYWWWY',
  '.YYXXXYYYYXXXXXXXXWWWWW.',
  '..YYYYYTTYYXXXXXXYWWWW..',
  '...YYTT.TYYYYYYYYYTYW...',
  '.....TTTQVTYYYYYYTT.....',
  '........RPTUUT.TTU......',
  '..........RUUUTVR.......',
  '..........RVUVVV........',
  '..........RRVVR.........',
  '.........RSRVV..........',
  '.........SSVVV..........',
  '.........SSVVV..........',
  '.........SSVVRQ.........',
  '.......SSSSVUUUQ........',
  '.....PPPRUSVUUVVQQ......',
  '....PPPUUUSVUUUVVQQ.....',
  '..........ST............',
  '..........SV............',
];

export const palette = {'X': '#f7b1c4', 'Y': '#d97c94', 'Z': '#fae4e8', 'W': '#e47f9b', 'V': '#574135', 'U': '#3c2e25', 'T': '#44332b', 'S': '#8f6f5b', 'R': '#634a3d', 'Q': '#695342', 'P': '#7f634d'};

export const art = `<g transform="scale(1.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 24, h: 31, scale: 1.5 };
