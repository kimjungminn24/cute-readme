export const $ = (s) => document.querySelector(s);
export const uid = () => Math.random().toString(36).slice(2, 9);

export const SAVE_KEY = "cute-readme";
const OLD_SAVE_KEY = "readme-decorator";

export const app = { doc: [] };

export const BLOCKS = {};

export const ui = {};

// Release listeners and animation frames when block cards are rebuilt.
export const cleanups = new Set();

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(OLD_SAVE_KEY);
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

// Migrate saved documents to the current block schema.
export function migrate(v) {
  if (!Array.isArray(v) || !v.length) return null;
  const rows = v[0].cells ? v : v.map((b) => ({ id: uid(), cells: [[b]] }));
  for (const r of rows) {
    r.cells = r.cells
      .map((c) => c.filter((b) => b.type !== "badges").flatMap(splitStickers).map(asLine))
      .filter((c) => c.length);
  }
  const kept = rows.filter((r) => r.cells.length);
  return kept.length ? kept : null;
}

function asLine(b) {
  if (b.type !== "sticker") return b;
  if (String(b.art).startsWith("lines:") || Number(b.repeat) > 1) b.type = "line";
  return b;
}

function splitStickers(b) {
  if (b.type !== "stickers") return [b];
  const art = (b.items ?? [])
    .map((it) => (it.kind ? (it.kind === "art" ? it.value : null) : it.art))
    .filter(Boolean);
  return art.map((key) => ({ id: uid(), type: "sticker", align: b.align ?? "center", size: 64, art: key }));
}

let saveWarned = false;
export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(app.doc));
    saveWarned = false;
  } catch {
    if (saveWarned) return;
    saveWarned = true;
    alert("too big to keep: download it now, a reload will lose the last change");
  }
}

export function forget() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(OLD_SAVE_KEY);
  } catch {}
}

export function changed() {
  save();
  ui.renderOut?.();
}

export function refresh() {
  ui.renderBlocks?.();
  save();
  ui.renderOut?.();
}

export function flash(btn, text, back, ms = 1200) {
  btn.textContent = text;
  clearTimeout(btn._flash);
  btn._flash = setTimeout(() => { btn.textContent = back; }, ms);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("aria-hidden", "true");
    ta.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}
