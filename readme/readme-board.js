import { $, app, BLOCKS, ui, cleanups, changed, refresh } from "./readme-shared.js";
import { ALIGNS } from "./readme-markdown.js";
import { detach, dropOnGap, dropOnBlock } from "./readme-doc.js";

function makeUi(card) {
  let rowEl = null;
  const put = (el) => (rowEl || card).appendChild(el);
  return {
    input(obj, key, ph) {
      const i = document.createElement("input");
      i.type = "text"; i.value = obj[key]; i.placeholder = ph || "";
      i.oninput = () => { obj[key] = i.value; changed(); };
      put(i);
    },
    area(obj, key, ph) {
      const t = document.createElement("textarea");
      t.value = obj[key]; t.placeholder = ph || "";
      t.oninput = () => { obj[key] = t.value; changed(); };
      put(t);
    },
    select(obj, key, opts, after) {
      const s = document.createElement("select");
      for (const [v, label] of opts) {
        const o = document.createElement("option");
        o.value = v; o.textContent = label; s.appendChild(o);
      }
      s.value = obj[key]; s.className = "slim";
      s.onchange = () => { obj[key] = isNaN(+s.value) ? s.value : +s.value; changed(); after?.(); };
      put(s);
    },
    number(obj, key) {
      const i = document.createElement("input");
      i.type = "number"; i.value = obj[key]; i.className = "slim";
      i.oninput = () => { obj[key] = +i.value || 0; changed(); };
      put(i);
    },
    range(obj, key, min, max, step = 1) {
      const i = document.createElement("input");
      i.type = "range"; i.min = min; i.max = max; i.step = step; i.value = obj[key];
      const out = document.createElement("output");
      out.textContent = obj[key];
      i.oninput = () => { obj[key] = +i.value; out.textContent = i.value; changed(); };
      put(i); put(out);
    },
    color(obj, key) {
      const i = document.createElement("input");
      i.type = "color"; i.value = obj[key];
      i.oninput = () => { obj[key] = i.value; changed(); };
      put(i);
    },
    label(text) {
      const s = document.createElement("span");
      s.className = "lbl"; s.textContent = text;
      put(s);
    },
    card: () => card,
    rowStart() { rowEl = document.createElement("div"); rowEl.className = "row"; card.appendChild(rowEl); },
    rowEnd() { rowEl = null; },
  };
}

let draggedId = null;

function clearMarks() {
  for (const el of document.querySelectorAll(".drop-top,.drop-bottom,.drop-left,.drop-right"))
    el.classList.remove("drop-top", "drop-bottom", "drop-left", "drop-right");
  for (const el of document.querySelectorAll(".gap.hot")) el.classList.remove("hot");
}

function sideOf(ev, el) {
  const r = el.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width;
  if (x < 0.25) return "left";
  if (x > 0.75) return "right";
  return (ev.clientY - r.top) / r.height < 0.5 ? "top" : "bottom";
}

function makeGap(index) {
  const g = document.createElement("div");
  g.className = "gap";
  g.ondragover = (ev) => { ev.preventDefault(); clearMarks(); g.classList.add("hot"); };
  g.ondragleave = () => g.classList.remove("hot");
  g.ondrop = (ev) => {
    ev.preventDefault(); clearMarks();
    if (draggedId) { dropOnGap(index, draggedId); refresh(); }
  };
  return g;
}

function makeCard(b) {
  const spec = BLOCKS[b.type] ?? { label: b.type, edit() {} };
  const card = document.createElement("div");
  card.className = "block";

  const bar = document.createElement("div");
  bar.className = "bar";
  const type = document.createElement("span");
  type.className = "type"; type.textContent = "⠿ " + spec.label;
  type.title = "Drag to move";
  type.draggable = true;
  type.ondragstart = (ev) => {
    draggedId = b.id; card.classList.add("dragging");
    ev.dataTransfer.setData("text/plain", b.id);
    ev.dataTransfer.effectAllowed = "move";
  };
  type.ondragend = () => { draggedId = null; card.classList.remove("dragging"); clearMarks(); };
  bar.appendChild(type);

  if ("align" in b) {
    for (const a of ALIGNS) {
      const btn = document.createElement("button");
      btn.textContent = a; btn.className = b.align === a ? "on" : "";
      btn.setAttribute("aria-pressed", String(b.align === a));
      btn.onclick = () => { b.align = a; refresh(); };
      bar.appendChild(btn);
    }
  }
  const del = document.createElement("button");
  del.textContent = "✕";
  del.setAttribute("aria-label", "Remove " + spec.label);
  del.onclick = () => { detach(b.id); refresh(); };
  bar.appendChild(del);
  card.appendChild(bar);
  spec.edit(b, makeUi(card));

  card.ondragover = (ev) => {
    if (!draggedId || draggedId === b.id) return;
    ev.preventDefault(); clearMarks();
    card.classList.add("drop-" + sideOf(ev, card));
  };
  card.ondragleave = () => card.classList.remove("drop-top", "drop-bottom", "drop-left", "drop-right");
  card.ondrop = (ev) => {
    ev.preventDefault(); clearMarks();
    if (draggedId) { dropOnBlock(b.id, sideOf(ev, card), draggedId); refresh(); }
  };
  return card;
}

export function renderBlocks() {
  for (const fn of cleanups) fn();
  cleanups.clear();
  const host = $("#blocks");
  host.innerHTML = "";
  if (!app.doc.length) {
    const d = document.createElement("div");
    d.id = "empty"; d.textContent = "add blocks from the bar above";
    host.appendChild(d);
  }
  host.appendChild(makeGap(0));
  app.doc.forEach((r, ri) => {
    const wrap = document.createElement("div");
    wrap.className = "rowwrap";
    for (const cell of r.cells) {
      const cellEl = document.createElement("div");
      cellEl.className = "cell";
      for (const b of cell) cellEl.appendChild(makeCard(b));
      wrap.appendChild(cellEl);
    }
    host.appendChild(wrap);
    host.appendChild(makeGap(ri + 1));
  });
}

ui.renderBlocks = renderBlocks;
