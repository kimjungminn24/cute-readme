import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.......LXXXXX........',
  '....XXSYTTIZZLLX.....',
  '...LYYYTRTTTZFYYXR...',
  '..XYYYDWWWYYTWYYYZX..',
  '.XWWYYWXXXXXXRRZFYZX.',
  'XWWWYYXXEOOHUXLIAZZX.',
  'VWIYCYHVNNNQOVZTTZZZX',
  'UWYYYYaPP..OPSZTTCZZU',
  'UUYRYYRZJJJJOYZITYZUX',
  'UUWYbWWYXSXXSYZZZZXXG',
  'EUUZWWWYFRRWDYZZXXXHQ',
  'SOXUUYWRRRWYYZZXXXXMB',
  'BQOOUUUWWWWWYXXXXXcJ.',
  'VQQQOSUULLLdXXXSeEMV.',
  '.PQKQVSKPSSSXGXHMMV..',
  '..PPQQNNNKKKGMGMVV...',
  '....VVMNNNKKMMVV.....',
  '......VPVVPPVV.......',
];

export const palette = {'X': '#e983ad', 'Y': '#ffb4ce', 'Z': '#ffafcc', 'W': '#feb9d1', 'V': '#8a3d29', 'U': '#fe8bbf', 'T': '#ffd9e8', 'S': '#d1728c', 'R': '#ffc8de', 'Q': '#e4a857', 'P': '#9f4c2e', 'O': '#c4753e', 'N': '#fdc475', 'M': '#cc8b3c', 'L': '#fc9cc5', 'K': '#d38d5e', 'J': '#643428', 'I': '#d41032', 'H': '#b24753', 'G': '#ae622c', 'F': '#fef312', 'E': '#ca496e', 'D': '#43b5f7', 'C': '#97a134', 'B': '#8b4b27', 'A': '#f9c5ba', 'a': '#eb726b', 'b': '#ff8a42', 'c': '#943055', 'd': '#2498ff', 'e': '#b16144'};

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 21, h: 18, scale: 0.5 };
