import { personScale } from './catalog-person-face.js';
import { MINI_COLORS, MINI_HAIRS, MINI_OUTFITS, MINI_POSES, miniArt, miniHeight } from './person-minimi.js';

export { ACCESSORIES, ACCESSORY_STYLES, DEFAULT_ACCESSORY, DEFAULT_EXPRESSION, EXPRESSIONS, EXPRESSION_STYLES, SIZE_STYLES } from './catalog-person-face.js';

export const DEFAULT_SHAPE = 'pixel';
export const SHAPES = {
  pixel: {
    label: 'Minimi', headH: 18, hairs: MINI_HAIRS, outfits: MINI_OUTFITS,
    eyeRow: 10, mouthRow: 15, crownSink: 1, hand: { row: 6, col: 7 }, fallback: 'round',
  },
};
export const SHAPE_STYLES = { pixel: 'Minimi' };
const labels = (table) => Object.fromEntries(Object.entries(table).map(([id, value]) => [id, value.label]));
export const HAIR_STYLES = labels(MINI_HAIRS);
export const OUTFITS = labels(MINI_OUTFITS);
export const POSES = MINI_POSES;
export const POSE_STYLES = labels(POSES);
export const hairsForShape = () => HAIR_STYLES;
export const outfitsForShape = () => OUTFITS;
export const shapeUsesOutfit = () => true;
export const DEFAULT_POSE = 'stand';
export const DEFAULT_PERSON_ANIM = 'none';
export const PERSON_ANIMS = {
  none: { label: 'None' },
  bob: { label: 'Bob', cls: 'p-bob' },
  fly: { label: 'Fly', cls: 'p-fly', lift: 10 },
};
export const DEFAULT_PERSON = {
  col: 4, row: 5, flip: false, shape: DEFAULT_SHAPE, pose: DEFAULT_POSE,
  anim: DEFAULT_PERSON_ANIM, accessory: 'none', expression: 'normal', size: 'normal',
  ...MINI_COLORS, hairStyle: 'bob', outfit: 'tee', glasses: false,
};

// Map legacy shape names to the modular minimi for saved rooms.
export function personHeight(p = {}) {
  const anim = PERSON_ANIMS[p.anim] ?? PERSON_ANIMS.none;
  return (miniHeight(p) * personScale(p) + (anim.lift ?? 0)) * 2;
}
export function personArt(p = {}) {
  const anim = PERSON_ANIMS[p.anim] ?? PERSON_ANIMS.none;
  const scale = personScale(p);
  let art = '<g class="person"' + (p.flip ? ' transform="scale(-1,1)"' : '') + '>' + miniArt(p) + '</g>';
  if (scale !== 1) art = '<g transform="scale(' + scale + ')">' + art + '</g>';
  return anim.cls ? '<g class="' + anim.cls + '">' + art + '</g>' : art;
}
