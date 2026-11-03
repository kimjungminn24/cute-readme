import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.............PV........',
  '...........VPXTPU......',
  '.........WXXXXXXXX.....',
  '......VPXXXXSSSXXXTW...',
  '....WXXXXXXSSSXXXXXTTW.',
  '.WPXXXTXXXSSXXXXXXXXXXU',
  'UXXXXSSSXXXXXXXXXXXTTWW',
  'QRXSSXXSXXXXXXXXXTTWYYT',
  'QRWWXXXXXXXXXXXXTYWYYYU',
  'QQZZWWTXXXXXTTWOLYYVYWT',
  'QQUZZWWTXXXTWWPNTOVYYPT',
  'QMZUZZZWWXTPYYYNNLYYYUP',
  'QRZZZUUZRWXYYVUNOLYYYWX',
  'QRZZZZUURPYYVYYNJYYYYWX',
  'QMZZZZZZRVVYYYYYYYYYY..',
  '.UUZZZZZRWXYYYYYYYV....',
  '...UZZZZUWWYYYYYU......',
  '.....VZZRWWYYYVV.......',
  '.......QMWXV...........',
  '........UWV............',
];

export const palette = {'X': '#f5deac', 'Y': '#e8b980', 'Z': '#ba8e6e', 'W': '#d7a088', 'V': '#a17f69', 'U': '#977663', 'T': '#f9efd2', 'S': '#ecc388', 'R': '#b98677', 'Q': '#8b6b5b', 'P': '#e0ab8e', 'O': '#787168', 'N': '#b2b0ad', 'M': '#c1a98c', 'L': '#928d86', 'J': '#d5d2ce'};

export const art = sprite((dots) => drawAscii(dots, rows, palette));
export const size = { w: 23, h: 20, scale: 1 };
