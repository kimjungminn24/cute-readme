import './editor-board.js';
import './editor-panels.js';
import { renderRoom, DEMO_ROOM, EMPTY_ROOM } from '../src/room.js';
import { normalizeRoom } from './editor-core.js';
import { $, app, ui, render, readSaved } from './editor-shared.js';

const embedded = window.parent !== window;


function loadRoom(next) {
  const state = normalizeRoom(next);
  renderRoom(state, { editable: true, title: 'preview' });
  app.state = state;
  render();
  ui.patternPalette();
  ui.syncTheme();
  ui.syncSize();
  ui.syncPerson();
  ui.drawTextRows();
}

function armed(btn, label, action) {
  let timer = 0;
  return () => {
    if (!timer) {
      btn.textContent = 'Really? (click again)';
      timer = setTimeout(() => {
        btn.textContent = label;
        timer = 0;
      }, 2500);
      return;
    }
    clearTimeout(timer);
    timer = 0;
    btn.textContent = label;
    action();
  };
}

$('#demo').onclick = armed($('#demo'), 'Load demo', () => loadRoom(structuredClone(DEMO_ROOM)));

$('#reset').onclick = armed($('#reset'), 'Reset room', () => {
  // Preserve link settings when resetting the room.
  const kept = { links: app.state.links };
  if (app.state.linkScale !== undefined) kept.linkScale = app.state.linkScale;
  loadRoom({ ...structuredClone(EMPTY_ROOM), ...kept });
});

if (embedded) {
  document.body.classList.add('embedded');
  render();
  ui.syncSize();
  ui.drawTextRows();
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.data?.type !== 'room-load') return;
    if (e.data.room) {
      // Only report changes once the room has loaded, or an empty editor would overwrite the saved room.
      try {
        loadRoom(e.data.room);
      } catch (err) {
        ui.roomChanged = null;
        console.error(err);
        alert('This room could not be opened, so the editor will leave it as it is.');
        return;
      }
    }
    ui.roomChanged = () => window.parent.postMessage({ type: 'room-change', room: app.state }, location.origin);
    ui.roomChanged();
  });
  window.parent.postMessage({ type: 'room-ready' }, location.origin);
} else {
  app.persist = true;
  const saved = readSaved();
  try {
    loadRoom(saved ?? structuredClone(DEMO_ROOM));
  } catch {
    loadRoom(structuredClone(DEMO_ROOM));
  }
}
