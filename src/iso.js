const TILE_W = 48;
const TILE_H = 24;
export const TILE_HALF_W = TILE_W / 2;
export const TILE_HALF_H = TILE_H / 2;

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

export function mix(hex, other, t) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(other.slice(1), 16);
  const ch = (sh) => {
    const v = ((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t;
    return Math.round(v).toString(16).padStart(2, '0');
  };
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}
