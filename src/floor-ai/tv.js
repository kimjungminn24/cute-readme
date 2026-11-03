import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '..........WW........',
  '........WWYYWWW.....',
  '......WWYYYYYYYW....',
  '....WWYYYYYYYYYYYW..',
  '...WYYYYYYYYYYYYYYWW',
  '..UUSYYYYYYYYYYYYWQQ',
  '..UVNSWYYYYYYYYYQQQX',
  '..UVVTSSUYYYYYQQXXXX',
  '..UVTRRTNUUWQQXXXXXX',
  '..UVTRZZTPUQXXXXXXXX',
  '..UVTRRZZVVXXXXXXXXX',
  '..UVTRRRRTVXXXXXXXXX',
  '..UVOTRRRTVXXXXXXXXX',
  '..XVVVTTRTVXXXXXXXXX',
  '...QXXVOTTVXXXXXXXSS',
  '....NUXXVVVXXXXXSNN.',
  'ZZZZPPNSXVVXXXXSPOO.',
  'ZZZZPZZZZUSXSSZZZP..',
  'ZZZZZZZZZZNNOZZZ....',
  '..ZZZZZZZZPOOZZ.....',
  '....ZZZZZZPO........',
  '......ZZZZ..........',
];

export const palette = {'X': '#d4ab8e', 'Y': '#f8deb5', 'Z': '#d8cdc3', 'W': '#ebc9a3', 'V': '#7d7876', 'U': '#aa8973', 'T': '#9c9998', 'S': '#b4917a', 'R': '#aeb4b5', 'Q': '#c7a287', 'P': '#3c3a42', 'O': '#868080', 'N': '#936f65'};

export const art = sprite((dots) => drawAscii(dots, rows, palette));
export const size = { w: 20, h: 22, scale: 1 };
