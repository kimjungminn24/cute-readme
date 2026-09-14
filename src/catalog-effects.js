import { sprite, drawAscii } from './pixel.js';

const fx = (rows, palette, cls) =>
  `<g transform="translate(0 -30)">${sprite((dots) => drawAscii(dots, rows, palette), cls, true)}</g>`;

export const EFFECTS = {
  heart: {
    name: 'Heart',
    art: fx(
      ['.RR.RR.', 'RRRWRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
      { R: '#eb5f70', W: '#f7bec6' },
      'fx-beat',
    ),
  },
  note: {
    name: 'Note',
    art: fx(
      ['....N...', '....NN..', '....N.N.', '....N...', '....N...', '.NNN....', 'NNNN....', '.NN.....'],
      { N: '#9e90cf' },
      'fx-bob',
    ),
  },

  zzz: {
    name: 'Sleep',
    art: fx(
      ['.....ZZZ', '......Z.', '.....Z..', '.....ZZZ', '..ZZ....', '...Z....', '..Z.....', '..ZZ....'],
      { Z: '#92a4ce' },
      'fx-bob',
    ),
  },
  sweat: {
    name: 'Sweat',
    art: fx(
      ['..D..', '..D..', '.DDD.', 'DDdDD', 'DDDDD', '.DDD.'],
      { D: '#86b4da', d: '#cbe4f6' },
      'fx-bob',
    ),
  },
  star: {
    name: 'Star',
    art: fx(
      [
        '.....S.....',
        '....WSS....',
        '....WSS....',
        'SSSSSSSSSSS',
        '.SSSSSSSSS.',
        '..SSSSSSS..',
        '...SSSSS...',
        '..SSS.SSS..',
        '..SS...SS..',
      ],
      { S: '#f9d97b', W: '#fcf2c0' },
      'fx-twinkle',
    ),
  },
  question: {
    name: 'Question',
    art: fx(
      ['.QQQ.', 'Q...Q', '...QQ', '..QQ.', '..Q..', '.....', '..Q..'],
      { Q: '#e6b775' },
      'fx-beat',
    ),
  },
  exclaim: {
    name: 'Exclaim',
    art: fx(
      ['.XX.', '.XX.', '.XX.', '.XX.', '....', '.XX.'],
      { X: '#df7f6f' },
      'fx-beat',
    ),
  },
};
