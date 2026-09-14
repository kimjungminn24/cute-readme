import { BLOCKS, refresh } from "./readme-shared.js";
import { esc, picMd } from "./readme-markdown.js";
import { roomArt, fullPeriods } from "./readme-art.js";

const stickerSize = (b) => Math.min(400, Math.max(16, Number(b.size) || 64));
// For full-width strips, size controls the number of repetitions.
const stickerCount = (b) => (stickerFull(b)
  ? fullPeriods(stickerSize(b))
  : Math.min(40, Math.max(1, Math.round(Number(b.repeat)) || 1)));
const stickerDown = (b) => b.flow === "down";
const stickerFull = (b) => b.type === "line" && !stickerDown(b);
const stickerDims = (b) => roomArt.size(b.art, stickerSize(b), stickerCount(b), stickerDown(b), stickerFull(b));

const stickerKind = (kind) => ({
  label: kind.label,
  fresh: kind.fresh,

  edit(b, ui) {
    const card = ui.card();
    const row = document.createElement("div");
    row.className = "badge-row";
    const chosen = document.createElement("div");
    chosen.className = "sticker-row";
    chosen.style.flex = "1";
    const swap = document.createElement("button");
    const picker = document.createElement("div");
    picker.className = "art-pick";
    picker.hidden = !!b.art;

    const syncSwap = () => {
      swap.textContent = b.art ? "Change" : "Pick one";
      swap.classList.toggle("on", !picker.hidden);
    };

    const drawChosen = () => {
      chosen.innerHTML = "";
      if (!b.art) {
        const none = document.createElement("span");
        none.className = "mini-status";
        none.textContent = "none yet";
        chosen.append(none);
        return;
      }
      const chip = document.createElement("span");
      chip.className = "sticker-chip";
      chip.title = roomArt.name(b.art);
      chip.innerHTML = roomArt.svg(b.art, 30);
      const name = document.createElement("span");
      name.className = "mini-status";
      name.textContent = roomArt.name(b.art);
      chosen.append(chip, name);
    };

    const drawPicker = () => {
      picker.innerHTML = "";
      for (const set of roomArt.sets().filter(kind.sets)) {
        const label = document.createElement("div");
        label.className = "art-set";
        label.textContent = set;
        picker.append(label);
        for (const piece of roomArt.of(set)) {
          const tile = document.createElement("button");
          tile.className = "art-tile";
          tile.title = piece.name;
          tile.setAttribute("aria-label", piece.name);
          tile.innerHTML = roomArt.svg(piece.key, 34);
          tile.onclick = () => {
            b.art = piece.key;
            picker.hidden = true;
            refresh();
          };
          picker.append(tile);
        }
      }
    };

    swap.onclick = () => {
      picker.hidden = !picker.hidden;
      if (!picker.hidden && !picker.childElementCount) drawPicker();
      syncSwap();
    };

    row.append(chosen, swap);
    card.append(row, picker);
    drawChosen();
    syncSwap();
    if (!picker.hidden) drawPicker();
    ui.rowStart();
    ui.label("size");
    ui.range(b, "size", 16, 400, 2);
    if (kind.run) {
      ui.select(b, "flow", [["across", "across"], ["down", "down"]], refresh);
      if (stickerDown(b)) {
        ui.label("line");
        ui.number(b, "repeat");
      }
    }
    ui.rowEnd();
  },

  picture: true,
  pic: (b) => {
    if (!b.art) return null;
    const dims = stickerDims(b);
    return {
      src: "assets/stickers/" + roomArt.file(b.art, stickerCount(b), stickerDown(b)),
      width: dims.w,
      height: dims.h ?? undefined,
      alt: esc(roomArt.name(b.art)),
    };
  },
  md: (b) => picMd(b),

  view(b) {
    const p = document.createElement("p");
    p.style.textAlign = b.align;
    if (!b.art) {
      p.className = "mini-status";
      p.textContent = kind.label + ": pick one to see it here";
      return p;
    }
    const slot = document.createElement("span");
    slot.className = "sticker-out" + (stickerFull(b) ? " full" : "");
    slot.innerHTML = roomArt.svg(b.art, stickerSize(b), stickerCount(b), stickerDown(b), stickerFull(b));
    p.append(slot);
    return p;
  },

  files: (b) => (b.art
    ? [{
      name: "assets/stickers/" + roomArt.file(b.art, stickerCount(b), stickerDown(b)),
      data: roomArt.doc(b.art, stickerCount(b), stickerDown(b), stickerFull(b)),
    }]
    : []),
});

BLOCKS.sticker = stickerKind({
  label: "sticker",
  sets: (set) => set !== "lines",
  run: false,
  fresh: () => ({ align: "center", size: 64, art: null }),
});

BLOCKS.line = stickerKind({
  label: "line",
  sets: (set) => set === "lines",
  run: true,
  fresh: () => ({ align: "center", size: 72, repeat: 4, flow: "across", art: null }),
});
