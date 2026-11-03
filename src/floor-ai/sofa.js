import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '.......................XX.............',
  '....................XXXXXX............',
  '..................XXXXXXTTT...........',
  '.................XXXXXXYYTT...........',
  '..............XXXXXXXYYYYYT...........',
  '............LSXXXXYYYYYYYYYY..........',
  '...........XXXXLXYYYYYYYYYYY..........',
  '........XXXXXXXTTYYYYYYYYYYIXX........',
  '......XXXXXXYYTTSYYYYYYYYYTIXXXX......',
  '.....XXXXXXYYYYTTEYYYYYYYYTQVXXXX.....',
  '...XXXXXXYYYYYYTTYYYYYYYYTRGWHXXXXXX..',
  '..VZXXYYYYYYYYYYYMYYYYYYVWRGZZORWXXXXL',
  '..ZZOYYYYYYYYYYYYSTYYYTWWWUGZZZURVXXWW',
  '..ZZZHYYYYYYYYYYYTVYYVVWVOWXMSZZZUWWVV',
  '..ZZZZYYYYYYYYYYYTVVVROWVXXXXXSMZZUWWV',
  '..ZZZZVYYYYYYYYTYWVVOWVXXXXXXXXLSZUWWR',
  '..UZZZVYYYYYYTWWWWSSVVXXXXXXXXXXXXUWWV',
  '..XKUZSWYYYYVWWROVQTXXXXXXXXXXXXXXXWWV',
  '.YXXXSSWWYYWWWOWVXXXVXXXXXXXXXXXXVWWWV',
  'VVRXXXXWVVVWJVVVXXXXXXVXXXXXXXXWWWZWWV',
  'OUZVVXXXXVMRVXXXXXXXXXXXYVXXXWRSSZUWV.',
  '.UZZZWWXXXXJXXXXXXXXXXXXXYKWWWSZZUUW..',
  '..UZZZZWRXXXXXXXXXXXXXXXXWYQSZZZZUFN..',
  '..ZZSZZZZWWXXVWXXXXXXXXWRQQZZZUU..FN..',
  '..ZZZSZZZZZWVVWWXXXXXYVWQZZZZZ........',
  '..UZZZZSZZZZWWWWXXXWWWZZZZZU..........',
  '..UZZZZZZSSZWWWUWWRQSZZZZU............',
  '...ZZZZZZZZSWWWRQSSZZZZZ..............',
  '...PPZZZZZZZZWWSZZZZZZ................',
  '...DP...UZZZZWWQUUUU..................',
  '....P....UUZUWWQUU....................',
  '...........UUWW.......................',
  '...........PCD........................',
  '...........PPNN.......................',
  '............PN........................',
];

export const palette = {'X': '#e5f5f0', 'Y': '#c9e3e2', 'Z': '#96b4b9', 'W': '#a2c6cd', 'V': '#a7cad0', 'U': '#98b7bc', 'T': '#c4dfdf', 'S': '#80a1a7', 'R': '#9dc2c9', 'Q': '#84a5aa', 'P': '#ac9e87', 'O': '#9fbec2', 'N': '#c9b392', 'M': '#7a9a9f', 'L': '#dbeeec', 'K': '#8fafb4', 'J': '#b8d4d8', 'I': '#8da9ae', 'H': '#a9c4c8', 'G': '#37585c', 'F': '#95836d', 'E': '#739193', 'D': '#b5a288', 'C': '#a6947b'};

export const art = sprite((dots) => drawAscii(dots, rows, palette));
export const size = { w: 38, h: 35, scale: 1 };
