import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.................PVV...........',
  '...............VPXTTPU.........',
  '.............WPXXXXXTXV........',
  '..........VWWXXXXXXXXXXXV......',
  '........VPXXXXXXSSSSXXXTTWW....',
  '.....WWXXXXXXXSSSSXXXXXXXTTWW..',
  '...PWXXXTXXXSSSSXXXXXXXXXXXTXU.',
  '.WWXXXXXTSXXXXXXXXXXXXXXXXXXXWV',
  'UXXXXXSSSSSXXXXXXXXXXXXXXTTWWWV',
  'QRXXSSXXXSXXXXXXXXXXXXXTTWWYYTU',
  'QRWWSXXXXXXXXXXXXXXXXTTWWYYYYWU',
  'QRZWWXXXXXXXXXXXXXXTTYYYYYYVVUU',
  'QQZZZWWTTXXXXXXXTTWWOLOYYVVYWTV',
  'QQUZZZWWWTXXXXTTWWPKNTOYVYYYPTV',
  'QMZUUZZZZWWXXTPWPYYYNNLVYYYYUPV',
  'QMZZZUUZZZRWWWZYYYYONNLYYYYYUPV',
  'QRZZZZZUUZZRWXYYYVURNOLYYYYYWXV',
  'QRZZZZZZUUZRPYYVVYYONJOYYYYYWXV',
  'QMZZZZZZZZURWVVYYYYYOOYYYYYZWW.',
  'QMZZZZZZZZRVVXYYYYYYYYYYYVV....',
  '.UUVZZZZZZMRWXYYYYYYYYYVV......',
  '....UZZZZZURWWYYYYYYYUV........',
  '.....UVZZZURWWYYYYVVV..........',
  '.......UUZMRWXYYUU.............',
  '.........QMRWXVV...............',
  '..........URWV.................',
  '...........UU..................',
];

export const palette = {'X': '#f5deac', 'Y': '#e8b980', 'Z': '#ba8e6e', 'W': '#d7a088', 'V': '#a17f69', 'U': '#977663', 'T': '#f9efd2', 'S': '#ecc388', 'R': '#b98677', 'Q': '#8b6b5b', 'P': '#e0ab8e', 'O': '#787168', 'N': '#b2b0ad', 'M': '#c1a98c', 'L': '#928d86', 'K': '#aea9a4', 'J': '#d5d2ce'};

export const art = `<g transform="scale(0.75)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 31, h: 27, scale: 0.75 };
