import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.............X.......',
  '...........XXXXX.....',
  '.........XXXXXXXXX...',
  '......XXXXXXXXXXXXXX.',
  '...VXXXXXXXXXXXXXXXVX',
  '.XXXXXXXXXXXXXXXXVXSZ',
  'PVXXXXXXXXXXXXVVXWSUZ',
  'YUUPXXXXXXXVXZWYVVZUZ',
  'YYUUYYVXXVVWTTVVWWZUZ',
  'YYUYUUSXZZWYVZZWWWZUZ',
  'YYUYYYYUZVVWWZUWZZUUZ',
  'YYUYYYYYZWWWZZZZTSVRZ',
  'YYUYYYYYZWWWZZZTVVZZW',
  'YYUYYYYYZWRRVVZWWWWZZ',
  'YYUYYYYYZYSXWZZWZZZZZ',
  'YYUYYYYYZVWWWZUWZZSUZ',
  'YYUYYYYYZWWWWZWTT.QUZ',
  'YYU.YYYYZWZWZT.....R.',
  '.YU...YYZTTT.........',
  '......YYZ............',
  '......YYZ............',
  '.......YZ............',
];

export const palette = {'X': '#f6d49a', 'Y': '#ad897a', 'Z': '#e0b590', 'W': '#ddad83', 'V': '#f7e2c4', 'U': '#95766d', 'T': '#b99582', 'S': '#c9a087', 'R': '#9d7b71', 'Q': '#856d67', 'P': '#d4aa8d'};

export const art = sprite((dots) => drawAscii(dots, rows, palette));
export const size = { w: 21, h: 22, scale: 1 };
