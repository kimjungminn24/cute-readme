import { makeGrid, drawAscii, toMarkup } from './pixel.js';
import { mix, shade } from './iso.js';
import { ACCESSORIES } from './catalog-person-face.js';

const choices = (entries) => Object.fromEntries(entries.map(([id, label, above = 0]) => [id, { label, above, art: [] }]));
export const MINI_HAIRS = choices([
  ['bob', 'Round bob'], ['short', 'Soft crop'], ['long', 'Long hair'],
  ['ponytail', 'Ponytail', 2], ['bun', 'Bun', 4], ['pigtails', 'Twin tails'],
  ['curly', 'Soft curls', 1], ['bald', 'No hair'],
]);
export const MINI_OUTFITS = choices([
  ['tee', 'T-shirt'], ['hoodie', 'Hoodie'], ['cardigan', 'Cardigan'],
  ['dress', 'Ribbon dress'], ['shirt', 'Shirt & tie'], ['overalls', 'Dungarees'],
  ['sweater', 'Striped knit'], ['blazer', 'Blazer'], ['track', 'Track jacket'],
  ['sailor', 'Sailor collar'], ['apron', 'Apron'], ['pajama', 'Star pajamas'],
  ['vest', 'Sweater vest'], ['coat', 'Long coat'],
]);
export const MINI_COLORS = { skin: '#f5d5be', hair: '#78564b', top: '#a9c9bb', bottom: '#8092ac' };
export const MINI_POSES = { stand: { label: 'Stand' }, sit: { label: 'Sit', sit: true }, back: { label: 'Back', back: true } };

const HEAD_TOP = -32;
export function miniHeight(p) {
  const hair = MINI_HAIRS[p?.hairStyle] ?? MINI_HAIRS.bob;
  return 31 + hair.above - (p?.pose === 'sit' ? 5 : 0);
}

