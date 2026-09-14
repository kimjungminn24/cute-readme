import { sprite, drawAscii, SCALE } from './pixel.js';

// Use the full tile period to preserve spacing between motifs.
const strip = (rows, palette, cls = '', edged = false) => ({
  period: rows[0].length * SCALE,
  art: sprite((dots) => drawAscii(dots, rows, palette), cls, edged),
});

const HEART_ROWS = [
  '...RR.RR....',
  '..RRRWRRR...',
  '..RRRRRRR...',
  '...RRRRR....',
  '....RRR.....',
  '.....R......',
];
const HEART_INK = { R: '#eb5f70', W: '#f7bec6' };

export const LINES = {
  lace: {
    name: 'Lace',
    turn: true,
    ...strip(
      [
        'PPPPPPPPPPPPPPPP',
        'P..pp..PP..pp..P',
        '.P.pp.P..P.pp.P.',
        '..PPPP....PPPP..',
      ],
      { P: '#ecb4c2', p: '#f8dbe1' },
    ),
  },
  dots: {
    name: 'Dots',
    turn: true,
    ...strip(['OO..OO..OO..OO..', 'OO..OO..OO..OO..'], { O: '#e27589' }),
  },
  chain: {
    name: 'Chain',
    turn: true,
    ...strip(
      [
        '.CC..CC..CC..CC.',
        'C..cC..cC..cC..c',
        'C..cC..cC..cC..c',
        '.CC..CC..CC..CC.',
      ],
      { C: '#d2b667', c: '#e7d288' },
    ),
  },
  garland: {
    name: 'Garland',
    turn: true,
    ...strip(
      [
        '..L....F....L...',
        '.LL...FYF...LL..',
        'GGGGGGGFGGGGGGGG',
        '....L.....L.....',
        '.....LL..LL.....',
      ],
      { G: '#8daf7b', L: '#b0d391', F: '#e27589', Y: '#fae2a2' },
    ),
  },
  hearts: {
    name: 'Hearts',
    turn: true,
    ...strip(HEART_ROWS, HEART_INK, '', true),
  },
  heartsBeat: {
    name: 'Hearts, beating',
    turn: true,
    ...strip(HEART_ROWS, HEART_INK, 'fx-beat', true),
  },
  fence: {
    name: 'Fence',
    turn: true,
    ...strip(
      [
        '.f...f...f...f..',
        'FFFFFFFFFFFFFFFF',
        '.F...F...F...F..',
        'FFFFFFFFFFFFFFFF',
        '.F...F...F...F..',
      ],
      { F: '#b88e74', f: '#cfa385' },
    ),
  },
};
