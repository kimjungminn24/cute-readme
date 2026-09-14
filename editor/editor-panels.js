import {
  WEATHER_STYLES, DEFAULT_WEATHER, ROOM_SKINS, clampGrid, geometry,
  TEXT_STYLES, DEFAULT_TEXT_STYLE, TEXT_ANIMS, DEFAULT_TEXT_ANIM,
} from '../src/room.js';
import { clampScale } from '../src/svg.js';
import {
  POSE_STYLES, SHAPE_STYLES, DEFAULT_SHAPE,
  hairsForShape, outfitsForShape, shapeUsesOutfit, ACCESSORY_STYLES, EXPRESSION_STYLES, SIZE_STYLES,
  PERSON_ANIMS, DEFAULT_PERSON_ANIM, DEFAULT_PERSON, personArt, personHeight,
} from '../src/catalog.js';
import { fitToGrid } from './editor-core.js';
import { $, app, ui, render, bindScaleSlider } from './editor-shared.js';

let lastPerson = null;

function person() {
  if (!app.state.person) app.state.person = { ...DEFAULT_PERSON };
  return app.state.person;
}

function removePerson() {
  if (!app.state.person) return false;
  lastPerson = app.state.person;
  app.state.person = null;
  syncPerson();
  render();
  return true;
}

function restorePerson() {
  app.state.person = { ...(lastPerson ?? DEFAULT_PERSON) };
  syncPerson();
  render();
}

const weatherSelect = $('#t-weather');
weatherSelect.innerHTML = Object.entries(WEATHER_STYLES)
  .map(([id, name]) => `<option value="${id}">${name}</option>`)
  .join('');
weatherSelect.onchange = () => {
  if (weatherSelect.value === DEFAULT_WEATHER) delete app.state.weather;
  else app.state.weather = weatherSelect.value;
  render();
};

function syncTheme() {
  const wall = app.state.theme.wall ?? ROOM_SKINS[0].wall;
  const floor = app.state.theme.floor ?? ROOM_SKINS[0].floor;
  $('#t-wall').value = wall;
  $('#t-floor').value = floor;
  weatherSelect.value = app.state.weather ?? DEFAULT_WEATHER;
}

const bindings = [
  ['#t-wall', (v) => (app.state.theme.wall = v)],
  ['#t-floor', (v) => (app.state.theme.floor = v)],
];
for (const [sel, set] of bindings) {
  const el = $(sel);

  el.oninput = () => { set(el.value); syncTheme(); ui.patternPalette(); render(); };
}
syncTheme();

const rsCols = $('#rs-cols');
const rsRows = $('#rs-rows');
const rsScale = $('#rs-scale');

const roomScale = () => clampScale(app.state.scale ?? 1);

const syncScale = bindScaleSlider(rsScale, $('#rs-scale-out'), (s) => {
  if (s === 1) delete app.state.scale;
  else app.state.scale = s;
  syncSize();
  render();
});

function syncSize() {
  const { cols, rows } = (app.state.grid = clampGrid(app.state.grid));
  const s = roomScale();
  const geo = geometry(app.state.grid);

  rsCols.value = cols;
  rsRows.value = rows;
  $('#rs-cols-out').textContent = cols;
  $('#rs-rows-out').textContent = rows;
  syncScale(s);
  $('#rs-size').textContent =
    `room.svg comes out ${Math.round(geo.width * s)} × ${Math.round(geo.height * s)} px`
    + `: ${geo.width} × ${geo.height} drawing at ×${s}`;
}

for (const [el, key] of [[rsCols, 'cols'], [rsRows, 'rows']]) {
  el.oninput = () => {
    app.state.grid = clampGrid({ ...app.state.grid, [key]: Number(el.value) });
    fitToGrid(app.state);
    syncSize();
    drawTextRows();
  };
}

