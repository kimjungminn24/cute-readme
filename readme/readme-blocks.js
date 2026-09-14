import { BLOCKS, changed, refresh } from "./readme-shared.js";
import { esc, brJoin, texEscape, alignAttr, picMd } from "./readme-markdown.js";
import { imageName } from "./readme-doc.js";

const SIZES = { normal: "", large: "\\large ", big: "\\Large ", huge: "\\huge " };

// Banners use KaTeX in GitHub Markdown and CSS in the preview.
const FONTS = {
  sans: { tex: "\\textsf", css: "font-family:sans-serif" },
  serif: { tex: "\\textrm", css: "font-family:serif" },
  mono: { tex: "\\texttt", css: "font-family:ui-monospace,Consolas,monospace" },
  italic: { tex: "\\textit", css: "font-family:sans-serif;font-style:italic" },
  bold: { tex: "\\textbf", css: "font-family:sans-serif;font-weight:700" },
};
const bannerFont = (b) => FONTS[b.font] ?? FONTS.sans;

const spacerLines = (b) => Math.min(20, Math.max(1, Math.round(b.lines) || 1));

function dataUriBytes(uri) {
  const bin = atob(uri.slice(uri.indexOf(",") + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Keep GIF and SVG files intact to preserve animation and vector data.
const KEEP_WHOLE = ["image/gif", "image/svg+xml"];
const KEEP_WHOLE_MAX = 2 * 1024 * 1024;

// Resize photos before storing data URIs to stay within localStorage limits.
function readImageFile(file, maxPx) {
  return new Promise((ok, fail) => {
    if (KEEP_WHOLE.includes(file.type) && file.size > KEEP_WHOLE_MAX) {
      fail(new Error(Math.round(file.size / 1024) + "KB is too big to keep whole; 2MB is the limit"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => fail(new Error("could not read the file"));
    reader.onload = () => {
      const uri = reader.result;
      if (KEEP_WHOLE.includes(file.type)) return ok(uri);
      const im = new Image();
      im.onerror = () => fail(new Error("not a picture"));
      im.onload = () => {
        const k = Math.min(1, maxPx / Math.max(im.naturalWidth, im.naturalHeight));
        if (k === 1 && uri.length < 400000) return ok(uri);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(im.naturalWidth * k));
        canvas.height = Math.max(1, Math.round(im.naturalHeight * k));
        canvas.getContext("2d").drawImage(im, 0, 0, canvas.width, canvas.height);
        ok(canvas.toDataURL("image/png"));
      };
      im.src = uri;
    };
    reader.readAsDataURL(file);
  });
}

const imageSrc = (b) => (b.file ? "assets/images/" + imageName(b) : esc(b.src));

BLOCKS.heading = {
  label: "heading",
  fresh: () => ({ level: 2, text: "Section", align: "left" }),
  edit(b, ui) {
    ui.select(b, "level", [[1, "H1"], [2, "H2"], [3, "H3"]]);
    ui.input(b, "text", "heading text");
  },
  md(b) {
    const at = alignAttr(b);
    if (at) return "<h" + b.level + at + ">" + esc(b.text) + "</h" + b.level + ">";
    return "#".repeat(b.level) + " " + b.text;
  },
  line: (b) => ({ tag: "h" + b.level, inner: esc(b.text) }),
  view(b) {
    const h = document.createElement("h" + b.level);
    h.textContent = b.text; h.style.textAlign = b.align;
    return h;
  },
};

BLOCKS.text = {
  label: "text",
  fresh: () => ({ text: "Write something.", align: "left" }),
  edit(b, ui) { ui.area(b, "text", "plain markdown; anything but left goes out as HTML"); },
  md(b) {
    const at = alignAttr(b);
    if (at) return "<p" + at + ">" + brJoin(b.text) + "</p>";
    return b.text.trim();
  },
  line: (b) => ({ tag: "p", inner: brJoin(b.text) }),
  view(b) {
    const p = document.createElement("p");
    p.innerHTML = brJoin(b.text); p.style.textAlign = b.align;
    return p;
  },
};

const bannerTex = (b) => "{\\color{" + b.color + "}" + SIZES[b.size] + bannerFont(b).tex + "{" + texEscape(b.text) + "}}";

BLOCKS.banner = {
  label: "color banner",
  fresh: () => ({ text: "Colored text, on GitHub, really", color: "#c05b76", size: "big", font: "sans", align: "center" }),
  edit(b, ui) {
    ui.input(b, "text", "banner text");
    ui.rowStart();
    ui.color(b, "color");
    ui.select(b, "size", [["normal", "normal"], ["large", "large"], ["big", "bigger"], ["huge", "huge"]]);
    ui.select(b, "font", Object.keys(FONTS).map((id) => [id, id]));
    ui.rowEnd();
  },
  md(b) {
    const tex = bannerTex(b);
    if (b.align === "center") return "$$" + tex + "$$";
    if (b.align === "right") return '<div align="right">\n\n$' + tex + '$\n\n</div>';
    return "$" + tex + "$";
  },
  /* Blank lines inside the wrapper enable GitHub Markdown rendering. */
  line: (b) => ({ tag: "div", inner: "$" + bannerTex(b) + "$", loose: true }),
  view(b) {
    const p = document.createElement("p");
    p.textContent = b.text;
    p.style.cssText = bannerFont(b).css + ";color:" + b.color +
      ";text-align:" + b.align + ";font-size:" +
      ({ normal: 14, large: 17, big: 21, huge: 28 })[b.size] + "px";
    return p;
  },
};

BLOCKS.image = {
  label: "image",
  fresh: () => ({ src: "", width: 480, align: "center" }),
  edit(b, ui) {
    const card = ui.card();
    const row = document.createElement("div");
    row.className = "badge-row";
    const url = document.createElement("input");
    url.type = "text";
    url.placeholder = b.file ? "using the attached file" : "image url";
    url.value = b.src || "";
    url.disabled = !!b.file;
    url.oninput = () => { b.src = url.value; changed(); };
    const pick = document.createElement("input");
    pick.type = "file"; pick.accept = "image/*"; pick.hidden = true;
    const attach = document.createElement("button");
    attach.textContent = "+ File";
    attach.onclick = () => pick.click();
    pick.onchange = async () => {
      const picked = pick.files[0];
      pick.value = "";
      if (!picked) return;
      attach.disabled = true;
      try {
        b.file = { name: picked.name, uri: await readImageFile(picked, 960) };
        refresh();
      } catch (e) {
        alert("could not read that image: " + e.message);
        attach.disabled = false;
      }
    };
    row.append(url, pick, attach);
    card.append(row);

    if (b.file) {
      const line = document.createElement("div");
      line.className = "badge-row";
      const where = document.createElement("span");
      where.className = "mini-status";
      where.style.flex = "1";
      where.textContent = "goes out as assets/images/" + imageName(b);
      const drop = document.createElement("button");
      drop.textContent = "✕";
      drop.setAttribute("aria-label", "Detach the file");
      drop.onclick = () => { delete b.file; refresh(); };
      line.append(where, drop);
      card.append(line);
    }
    ui.rowStart(); ui.number(b, "width"); ui.rowEnd();
  },
  picture: true,
  pic: (b) => (b.file || b.src ? { src: imageSrc(b), width: b.width } : null),
  md: (b) => picMd(b),
  view(b) {
    const p = document.createElement("p");
    p.style.textAlign = b.align;
    if (!b.file && !b.src) {
      p.className = "mini-status";
      p.textContent = "image: attach a file or paste a url";
      return p;
    }
    const img = document.createElement("img");
    img.src = b.file ? b.file.uri : b.src;
    img.width = b.width;
    p.appendChild(img);
    return p;
  },
  files: (b) => (b.file ? [{ name: "assets/images/" + imageName(b), data: dataUriBytes(b.file.uri) }] : []),
};

BLOCKS.list = {
  label: "list",
  fresh: () => ({ text: "first thing\nsecond thing" }),
  edit(b, ui) { ui.area(b, "text", "one item per line"); },
  md(b) { return b.text.trim().split(/\n/).map((l) => "- " + l).join("\n"); },
  view(b) {
    const ul = document.createElement("ul");
    for (const l of b.text.trim().split(/\n/)) {
      const li = document.createElement("li"); li.textContent = l; ul.appendChild(li);
    }
    return ul;
  },
};

BLOCKS.spacer = {
  label: "spacer",
  fresh: () => ({ lines: 2 }),
  edit(b, ui) { ui.label("blank lines"); ui.number(b, "lines"); },
  md(b) { return "<br>".repeat(spacerLines(b)); },
  view(b) {
    const p = document.createElement("p");
    for (let n = 0; n < spacerLines(b); n++) p.appendChild(document.createElement("br"));
    return p;
  },
};

BLOCKS.divider = {
  label: "divider",
  fresh: () => ({}),
  edit() {},
  md() { return "---"; },
  view() { return document.createElement("hr"); },
};
