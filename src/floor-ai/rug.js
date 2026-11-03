import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.................V..V.RRRRR....................',
  '.............ZZMVYNOQTTTTTTLSYRMMV.............',
  '..........DGESNUUSKKXXXXXXYKNLUUTSOZD..........',
  '.......RGVYLUXXYXXXXXXXXXXXXXXXYXOUUYMMR.......',
  '.....VYUYYXXXXXXXXXXXXXXXXXXXXXXXXXXXYYHYK.....',
  '...ZBAYYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXYYScG...',
  '..RYSYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXYYV..',
  '.VYYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXTYB.',
  '.RXYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXYYV.',
  'BYYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXLYI',
  'JMYYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXYZW',
  'JIYYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXHYZP',
  '..VOYYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXYZP.',
  '...GVYQYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXYHYVZF..',
  '...JZZYSCXXXXXXXXXXXXXXXXXXXXXXXXXXXXYNXYZZJ...',
  '....PPZZZTALXXXXXXXXXXXXXXXXXXXXXXXXQTZRZ......',
  '........PZZRXYYOOaUUQQQQQQQUUTNNYYEVZGP........',
  '.........JJFbZZZZXYYYYYYYYYYYXVZZZZFWW.........',
  '.............WWW.ZZZZZZZZZZZZZ.P.W.............',
];

export const palette = {'X': '#91ccd1', 'Y': '#95cccf', 'Z': '#7ca29f', 'W': '#c0b3a5', 'V': '#83a3a3', 'U': '#f0eede', 'T': '#b2d6d5', 'S': '#9ccfd0', 'R': '#82a9a8', 'Q': '#a8cfd2', 'P': '#c6baac', 'O': '#a7cec9', 'N': '#97cdc3', 'M': '#88a9a7', 'L': '#a1ccce', 'K': '#a1d0c9', 'J': '#c6b8aa', 'I': '#91a8a6', 'H': '#d1e6db', 'G': '#7c9b9b', 'F': '#bcbbad', 'E': '#9cc5c5', 'D': '#88a09b', 'C': '#e2edd8', 'B': '#8fb1b0', 'A': '#ccdad4', 'a': '#c3e7d7', 'b': '#a4b3a9', 'c': '#98b8bd'};

export const art = sprite((dots) => drawAscii(dots, rows, palette));
export const size = { w: 47, h: 19, scale: 1 };
