export const ACCESSORIES = {
  none: { label: 'None' },

  glasses: {
    label: 'Glasses',
    on: 'face',
    art: {
      chibi: [
        '....GGGG........GGGG....',
        '...G....G......G....G...',
        '...G....GGGGGGGG....G...',
        '...G....G......G....G...',
        '....GGGG........GGGG....',
      ],
      round: [
        '...GG..GG...',
        '...GEGGEG...',
        '...GG..GG...',
      ],

      square: [
        '..GGG..GGG..',
        '..GEEGGEEG..',
        '..GGG..GGG..',
      ],

      stick: ['....GEGEG...'],
    },
  },

  crown: {
    label: 'Crown',
    on: 'head',
    palette: { A: '#e9ce81', a: '#fcf2c0', j: '#c56f6b' },
    art: {
      chibi: [
        '......A.....A.....A.....',
        '......AA...AAA...AA.....',
        '......AAAaAAAAAaAAA.....',
        '......AAAAAAAAAAAAA.....',
        '......AjAAAAAjAAAjA.....',
        '......AAAAAAAAAAAAA.....',
      ],
      round: [
        '.....AA.....',
        '..AA.AA.AA..',
        '..AaaaaaaA..',
        '..AjAAAAjA..',
      ],
      square: [
        '.....AA.....',
        '..AA.AA.AA..',
        '..AaaaaaaA..',
        '..AjAAAAjA..',
      ],

      stick: [
        '......A.....',
        '...A..A..A..',
        '...aaaaaaa..',
        '...AjAAAjA..',
      ],
    },
  },

  wand: {
    label: 'Wand',
    on: 'hand',
    grip: [5, 0],
    palette: { A: '#987c63', a: '#f9d97b', s: '#fcf2c0' },
    art: [
      '.s.',
      'sas',
      '.s.',
      '.A.',
      '.A.',
      'A..',
    ],
  },

  sword: {
    label: 'Sword',
    on: 'hand',

    grip: [5, 1],
    palette: { A: '#987c63', a: '#dddfe4', s: '#f4f4f6', g: '#c4a269' },
    art: [
      '.s.',
      '.a.',
      '.a.',
      '.a.',
      'ggg',
      '.A.',
      '.A.',
    ],
  },

  catEars: {
    label: 'Cat Ears',
    on: 'head',
    palette: { C: '#786a62', c: '#8f7f75', p: '#e097a4' },
    art: {
      // Minimi: 16 wide, drawn straight onto the head so the ears stay symmetric.
      pixel: [
        '...CC......CC...',
        '...CcC....CcC...',
        '...CcpC..CpcC...',
        '..CcppC..CppcC..',
        '..CcC......CcC..',
        '..CC........CC..',
      ],
      chibi: [
        '....C.............C.....',
        '...CcC...........CcC....',
        '..CcpcC.........CcpcC...',
        '..CCCCC.........CCCCC...',
      ],
      round: [
        '..C......C..',
        '..Cc....cC..',
        '..CpC..CpC..',
        '..CCC..CCC..',
      ],
      square: [
        '..C......C..',
        '..Cc....cC..',
        '..CpC..CpC..',
        '..CCC..CCC..',
      ],
      stick: [
        '...C....C...',
        '...Cc..cC...',
        '...Cp..pC...',
        '...CC..CC...',
      ],
    },
  },
};

export const DEFAULT_ACCESSORY = 'none';

export const EXPRESSIONS = {
  normal: { label: 'Normal' },

  smile: {
    label: 'Smile',
    art: {
      chibi: { mouth: ['.........M....M.........', '..........MMMM..........'] },
      round: { mouth: '..LRMMMMRs..' },
      square: { mouth: '..SMMMMMMS..' },
      stick: { mouth: '.....EEE....' },
    },
  },

  wink: {
    label: 'Wink',
    art: {
      chibi: {
        eyes: [
          '......EE........SS......',
          '......EE........SS......',
          '......EE........EE......',
          '......EE........SS......',
        ],
        mouth: ['.........M....M.........', '..........MMMM..........'],
      },
      round: { eyes: ['...SESSEE...'], mouth: '..LRMMMMRs..' },
      square: { eyes: ['..WEESSSEW..'], mouth: '..SMMMMMMS..' },
      stick: { eyes: ['.....E.EE...'] },
    },
  },

  surprised: {
    label: 'Surprised',
    art: {
      chibi: {
        eyes: [
          '.....EEE.......EEE......',
          '.....EWE.......EWE......',
          '.....EWE.......EWE......',
          '.....EEE.......EEE......',
        ],
        mouth: ['...........MM...........', '...........MM...........'],
      },
      round: { eyes: ['...EESSEE...', '...EESSEE...'], mouth: '..LRSMSSRs..' },
      square: { eyes: ['..WEESSEEW..', '..WEESSEEW..'], mouth: '..SSSMMSSS..' },
      stick: { eyes: ['....EE.EE...', '....EE.EE...'], mouth: '......E.....' },
    },
  },

  sleepy: {
    label: 'Sleepy',
    art: {
      chibi: {
        eyes: [
          '......SS........SS......',
          '......SS........SS......',
          '......EE........EE......',
          '......EE........EE......',
        ],
        mouth: ['...........MM...........'],
      },
      round: { eyes: ['...EESSEE...'], mouth: '..LRSMSSRs..' },
      square: { eyes: ['..WEEEEEEW..'], mouth: '..SSSMMSSS..' },
      stick: { eyes: ['....EE.EE...'] },
    },
  },
};

export const DEFAULT_EXPRESSION = 'normal';

export const EXPRESSION_STYLES = Object.fromEntries(
  Object.entries(EXPRESSIONS).map(([id, e]) => [id, e.label]),
);

const PERSON_SIZES = {
  small: { label: 'Small', scale: 0.75 },
  normal: { label: 'Normal', scale: 1 },
  big: { label: 'Big', scale: 1.3 },
};

const DEFAULT_SIZE = 'normal';

export const SIZE_STYLES = Object.fromEntries(
  Object.entries(PERSON_SIZES).map(([id, v]) => [id, v.label]),
);

export const personScale = (p) => (PERSON_SIZES[p?.size] ?? PERSON_SIZES[DEFAULT_SIZE]).scale;

export const ACCESSORY_STYLES = Object.fromEntries(
  Object.entries(ACCESSORIES).map(([id, a]) => [id, a.label]),
);
