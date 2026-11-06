import {
  renderMusicCard, parseYouTube, youtubeUrl, thumbnailUrl, musicFile,
  MUSIC_CARD_THEMES, DEFAULT_MUSIC_THEME,
} from "../src/musiccard.js";
import { readDotFont } from "../src/dotfont.js";
import { BLOCKS, ui as shared, changed } from "./readme-shared.js";
import { esc, picMd } from "./readme-markdown.js";
import { assetNames } from "./readme-doc.js";

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

const songOf = (b) => ({
  id: parseYouTube(b.url),
  title: b.title,
  artist: b.artist,
  cover: b.cover,
});

function cardOpts(b) {
  const theme = MUSIC_CARD_THEMES[b.theme] ? b.theme : DEFAULT_MUSIC_THEME;
  if (MUSIC_CARD_THEMES[theme].dots) wantDotFont();
  return { theme, layout: b.layout, width: b.width, dots: dotFont };
}

const fileName = (b) => assetNames(b, "music", (x) => [musicFile(songOf(x))])[0];

// Reads the video thumbnail into a data URI so the card can carry it.
// An SVG shown through <img> cannot load outside images, so the picture has to be inside the file.
async function readThumbnail(id) {
  const res = await fetch(thumbnailUrl(id));
  if (!res.ok) throw new Error(String(res.status));
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// YouTube's oEmbed gives the video title and channel name.
async function readTitle(id) {
  const res = await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(youtubeUrl(id)));
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  return { title: data.title ?? "", artist: data.author_name ?? "" };
}

BLOCKS.music = {
  label: "music",
  fresh: () => ({
    url: "", title: "", artist: "", cover: null, layout: "wide",
    theme: DEFAULT_MUSIC_THEME, width: 400, align: "center",
  }),

  edit(b, ui) {
    const card = ui.card();
    const row = document.createElement("div");
    row.className = "badge-row";
    const url = document.createElement("input");
    url.type = "text"; url.placeholder = "YouTube link"; url.value = b.url;
    url.setAttribute("aria-label", "YouTube link");
    const load = document.createElement("button");
    load.textContent = "Load";
    const status = document.createElement("div");
    status.className = "mini-status";
    row.append(url, load);
    card.append(row, status);

    url.oninput = () => { b.url = url.value; changed(); };
    const field = (key, ph) => {
      const i = document.createElement("input");
      i.type = "text"; i.value = b[key]; i.placeholder = ph;
      i.setAttribute("aria-label", ph);
      i.oninput = () => { b[key] = i.value; changed(); };
      return i;
    };
    const title = field("title", "song title");
    const artist = field("artist", "artist");

    load.onclick = async () => {
      const id = parseYouTube(url.value);
      if (!id) { status.textContent = "needs a YouTube link"; return; }
      b.url = url.value = youtubeUrl(id);
      load.disabled = true;
      status.textContent = "reading the video…";
      const notes = [];
      try {
        const meta = await readTitle(id);
        if (!b.title) title.value = b.title = meta.title;
        if (!b.artist) artist.value = b.artist = meta.artist;
      } catch { notes.push("could not read the title, type it in"); }
      try {
        b.cover = await readThumbnail(id);
        notes.push("thumbnail ready");
      } catch { b.cover = null; notes.push("could not fetch the thumbnail, using the default cover"); }
      status.textContent = notes.join(". ");
      load.disabled = false;
      changed();
    };

    const names = document.createElement("div");
    names.className = "row";
    names.append(title, artist);
    card.append(names);
    ui.rowStart();
    ui.select(b, "layout", [["wide", "wide"], ["square", "square"]], () => { b.width = b.layout === "square" ? 220 : 400; shared.renderBlocks?.(); changed(); });
    ui.select(b, "theme", Object.entries(MUSIC_CARD_THEMES).map(([id, t]) => [id, t.label]));
    ui.number(b, "width");
    ui.rowEnd();
  },

  picture: true,
  inline: (b, extra = "") => {
    const id = parseYouTube(b.url);
    if (!id) return "";
    return '<a href="' + youtubeUrl(id) + '"><img ' + extra + 'src="assets/music/' + fileName(b) +
      '" alt="' + esc(b.title || "now playing") + '"></a>';
  },
  md: (b) => picMd(b),

  view(b) {
    const p = document.createElement("p");
    p.style.textAlign = b.align;
    if (!parseYouTube(b.url)) { p.className = "mini-status"; p.textContent = "music: paste a YouTube link"; return p; }
    const a = document.createElement("a");
    a.href = youtubeUrl(parseYouTube(b.url));
    a.innerHTML = renderMusicCard(songOf(b), cardOpts(b));
    p.appendChild(a);
    return p;
  },

  files: (b) => (parseYouTube(b.url)
    ? [{ name: "assets/music/" + fileName(b), data: renderMusicCard(songOf(b), cardOpts(b)) }]
    : []),
};
