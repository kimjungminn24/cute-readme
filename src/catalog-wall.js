import { sprite, drawAscii } from './pixel.js';
import * as WAI from './catalog-wall-ai.js';

const SHEAR = { left: -1, right: 1, floor: 0 };

// Kept for new wall pieces: `npm run import -- art.png --kind wall` prints a wallSprite(...) entry.
// eslint-disable-next-line no-unused-vars
const wallSprite = (rows, palette, cls = '') => (wall) =>
  sprite((dots) => drawAscii(dots, rows, palette, { shear: SHEAR[wall] ?? 1 }), cls);

export const WALL_ITEMS = {
  window: { name: 'Window', v: 36, art: WAI.window },
  painting: { name: 'Painting', v: 46, art: WAI.painting },
};
