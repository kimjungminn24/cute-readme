const WEATHERS = {
  none: { name: 'None' },
  sakura: {
    name: 'Sakura',
    count: 36,
    fall: [7, 12],
    sway: [2.2, 3.6],
    drift: 14,
    art: (i) => {
      const c = i % 3 === 0 ? '#ff9ec4' : i % 3 === 1 ? '#ffc0d9' : '#ffe0ec';

      return `<path fill="${c}" d="M0 0h4v2h-2v2h-2z"/>`;
    },
  },
  snow: {
    name: 'Snow',
    count: 46,
    fall: [9, 16],
    sway: [3.4, 5.2],
    drift: 8,
    art: (i) => (i % 4 === 0
      ? `<path fill="#ffffff" d="M0 0h4v4h-4z"/>`
      : `<path fill="#f2f7ff" d="M0 0h2v2h-2z"/>`),
  },
  rain: {
    name: 'Rain',
    count: 52,
    fall: [2.8, 4.4],
    sway: null,
    drift: 0,
    art: () => `<path fill="#8fc2e8" d="M0 0h2v8h-2z"/>`,
  },
  leaves: {
    name: 'Autumn Leaves',
    count: 30,
    fall: [6.5, 11],
    sway: [2.4, 3.8],
    drift: 16,
    art: (i) => {
      const c = ['#e8853c', '#d4552f', '#d9b23a', '#a8703c'][i % 4];

      return `<path fill="${c}" d="M2 0h4v4h-2v2h-4v-4h2z"/>`;
    },
  },
  hearts: {
    name: 'Hearts',
    count: 20,
    fall: [8, 13],
    sway: [2.6, 4],
    drift: 10,
    art: (i) => {
      const c = i % 3 === 0 ? '#ff5f8f' : i % 3 === 1 ? '#ff8fb3' : '#ffb8cf';

      return `<path fill="${c}" d="M0 0h4v2h2v-2h4v4h-2v2h-2v2h-2v-2h-2v-2h-2z"/>`;
    },
  },
  fireflies: {
    name: 'Fireflies',
    count: 18,
    fall: null,
    sway: [3, 5],
    drift: 10,
    blink: [1.6, 2.8],
    art: (i) => (i % 3 === 0
      ? `<path fill="#ffe08a" d="M0 0h4v4h-4z"/>`
      : `<path fill="#d8e86a" d="M0 0h2v2h-2z"/>`),
  },
  bubbles: {
    name: 'Bubbles',
    count: 22,
    fall: [7, 12],
    sway: [2.2, 3.6],
    drift: 10,
    rise: true,
    art: (i) => (i % 4 === 0
      ? `<path fill="#bfe8f2" d="M0 0h2v2h-2z"/>`

      : `<path fill="#bfe8f2" d="M2 0h4v2h-4zM0 2h2v4h-2zM6 2h2v4h-2zM2 6h4v2h-4z"/><path fill="#eafcff" d="M2 2h2v2h-2z"/>`),
  },
};

export const DEFAULT_WEATHER = 'none';

export const WEATHER_STYLES = Object.fromEntries(
  Object.entries(WEATHERS).map(([id, w]) => [id, w.name]),
);

function rnd(i, k) {
  let h = Math.imul(i + 1, 374761393) + Math.imul(k + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function weather(id, geo) {
  const w = WEATHERS[id];
  if (!w?.art) return { css: '', markup: '' };

  const pick = (i, k, [lo, hi]) => +(lo + rnd(i, k) * (hi - lo)).toFixed(2);

  const drop = geo.height + 24;

  let markup = '';
  for (let i = 0; i < w.count; i++) {
    const x = Math.round(rnd(i, 1) * geo.width);

    const y = Math.round(rnd(i, 6) * geo.height) - 12;
    let inner = w.sway
      ? `<g class="wx" style="animation-duration:${pick(i, 4, w.sway)}s;animation-delay:${-(rnd(i, 5) * 3).toFixed(2)}s">${w.art(i)}</g>`
      : w.art(i);
    if (w.blink) inner = `<g class="wb" style="animation-duration:${pick(i, 7, w.blink)}s;animation-delay:${-(rnd(i, 8) * 4).toFixed(2)}s">${inner}</g>`;

    markup += w.fall
      ? `<g transform="translate(${x} ${y})"><g class="wy" style="animation-duration:${pick(i, 2, w.fall)}s">${inner}</g></g>`
      : `<g transform="translate(${x} ${y})">${inner}</g>`;
  }

  const css = `
  .wy { animation-name: wfall; animation-timing-function: linear; animation-iteration-count: infinite; }
  .wx { animation-name: wsway; animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-direction: alternate; }
  @keyframes wfall {
    from { transform: translateY(0); opacity: 0; }
    10% { opacity: 1; }
    85% { opacity: 1; }
    to { transform: translateY(${w.rise ? -drop : drop}px); opacity: 0; }
  }
  @keyframes wsway { from { transform: translateX(-${w.drift}px); } to { transform: translateX(${w.drift}px); } }${w.blink ? `
  .wb { animation-name: wblink; animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-direction: alternate; }
  @keyframes wblink { from { opacity: 0.1; } to { opacity: 1; } }` : ''}
  @media (prefers-reduced-motion: reduce) { .wy, .wx${w.blink ? ', .wb' : ''} { animation: none; } }`;

  return { css, markup: `<g class="weather" aria-hidden="true">${markup}</g>` };
}
