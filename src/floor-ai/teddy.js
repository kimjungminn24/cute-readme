import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '....PPXH..............',
  '...VVZZX.......ZKXX...',
  '..ZPWWUTXXXXXXGOcPVX..',
  '..TTUUTRXXXXXXXGUUCX..',
  '..TTUTFXXXXXXXXXXYUX..',
  '...TTFNRXXXXXXXXXJTE..',
  '....ZZRXXXXXXXXXXZO...',
  '....ZZRIWXXXXIWXXX....',
  '....ZZRIaXUXXIIXXX....',
  '....VZZRHIDaYXXXXX....',
  '....VZZPUYaYYXXXXC....',
  '.....ZZZHUMWWXXXX.....',
  '......ZZHWUUUXXK......',
  '.....VOOZZZZZZZS......',
  '...DVVSMLSSbLcSVXX....',
  '..DVVTMVLLbLLYZVXXX...',
  '.PBXEOZBLbADLYXSVXXX..',
  '.ZXXXMZWUJYWAYXSVNXX..',
  '.ORXKMZWWYYYYYYTOONF..',
  '.QQVMSVWYYYYYYYOMOVO..',
  '..GXXSVWYYYYYYETRXXE..',
  '.PRRXXVBWYYYYYRFXXGXX.',
  'PPWJCKXNNWWWUVTNNYYJX.',
  'PWWYYKXTVRNNPVVNWYYYWK',
  'QWWWYYXFQQQQQSVZUWWWJG',
  'DUWWUJXCMQQQTSVZUWWWS.',
  '.TBUWQE.......ATHUUM..',
  '..TMSS..........TSA...',
];

export const palette = {'X': '#f29759', 'Y': '#feedc1', 'Z': '#965933', 'W': '#f6c58f', 'V': '#9e5e35', 'U': '#edb986', 'T': '#7b482b', 'S': '#6a3924', 'R': '#b76a37', 'Q': '#763b25', 'P': '#a7683d', 'O': '#8b5431', 'N': '#ab6432', 'M': '#60341f', 'L': '#f3393d', 'K': '#d17b41', 'J': '#fbd6a1', 'I': '#232426', 'H': '#d8a47a', 'G': '#b66a45', 'F': '#aa5d33', 'E': '#e2925b', 'D': '#a16d54', 'C': '#ce9359', 'B': '#c2814f', 'A': '#b88e6c', 'a': '#312823', 'b': '#e61942', 'c': '#833a2e'};

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 22, h: 28, scale: 0.5 };
