import {
  renderAboutCard, ABOUT_THEMES, ABOUT_ICONS, DEFAULT_ABOUT_THEME, DEFAULT_ABOUT_ROWS,
} from "../src/aboutcard.js";
import { readDotFont } from "../src/dotfont.js";
import { BLOCKS, ui as shared, changed } from "./readme-shared.js";
import { esc, picMd } from "./readme-markdown.js";
import { ordinal } from "./readme-doc.js";

let dotFont = null;
let dotAsked = false;
function wantDotFont() {
  if (dotAsked) return;
  dotAsked = true;
  fetch("./assets/galmuri11.dot")
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((buf) => { dotFont = readDotFont(buf); shared.renderOut?.(); })
    .catch(() => {});
}

const MAX_ROWS = 8;

const cardOpts = (b) => {
  wantDotFont();
  return { theme: b.theme, title: b.title, width: b.width, frame: b.frame !== "none", typing: b.typing === "on", dots: dotFont };
};

BLOCKS.about = {
  label: "about me",
  fresh: () => ({
    title: "about me", theme: DEFAULT_ABOUT_THEME, frame: "window", typing: "off", width: 460, align: "center",
    rows: DEFAULT_ABOUT_ROWS.map((r) => ({ ...r })),
  }),

  edit(b, ui) {
    const card = ui.card();
    ui.rowStart();
    ui.input(b, "title", "title");
    ui.select(b, "theme", Object.entries(ABOUT_THEMES).map(([id, t]) => [id, t.label]));
    ui.select(b, "frame", [["window", "window"], ["none", "text only"]]);
    ui.select(b, "typing", [["off", "still text"], ["on", "typing"]]);
    ui.number(b, "width");
    ui.rowEnd();

    const list = document.createElement("div");
    const draw = () => {
      list.innerHTML = "";
      b.rows.forEach((r, i) => {
        const line = document.createElement("div");
        line.className = "badge-row";
        const icon = document.createElement("select");
        icon.setAttribute("aria-label", "Icon");
        for (const id of Object.keys(ABOUT_ICONS)) {
          const o = document.createElement("option");
          o.value = id; o.textContent = id; icon.appendChild(o);
        }
        icon.value = r.icon;
        icon.onchange = () => { r.icon = icon.value; changed(); };
        const label = document.createElement("input");
        label.type = "text"; label.placeholder = "label"; label.value = r.label ?? ""; label.maxLength = 18;
        label.setAttribute("aria-label", "Label");
        label.oninput = () => { r.label = label.value; changed(); };
        const text = document.createElement("input");
        text.type = "text"; text.placeholder = "what to say"; text.value = r.text ?? "";
        text.setAttribute("aria-label", "Text");
        text.oninput = () => { r.text = text.value; changed(); };
        const del = document.createElement("button");
        del.textContent = "✕";
        del.setAttribute("aria-label", "Remove " + (r.label || "row"));
        del.onclick = () => { b.rows.splice(i, 1); draw(); changed(); };
        line.append(icon, label, text, del);
        list.appendChild(line);
      });
      if (b.rows.length < MAX_ROWS) {
        const add = document.createElement("button");
        add.className = "add";
        add.textContent = "+ Line";
        add.onclick = () => { b.rows.push({ icon: "star", label: "", text: "" }); draw(); changed(); };
        list.appendChild(add);
      }
    };
    draw();
    card.appendChild(list);
  },

  picture: true,
  pic: (b) => ({ src: "assets/" + ordinal(b, "about", "about"), width: esc(String(b.width)), alt: b.title || "about me" }),
  md: (b) => picMd(b),

  view(b) {
    const p = document.createElement("p");
    p.style.textAlign = b.align;
    p.innerHTML = renderAboutCard(b.rows, cardOpts(b));
    return p;
  },

  files: (b) => [{ name: "assets/" + ordinal(b, "about", "about"), data: renderAboutCard(b.rows, cardOpts(b)) }],
};