const TONES = {
  skin: ['#f7dcc3', '#e8b88a', '#d99b6c', '#b97a4e', '#8d5524', '#5b3a22'],
  hair: ['#20191a', '#4a3320', '#7a4b21', '#c08a3e', '#e6cf8b', '#a33b3b', '#3f5aa8', '#8a5aa8', '#d8d8d8'],
  top: ['#3aa0a8', '#4a5ba8', '#c23b3b', '#d97757', '#e0b23c', '#5aa84a', '#8a5aa8', '#f2ede2', '#3a3a44'],
  bottom: ['#4a5ba8', '#3a3a44', '#6b5b45', '#2f6b57', '#8a3b52', '#b8862e', '#7a7f8a', '#e2ddd0', '#20232a'],
};

const MINI_FRAMES = { head: ['-28 -80 56 56', 42, 42], body: ['-30 -82 60 86', 45, 65], preview: ['-30 -82 60 86', 150, 215] };
const framesFor = () => MINI_FRAMES;

const boxed = (art, [box, w, h]) =>
  `<svg width="${w}" height="${h}" viewBox="${box}" shape-rendering="crispEdges" aria-hidden="true">${art}</svg>`;

const CHIPS = [
  ['#p-shapes', 'shape', () => SHAPE_STYLES, 'body'],
  ['#p-hairs', 'hairStyle', hairsForShape, 'head'],
  ['#p-outfits', 'outfit', outfitsForShape, 'body', shapeUsesOutfit],

  ['#p-poses', 'pose', () => POSE_STYLES, 'body'],

  ['#p-faces', 'expression', () => EXPRESSION_STYLES, 'head'],
  ['#p-accs', 'accessory', () => ACCESSORY_STYLES, 'body'],
  ['#p-sizes', 'size', () => SIZE_STYLES, 'body'],
];

const shapeOf = (p) => (p?.shape in SHAPE_STYLES ? p.shape : DEFAULT_SHAPE);

const animSelect = $('#p-anim');
animSelect.innerHTML = Object.entries(PERSON_ANIMS)
  .map(([id, a]) => `<option value="${id}">${a.label}</option>`)
  .join('');
animSelect.onchange = () => { person().anim = animSelect.value; render(); };

let chipsShape = null;

function drawChips(shape) {
  for (const [sel, key, table, , shows] of CHIPS) {
    const el = $(sel);
    el.innerHTML = '';
    el.closest('.chip-row').hidden = shows ? !shows(shape) : false;
    for (const [id, label] of Object.entries(table(shape))) {
      const b = document.createElement('button');
      b.type = 'button';
      b.title = label;
      b.setAttribute('aria-label', label);
      b.dataset.id = id;
      b.onclick = () => {
        const p = person();
        p[key] = id;

        if (key === 'shape' && !(p.hairStyle in hairsForShape(id))) {
          p.hairStyle = Object.keys(hairsForShape(id))[0];
        }
        if (key === 'shape' && !(p.outfit in outfitsForShape(id))) {
          p.outfit = Object.keys(outfitsForShape(id))[0];
        }
        syncPerson();
        render();
      };
      el.append(b);
    }
  }
  chipsShape = shape;
}

for (const [key, colors] of Object.entries(TONES)) {
  for (const color of colors) {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = color;
    b.setAttribute('aria-label', `${key} ${color}`);
    b.dataset.key = key;
    b.dataset.color = color;
    b.style.background = color;
    b.onclick = () => { person()[key] = color; syncPerson(); render(); };
    $(`#p-${key}-dots`).append(b);
  }
  const el = $(`#p-${key}`);
  el.oninput = () => { person()[key] = el.value; syncPerson(); render(); };
}