// Grid coordinates are relative to the feet at y = -1.
export function miniGrid(p = {}) {
  const dots = makeGrid();
  const colors = Object.fromEntries(Object.entries(MINI_COLORS).map(([key, value]) => [key, p[key] ?? value]));
  const pal = {
    S: colors.skin, s: mix(colors.skin, '#b47868', .22), L: mix(colors.skin, '#fff6e9', .2),
    H: colors.hair, h: mix(colors.hair, '#fff1d8', .18), d: shade(colors.hair, .82),
    D: mix(colors.hair, '#332b35', .38),
    T: colors.top, t: shade(colors.top, .82), u: mix(colors.top, '#fff9e9', .35),
    B: colors.bottom, b: shade(colors.bottom, .77),
    E: '#44343c', W: '#fff7e9', R: mix(colors.skin, '#e7959e', .42),
    M: '#b77678', G: '#aaacb3', O: '#66545a', V: '#df7d91',
  };
  const hair = p.hairStyle in MINI_HAIRS ? p.hairStyle : 'bob';
  const outfit = p.outfit in MINI_OUTFITS ? p.outfit : 'tee';
  const pose = p.pose in MINI_POSES ? p.pose : 'stand';
  const sit = pose === 'sit';
  const back = pose === 'back';
  const lift = sit ? 5 : 0;
  const box = (x, y, w, h, color) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) dots.set(`${xx},${yy}`, pal[color] ?? color);
  };
  const stamp = (rows, x, y) => drawAscii(dots, rows, pal, { ax: 0, ay: 0, dx: x, dy: y });
  const headPoint = (x, y) => [x <= -4 ? x + 1 : x >= 4 ? x - 1 : x, y + (y <= -27 ? 1 : 0) + lift];
  const head = (rows, x, y, palette = pal, anchor = {}) => {
    const layer = makeGrid();
    drawAscii(layer, rows, palette, { ax: 0, ay: 0, dx: x, dy: y, ...anchor });
    for (const [key, color] of layer) {
      const [hx, hy] = headPoint(...key.split(',').map(Number));
      dots.set(`${hx},${hy}`, color);
    }
  };
  const hb = (x, y, w, h, color) => head(Array(h).fill(color.repeat(w)), x, y);

  if (hair === 'long' || hair === 'bob') {
    head([
      '....DDDDDDDDDD....',
      '..DDHHHHHHHHHHDD..',
      '.DHHHHHHHHHHHHHdD.',
      'DHHHHHHHHHHHHHHddD',
      'DHhHHHHHHHHHHHHddD',
      'DHhHHHHHHHHHHHHddD',
      'DHhHHHHHHHHHHHHddD',
      'DHhHHHHHHHHHHHHddD',
      'DHhHHHHHHHHHHHHddD',
      'DHhHHHHHHHHHHHHddD',
      'DHhHHHHHHHHHHHHddD',
      '.DHHHHHHHHHHHHddD.',
      '..DHHHHHHHHHHddD..',
      '...DDddddddddDD...',
    ], -9, -29);
    if (hair === 'long') {
      head([
        'DHhHHHHHHHHHHHHddD',
        'DHhHHHHHHHHHHHHddD',
        'DHhHHHHHHHHHHHHddD',
        'DHhHHHHHHHHHHHHddD',
        '.DHhHHHHHHHHHHddD.',
        '.DHhHHHHHHHHHHddD.',
        '..DHHHHHHHHHHddD..',
        '...DHHHHHHHHddD...',
        '....DDddddddDD....',
      ], -9, -19);
    }
  }
  if (hair === 'pigtails') {
    for (const x of [-12, 7]) {
      head(['.VVV.', '.DHD.', 'DHHhD', 'DHHhD', 'DHHdD', 'DHHdD', '.DHdD', '.DHd.', '..DD.'], x, -25);
    }
  }
  if (hair === 'ponytail') {
    head(['..DDD..', '.DHHhD.', 'DHHHhhD', 'DHhHHdD', '.DVVddD', '..DHddD', '..DHhdD', '..DHhdD', '..DHddD', '...Ddd.', '....D..'], 6, -33);
  }

  if (sit) {
    stamp(['.bbbbbbbbbb.', 'bBBBBBBBBBBb', 'bBBB....BBBb', 'bBBB....BBBb', '.EEE....EEE.'], -6, -5);
  } else {
    stamp(['..bBBBBBBb..', '..bBBbbBBb..', '..bBB..BBb..', '..bBB..BBb..', '..bBB..BBb..', '..sSS..SSs..', '..EEE..EEE..'], -6, -7);
  }
  const bodyY = -15 + lift;
  stamp(['....sSSs....', '...ttTTtt...', '.ttTTTTTTtt.', '..tTTTTTTt..', '..tTTTTTTt..', '..tTTTTTTt..', '..tTTTTTTt..', '..tttttttt..'], -6, bodyY);
  const detail = (rows, x = -4, dy = 2) => stamp(rows, x, bodyY + dy);
  if (outfit === 'hoodie') {
    detail(back ? ['.tttttt.', '.tTTTTt.', '..tttt..'] : ['.W....W.', '.W....W.', '........', '..tttt..', '..tTTt..'], -4, 1);
  }
  if (['cardigan', 'blazer', 'vest'].includes(outfit) && !back) {
    detail(['..WWWW..', '.tWWWWt.', '.TtWWtT.', '.TTWWTT.', '.TTWOTT.']);
    if (outfit === 'vest') detail(['WW....WW', 'WW....WW'], -4, 2);
    if (outfit === 'blazer') detail(['tTWWWWTt', 'tTtWWtTt', 'TTTWWTTT', 'uuTWOTuu'], -4, 2);
  }
  if (outfit === 'shirt' && !back) detail(['.WW..WW.', '..WBBW..', '...BB...', '...BB...', '...b....']);
  if (outfit === 'sweater') detail(['uuuuuuuu', 'TTTTTTTT', 'uuuuuuuu', 'TTTTTTTT']);
  if (outfit === 'track') detail(['W..W...W', 'W..W...W', 'W..W...W', 'W..W...W']);
  if (outfit === 'pajama') detail(['.W......', 'WWW...W.', '.W...WWW', '......W.']);
  if (outfit === 'sailor') detail(back ? ['WWWWWWWW', 'WBBBBBBW', 'WWWWWWWW'] : ['WW....WW', '.WW..WW.', '..WVWW..', '...V....']);
  if (outfit === 'overalls') detail(['.B....B.', '.B....B.', '.BWWWWB.', '.BBBBBB.', '.BBbbBB.', '.BBBBBB.']);
  if (outfit === 'apron') detail(['.W....W.', '.WWWWWW.', '.WWWWWW.', 'WWWWWWWW', 'WWWttWWW', 'WWWWWWWW']);
  if (outfit === 'dress' || outfit === 'coat') {
    detail(sit
      ? ['.tTTTTTTt.', 'tTTuTTuTTt', 'tttttttttt']
      : ['..tTTTTTTt..', '..tTTTTTTt..', '.tTTuTTuTTt.', '.tTTuTTuTTt.', 'tTTTuTTuTTTt', 'tTTTuTTuTTTt', 'tttttttttttt'], sit ? -5 : -6, 5);
    if (outfit === 'dress' && !back) detail(['..WWWW..', '...VV...', '..V..V..'], -4, 2);
    else if (!back) detail(['...Wt...', '...Wt...', '...Ot...', '...Wt...']);
    if (sit) box(-4, -4, 8, 1, 'T');
  }

  // Draw arms after clothing so trims do not overlap them.
  const longSleeve = ['hoodie', 'sweater', 'coat', 'cardigan', 'pajama', 'track', 'blazer', 'shirt'].includes(outfit);
  stamp(longSleeve ? ['.t', 'tT', 'tT', 'tT', 'tt', '.S', '.s'] : ['.t', 'tT', 'tt', '.L', '.S', '.s'], -6, bodyY + 2);
  if (sit) {
    stamp(['t.', 'Tt', 'tt', 'S.', 's.'], 4, bodyY + 2);
  } else {
    stamp(longSleeve ? ['t.', 'Tt', 'Tt', 'Tt', 'tt', 'S.', 's.'] : ['t.', 'Tt', 'tt', 'L.', 'S.', 's.'], 4, bodyY + 2);
  }

  head([
    '.....ssssss.....',
    '...ssSSSSSSss...',
    '..sSSSSSSSSSSs..',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSSSSSSSSs.',
    'sSLSSSSSSSSSSSss',
    'sSLSSSSSSSSSSSss',
    '.sLSSSSSSSSSSSs.',
    '.sSSSSSSSSSSSSs.',
    '..sSSSSSSSSSSs..',
    '...ssSSSSSSss...',
    '.....ssssss.....',
  ], -8, -29);

  if (hair !== 'bald') {
    head([
      '......DDDDDD......',
      '....DDHHHHHHDD....',
      '..DDHHHHHHHHHHDD..',
      '.DHHHhhhHHHHHHHdD.',
      '.DHhhhhhHHHHHHHddD',
      'DHhhHHHHHHHHHHHddD',
      'DHHHHHHHHHHHHHHddD',
      'DHHHHHHHHHHHHHHddD',
    ], -9, HEAD_TOP);
    if (back) {
      head(['DHHHHHHHHHHHHHHddD', 'DHHHHHHHHHHHHHHddD', '.DHhHHHHHHHHHHddD.', '.DHhHHHHHHHHHHddD.', '.DHhHHHHHHHHHHddD.', '..DHHHHHHHHHHddD..', '...DHHHHHHHHddD...', '....DDddddddDD....'], -9, -24);
    } else {
      head(['DHHHHHHHHHHddHHddD', '.DHHHHHHHdd..DHdd.', '.DHHHHHdd.....Ddd.', '..DHd..........d..'], -9, -24);
      if (hair === 'bob' || hair === 'long') {
        head(['DHh............ddD', 'DHh............ddD', '.DH............dD.', '..D............D..'], -9, -21);
      }
      if (hair === 'short') {
        hb(-6, -24, 8, 1, 'H'); hb(-5, -23, 4, 1, 'H'); hb(-5, -26, 3, 1, 'h');
      }
    }
  }
  if (hair === 'bun') head(['..DDDD..', '.DHHhhD.', 'DHHhhhHD', 'DHHHHHdD', '.DHHddD.', '..DDDD..'], -4, -36);
  if (hair === 'curly') {
    head(['..DDD..DDD..DDD..', '.DHhHDDHhHDDHhHD.', 'DHHHHHHHHHHHHHHHD', '.DHHHHHHHHHHHHHD.'], -8, -33);
    for (const x of [-11, 8]) head(['.DD.', 'DHHd', 'DHhd', '.DD.', 'DHHd', '.DD.'], x, -27);
  }

  if (!back) {
    const expression = p.expression;
    for (const x of [-3, 3]) {
      if (expression === 'sleepy' || (expression === 'wink' && x > 0)) hb(x - 1, -20, 2, 1, 'E');
      else { hb(x, -21, 1, 2, 'E'); }
    }
    hb(-5, -19, 2, 1, 'R'); hb(4, -19, 2, 1, 'R');
    if (expression === 'smile' || expression === 'wink') head(['M.M', '.M.'], -1, -18);
    else if (expression === 'surprised') head(['MM', 'MM'], -1, -19);
    else hb(0, -18, 1, 1, 'M');
  }
  const accId = p.accessory && p.accessory !== 'none' ? p.accessory : p.glasses ? 'glasses' : 'none';
  const acc = ACCESSORIES[accId];
  if (acc && !(back && acc.on === 'face')) {
    if (accId === 'glasses') head(['GGGGG..GGGGG', 'G...GGGG...G', 'GGGGG..GGGGG'], -6, -22);
    else {
      const art = Array.isArray(acc.art) ? acc.art : acc.art?.round;
      if (art) {
        const options = acc.on === 'hand'
          ? { ax: acc.grip[1], ay: acc.grip[0], dx: 5, dy: bodyY + 8 }
          : { dy: HEAD_TOP + lift - MINI_HAIRS[hair].above + 1 };
        if (acc.on === 'hand') drawAscii(dots, art, { ...pal, ...acc.palette }, options);
        else head(art, 0, 0, { ...pal, ...acc.palette }, { ...options, dy: options.dy - lift, ax: Math.floor(Math.max(...art.map(row => row.length)) / 2), ay: art.length });
      }
    }
  }
  return dots;
}

export const miniArt = (p) => toMarkup(miniGrid(p));
