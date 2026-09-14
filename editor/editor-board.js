import {
  geometry, gridCell,
  wallSwatch, WALL_STYLES, DEFAULT_WALL_STYLE,
  floorSwatch, FLOOR_STYLES, DEFAULT_FLOOR_STYLE,
} from '../src/room.js';
import { FLOOR_ITEMS, WALL_ITEMS, EFFECTS, SKILLS } from '../src/catalog.js';
import { topItemAt, stackLift, moveToPoint, cellAtPoint } from './editor-core.js';
import { $, app, ui, render } from './editor-shared.js';

let tool = null;

const stage = $('#stage');
const measurer = $('#measurer');

function icon(art, size = 44) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = art;
  measurer.append(g);
  const b = g.getBBox();
  g.remove();

  const side = Math.max(b.width, b.height, 1) * 1.12;
  const x = b.x + b.width / 2 - side / 2;
  const y = b.y + b.height / 2 - side / 2;
  return `<svg width="${size}" height="${size}" viewBox="${x} ${y} ${side} ${side}" shape-rendering="crispEdges" aria-hidden="true">${art}</svg>`;
}

function toolButton(el, art, name, t) {
  const b = document.createElement('button');
  b.type = 'button';
  b.title = name;
  b.setAttribute('aria-label', name);

  if (art) b.innerHTML = icon(art);
  else { b.classList.add('label'); b.textContent = name; }
  b.onclick = () => selectTool(t, b);
  el.append(b);
}

function palette(el, entries, type, artOf = (def) => def.icon ?? def.art) {
  for (const [id, def] of Object.entries(entries)) toolButton(el, artOf(def), def.name, { type, id });
}

