import { renderRoom, EMPTY_ROOM } from '../src/room.js';
import { clampScale, snapScale, SCALE_STOPS } from '../src/svg.js';

export const $ = (sel) => document.querySelector(sel);

export const SAVE_KEY = 'cute-readme-room';

export const app = {
  state: structuredClone(EMPTY_ROOM),
  persist: false,
};

export const ui = {};

const stage = $('#stage');


export function readSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist() {
  if (!app.persist) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(app.state));
  } catch {
    app.persist = false;
  }
}

export function syncRoom() {
  persist();
  ui.roomChanged?.();
}

export function render() {
  stage.innerHTML = renderRoom(app.state, { editable: true, title: 'preview' });
  ui.markHeld?.();
  syncRoom();
}

export function bindScaleSlider(el, out, set) {
  el.min = 0;
  el.max = SCALE_STOPS.length - 1;
  el.step = 1;

  el.oninput = () => {
    const i = Math.min(SCALE_STOPS.length - 1, Math.max(0, Math.round(Number(el.value)) || 0));
    set(SCALE_STOPS[i]);
  };

  return (scale) => {
    const s = clampScale(scale);
    el.value = SCALE_STOPS.indexOf(snapScale(s));
    out.textContent = `×${s}`;
    return s;
  };
}
