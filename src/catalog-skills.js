import { sprite, drawAscii, OUTLINE } from './pixel.js';
import { shade, mix } from './iso.js';

const FONT = {
  J: ['..XXX', '....X', '....X', '....X', 'X...X', 'X...X', '.XXX.'],
  S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
  G: ['.XXX.', 'X...X', 'X....', 'X.XXX', 'X...X', 'X...X', '.XXX.'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  P: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....'],
  Y: ['X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..'],
  R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  K: ['X...X', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X...X'],
  C: ['.XXX.', 'X...X', 'X....', 'X....', 'X....', 'X...X', '.XXX.'],
  H: ['X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
};

const word = (s) => Array.from({ length: 7 }, (_, r) => [...s].map((ch) => FONT[ch][r]).join('.'));

const ICON = {
  java: [
    '..X..X..X..',
    '..X..X..X..',
    '...........',
    '.XXXXXXX...',
    '.XXXXXXXXX.',
    '.XXXXXXX.X.',
    '.XXXXXXXXX.',
    '.XXXXXXX...',
    '.XXXXXXX...',
    '..XXXXX....',
    '...XXX.....',
  ],

  docker: [
    '...XX.XX.....',
    '...XX.XX.....',
    '.............',
    'XX.XX.XX.....',
    'XX.XX.XX.....',
    '...........XX',
    'XXXXXXXXXXXXX',
    'XXXXXXXXXXX..',
    '.XXXXXXXXX...',
    '..XXXXXXX....',
    '...XXXXX.....',
  ],

  react: [
    'XX.......XX',
    '.XX.....XX.',
    '..XX...XX..',
    '...XX.XX...',
    '....XXX....',
    'XXXXXXXXXXX',
    '....XXX....',
    '...XX.XX...',
    '..XX...XX..',
    '.XX.....XX.',
    'XX.......XX',
  ],

  claude: [
    '.....X.....',
    '.X...X...X.',
    '..XX.X.XX..',
    '...XXXXX...',
    '....XXX....',
    'XXXXXXXXXXX',
    '....XXX....',
    '...XXXXX...',
    '..XX.X.XX..',
    '.X...X...X.',
    '.....X.....',
  ],

  vue: [
    'XX.......XX',
    'XXX.....XXX',
    '.XX.....XX.',
    '.XXX...XXX.',
    '..XX...XX..',
    '..XXX.XXX..',
    '...XX.XX...',
    '...XXXXX...',
    '....XXX....',
    '....XXX....',
    '.....X.....',
  ],

  db: [
    '.XXXXXXXXX.',
    'XXXXXXXXXXX',
    '.XXXXXXXXX.',
    '...........',
    '.XXXXXXXXX.',
    'XXXXXXXXXXX',
    '.XXXXXXXXX.',
    '...........',
    '.XXXXXXXXX.',
    'XXXXXXXXXXX',
    '.XXXXXXXXX.',
  ],

  git: [
    '.XXX...XXX.',
    '.XXX...XXX.',
    '.XXX...XXX.',
    '..X.....X..',
    '..X.....X..',
    '..X....XX..',
    '..XXXXXX...',
    '..X........',
    '.XXX.......',
    '.XXX.......',
    '.XXX.......',
  ],
};

const BADGE_R = 8;

function skillBadge(bg, fg, rows) {
  const cy = -1 - BADGE_R;
  const edge = mix(shade(bg, 0.5), OUTLINE, 0.3);
  const lit = shade(bg, 1.2);
  const dim = shade(bg, 0.82);
  const gloss = shade(bg, 1.07);

  const w = Math.max(...rows.map((r) => r.length));

  return sprite((dots) => {
    for (let y = -BADGE_R; y <= BADGE_R; y++) {
      for (let x = -BADGE_R; x <= BADGE_R; x++) {
        const ring = Math.max(Math.abs(x), Math.abs(y));
        if (ring === BADGE_R && Math.abs(x) === Math.abs(y)) continue;
        let c;
        if (ring === BADGE_R) c = edge;
        else if (ring === BADGE_R - 1) {
          const top = y === 1 - BADGE_R && x !== BADGE_R - 1;
          const left = x === 1 - BADGE_R && y !== BADGE_R - 1;
          c = top || left ? lit : dim;
        } else c = y <= 4 - BADGE_R ? gloss : bg;
        dots.set(`${x},${cy + y}`, c);
      }
    }

    drawAscii(dots, rows, { X: fg }, {
      ax: 0,
      ay: 0,
      dx: -Math.floor(w / 2),
      dy: cy - Math.floor(rows.length / 2),
    });
  }, 'fx-bob');
}

const BADGE_SHADOW = '<path fill="#000000" opacity="0.16" d="M-6 -6h12v2h-12z M-9 -4h18v2h-18z M-6 -2h12v2h-12z"/>';

function skill(name, bg, fg, rows) {
  const badge = skillBadge(bg, fg, rows);
  return { name, art: `${BADGE_SHADOW}<g transform="translate(0 -30)">${badge}</g>`, icon: badge };
}

export const SKILLS = {
  java: skill('Java', '#e76f00', '#ffffff', ICON.java),
  js: skill('JS', '#f7df1e', '#1e1e1e', word('JS')),
  ts: skill('TS', '#3178c6', '#ffffff', word('TS')),
  python: skill('Python', '#3776ab', '#ffd43b', word('PY')),
  go: skill('Go', '#00add8', '#ffffff', word('GO')),
  react: skill('React', '#20232a', '#61dafb', ICON.react),
  git: skill('Git', '#f05133', '#ffffff', ICON.git),
  docker: skill('Docker', '#1d63ed', '#ffffff', ICON.docker),
  claude: skill('Claude', '#d97757', '#ffffff', ICON.claude),
  vue: skill('Vue', '#35495e', '#42b883', ICON.vue),
  rust: skill('Rust', '#b7410e', '#ffffff', word('RS')),
  kotlin: skill('Kotlin', '#7f52ff', '#ffffff', word('KT')),
  c: skill('C', '#03599c', '#ffffff', word('C')),
  sql: skill('SQL', '#336791', '#ffffff', ICON.db),
  html: skill('HTML', '#e34c26', '#ffffff', word('HT')),
};
