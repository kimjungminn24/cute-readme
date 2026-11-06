import "./readme-blocks.js";
import "./readme-stickers.js";
import "./readme-embeds.js";
import "./readme-music.js";
import "./readme-about.js";
import "./readme-board.js";
import { showPane } from "./readme-preview.js";
import { $, app, BLOCKS, load, forget, refresh, flash, copyText } from "./readme-shared.js";
import { row, allBlocks } from "./readme-doc.js";
import { markdown } from "./readme-markdown.js";
import { mountArtCss } from "./readme-art.js";
import { makeZip } from "../src/zip.js";

const PALETTE = [
  "heading", "text", "banner", "image", "list", "divider", "spacer",
  "sticker", "line", "miniroom", "links", "repocards", "music", "about",
];

app.doc = load() ?? [
  row({ type: "heading", level: 1, text: "Hi there, I am ...", align: "center" }),
  row({ type: "text", align: "left", text: "I build small things that work." }),
];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
for (const type of PALETTE) {
  const btn = document.createElement("button");
  btn.textContent = "+ " + cap(BLOCKS[type].label);
  btn.onclick = () => {
    app.doc.push(row({ type, ...BLOCKS[type].fresh() }));
    refresh();
  };
  $("#palette").append(btn);
}

$("#tabPrev").onclick = () => showPane(false);
$("#tabMd").onclick = () => showPane(true);

$("#copyBtn").onclick = async () => {
  const ok = await copyText(markdown());
  flash($("#copyBtn"), ok ? "Copied!" : "Copy failed", "Copy markdown");
};

$("#resetBtn").onclick = () => {
  if (!confirm("Throw away the current document?")) return;
  forget();
  location.reload();
};

const DL_LABEL = "Download README.md";
$("#dlBtn").onclick = async () => {
  const dl = $("#dlBtn");
  const files = [];
  dl.disabled = true;
  dl.textContent = "Packing…";
  try {
    for (const b of allBlocks()) {
      const make = BLOCKS[b.type]?.files;
      if (!make) continue;
      for (const f of await make(b)) if (!files.some((x) => x.name === f.name)) files.push(f);
    }
  } catch (e) {
    dl.disabled = false;
    dl.textContent = DL_LABEL;
    alert("Could not build one of the images: " + e.message);
    return;
  }
  dl.disabled = false;
  const a = document.createElement("a");
  if (!files.length) {
    a.href = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown" }));
    a.download = "README.md";
  } else {
    a.href = URL.createObjectURL(makeZip([{ name: "README.md", data: markdown() }, ...files]));
    a.download = "cute-readme.zip";
  }
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
  flash(dl, "Saved " + a.download + (files.length ? " (README.md + " + files.length + " files)" : ""), DL_LABEL, 1600);
};

const topBar = $("#top");
new ResizeObserver(() => {
  document.documentElement.style.setProperty("--top-h", topBar.offsetHeight + "px");
}).observe(topBar);

mountArtCss();
refresh();