function syncPerson() {
  const here = !!app.state.person;
  const p = app.state.person ?? DEFAULT_PERSON;
  $('.person-stage').classList.toggle('gone', !here);
  $('#p-remove').textContent = here ? '✕ Remove' : '+ Add back';
  $('#p-flip').disabled = !here;
  $('#p-preview').innerHTML = boxed(personArt(p), framesFor(p).preview);

  const shape = shapeOf(p);
  if (shape !== chipsShape) drawChips(shape);

  const onePen = shape === 'stick';
  for (const key of ['skin', 'hair', 'bottom']) $(`#p-${key}`).closest('.tone').hidden = onePen;
  $('#p-top').closest('.tone').querySelector('span').textContent = onePen ? 'Color' : 'Top';

  for (const [sel, key, , frame] of CHIPS) {
    for (const b of $(sel).children) {
      const chip = { ...p, [key]: b.dataset.id, flip: false };
      b.innerHTML = boxed(personArt(chip), framesFor(key === 'shape' ? chip : p)[frame]);
      b.classList.toggle('on', (key === 'shape' ? shapeOf(p) : p[key] ?? DEFAULT_PERSON[key]) === b.dataset.id);
    }
  }

  for (const key of Object.keys(TONES)) {
    const v = p[key] ?? DEFAULT_PERSON[key];
    $(`#p-${key}`).value = v;
    for (const d of $(`#p-${key}-dots`).children) {
      d.classList.toggle('on', d.dataset.color === v);
      d.setAttribute('aria-pressed', String(d.dataset.color === v));
    }
  }

  animSelect.value = p.anim ?? DEFAULT_PERSON_ANIM;
  $('#p-flip').setAttribute('aria-pressed', String(!!p.flip));
}

$('#p-remove').onclick = () => {
  if (!removePerson()) restorePerson();
};

$('#p-flip').onclick = () => { person().flip = !person().flip; syncPerson(); render(); };

syncPerson();

const textRows = $('#text-rows');
const textList = () => (app.state.texts ??= []);

function styleSelect(table, current, fallback, onPick) {
  const sel = document.createElement('select');
  sel.innerHTML = Object.entries(table)
    .map(([id, def]) => {
      const on = id === (current ?? fallback) ? ' selected' : '';
      return `<option value="${id}"${on}>${def.label}</option>`;
    })
    .join('');
  sel.onchange = () => onPick(sel.value);
  return sel;
}

function textRow(t, i) {
  const row = document.createElement('div');
  row.className = 'text-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'b-text';
  input.maxLength = 40;
  input.placeholder = 'hello~';
  input.value = t.text ?? '';

  input.oninput = () => { t.text = input.value; render(); };

  const at = document.createElement('span');
  at.className = 'b-at';
  at.textContent = `${t.col},${t.row}`;

  const style = styleSelect(TEXT_STYLES, t.style, DEFAULT_TEXT_STYLE, (v) => { t.style = v; render(); });
  style.title = 'style';
  const anim = styleSelect(TEXT_ANIMS, t.anim, DEFAULT_TEXT_ANIM, (v) => { t.anim = v; render(); });
  anim.title = 'motion';

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'l-del';
  del.textContent = '✕';
  del.title = 'remove text';
  del.onclick = () => { textList().splice(i, 1); drawTextRows(); };

  row.append(input, at, style, anim, del);
  return row;
}

function drawTextRows() {
  textRows.innerHTML = '';
  textList().forEach((t, i) => textRows.append(textRow(t, i)));
  render();
}

$('#text-add').onclick = () => {
  const p = app.state.person ?? DEFAULT_PERSON;
  const { cols, rows } = app.state.grid;
  textList().push({
    text: 'hello~',
    col: Math.min(cols - 1, (p.col ?? 0) + 1),
    row: Math.min(rows - 1, p.row ?? 0),
    style: DEFAULT_TEXT_STYLE,
    anim: DEFAULT_TEXT_ANIM,
  });
  drawTextRows();
  textRows.lastElementChild?.querySelector('.b-text')?.select();
};

ui.syncTheme = syncTheme;
ui.syncSize = syncSize;
ui.syncPerson = syncPerson;
ui.removePerson = removePerson;
ui.drawTextRows = drawTextRows;
