import { app, uid } from "./readme-shared.js";

export function row(...blocks) {
  return { id: uid(), cells: [blocks.map((b) => ({ id: uid(), ...b }))] };
}

export function allBlocks() {
  const out = [];
  for (const r of app.doc) for (const cell of r.cells) out.push(...cell);
  return out;
}

export function findBlock(id) {
  for (const r of app.doc) for (const cell of r.cells) {
    const i = cell.findIndex((b) => b.id === id);
    if (i >= 0) return { row: r, cell, i };
  }
  return null;
}

export function detach(id) {
  const loc = findBlock(id);
  const [b] = loc.cell.splice(loc.i, 1);
  for (const r of app.doc) r.cells = r.cells.filter((c) => c.length);
  app.doc = app.doc.filter((r) => r.cells.length);
  return b;
}

export function dropOnGap(gapIndex, id) {
  const loc = findBlock(id);
  const emptiesRow = loc.row.cells.length === 1 && loc.cell.length === 1;
  const rowIndex = app.doc.indexOf(loc.row);
  const b = detach(id);
  let at = gapIndex;
  if (emptiesRow && rowIndex < gapIndex) at--;
  app.doc.splice(at, 0, { id: uid(), cells: [[b]] });
}

export function dropOnBlock(targetId, side, id) {
  if (targetId === id) return;
  const b = detach(id);
  const t = findBlock(targetId);
  if (!t) { app.doc.push({ id: uid(), cells: [[b]] }); return; }
  if (side === "left" || side === "right") {
    if (t.row.cells.length >= 3) { t.cell.splice(t.i + 1, 0, b); }
    else {
      const at = t.row.cells.indexOf(t.cell) + (side === "right" ? 1 : 0);
      t.row.cells.splice(at, 0, [b]);
    }
    return;
  }
  t.cell.splice(t.i + (side === "bottom" ? 1 : 0), 0, b);
}

export function imageName(b) {
  const clean = (s) => (s || "image").replace(/[^\w.-]+/g, "-").replace(/^-+/, "");
  const want = clean(b.file.name);
  let n = 0;
  for (const x of allBlocks()) {
    if (x.type !== "image" || !x.file || clean(x.file.name) !== want) continue;
    n++;
    if (x === b) return n === 1 ? want : want.replace(/(\.\w+)?$/, "-" + n + "$1");
  }
  return want;
}

export function ordinal(b, type, base) {
  let n = 0;
  for (const x of allBlocks()) {
    if (x.type === type) { n++; if (x === b) return n === 1 ? base + ".svg" : base + "-" + n + ".svg"; }
  }
  return base + ".svg";
}
