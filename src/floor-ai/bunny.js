import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '....UU...........',
  '...UXXY......ZZ..',
  '...UZXV.....YQXZ.',
  '...ZTBW....PXRZRU',
  '...ZTcWW...XROTZU',
  '...ZTOWN..NXATTZ.',
  '...KTOWM.UXYHTZ..',
  '...WGOWN.WZOHTN..',
  '...WTOWU.XVOHZ...',
  '...ZWXXQLQOHZ....',
  '..VXXXXXXPdA.....',
  '.UXXXXXXXYZL.....',
  '.VXXXXXXXYYWP....',
  'VRXXXXXRYYYYU....',
  'WQaQRJRYYYYYN....',
  'WTbYYYPbYYYYN....',
  'WTQQGYYaGGYYU....',
  '.WYYYZYBTTYe.....',
  '..PYPPYYPZFVV....',
  '..UKUCEEENVKVV...',
  '..KRXXXXXVVVZSS..',
  '..SRYXXXYPPVSQZS.',
  '..IQXYXYLYYMWNKJK',
  '..IYRUYYLXYCVVVJJ',
  '..DYYUYWCXYEMMLJK',
  '.SYYFYZLMRQILMMS.',
  '.SXYFL.FXXZIMDD..',
  '..SSS..SJXWI.....',
  '........SSD......',
];

export const palette = {'X': '#fefefb', 'Y': '#efe5d2', 'Z': '#e4d8c0', 'W': '#dcd0b7', 'V': '#d7c9af', 'U': '#c0b192', 'T': '#fd9d98', 'S': '#877463', 'R': '#f3ebdc', 'Q': '#fdfaf2', 'P': '#ebdfc8', 'O': '#c56354', 'N': '#b4a184', 'M': '#ad9977', 'L': '#cbb895', 'K': '#d4c3a5', 'J': '#faf3e7', 'I': '#836e47', 'H': '#e47e73', 'G': '#f6a7a3', 'F': '#9e896a', 'E': '#947c53', 'D': '#71604e', 'C': '#a78f62', 'B': '#e9bcae', 'A': '#c28066', 'a': '#352d2b', 'b': '#211812', 'c': '#d27468', 'd': '#c4927c', 'e': '#a1917b'};

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 17, h: 29, scale: 0.5 };
