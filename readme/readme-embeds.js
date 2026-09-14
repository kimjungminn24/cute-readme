import { renderRoom } from "../src/room.js";
import { embedRoom } from "../editor/editor-core.js";
import { renderLinkBadge, badgeFiles, LINK_PRESETS, LINK_ICONS } from "../src/links.js";
import {
  renderRepoCard, parseRepo, cardFile, REPO_CARD_THEMES, DEFAULT_REPO_CARD_THEME,
} from "../src/repocard.js";
import { fetchRepo } from "../src/github.js";
import { readDotFont } from "../src/dotfont.js";
import { BLOCKS, ui, cleanups, changed } from "./readme-shared.js";
import { esc, picMd } from "./readme-markdown.js";
import { ordinal } from "./readme-doc.js";

BLOCKS.miniroom = {
  label: "miniroom",
  fresh: () => ({ room: null, width: "100%", align: "center" }),

  edit(b, ui) {
    const card = ui.card();
    const open = document.createElement("button");
    open.className = "primary";
    const status = document.createElement("div");
    const show = (ok, text) => {
      status.className = "mini-status" + (ok ? "" : " err");
      status.textContent = text;
    };
    show(true, b.room ? "room loaded" : "no room yet");
    const row = document.createElement("div");
    row.className = "badge-row";
    row.append(open);
    const slot = document.createElement("div");
    card.append(row, status, slot);

    let frame = null, onMsg = null;
    const idle = () => { open.textContent = b.room ? "Edit the room" : "Make a room"; };
    const closeEditor = () => {
      removeEventListener("message", onMsg);
      cleanups.delete(closeEditor);
      frame?.remove(); frame = null;
      idle();
      show(true, b.room ? "room loaded" : "no room yet");
    };
    idle();
    open.onclick = () => {
      if (frame) return closeEditor();
      frame = document.createElement("iframe");
      frame.className = "room-inline";
      frame.src = "./editor/";
      frame.title = "room editor";
      onMsg = (e) => {
        if (e.origin !== location.origin || e.source !== frame?.contentWindow) return;
        if (e.data?.type === "room-ready") {
          frame.contentWindow.postMessage({ type: "room-load", room: b.room }, location.origin);
        } else if (e.data?.type === "room-change") {
          b.room = e.data.room;
          changed();
        }
      };
      addEventListener("message", onMsg);
      cleanups.add(closeEditor);
      slot.append(frame);
      open.textContent = "Done";
    };

    ui.rowStart(); ui.input(b, "width", "width (100% or a px number)"); ui.rowEnd();
  },

  picture: true,
  pic: (b) => (b.room
    ? { src: "assets/" + ordinal(b, "miniroom", "room"), width: esc(String(b.width)), alt: "my room" }
    : null),
  md: (b) => picMd(b),

  view(b) {
    const p = document.createElement("p");
    p.style.textAlign = b.align;
    if (!b.room) { p.className = "mini-status"; p.textContent = "miniroom: make a room to see it"; return p; }
    p.innerHTML = renderRoom(b.room, { title: "miniroom" });
    return p;
  },

  files: (b) => (b.room ? [{
    name: "assets/" + ordinal(b, "miniroom", "room"),
    data: embedRoom(renderRoom(b.room, { title: "miniroom" }), b.room),
  }] : []),
};

const linked = (items) => badgeFiles(items).filter(({ link }) => link.url && !/[:/]$/.test(link.url));

BLOCKS.links = {
  label: "link badges",
  fresh: () => ({ align: "center", items: [{ ...LINK_PRESETS.github }] }),

  edit(b, ui) {
    const card = ui.card();
    const list = document.createElement("div");
    const option = (v, label, on) => '<option value="' + v + '"' + (on ? " selected" : "") + ">" + label + "</option>";
    const draw = () => {
      list.innerHTML = "";
      b.items.forEach((it, i) => {
        const preset = document.createElement("select");
        preset.setAttribute("aria-label", "Preset");
        preset.innerHTML = option("", "preset…") +
          Object.entries(LINK_PRESETS).map(([id, p]) => option(id, p.label)).join("");
        preset.onchange = () => {
          const p = LINK_PRESETS[preset.value];
          if (!p) return;
          Object.assign(it, { ...p, url: it.url && it.url !== "https://" ? it.url : p.url });
          draw(); changed();
        };
        const label = document.createElement("input");
        label.type = "text"; label.placeholder = "label"; label.maxLength = 16; label.value = it.label ?? "";
        label.setAttribute("aria-label", "Label");
        label.oninput = () => { it.label = label.value; changed(); };
        const url = document.createElement("input");
        url.type = "text"; url.placeholder = "https://"; url.value = it.url ?? "";
        url.setAttribute("aria-label", "URL");
        url.oninput = () => { it.url = url.value; changed(); };
        const color = document.createElement("input");
        color.type = "color"; color.value = it.color ?? LINK_PRESETS.link.color;
        color.title = "badge color";
        color.setAttribute("aria-label", "Badge color");
        color.oninput = () => { it.color = color.value; changed(); };
        const icon = document.createElement("select");
        icon.setAttribute("aria-label", "Icon");
        icon.innerHTML = option("", "no icon", !it.icon) +
          Object.keys(LINK_ICONS).map((id) => option(id, id, id === it.icon)).join("");
        icon.onchange = () => { it.icon = icon.value || null; changed(); };
        const del = document.createElement("button");
        del.textContent = "✕";
        del.setAttribute("aria-label", "Remove " + (it.label || "link"));
        del.onclick = () => { b.items.splice(i, 1); draw(); changed(); };
        const top = document.createElement("div");
        top.className = "badge-row";
        top.append(preset, label, color, icon, del);
        const bottom = document.createElement("div");
        bottom.className = "badge-row";
        bottom.append(url);
        const item = document.createElement("div");
        item.className = "link-item";
        item.append(top, bottom);
        list.appendChild(item);
      });
      const add = document.createElement("button");
      add.className = "add";
      add.textContent = "+ Link";
      add.onclick = () => { b.items.push({ ...LINK_PRESETS.link }); draw(); changed(); };
      list.appendChild(add);
    };
    draw();
    card.appendChild(list);
  },

  picture: true,
  inline: (b, extra = "") => linked(b.items).map(({ link, file }) =>
    '<a href="' + esc(link.url) + '"><img ' + extra + 'src="assets/links/' + file + '" alt="' + esc(link.label ?? "") + '"></a>')
    .join("\n  "),
  md: (b) => picMd(b),

  view(b) {
    const p = document.createElement("p");
    p.style.textAlign = b.align;
    for (const it of b.items) {
      const a = document.createElement("a");
      a.href = it.url || "#";
      a.style.margin = "0 2px";
      a.innerHTML = renderLinkBadge(it);
      p.appendChild(a);
    }
    return p;
  },

  files: (b) => linked(b.items).map(({ link, file }) =>
    ({ name: "assets/links/" + file, data: renderLinkBadge(link) })),
};

