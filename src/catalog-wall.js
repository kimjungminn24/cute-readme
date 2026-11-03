import { sprite, drawAscii, hash } from './pixel.js';
import * as WAI from './catalog-wall-ai.js';

const SHEAR = { left: -1, right: 1, floor: 0 };

const wallSprite = (rows, palette, cls = '') => (wall) =>
  sprite((dots) => drawAscii(dots, rows, palette, { shear: SHEAR[wall] ?? 1 }), cls);

const WINDOW_ROWS = [];
{
  for (let y = 0; y < 20; y++) {
    let row = '';
    for (let x = 0; x < 24; x++) {
      const frame = y < 2 || y >= 18 || x < 2 || x >= 22;
      const streak = (x + y) % 9 < 2;
      row += frame ? 'F' : streak ? 'W' : 'G';
    }
    WINDOW_ROWS.push(row);
  }
}


const GRAPH_ROWS = [];
{
  const LEVELS = ['a', 'b', 'c', 'd'];
  for (let y = 0; y < 11; y++) {
    let row = '';
    for (let x = 0; x < 17; x++) {
      const frame = y < 1 || y >= 10 || x < 1 || x >= 16;
      const cell = (x - 1) % 2 === 0 && (y - 1) % 2 === 0;
      row += frame ? 'F' : cell ? LEVELS[Math.floor(hash(x, y) * 4)] : 'w';
    }
    GRAPH_ROWS.push(row);
  }
}

export const WALL_ITEMS = {
  window: { name: 'Window', v: 36, art: WAI.window },
  painting: { name: 'Painting', v: 46, art: WAI.painting },
};
