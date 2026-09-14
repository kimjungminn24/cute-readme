import { sprite, pxBox, drawAscii, fillPoly, speckle, hash } from './pixel.js';
import { shade } from './iso.js';
import { off, P } from './catalog-base.js';

function leafRows(w, h, lobes) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const bump = (hash(x >> 1, y >> 1) - 0.5) * 0.3;
      let near = null;
      for (const [lx, ly, r] of lobes) {
        const dx = (x - lx) / r;
        const dy = (y - ly) / (r * 0.86);
        const d = dx * dx + dy * dy;
        if (d <= 1 + bump && (!near || d < near.d)) near = { d, dx, dy };
      }
      if (!near) {
        row += '.';
        continue;
      }

      const t = near.dx * 0.62 + near.dy * 0.78 + (hash(x, y) - 0.5) * 0.3;

      const under = Math.max(0, 1 - Math.hypot((x - w / 2) / (w * 0.34), (y - h * 1.02) / (h * 0.44)));

      const crease = near.d > 0.82 ? 0.5 : 0;
      const v = t + under * 1.25 + crease;

      if (v < -0.42 && near.d > 0.3) row += 'L';
      else row += v > 0.62 ? 'S' : v > 0.12 ? 'D' : 'G';
    }
    rows.push(row);
  }
  return rows;
}

const BARK = '#997f69';

function trunkArt(dots, s, h, color) {
  const seg = (w, lift, ht, c = color) =>
    pxBox(dots, w, w, ht, c, { ...off(2, 2, 1 + w / 2, 1 + w / 2), lift, noise: 0.13 });

  seg(s * 1.2, 0, 1.5, shade(color, 0.82));
  const shaft = h - 5;
  seg(s, 1.5, shaft);
  seg(s * 1.28, h - 3.5, 3.5);

  const near = (s - 2) * 6 - 1.5;
  const groove = Array(shaft - 4).fill('B');
  for (const gx of [-Math.round(s * 7), Math.round(s * 5)]) {
    drawAscii(dots, groove, { B: shade(color, 0.62) }, { dx: gx, dy: near - Math.abs(gx) / 2 - 2 });
  }
}

const swaying = (art, originY) =>
  `<g class="sway" style="transform-origin:0px ${originY * 2}px">${art}</g>`;

const TREE_LOBES = [
  [20, 13.5, 10],
  [11.5, 8, 7.2],
  [28.5, 9, 6.6],
  [20, 6.3, 7],
  [7.5, 14.5, 6.2],
  [32.5, 14, 6.6],
  [12.5, 20, 6.4],
  [27.5, 20.5, 5.8],
  [20, 21.5, 5.5],
];

export const tree =
  sprite((dots) => trunkArt(dots, 0.4, 18, BARK)) +
  swaying(
    sprite((dots) =>
      drawAscii(
        dots,
        leafRows(40, 27, TREE_LOBES),
        { L: '#b0d391', G: '#96b97f', D: '#80a170', S: '#708862' },
        { dy: -22 },
      ),
    ),
    -25,
  );

const SAKURA_LOBES = [
  [20.5, 13, 9.5],
  [11, 8.5, 7],
  [30, 9, 7],
  [20.5, 6.4, 7.2],
  [6.5, 14, 5.8],
  [34.5, 13.5, 6],
  [12, 19.5, 6.2],
  [29, 19.5, 6],
  [20.5, 20.5, 5.6],
];

const petal = (dx, dy, dur, delay) =>
  `<g class="petal" style="animation-duration:${dur}s;animation-delay:${delay}s">${sprite((dots) =>
    drawAscii(dots, ['.pp.', 'PPPP', '.PP.'], { P: '#e5aac0', p: '#fad9e3' }, { dx, dy }),
  )}</g>`;

export const sakura =
  sprite((dots) => trunkArt(dots, 0.38, 19, '#8f7667')) +
  swaying(
    sprite((dots) =>
      drawAscii(
        dots,
        leafRows(41, 26, SAKURA_LOBES),
        { L: '#fce6ec', G: '#f3cbd7', D: '#e2aabc', S: '#d39ead' },
        { dy: -22 },
      ),
    ),
    -25,
  ) +
  petal(-11, -26, 4.6, -0.4) +
  petal(7, -21, 5.4, -2.7) +
  petal(-2, -31, 6.2, -4.1);

const GRASS = '#99b87c';

export const grass = sprite((dots) => {
  const p = P(1, 1);
  fillPoly(dots, [p(0, 0), p(1, 0), p(1, 1), p(0, 1)], speckle(GRASS, 0.16));

  for (const [c, r] of [[0.26, 0.32], [0.72, 0.52], [0.44, 0.84]]) {
    const [x, y] = p(c, r);
    drawAscii(dots, ['t...t', '.b.b.', '..B..'], { B: '#75956a', b: '#81a16d', t: '#b0d391' }, { dx: x, dy: y });
  }
});

const PETAL_COLORS = ['#e27589', '#efd17e', '#f5f0e7', '#b08dd4'];

export const flowers = sprite((dots) => {
  const p = P(1, 1);
  const spots = [[0.3, 0.28], [0.72, 0.36], [0.34, 0.74], [0.7, 0.72]];
  spots.forEach(([c, r], i) => {
    const [x, y] = p(c, r);
    drawAscii(dots, ['S', 'S', 'S', 'S', 'S'], { S: '#7f996d' }, { dx: x, dy: y });
    drawAscii(dots, ['l..l', 'll.l'], { l: '#8daf7b' }, { dx: x, dy: y - 1 });
    drawAscii(
      dots,
      ['.F.F.', 'FFFFF', 'FFYFF', 'FFFFF', '.F.F.'],
      { F: PETAL_COLORS[i], Y: '#fae2a2' },
      { dx: x, dy: y - 5 },
    );
  });
});

const octa = (p, m, q) =>
  [
    [m, m + q],
    [m + q, m],
    [2 - m - q, m],
    [2 - m, m + q],
    [2 - m, 2 - m - q],
    [2 - m - q, 2 - m],
    [m + q, 2 - m],
    [m, 2 - m - q],
  ].map(([c, r]) => p(c, r));
