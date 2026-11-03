import { sprite, drawAscii } from '../pixel.js';

export const rows = [
  '..PP.................PP..',
  '.ZTTZZ.............ZSTXW.',
  '.WTRXXZS.........WSXXRXV.',
  'SYTRTXXRZ.......WRXXXXXYW',
  'WYYYYYXXXZ.ZZZ.WTXXYYYYYW',
  'WRYYYYYYYRVTRXVXYYYYYYYRW',
  'WZYYYZZVUUZURRZQUZZZYYYNV',
  'SZYYTYYYZVWYRRVZZUYYXYYNV',
  'SYYTXXXYYQWYYYVYYYTXXXYYW',
  'VYYXXXXXRUWUZUVURXXXXXYYV',
  'VUXXXXZZVWVVVVVVVVZXXXXYV',
  'ZUXZZZQUWZXW.VXVVUUZZZXUV',
  'SWZQQQZVZYRV.VXYVVVQQQZVW',
  '.WWWWZXWUYRV.VTYUZXWZWWS.',
  '.....ZRYYXXV.VTXYYRW.....',
  '....VYYYXXXW.WTXXYYYZ....',
  '...SXXXXXXZ...ZXXXXXXW...',
  '...WXXXXXRW...ZXTTXXXV...',
  '...WXXXXXUZ...WUTXXXXV...',
  '..WXXXZXXV.....WTXZXXXW..',
  '..WXZW.ZXW.....WTW.WWXV..',
  '..SS...WRS.....SXS...SW..',
  '........Z.......Z........',
  '........S.......P........',
];

export const palette = { 'P': '#5f3f5a', 'Z': '#58334e', 'T': '#fe78b6', 'S': '#543b52', 'X': '#ff7eba', 'W': '#53364d', 'R': '#fe87bb', 'V': '#50334a', 'Y': '#e93a98', 'U': '#e13f95', 'Q': '#d83b90', 'N': '#58244c' };

export const art = `<g transform="scale(0.5)">${sprite((dots) => drawAscii(dots, rows, palette))}</g>`;
export const size = { w: 25, h: 24, scale: 0.5 };
