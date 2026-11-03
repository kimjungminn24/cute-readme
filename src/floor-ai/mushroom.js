import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.......XXXXXX.......',
  '.....WWWWWWWXXX.....',
  '...WWTWWWWWWXXXXW...',
  '..XWYYXWWWTWXWWXWW..',
  '.XXWZTXWWTTWXWZXXXX.',
  '.XXXXXXXWWWWXXZZXXX.',
  'XXXXXXXXXXXXXXXZXXXR',
  'XXXXXXTXXXXXXXXXXXXR',
  'XXXXXTTXXXXXXXXXXXXR',
  '.UXXXXXXXXXXZZXXXXR.',
  '.UUXXXXXXXXXZXXXXU..',
  '..UUUXXXXXXXXXXUU...',
  '....UUUUUUUUUUUU....',
  '.....QZVSSSSSZV.....',
  '....VTZZVVVZZZZV....',
  '....VYYYZZZZZYZV....',
  '...VZYYYYYYYYYZZV...',
  '...VYYYYYYYYYYZZV...',
  '...VZYYYYYYYYYZZV...',
  '...VZYYYYYYYYYYZV...',
  '....VZYYYYYYYZZV....',
  '....VVZZYYZZZZVV....',
  '......VVVVVVVV......',
];

export const palette = {'X': '#e3433c', 'Y': '#fef0cc', 'Z': '#e4c598', 'W': '#fc5b52', 'V': '#c1995d', 'U': '#be2f33', 'T': '#fbe8c7', 'S': '#8c212b', 'R': '#9c222a', 'Q': '#bb854e'};

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 20, h: 23, scale: 0.5 };
