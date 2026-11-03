# Reference

Room JSON spec, the full catalog, per-section option tables, npm scripts, calling it from code, and the file layout.

[← back to the README](../README.md)

| | |
| --- | --- |
| **Room** | [Room JSON spec](#room-json-spec) / [Catalog](#catalog) |
| **Add-ons** | [Link badges](#link-badges) / [Repository cards](#repository-cards) / [Suika contributors](#suika-contributors) |
| **Development** | [npm scripts](#npm-scripts) / [Using it from code](#using-it-from-code) / [Layout](#layout) |

## Room JSON spec

Paste it into the editor's JSON box and hit `Apply` to load it.

```jsonc
{
  "v": 1,
  "grid":  { "cols": 8, "rows": 8 },        // 4–12 each (a wider room)
  "scale": 1,                                // output scale 0.25–4, default 1 (same drawing, bigger size)
  "theme": {
    "wall": "#c4a875", "floor": "#b8945f",
    "wallStyle": "block",                  // wall pattern, default block (table below)
    "floorStyle": "grid"                   // floor pattern, default grid (table below)
  },
  "weather": "none",                         // seasonal layer, default none (table below)
  "items": [                                 // floor items (lift = how high it sits on something)
    { "id": "bed", "col": 0, "row": 2, "flip": false }
  ],
  "wallItems": [                             // wall pieces
    { "id": "window", "wall": "right", "u": 4 }   // wall: "left" | "right"
  ],
  "person": {                                // null for a room with nobody in it (✕ Remove in the editor)
    "col": 3, "row": 6, "flip": false,
    "skin": "#e8b88a", "hair": "#4a3320",
    "hairStyle": "short",                    // table below (default short)
    "outfit": "tee",                         // table below (default tee)
    "glasses": false,
    "top": "#3aa0a8", "bottom": "#4a5ba8"    // shoe colour is derived from bottom
  },

  // Text. Not attached to the character; it stands on any cell
  "texts": [
    { "text": "hello~", "col": 4, "row": 3, "style": "bubble", "anim": "type" }
  ],
  "effects": [{ "id": "heart", "col": 4, "row": 6 }],
  "skills":  [{ "id": "java", "col": 7, "row": 7 }],

  // Link badges. Not part of the room drawing; exported separately as links/*.svg
  "linkScale": 1,                            // badge scale (default 1). For one badge only, use scale below
  "links": [
    { "label": "Blog", "url": "https://example.com", "color": "#3aa0a8", "icon": "doc" }
  ]
}
```

An `id` that is not in the catalog is ignored silently, and coordinates are clamped to the grid. Draw order sorts itself by `layer`, then by the depth of the front corner.

### Stacking

You can put things on top of items. Click a cell that already holds something and the editor stacks on top of it, and you can stack on a stack. Drag it to another cell and it re-stacks there; drag it somewhere with nothing to stand on and it drops to the floor.

```jsonc
{ "id": "table", "col": 1, "row": 1 },
{ "id": "books", "col": 1, "row": 1, "lift": 9.6 }  // on the table top (9.6 dots)
```

`lift` is in dots, which is 2× on screen. Leave it out for the floor.

Items that can hold things have a `top` (surface height) in `FLOOR_ITEMS` in [src/catalog-floor.js](../src/catalog-floor.js). Anything without `top` (a rug, a plant, the cat, all without a flat surface) cannot hold anything. Change the drawing and this value has to change with it.

Things stacked on the same cell share a depth, so array order decides front and back: later entries draw on top.

### Text

`texts[]` is text standing on a cell. It is not attached to the character, so you can just drag it around the room. Write the words in the editor's `Text` panel.

Look (`style`) and motion (`anim`) are chosen separately. A speech bubble can sit still, and bare text with no box can type itself out.

| `style` | `bubble` `paper` `mint` `rose` `slate` for speech bubbles (colour only) / `plain` for bare text, no box |
|---|---|
| `anim` | `none` still / `type` letter by letter / `float` up and down / `blink` blinking / `pulse` growing and shrinking |

`plain` lays the same text down once in bold underneath as a halo, so it does not get lost against the room pattern.

`type` does not draw the letters one at a time. It slides a `<clipPath>` covering the text in from the left. Scripts are dead in an SVG embedded with `<img>` but CSS animation is alive, so it keeps running inside a README. A two-line message finishes the first line before the second starts.

> Covering the text with a background-coloured rectangle would be easier, but two things get in the way. `plain` has no colour to cover with, and where animation does not run the text would be hidden forever. A clip at rest means "fully visible", so the text is readable even in the worst case.

> `person.bubble` (the old way of attaching a bubble to the character) and `bubbles[]` (the old name for `texts[]`) are still read, so older `room.json` files keep working. The editor moves an old bubble into `texts[]` when it opens the file.

---

## Catalog

| Kind | id |
|---|---|
| Floor items | `teddy` `dog` `mushroom` `snowman` `donut` `bunny` `penguin` `gift` `rainbow` `bigheart` `ribbon` `ducky` `frog` `dino` `ghost` `rug` `bed` `chest` `bookshelf` `ore` `creeper` `dirt` `grassblock` `table` `desk` `tv` `fridge` `plant` `lamp` `stool` `drawer` `cactus` `sofa` `books` `turntable` `grass` `flowers` `tree` `sakura` |
| Items you can stack on (has `top`) | `bed` `chest` `ore` `dirt` `grassblock` `table` `desk` `fridge` `stool` `drawer` `books` |
| Wall pieces | `window` `painting` |
| Effects | `heart` `note` `zzz` `sweat` `star` `question` `exclaim` |
| Skill badges | `java` `js` `ts` `python` `go` `react` `git` `docker` `claude` `vue` `rust` `kotlin` `c` `sql` `html` |
| Wall pattern (`theme.wallStyle`) | `block` `brick` `plank` `stripe` `panel` `tile` `plain` `solid` `none` |
| Floor pattern (`theme.floorStyle`) | `grid` `tile` `checker` `plank` `brick` `plain` `solid` `none` |
| Season (`weather`) | `none` `sakura` `snow` `rain` `leaves` `hearts` `fireflies` `bubbles` |

Three of them have no pattern. `plain` keeps the speckled texture of the base colour, `solid` is a flat single colour, and `none` draws nothing at all (transparent).

`none` leaves that part empty, so the README's own background shows through.

| `wallStyle` | `floorStyle` | Result |
|---|---|---|
| `none` | anything | Walls gone, things sitting on a floor |
| anything | `none` | Floor gone |
| `none` | `none` | Fully transparent background, items and character as stickers |

Dropping the background makes it match GitHub's light and dark mode by itself, because what is left is the things in the room rather than a coloured rectangle. The file also gets much smaller: `104KB → 21KB` for the demo room.

Wall pieces (`window` `painting` …) are still drawn with the wall turned off. If a picture frame floating with no wall bothers you, remove the wall pieces too.

### Seasons

`weather` scatters petals, snow, rain, and other seasonal layers across the whole room. It is a layer in front of everything rather than an item or wall decor, so it sits on top of any room unchanged. Swap it once a season and the profile looks new on its own.

| `weather` | What falls |
|---|---|
| `sakura` | 36 pink petals, swinging wide and drifting slowly |
| `snow` | 46 flakes, slower still, more floating than falling |
| `rain` | 52 streaks, straight down, no sway |
| `leaves` | 30 autumn leaves in four warm tones, tumbling a touch faster than petals |
| `hearts` | 20 pink hearts, sinking lazily |
| `fireflies` | 18 warm dots that hang in place, blinking and swaying |
| `bubbles` | 22 bubbles, the one weather that rises instead of falls |

Fall speed, sway width, and starting position differ per particle, so nothing falls in rows. Where animation is turned off, the scattered first frame stays put.

### Character

| Field | Values |
|---|---|
| Hair (`person.hairStyle`) | `bob` `short` `long` `ponytail` `bun` `pigtails` `curly` `bald` |
| Outfit (`person.outfit`) | `tee` `hoodie` `cardigan` `dress` `shirt` `overalls` `sweater` `blazer` `track` `sailor` `apron` `pajama` `vest` `coat` |
| Pose (`person.pose`) | `stand` `sit` `back` |
| Motion (`person.anim`) | `none` `bob` `fly` |
| Accessory (`person.accessory`) | `none` `glasses` `crown` `wand` `sword` `catEars` |
| Expression (`person.expression`) | `normal` `smile` `wink` `surprised` `sleepy` |
| Size (`person.size`) | `small` `normal` `big` |
| Colour (`person.skin` `person.hair` `person.top` `person.bottom`) | Any hex; each one moves on its own |
| Shape (`person.shape`) | Kept so older rooms still load. `pixel` `chibi` `round` `square` `stick` all draw the same minimi |

Every combination is valid, 12 hairstyles x 14 outfits x 5 poses, and an unknown hairstyle, outfit or pose resolves to `bob`, `tee` and `stand` instead of failing.

### How the minimi is drawn

The character is one modular figure in [src/person-minimi.js](../src/person-minimi.js). Hair, skin, clothes, limbs, expressions and accessories are separate plates stamped on shared anchors, so changing an outfit never redraws the face and recolouring the hair never touches the shirt.

Earlier versions carried five shapes (`round`, `square`, `stick`, `chibi`, `pixel`), each with its own hair set cut to its own skull, and `pixel` stored every hair x outfit pair as one finished sprite. That is why its wardrobe could not be mixed freely and why expressions and sitting did nothing on it. One body on shared anchors replaces all of them.

Layers go clothes, then arms, then face, then hair. The arms are drawn after the clothing so a collar or a hem cannot cut through them. The near side carries a narrow seam and a slightly lower shoulder, which reads as a small turn toward the room instead of a figure square to the camera.

Sitting lowers the head and torso by five rows and leaves the feet where they are, so a seated character still rests on the floor tile it was placed on.

The spot an accessory attaches to is pinned with coordinates rather than nudged into place by eye. They live in `SHAPES` in [src/catalog-person.js](../src/catalog-person.js): `eyeRow` (10), `mouthRow` (15), `crownSink` (how far a head-worn item sinks in, 1) and `hand` (row 6, column 7).

- A drawing only states its own reference point. Anything held carries `grip: [row, col]`, the point where the hand closes on it, which puts a hilt in the palm and stands the blade upright.
- The crown sits on the hair, not on the skull. Matched to the skull it would sink into a bun or a cloud of curls.
- Accessories draw last. Behind the hair, glasses would be hidden by the fringe and read as a smudge.

`fly` is a motion, not a pose. It lifts with CSS only, so where animation does not run the character stands on the floor. The speech bubble rises to match, otherwise the risen head punches through it.

Size scales around the feet, because the sprite origin is at the feet. The speech bubble rises with it.

A new hairstyle is an entry in `MINI_HAIRS`: an id, a label, and `above` for how many rows it rises over the skull so the speech bubble clears it, plus its plate in `miniGrid`. A new outfit is an entry in `MINI_OUTFITS` and its own block of dot strings. Both show up as editor chips with nothing else to wire. `node scripts/preview-minimi.js` rebuilds the contact sheet at [docs/minimi-gallery.html](minimi-gallery.html), and `/docs/minimi.html` is the interactive wardrobe.
New items go into the section files (`src/catalog-floor-*.js`, `catalog-wall.js`, `catalog-effects.js`, `catalog-skills.js`) as dot strings, with one line added to `FLOOR_ITEMS` in `catalog-floor.js`, and show up in the editor palette automatically. Adding a badge is one line, and if you drew it as a PNG, `npm run import` converts it to dot strings.

---

## Link badges

→ [how to add them](../README.md#3-add-link-badges)

| | |
|---|---|
| Presets | `link` `blog` `github` `mail` `linkedin` `notion` `velog` `tistory` `youtube` `instagram` `x` `discord` |
| Icons (`icon`) | `link` `mail` `doc` `play` `cam` `chat` `user` `code` (or none) |

Size comes from `linkScale` in `room.json` (×1–×4) and applies to every badge at once. To make one badge different, put `"scale": 2` on that link directly. The 0.5 steps keep the dots on whole pixels.

Badges are separate files from the room drawing, so re-exporting the room does not touch them.

---

## Repository cards

→ [how to add them](../README.md#4-add-repository-cards)

| Theme (`theme`) | Look |
|---|---|
| `light` `dark` | GitHub's pinned repo card as-is |
| `pixel` | Dots: an 8-bit black and white dialog with the corner pixels cut off; icons and text are dots too |
| `zebra` | Zebra: a thick black and white striped border |
| `retro` | 70s sunset: colour bands at the top, a sliced sun at the bottom right |
| `earth` | Earth: a starry night sky, the globe and an orbiting satellite at the bottom right |
| `y2k` | Hologram: a frosted glass plate and sparkles over a rainbow |

The patterned themes lay a plate underneath so the text does not get lost in the pattern, which makes those cards slightly taller.

`zebra` `retro` `earth` `y2k` move: a sheen sweeps across the card, y2k's sparkles blink, retro's sun pulses, and earth's satellite orbits. `"sparkle": false` keeps the pattern and drops the motion. Viewers with reduce motion on stop it by themselves.

| Key | Range | What it does |
|---|---|---|
| `width` | 240–900 | The space the text gets. It changes where the description wraps and how tall the card is |
| `scale` | 0.25–4 | Blows the finished card up |

Bigger letters means `scale`; more words per line means `width`.
## Suika contributors

| Environment variable | Default | What it does |
|---|---|---|
| `SUIKA_THEME` | `suika` | `suika` the original cream, `dark`, `pixel` dots |
| `SUIKA_TITLE` | `Contributors` | Heading, top left (`SCORE`, top right, is the sum of the commits) |
| `SUIKA_LIMIT` | `15` | How many people go in the jar. More makes a taller card (the pile grows upward) |
| `SUIKA_WIDTH` | `520` | Jar width (280–1200) |
| `SUIKA_SCALE` | `1` | Scale of the finished card (0.25–4) |
| `SUIKA_DROP` | `true` | The falling animation |
| `SUIKA_NAMES` | `true` | Logins on the big balls (small ones get none, since the text would be wider than the ball) |
| `TARGET_REPO` | the repo the workflow runs in | Only when the repo you want to draw is a different one |

Unlike repo cards, `WIDTH` and `SCALE` both grow the whole card. Ball radius is a ratio of the jar width, so a wider jar means bigger balls and the height follows. To make the card shorter, lower `LIMIT`.

The jar is a U, open at the top. A lighter line runs inside the wall and a shadow sits on the floor to give it thickness, and a lip caps the walls; a single outline reads as a border, not a jar. `suika` and `dark` run a sheet of glass over the balls; the pixel theme drops it, since translucency does not suit dots.

---

## npm scripts

| Command | What it does |
|---|---|
| `npm run editor` | README builder server (`PORT`, default 5599) |
| `npm run preview:room` | Demo room → `room.svg` |
| `npm run render:room` | Room JSON → SVG (args: `room.json [out] [title]`) |
| `npm run render:cards` | Repo cards → SVG (args: `[cards.json] [outdir]`) |
| `npm run render:suika` | Suika contributors → SVG (args: `owner/repo [out] [theme]`) |
| `npm run preview:suika` | Suika → `suika.svg` (args: `owner/repo`, `--theme=all` / `--width=`) |
| `npm run import` | Pixel-art PNG → dot strings (args: `art.png --kind effect`) |
| `node scripts/preview-minimi.js` | Minimi contact sheet → `docs/minimi-gallery.html` |
| `node scripts/build-dotfont.js` | BDF font → dot blob (args: `<in.bdf> [out.dot]`) |
| `npm test` | `node --test` |

---

## Using it from code

```js
import { renderRoom, DEMO_ROOM } from './src/room.js';
import { renderRepoCard } from './src/repocard.js';
import { fetchRepo } from './src/github.js';

// room
const svg = renderRoom(DEMO_ROOM, { title: 'my room', scale: 2 });

// repo card
const repo = await fetchRepo({ owner: 'kimjungminn24', repo: 'cute-readme' });
const card = renderRepoCard(repo, { theme: 'pixel', width: 400 });
```

`renderRoom(data, { title, editable })`: with `editable: true` the output gains transparent hit-test polygons and `data-*` attributes (editor only).

### Scaling

All three renderers take `scale`: `renderRoom(data, { scale })`, `renderRepoCard(repo, { width, scale })`, `renderLinkBadge(link, { scale })`.

```js
renderRoom(room, { scale: 2 });          // a 436×316 drawing goes out at 872×632
renderRoom({ ...room, scale: 2 });       // the same from the room JSON (this is what the workflow reads)
renderLinkBadge({ label: 'Blog' }, { scale: 2 });
```

Only `width`/`height` on the `<svg>` are multiplied; `viewBox` stays as it is. No shape is redrawn, so the file size does not change, and being vector it does not smear when enlarged. Values are clamped to 0.25–4, and anything that is not a number falls back to 1 rather than throwing, so one typo cannot kill a workflow. The whole implementation is the `clampScale` / `sizeAttrs` pair in [src/svg.js](../src/svg.js).

`width` (cards) is a different thing from scale. It is the width the text is laid out in, so wrapping and height change with it.

---

## Layout

```
src/catalog.js               catalog barrel (re-exports the files below)
src/catalog-base.js          isometric coordinate helper + stone colour
src/catalog-floor.js         floor item list (FLOOR_ITEMS)
src/catalog-floor-ai.js      floor item art made with PixelLab (one file each in floor-ai/)
src/catalog-floor-blocks.js  hand-drawn block items (ore, creeper, dirt, grass block)
src/catalog-wall.js          wall pieces
src/catalog-wall-ai.js       wall art made with PixelLab (wall-ai/)
src/catalog-effects.js       effects
src/catalog-skills.js        skill badges
src/catalog-lines.js         line stickers for the README builder
src/catalog-person.js        character API (SHAPES + personArt)
src/catalog-person-face.js   expressions, accessories, sizes
src/person-minimi.js         minimi renderer (hair × outfit × pose on shared anchors)
src/room.js                  room renderer (isometric placement + z-sorting)
src/room-*.js                room pieces (styles, geometry, text, weather)
src/pixel.js                 dot grid → run merging → one path per colour
src/dotfont.js               glyph bitmaps → dot paths (text in the pixel theme)
src/iso.js                   isometric tile constants, shading
src/svg.js                   XML escaping, width measurement, wrapping, output scale
src/links.js                 link badge renderer + 3x5 dot font, README snippet
src/repocard.js              repository card renderer + language colours
src/repocard-themes.js       repo card theme table + pattern shapes
src/suika.js                 suika contributors (size ladder + stacking physics + card)
src/github.js                repo, contributor and avatar lookups
src/png.js                   PNG decoder (node:zlib only)
src/ascii.js                 pixel grid ↔ dot strings
src/zip.js                   zip writer for the builder download
index.html                   README builder page (entry: readme/readme.js)
readme/                      README builder (blocks, board, preview, markdown export)
editor/                      room editor mounted inside the builder (pure logic in editor-core.js)
scripts/                     CLI entry points
templates/                   Actions workflow templates
```