function selectTool(t, btn) {
  tool = t;
  drop();

  document.querySelectorAll('.tools button:not(.swatch)').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

palette($('#tools-item'), FLOOR_ITEMS, 'item');

palette($('#tools-item'), EFFECTS, 'effect');
palette($('#tools-wall'), WALL_ITEMS, 'wall', (def) => def.art('right'));
palette($('#tools-skill'), SKILLS, 'skill');

const PATTERN_GROUPS = [
  {
    label: 'Wall',
    styles: WALL_STYLES,
    key: 'wallStyle',
    fallback: DEFAULT_WALL_STYLE,
    swatch: wallSwatch,
    color: () => app.state.theme.wall,
  },
  {
    label: 'Floor',
    styles: FLOOR_STYLES,
    key: 'floorStyle',
    fallback: DEFAULT_FLOOR_STYLE,
    swatch: floorSwatch,
    color: () => app.state.theme.floor,
  },
];

function patternPalette() {
  const el = $('#tools-pattern');
  el.innerHTML = '';

  for (const group of PATTERN_GROUPS) {
    const head = document.createElement('p');
    head.className = 'tool-row-label';
    head.textContent = group.label;
    el.append(head);

    const cur = app.state.theme[group.key] ?? group.fallback;
    for (const [id, def] of Object.entries(group.styles)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.title = def.name;
      b.setAttribute('aria-label', `${def.name} ${group.label.toLowerCase()}`);
      b.setAttribute('aria-pressed', String(id === cur));
      b.classList.toggle('active', id === cur);
      b.innerHTML = group.swatch(id, group.color());
      b.onclick = () => {
        app.state.theme[group.key] = id;
        render();
        patternPalette();
      };
      el.append(b);
    }
  }
}
patternPalette();

for (const [name, type] of [
  ['Move', 'move'],
  ['Erase', 'erase'],
  ['Flip', 'flip'],
]) {
  toolButton($('#tools-edit'), null, name, { type });
}

const tabs = [...document.querySelectorAll('#tabs button')];

const groups = [...document.querySelectorAll('#toolbox > [data-tab]')];

function showTab(name) {
  for (const b of tabs) {
    const on = b.dataset.tab === name;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  }
  for (const g of groups) g.classList.toggle('active', g.dataset.tab === name);
}
for (const b of tabs) b.onclick = () => showTab(b.dataset.tab);
showTab('item');

function clickCell(c, r) {
  if (!tool) return;
  const { cols, rows } = app.state.grid;

  if (tool.type === 'item') {
    const def = FLOOR_ITEMS[tool.id];
    const col = Math.min(c, cols - Math.ceil(def.fc));
    const row = Math.min(r, rows - Math.ceil(def.fr));

    const lift = stackLift(app.state.items, col, row);
    app.state.items.push(lift ? { id: tool.id, col, row, lift } : { id: tool.id, col, row });
  } else if (tool.type === 'wall') {
    app.state.wallItems.push({ id: tool.id, wall: 'floor', col: c, row: r });
  } else if (tool.type === 'effect') {
    app.state.effects.push({ id: tool.id, col: c, row: r });
  } else if (tool.type === 'skill') {
    (app.state.skills ??= []).push({ id: tool.id, col: c, row: r });
  } else if (tool.type === 'erase') {
    const texts = app.state.texts ??= [];
    const b = texts.findIndex((f) => f.col === c && f.row === r);
    if (b >= 0) { texts.splice(b, 1); return ui.drawTextRows(); }
    for (const list of [app.state.skills ?? [], app.state.effects]) {
      const i = list.findIndex((f) => f.col === c && f.row === r);
      if (i >= 0) { list.splice(i, 1); return render(); }
    }

    if (app.state.person?.col === c && app.state.person?.row === r) return ui.removePerson();
    const idx = topItemAt(app.state.items, c, r);
    if (idx >= 0) app.state.items.splice(idx, 1);
  } else if (tool.type === 'flip') {
    if (app.state.person && app.state.person.col === c && app.state.person.row === r) {
      app.state.person.flip = !app.state.person.flip;
    } else {
      const idx = topItemAt(app.state.items, c, r);
      if (idx >= 0) app.state.items[idx].flip = !app.state.items[idx].flip;
    }
  }
  render();
}

function clickWall(wall, u) {
  if (!tool) return;
  if (tool.type === 'wall') {
    app.state.wallItems.push({ id: tool.id, wall, u });
  } else if (tool.type === 'erase') {
    const idx = app.state.wallItems.findIndex((w) => w.wall === wall && w.u === u);
    if (idx >= 0) app.state.wallItems.splice(idx, 1);
  }
  render();
}

const KIND_LISTS = {
  item: () => app.state.items,
  effect: () => app.state.effects,
  skill: () => app.state.skills,
  text: () => app.state.texts,
  wallItem: () => app.state.wallItems,
};

function spriteAt(e) {
  for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
    const g = el.closest?.('[data-kind]');
    if (!g || !stage.contains(g)) continue;
    const kind = g.dataset.kind;
    if (kind === 'person') return app.state.person ? { obj: app.state.person, kind } : null;
    const obj = KIND_LISTS[kind]?.()?.[Number(g.dataset.idx)];
    if (obj) return { obj, kind };
  }
  return null;
}

function eraseSprite({ obj, kind }) {
  if (kind === 'person') return ui.removePerson();
  const list = KIND_LISTS[kind]?.();
  const i = list?.indexOf(obj) ?? -1;
  if (i < 0) return false;
  list.splice(i, 1);
  if (kind === 'text') ui.drawTextRows();
  else render();
  return true;
}

function flipSprite({ obj, kind }) {
  if (kind !== 'item' && kind !== 'person') return false;
  obj.flip = !obj.flip;
  if (kind === 'person') ui.syncPerson();
  render();
  return true;
}

function clickAt(e) {
  if (tool?.type === 'move') return moveClick(e);

  if (tool?.type === 'erase' || tool?.type === 'flip') {
    const hit = spriteAt(e);
    if (hit && (tool.type === 'erase' ? eraseSprite(hit) : flipSprite(hit))) return;
  }

  const cell = e.target.closest('[data-cell]');
  if (cell) {
    const [c, r] = cell.dataset.cell.split(',').map(Number);
    return clickCell(c, r);
  }
  const wall = e.target.closest('[data-wall]');
  if (wall) clickWall(wall.dataset.wall, Number(wall.dataset.u));
}