let dotFont = null;
let dotAsked = false;
function wantDotFont() {
  if (dotAsked) return;
  dotAsked = true;
  fetch("./assets/galmuri11.dot")
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((buf) => { dotFont = readDotFont(buf); ui.renderOut?.(); })
    .catch(() => {});
}

function cardOpts(b) {
  const theme = REPO_CARD_THEMES[b.theme] ? b.theme : DEFAULT_REPO_CARD_THEME;
  if (REPO_CARD_THEMES[theme].dot) wantDotFont();
  return { theme, width: Math.min(900, Math.max(240, Number(b.width) || 400)), dots: dotFont };
}

BLOCKS.repocards = {
  label: "repo cards",
  fresh: () => ({ align: "center", theme: DEFAULT_REPO_CARD_THEME, width: 400, repos: [] }),

  edit(b, ui) {
    const card = ui.card();
    const row = document.createElement("div");
    row.className = "badge-row";
    const input = document.createElement("input");
    input.type = "text"; input.placeholder = "owner/repo";
    input.setAttribute("aria-label", "Repository");
    const add = document.createElement("button");
    add.textContent = "+ Add";
    const status = document.createElement("div");
    status.className = "mini-status";
    const list = document.createElement("div");
    const drawList = () => {
      list.innerHTML = "";
      b.repos.forEach((repo, i) => {
        const line = document.createElement("div");
        line.className = "badge-row";
        const name = document.createElement("span");
        name.textContent = repo.owner + "/" + repo.name + "  ★ " + repo.stars;
        name.style.flex = "1";
        const del = document.createElement("button");
        del.textContent = "✕";
        del.setAttribute("aria-label", "Remove " + repo.owner + "/" + repo.name);
        del.onclick = () => { b.repos.splice(i, 1); drawList(); changed(); };
        line.append(name, del);
        list.appendChild(line);
      });
    };
    add.onclick = async () => {
      const parsed = parseRepo(input.value);
      if (!parsed) { status.textContent = "needs owner/repo or a GitHub URL"; return; }
      if (b.repos.some((c) => c.owner === parsed.owner && c.name === parsed.repo)) {
        status.textContent = parsed.owner + "/" + parsed.repo + " is already added";
        return;
      }
      add.disabled = true;
      status.textContent = "reading " + parsed.owner + "/" + parsed.repo + "…";
      try {
        b.repos.push(await fetchRepo(parsed));
        input.value = "";
        status.textContent = "";
        drawList(); changed();
      } catch (e) {
        status.textContent = e.message;
      }
      add.disabled = false;
    };
    input.onkeydown = (e) => { if (e.key === "Enter") add.click(); };
    row.append(input, add);
    card.append(row, status, list);
    drawList();
    ui.rowStart();
    ui.select(b, "theme", Object.entries(REPO_CARD_THEMES).map(([id, t]) => [id, t.label]));
    ui.number(b, "width");
    ui.rowEnd();
  },

  picture: true,
  inline: (b, extra = "") => b.repos.map((repo) =>
    '<a href="https://github.com/' + repo.owner + "/" + repo.name + '"><img ' + extra + 'src="assets/cards/' +
    cardFile(repo) + '" alt="' + esc(repo.owner + "/" + repo.name) + '"></a>')
    .join("\n  "),
  md: (b) => picMd(b),

  view(b) {
    const p = document.createElement("p");
    p.style.textAlign = b.align;
    if (!b.repos.length) { p.className = "mini-status"; p.textContent = "repo cards: add a repo to see one"; return p; }
    for (const repo of b.repos) {
      const a = document.createElement("a");
      a.href = "https://github.com/" + repo.owner + "/" + repo.name;
      a.style.margin = "0 2px";
      a.innerHTML = renderRepoCard(repo, cardOpts(b));
      p.appendChild(a);
    }
    return p;
  },

  files: (b) => b.repos.map((repo) =>
    ({ name: "assets/cards/" + cardFile(repo), data: renderRepoCard(repo, cardOpts(b)) })),
};
