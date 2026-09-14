import { sprite, pxBox, drawAscii } from './pixel.js';
import { P } from './catalog-base.js';

export const teddy = sprite((dots) => {
  drawAscii(
    dots,
    [
      '.BB.....BB.',
      'BBBB...BBBB',
      'BBBBBBBBBBB',
      'BBEBBBBBEBB',
      'BBpBBBBBpBB',
      'BBBBmmmBBBB',
      'BBBBmnmBBBB',
      '.BBBBBBBBB.',
      '...BBBBB...',
      'bBBBBBBBBBb',
      'bBBBmmmBBBb',
      'bBBBmmmBBBb',
      '.bbb...bbb.',
    ],
    { B: '#c29e79', b: '#a7886a', E: '#3a3944', p: '#e5a8a0', m: '#e7d3b5', n: '#826d5c' },
  );
});

export const mushroom = sprite((dots) => {
  drawAscii(
    dots,
    [
      '...RRR...',
      '..RRRRR..',
      '.RwRRRwR.',
      'RRRRRwRRR',
      'RRwRRRRRR',
      '.rrrrrrr.',
      '...SSS...',
      '...SSS...',
      '...sss...',
    ],
    { R: '#d2796f', r: '#b46d65', w: '#f7f1e9', S: '#f0e7d7', s: '#d3c8b3' },
  );
});

export const snowman = sprite((dots) => {
  drawAscii(
    dots,
    [
      '....WWW....',
      '...WWWWW...',
      '...WEWEW...',
      '...WWoWW...',
      '....WWW....',
      '...SSSSS...',
      't.WWWWWWW.t',
      '.tWWWbWWWt.',
      '.WWWWWWWWW.',
      '.WWWWbWWWW.',
      '.WWWWWWWWW.',
      '.wWWWbWWWw.',
      '..wwwwwww..',
    ],
    { W: '#f6f6f6', w: '#d1d7dc', E: '#3a3944', o: '#e9a76a', b: '#79757a', t: '#987c63', S: '#cc7d7a' },
  );
});

export const donut = sprite((dots) => {
  drawAscii(
    dots,
    [
      '...PPPPP...',
      '..PPPwPPP..',
      '.PPyPPPgPP.',
      '.PPP...PPP.',
      '.OPP...PPO.',
      '.OOPPPPPOO.',
      '..OOOOOOO..',
      '...ooooo...',
    ],
    { P: '#ebaec1', y: '#fae2a2', g: '#b0d7ad', w: '#f7f1e9', O: '#e7ceaf', o: '#d3bb99' },
  );
});

export const bunny = sprite((dots) => {
  drawAscii(
    dots,
    [
      '..WW...WW..',
      '.WpW...WpW.',
      '.WpW...WpW.',
      '.WpW...WpW.',
      '..WWWWWWW..',
      '.WWEWWWEWw.',
      '.WWWWpWWWw.',
      '..WWWWWWw..',
      '.WWWWWWWWw.',
      '.WWWWWWWWw.',
      '..ww...ww..',
    ],
    { W: '#f5efe7', w: '#d3cbbd', p: '#ebaec1', E: '#3a3944' },
  );
});

export const penguin = sprite((dots) => {
  drawAscii(
    dots,
    [
      '..EEEEEEE..',
      '.EEEEEEEEe.',
      '.EEWEWEWEe.',
      '.EEWEWEWEe.',
      '.EEWoooWEe.',
      '.EWWWWWWWe.',
      'EEWWWWWWWEe',
      'EEWWWWWWWEe',
      '.EWWWWWwEe.',
      '..EEWWWEe..',
      '..oo...oo..',
    ],
    { E: '#3a3944', e: '#2c2b34', W: '#f5f0e7', w: '#dcd5c8', o: '#ebb676' },
  );
});

export const gift = sprite((dots) => {
  drawAscii(
    dots,
    [
      '..RR...RR..',
      '.R..RRR..R.',
      '..RRRRRRR..',
      'PPPPPRPPPPP',
      'PPPPPRPPPPp',
      '.PPPPRPPPp.',
      '.PPPPRPPPp.',
      '.PPPPRPPPp.',
      '.pppppppp..',
    ],
    { P: '#ebaec1', p: '#d09fad', R: '#c56f6b' },
  );
});

export const dog =
  sprite((dots) => drawAscii(dots, ['..cc', '.cc.', 'cc..', 'cc..', 'ccc.'], { c: '#d3bb99' }, { dx: 7, dy: -2 }), 'tail') +
  sprite((dots) =>
    drawAscii(
      dots,
      [
        '.BB....BB.',
        'BBBB..BBBB',
        'BBBCCCCBBB',
        'BBBCCCCBBB',
        'BBBECCEBBB',
        'BBBCCCCBBB',
        '.BBCnnCBB.',
        '..CCttCC..',
        '.CCCCCCCC.',
        'CCCCCCCCCC',
        'CCCCCCCCCC',
        '.CC.CC.CC.',
      ],
      { B: '#a7886a', C: '#efe1cc', E: '#3a3944', n: '#473932', t: '#e097a4' },
      { dy: -1 },
    ),
  );

export const ducky = sprite((dots) => {
  drawAscii(
    dots,
    [
      '...YYYY....',
      '..YYYYYY...',
      '..YEYYYY...',
      '.ooYYYYY...',
      '..oYYYY....',
      '...YYYY...Y',
      '..YYYYYY.YY',
      '.YYYYYYYYYy',
      '.YYyyyYYYYy',
      '..yyyyyyyy.',
    ],
    { Y: '#f2da7e', y: '#d2b86c', o: '#eaae6b', E: '#3a3944' },
  );
});

export const frog = sprite((dots) => {
  drawAscii(
    dots,
    [
      '.GG.....GG.',
      'GEEG...GEEG',
      'GGGGGGGGGGG',
      'GGGGGGGGGGg',
      'GGmGGGGGmGg',
      'GpGmmmmmGpg',
      'GGGWWWWWGGg',
      '.GGWWWWWGg.',
      '.GGGGGGGGg.',
      '.ggg...ggg.',
    ],
    { G: '#a1c983', g: '#87a76c', m: '#68805b', W: '#f3eed6', E: '#3a3944', p: '#ebaec1' },
  );
});

export const dino = sprite((dots) => {
  drawAscii(
    dots,
    [
      '....W.W....',
      '.DDDDDDDD..',
      '.DDDDDDDDd.',
      '.DEDDDDEDd.',
      '.DDDmmDDDd.',
      '.DWWWWWWDd.',
      '.DWWWWWWDd.',
      '.DWWWWWWDdD',
      '.DWWWWWWDdD',
      '.DDWWWWDDd.',
      '.dd.....dd.',
    ],
    { D: '#85bba4', d: '#739d8a', W: '#f0e7d0', E: '#3a3944', m: '#6b8d7b' },
  );
});

export const ghost = sprite((dots) => {
  drawAscii(
    dots,
    [
      '...WWWWW...',
      '..WWWWWWW..',
      '.WWWWWWWWw.',
      '.WWEWWWEWw.',
      '.WpWWWWWpw.',
      '.WWWWoWWWw.',
      '.WWWWWWWWw.',
      '.WWWWWWWWw.',
      '.WWWWWWWWw.',
      '.W.WW.WW.w.',
    ],
    { W: '#f2eef4', w: '#c5c0d3', E: '#3a3944', o: '#3a3944', p: '#ebaec1' },
    { dy: -5 },
  );
}, 'fx-bob');
