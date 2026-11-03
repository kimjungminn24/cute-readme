import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.....VVV......VVV......',
  '....VNXQV....VXXQV.....',
  '....VMITXPPPVXTHOV.....',
  '....WOWTXXXXXXTWOW.....',
  '....WTTTXXXXXXTTTW.....',
  '....XQMXXXXXXXXMQQ.....',
  '...ZRRXXXXXXXXXXRRW....',
  '...VRRXXXXXXXXXXRRV....',
  '...VXXXXXZZZZXXXXXV....',
  '...ZXXXXXXXXXXXXXXZ....',
  '....NXXXXXXXXXXXXZ.....',
  '..W.ZXXXXXXXXXXXXU.P...',
  '.KXZXXXXOYYYYMXXXXWXP..',
  'VXXWXXXOYYYYYYOXXXWXXW.',
  'VNUZXXXYYYYYYYYXXXZUW..',
  '.WUZXXXYYYYYYYYXXXZUW..',
  '..UZXXXYYYYYYYYXXXZU...',
  '.WNZQXVYYYYYYYYZXLZUPW.',
  'VXUULXQSSSYYSSSXXLNUXGW',
  '.WWJXXXWWSSSSWWXXXJWW..',
  '...ZZXLZ......ZKXZZ....',
  '.....ZZ........ZZ......',
];

export const palette = {'X': '#78ad67', 'Y': '#fdf3c5', 'Z': '#3d472f', 'W': '#413b30', 'V': '#58533f', 'U': '#416644', 'T': '#fefffc', 'S': '#d8ca9f', 'R': '#ea8773', 'Q': '#6f955b', 'P': '#66704e', 'O': '#b8d99a', 'N': '#44593b', 'M': '#8ec773', 'L': '#547b4e', 'K': '#7d8a65', 'J': '#a9aa8f', 'I': '#f7e9f8', 'H': '#d1d1cc', 'G': '#7f7367'};

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 23, h: 22, scale: 0.5 };
