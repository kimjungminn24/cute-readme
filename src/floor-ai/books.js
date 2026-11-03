import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '...........Q...........',
  '.........QXXXQ.........',
  '......QXXXXXXXXX.......',
  '....QXXXXXXXXXXXXQ.....',
  '..TXXXXXXXXXXXXXXXXX...',
  '.ZTTOXXXXXXXXXXXXXXXXQ.',
  '.ZZZTTOXXXXXXXXXXXXXXXT',
  '.UZZZZTTOXXXXXXXXXXXXN.',
  '.SZZZZZZZTOXXXXXXXZSYP.',
  'UUUSTZZZZZZTOXXQTYYYYTT',
  'UUUUUSTZZZZZZTNYYYYZZS.',
  '.RMUUUUSNZZZTYYYPZSPYP.',
  'VWVVMUUUUSZZTYSTSYYYYPN',
  'VWWWVVMUUUUSZTPYYYYPMRL',
  '.VWWWWVVRUUSYYYYSVRVYYV',
  '..RWWWWWVVNSYYSLVLYYKKR',
  '....VWWWWWVVVVVRKYYJRV.',
  '......RWWWWWRYYKYL.R...',
  '........VWWWYYJRR......',
  '..........VWV.R........',
];

export const palette = {'X': '#e58e3e', 'Y': '#f7f2cf', 'Z': '#a8392b', 'W': '#40365a', 'V': '#484365', 'U': '#c07b5e', 'T': '#b64533', 'S': '#d59b7d', 'R': '#564d60', 'Q': '#e39b57', 'P': '#e4bea5', 'O': '#c34d33', 'N': '#a95743', 'M': '#6e5c5b', 'L': '#6e5e7c', 'K': '#ebed9d', 'J': '#e8de5d'};

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 23, h: 20, scale: 0.5 };
