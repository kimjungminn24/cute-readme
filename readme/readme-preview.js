import { $, app, BLOCKS, ui } from "./readme-shared.js";
import { rowMode, tightRow, markdown } from "./readme-markdown.js";

const viewsOf = (cell) => cell.filter((b) => BLOCKS[b.type]).map((b) => BLOCKS[b.type].view(b));

function fitMd() {
  const md = $("#md");
  if (!md.offsetParent) return;
  md.style.height = "auto";
  md.style.height = md.scrollHeight + "px";
}

export function showPane(markdownPane) {
  $("#preview").style.display = markdownPane ? "none" : "";
  $("#mdwrap").style.display = markdownPane ? "block" : "none";
  for (const [id, on] of [["#tabPrev", !markdownPane], ["#tabMd", markdownPane]]) {
    $(id).className = on ? "active" : "";
    $(id).setAttribute("aria-pressed", String(on));
  }
  if (markdownPane) fitMd();
}

// Match rowMd layouts, including text wrapping around floated images.
export function renderOut() {
  const prev = $("#preview");
  prev.innerHTML = "";
  for (const r of app.doc) {
    const mode = rowMode(r);

    if (mode === "single") {
      for (const el of viewsOf(r.cells[0])) prev.appendChild(el);
      continue;
    }

    if (mode === "pictures") {
      const line = document.createElement("div");
      line.className = "pics";
      for (const cell of r.cells) for (const el of viewsOf(cell)) line.appendChild(el);
      prev.appendChild(line);
      continue;
    }

    if (mode === "float-left" || mode === "float-right") {
      const left = mode === "float-left";
      const wrap = document.createElement("div");
      wrap.className = "floatrow";
      const side = document.createElement("div");
      side.className = left ? "side-l" : "side-r";
      for (const el of viewsOf(left ? r.cells[0] : r.cells[1])) side.appendChild(el);
      wrap.appendChild(side);
      for (const el of viewsOf(left ? r.cells[1] : r.cells[0])) wrap.appendChild(el);
      prev.appendChild(wrap);
      continue;
    }

    if (mode === "tight") {
      const line = document.createElement("div");
      line.className = "tightrow";
      const align = tightRow(r).align;
      line.style.justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
      for (const cell of r.cells) for (const el of viewsOf(cell)) line.appendChild(el);
      prev.appendChild(line);
      continue;
    }

    if (mode === "flank") {
      const wrap = document.createElement("div");
      wrap.className = "floatrow";
      for (const [i, side] of [[0, "side-l"], [2, "side-r"]]) {
        const holder = document.createElement("div");
        holder.className = side;
        for (const el of viewsOf(r.cells[i])) holder.appendChild(el);
        wrap.appendChild(holder);
      }
      for (const el of viewsOf(r.cells[1])) wrap.appendChild(el);
      prev.appendChild(wrap);
      continue;
    }

    const cols = document.createElement("div");
    cols.className = "cols";
    for (const cell of r.cells) {
      const col = document.createElement("div");
      for (const el of viewsOf(cell)) col.appendChild(el);
      cols.appendChild(col);
    }
    prev.appendChild(cols);
  }
  $("#md").value = markdown();
  fitMd();
}

ui.renderOut = renderOut;
