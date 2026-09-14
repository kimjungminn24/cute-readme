import { app, BLOCKS } from "./readme-shared.js";

export const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const brJoin = (s) => esc(s.trim()).split(/\n/).join("<br>");

export function texEscape(s) {
  return s.replace(/[\\{}$%&#_^~]/g, (c) => c === "\\" ? "\\textbackslash " : "\\" + c);
}

export const ALIGNS = ["left", "center", "right"];

export function alignAttr(b) {
  return b.align === "center" || b.align === "right" ? ' align="' + b.align + '"' : "";
}

export function picInline(b, extra = "") {
  const spec = BLOCKS[b.type];
  if (spec.inline) return spec.inline(b, extra);
  const one = spec.pic(b);
  if (!one) return "";
  const height = one.height ? ' height="' + one.height + '"' : "";
  return "<img " + extra + 'src="' + one.src + '" width="' + one.width + '"' + height + ' alt="' + esc(one.alt ?? "") + '">';
}

export function picMd(b) {
  const inner = picInline(b);
  if (!inner) return "";
  const at = alignAttr(b);
  if (inner.includes("\n")) return "<p" + at + ">\n  " + inner + "\n</p>";
  return at ? "<p" + at + ">" + inner + "</p>" : inner;
}

function cellMd(cell) { return cell.map((b) => BLOCKS[b.type]?.md(b) ?? "").join("\n\n"); }

const isPicture = (b) => !!BLOCKS[b.type]?.picture;
const canFloat = (cell) => cell.length === 1 && isPicture(cell[0]);
const isAllPictures = (cell) => cell.every(isPicture);

const lineOf = (cell) => (cell.length === 1 ? BLOCKS[cell[0].type]?.line?.(cell[0]) : null);

// Place inward-facing pictures inside the text tag to avoid floats at page edges.
export function tightRow(r) {
  if (r.cells.length < 2 || r.cells.length > 3) return null;
  const mid = r.cells.findIndex((cell) => !isAllPictures(cell));
  const line = mid < 0 ? null : lineOf(r.cells[mid]);
  if (!line) return null;

  const aim = { [mid - 1]: "right", [mid + 1]: "left" };
  const parts = [];
  for (const [i, cell] of r.cells.entries()) {
    if (i === mid) { parts.push(line.inner); continue; }
    if (!canFloat(cell) || cell[0].align !== aim[i]) return null;
    parts.push(picInline(cell[0]));
  }
  return { tag: line.tag, loose: !!line.loose, align: r.cells[mid][0].align, parts };
}

export function rowMode(r) {
  if (r.cells.length === 1) return "single";
  if (r.cells.every(isAllPictures)) return "pictures";
  if (tightRow(r)) return "tight";
  if (r.cells.length === 3 && canFloat(r.cells[0]) && canFloat(r.cells[2]) && !isAllPictures(r.cells[1]))
    return "flank";
  if (r.cells.length === 2 && canFloat(r.cells[0]) !== canFloat(r.cells[1]))
    return canFloat(r.cells[0]) ? "float-left" : "float-right";
  return "table";
}

function rowMd(r) {
  const mode = rowMode(r);
  if (mode === "single") return cellMd(r.cells[0]);

  if (mode === "pictures") {
    const tags = r.cells.flatMap((cell) => cell.map((b) => picInline(b))).filter(Boolean);
    return tags.length ? '<p align="center">\n  ' + tags.join("\n  ") + "\n</p>" : "";
  }

  if (mode === "float-left" || mode === "float-right") {
    const left = mode === "float-left";
    const side = (left ? r.cells[0] : r.cells[1])[0];
    const text = left ? r.cells[1] : r.cells[0];
    const tags = picInline(side, 'align="' + (left ? "left" : "right") + '" ');
    if (!tags) return cellMd(text);
    return tags + "\n\n" + cellMd(text) + '\n\n<br clear="both">';
  }

  if (mode === "tight") {
    const { tag, loose, align, parts } = tightRow(r);
    const open = "<" + tag + alignAttr({ align }) + ">";
    const body = parts.filter(Boolean).join(" ");
    // Blank lines inside the wrapper enable GitHub Markdown rendering.
    return loose ? open + "\n\n" + body + "\n\n</" + tag + ">" : open + body + "</" + tag + ">";
  }

  if (mode === "flank") {
    const left = picInline(r.cells[0][0], 'align="left" ');
    const right = picInline(r.cells[2][0], 'align="right" ');
    const middle = cellMd(r.cells[1]);
    if (!left && !right) return middle;
    return left + right + "\n\n" + middle + '\n\n<br clear="both">';
  }

  const width = Math.floor(100 / r.cells.length);
  const tds = r.cells.map((cell) =>
    '<td valign="top" width="' + width + '%">\n\n' + cellMd(cell) + "\n\n</td>").join("\n");
  return "<table>\n<tr>\n" + tds + "\n</tr>\n</table>";
}

export function markdown(doc = app.doc) {
  return doc.map(rowMd).join("\n\n") + "\n";
}
