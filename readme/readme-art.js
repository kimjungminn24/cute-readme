import { styleFor, STYLE as ROOM_CSS } from "../src/room.js";
import { FLOOR_ITEMS, WALL_ITEMS, EFFECTS, SKILLS, LINES } from "../src/catalog.js";

const ART_SETS = {
  lines: [LINES, (d) => d.art],
  items: [FLOOR_ITEMS, (d) => d.icon ?? d.art],
  effects: [EFFECTS, (d) => d.art],
  skills: [SKILLS, (d) => d.icon ?? d.art],
  wall: [WALL_ITEMS, (d) => d.art("right")],
};

const artPieces = new Map();
for (const [set, [entries, artOf]] of Object.entries(ART_SETS)) {
  for (const [id, def] of Object.entries(entries)) {
    artPieces.set(set + ":" + id, { key: set + ":" + id, set, name: def.name, markup: artOf(def), turn: !!def.turn, period: def.period });
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";
const MOTION_SAMPLES = 12;
const PROBE_PX = 200;
const artMoves = new Map();

// Sample animation frames to include motion in the exported viewBox.
function motionPad(markup, box) {
  const probe = document.createElementNS(SVG_NS, "svg");
  probe.setAttribute("width", PROBE_PX);
  probe.setAttribute("height", Math.round((PROBE_PX * box.h) / box.w));
  probe.setAttribute("viewBox", `${box.x} ${box.y} ${box.w} ${box.h}`);
  probe.style.cssText = "position:absolute;left:-9999px;top:0";
  probe.innerHTML = markup;
  document.body.append(probe);

  const plays = [];
  for (const el of probe.querySelectorAll("*")) plays.push(...el.getAnimations());

  const frame = probe.getBoundingClientRect();
  let out = 0;
  const widest = () => {
    for (const el of probe.children) {
      const r = el.getBoundingClientRect();
      out = Math.max(out, frame.left - r.left, frame.top - r.top, r.right - frame.right, r.bottom - frame.bottom);
    }
  };

  artMoves.set(markup, plays.length > 0);
  if (!plays.length) widest();
  else {
    for (let i = 0; i <= MOTION_SAMPLES; i++) {
      for (const play of plays) {
        const span = play.effect.getTiming().duration;
        play.currentTime = (i / MOTION_SAMPLES) * (typeof span === "number" ? span : 1000);
      }
      widest();
    }
  }
  probe.remove();
  return out > 0 ? (out / PROBE_PX) * box.w * 1.1 : 0;
}

const artBoxes = new Map();
function artBox(piece) {
  if (artBoxes.has(piece.key)) return artBoxes.get(piece.key);
  const g = document.createElementNS(SVG_NS, "g");
  g.innerHTML = piece.markup;
  const host = document.getElementById("measurer");
  host.append(g);
  const b = g.getBBox();
  g.remove();

  // Use the full tile period to preserve spacing between motifs.
  const box = piece.period
    ? { x: -piece.period / 2, y: b.y, w: piece.period, h: Math.max(b.height, 1) }
    : { x: b.x, y: b.y, w: Math.max(b.width, 1), h: Math.max(b.height, 1) };
  const pad = motionPad(piece.markup, box);
  const grown = pad
    ? { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 }
    : box;
  artBoxes.set(piece.key, grown);
  return grown;
}

export function mountArtCss() {
  const pageCss = document.createElement("style");
  pageCss.textContent = ROOM_CSS;
  document.head.append(pageCss);
}

const ART_FILE_PX = 128;
const PAGE_PX = 880;
export const fullPeriods = (px) => Math.max(1, Math.min(40, Math.round(PAGE_PX / Math.max(1, px))));
let artRun = 0;

export const roomArt = {
  sets: () => Object.keys(ART_SETS),
  of: (set) => [...artPieces.values()].filter((p) => p.set === set),
  name: (key) => artPieces.get(key)?.name ?? key,

  file: (key, repeat = 1, down = false) =>
    key.replace(":", "-") + (repeat > 1 ? (down ? "-y" : "-x") + repeat : "") + ".svg",

  svg(key, px, repeat = 1, down = false, full = false) {
    const piece = artPieces.get(key);
    if (!piece) return "";
    const box = artBox(piece);
    const n = Math.max(1, Math.min(40, Math.round(repeat) || 1));
    const view = box.x + " " + box.y + " " + box.w + " " + box.h;
    if (n === 1 && !full && !(down && piece.turn)) {
      const height = Math.round(px * (box.h / box.w) * 100) / 100;
      return '<svg width="' + px + '" height="' + height + '" viewBox="' + view +
        '" shape-rendering="crispEdges" aria-hidden="true">' + piece.markup + "</svg>";
    }
    // Copy animated art directly because SVG clones may not animate.
    const cols = down ? 1 : n;
    const rows = down ? n : 1;
    const moves = artMoves.get(piece.markup);
    const id = "a" + (artRun += 1);
    const inner = moves ? piece.markup : '<use href="#' + id + '"/>';
    const turned = down && piece.turn;
    const cw = turned ? box.h : box.w;
    const ch = turned ? box.w : box.h;
    const body = turned
      ? '<g transform="translate(' + box.h + " 0) rotate(90) translate(" + -box.x + " " + -box.y + ')">' + inner + "</g>"
      : inner;
    const cellView = turned ? "0 0 " + cw + " " + ch : view;
    const copies = [];
    for (let i = 0; i < n; i++) {
      copies.push('<svg x="' + (down ? 0 : i * cw) + '" y="' + (down ? i * ch : 0) +
        '" width="' + cw + '" height="' + ch + '" viewBox="' + cellView + '">' + body + "</svg>");
    }
    const defs = moves ? "" : '<defs><g id="' + id + '">' + piece.markup + "</g></defs>";
    const { w, h } = this.size(key, px, n, down, full);
    const dim = 'width="' + w + '"' + (h == null ? "" : ' height="' + h + '"');
    return '<svg ' + dim + ' viewBox="0 0 ' + cw * cols + " " + ch * rows +
      '" shape-rendering="crispEdges" aria-hidden="true">' + defs + copies.join("") + "</svg>";
  },

  size(key, px, repeat = 1, down = false, full = false) {
    const piece = artPieces.get(key);
    if (!piece) return { w: px, h: px };
    const box = artBox(piece);
    const n = Math.max(1, Math.min(40, Math.round(repeat) || 1));
    const turned = down && piece.turn;
    const cellW = turned ? px * (box.h / box.w) : px;
    const cellH = turned ? px : px * (box.h / box.w);
    if (full) return { w: "100%", h: null };
    const w = Math.round(cellW * (down ? 1 : n) * 100) / 100;
    const h = Math.round(cellH * (down ? n : 1) * 100) / 100;
    return { w, h };
  },

  doc(key, repeat = 1, down = false, full = false) {
    const body = this.svg(key, ART_FILE_PX, repeat, down, full);
    if (!body) return "";
    const css = styleFor(body);
    return body
      .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace(">", css ? "><style>" + css + "</style>" : ">");
  },
};