const SLOP = 4;

let drag = null;

function svgPoint(e) {
  const m = stage.querySelector('svg')?.getScreenCTM();
  return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : null;
}

function pick(e) {
  const hit = spriteAt(e);
  if (hit) {
    if (hit.kind === 'wallItem') {
      if (hit.obj.wall !== 'floor') return { obj: hit.obj, wall: true };
    }

    const p = svgPoint(e);
    const cell = p ? cellAtPoint(app.state.items, p, geometry(app.state.grid), hit.obj) : null;
    return {
      obj: hit.obj,
      kind: hit.kind,
      def: hit.kind === 'item' ? FLOOR_ITEMS[hit.obj.id] : null,
      dc: cell ? Math.floor(cell.c) - (hit.obj.col ?? 0) : 0,
      dr: cell ? Math.floor(cell.r) - (hit.obj.row ?? 0) : 0,
    };
  }

  const wallEl = e.target.closest('[data-wall]');
  if (wallEl) {
    const wall = wallEl.dataset.wall;
    const u = Number(wallEl.dataset.u);
    const obj = app.state.wallItems.find((w) => w.wall === wall && w.u === u);
    return obj ? { obj, kind: 'wallItem', wall: true } : null;
  }

  const cellEl = e.target.closest('[data-cell]');
  if (!cellEl) return null;
  const [c, r] = cellEl.dataset.cell.split(',').map(Number);

  for (const kind of ['text', 'skill', 'effect']) {
    const obj = (KIND_LISTS[kind]() ?? []).find((f) => f.col === c && f.row === r);
    if (obj) return { obj, kind, dc: 0, dr: 0 };
  }
  if (app.state.person?.col === c && app.state.person?.row === r) {
    return { obj: app.state.person, kind: 'person', dc: 0, dr: 0 };
  }
  const idx = topItemAt(app.state.items, c, r);
  if (idx < 0) return null;
  const obj = app.state.items[idx];

  return { obj, kind: 'item', def: FLOOR_ITEMS[obj.id], dc: c - obj.col, dr: r - obj.row };
}

function moveTo(e, t) {
  const p = svgPoint(e);
  return p ? moveToPoint(app.state, p, t) : false;
}

let held = null;

function markHeld() {
  if (!held) return;
  const i = KIND_LISTS[held.kind]?.()?.indexOf(held.obj);
  const sel = held.kind === 'person' ? '[data-kind="person"]' : `[data-kind="${held.kind}"][data-idx="${i}"]`;
  stage.querySelector(sel)?.classList.add('held');
}

function drop() {
  if (!held) return false;
  held = null;
  stage.classList.remove('holding');
  render();
  return true;
}

function moveClick(e) {
  if (held) {
    const t = held;
    const moved = moveTo(e, t);
    drop();
    if (moved && t.kind === 'text') ui.drawTextRows();
    return;
  }

  const got = pick(e);
  if (!got) return;

  held = { ...got, dc: 0, dr: 0 };
  stage.classList.add('holding');
  render();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') drop();
});

stage.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const picked = pick(e);
  if (picked) drag = { ...picked, x0: e.clientX, y0: e.clientY, moved: false };
});

function endDrag() {
  drag = null;
  stage.classList.remove('dragging');
}

stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  if (!(e.buttons & 1)) return endDrag();
  if (!drag.moved) {
    if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < SLOP) return;
    drag.moved = true;
    drop();

    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
  }
  if (moveTo(e, drag)) render();
});

stage.addEventListener('pointerup', (e) => {
  const moved = drag?.moved;

  const wasText = moved && (app.state.texts ?? []).includes(drag.obj);
  endDrag();
  if (!moved) clickAt(e);
  else if (wasText) ui.drawTextRows();
});

stage.addEventListener('pointercancel', endDrag);

ui.patternPalette = patternPalette;
ui.markHeld = markHeld;
