import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.......................TTSI..............',
  '......................SXXXXXSH...........',
  '....................TXXXXXXXXXII.........',
  '..................SSXXLXXXXXXXXXI........',
  '................STXXXXLRIXXXXXXXXXST.....',
  '..............TXXXXXXXXXLHHXXXXXXXXT.....',
  '............TTXXXXXXXXXXXKKQSXXXXXHHSI...',
  '..........QQXXXXXXXXXXXXXXXRHHXXRYKXXXSH.',
  '........SXXXXXXXXXXXXXXXXXXXXLRRKXXXXXTL.',
  '.......TXXXXXXXXXXXXXXXXXXXXXXKKXXXXQQYL.',
  '....TTTXXXXXXXXXXXXXXXXXXXXXXXXXXXTYYYYWW',
  '...QXXXXXXXXXXXXXXXXXXXXXXXXXXXXSYYYRWWVE',
  '..YXXXXXXXXXXXXXXXXXXXXXXXXXXXSTYYYWWEVVP',
  '.LYXXXXXXXXXXXXXXXXXXXXXXXXXXYYYYRWWVVVD.',
  'WWYYYTXXXXXXXXXXXXXXXXXXXXXQYYYRWVVVVJP..',
  'VWWYYYTTXXXXXXXXXXXXXXXXXXTYYYWWVVVOOJPZT',
  'VUUWWYYYYXXXXXXXXXXXXXXXQYYYWWEPPVZZZOO..',
  '.VUUUWWRYYYTXXXXXXXXXTTYYRRWVNVVZZZM.....',
  '..DUUUUWWRRYTTXXXXXXTYYYRWVVVNZZZM.......',
  '.ZVPUUUUUWRRYYTXXXSYYYWWWVVVOZZZ.........',
  '..OOCZPUUUUWWRYQQQYYYWWVVVPZZZ...........',
  '...CCZZZJUUUUWRQQQYRWNVNOJZZ.............',
  '......ZZZZUUUUWWQWWWVVNZZZZ..............',
  '........ZZZZPUPEBFUUNGZZM................',
  '.........MZZZZVFBFGPZZZ..................',
  '............ZZZFGFZZZ....................',
  '..............ZOFJZM.....................',
  '...............OFP.......................',
  '................G........................',
];

export const palette = {'X': '#fcf8ed', 'Y': '#d4beb1', 'Z': '#857b7c', 'W': '#e2b491', 'V': '#ba8b76', 'U': '#c89c7b', 'T': '#eaddd0', 'S': '#ede1d5', 'R': '#d2baac', 'Q': '#e7d6ca', 'P': '#ab7f6c', 'O': '#8e6f60', 'N': '#c29578', 'M': '#8a8081', 'L': '#b19d8f', 'K': '#a89386', 'J': '#846a5b', 'I': '#dfcec2', 'H': '#dac7b9', 'G': '#9b7665', 'F': '#c49384', 'E': '#d4a884', 'D': '#a17765', 'C': '#948a8d', 'B': '#cd9d8f'};

export const art = sprite((dots) => drawAscii(dots, rows, palette));
export const size = { w: 41, h: 29, scale: 1 };
