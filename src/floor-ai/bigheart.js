import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.....TTWW........WWWW.....',
  '...TTPPPPVV....WWYYYYTT...',
  '..WNPYYYYZOT..TNQXXXXYYV..',
  '.VOSSYYZYYYSWVSQQQXXXXYYW.',
  '.RYYQQYZZYYUXNLSYYYXXXXYT.',
  'WYYYQQYZYYZZOYYKYYYXXXXYYV',
  'WSXQMYZZZZZYYYYYYYYYXXXXSR',
  'TSXQMYYYYYZZZZZZYZYYXXXXSV',
  'TSXOSYZZZZZZZZZZYZZYXXXXYW',
  'TSXOZZZZZZZZZZZZZYYYXXXXYV',
  'WSXXYYZZZZZZZZZZZZYXXXXXYV',
  '.VUXXYYZZZZZZZZZZYXXXXXUR.',
  '.RUXXYYYZZYZZZZZZYXXXXXUR.',
  '..TXXXYXYZZZZZZZXXXXXXUV..',
  '...RUXYYNYYYZYYYXXXXXUV...',
  '....WUXYYYYYYZYXXXXXXV....',
  '.....RUXXXYYYYXXXXXXV.....',
  '......WUXXXXXXXXXXXR......',
  '.......RXXXXXXXXXUR.......',
  '........WUXXXXXXXV........',
  '.........RUXXXXUV.........',
  '..........WXXXXV..........',
  '...........RUUR...........',
  '............TT............',
];

export const palette = {'X': '#c72c73', 'Y': '#ec77a4', 'Z': '#f074a6', 'W': '#732344', 'V': '#6d213d', 'U': '#ce317c', 'T': '#792348', 'S': '#e67ba2', 'R': '#661d38', 'Q': '#f4c6ee', 'P': '#f989c4', 'O': '#ed519f', 'N': '#e564a4', 'M': '#f0d4f0', 'L': '#ebe1f2', 'K': '#f9aadd'};

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 26, h: 24, scale: 0.5 };
