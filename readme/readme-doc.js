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

// Non-ASCII names such as 사진.png keep only the extension, so fall back to "image" rather than a dotfile.
const cleanFileName = (s) => {
  const name = String(s || "").replace(/[^\w.-]+/g, "-").replace(/^-+/, "");
  const ext = name.match(/\.\w+$/)?.[0] ?? "";
  return name.slice(0, name.length - ext.length).replace(/-+$/, "") ? name : "image" + ext;
};

export function imageName(b) {
  return assetNames(b, "image", (x) => (x.file ? [cleanFileName(x.file.name)] : []))[0];
}

// Number repeated asset names across every block of one type, so no file in the zip overwrites another.
export function assetNames(b, type, namesOf) {
  const used = new Set();
  for (const x of allBlocks()) {
    if (x.type !== type) continue;
    const names = namesOf(x).map((want) => {
      let name = want;
      for (let n = 2; used.has(name); n++) name = want.replace(/(\.\w+)?$/, "-" + n + "$1");
      used.add(name);
      return name;
    });
    if (x === b) return names;
  }
  return namesOf(b);
}

export function ordinal(b, type, base) {
  let n = 0;
  for (const x of allBlocks()) {
    if (x.type === type) { n++; if (x === b) return n === 1 ? base + ".svg" : base + "-" + n + ".svg"; }
  }
  return base + ".svg";
}
