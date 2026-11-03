# 参考

房间 JSON 规格、素材完整目录、各章节选项表、npm 脚本、用代码调用的方法、文件结构。

[← 回到 README](../README.zh-CN.md)

| | |
| --- | --- |
| **房间** | [房间 JSON 规格](#房间-json-规格) / [素材目录](#素材目录) |
| **附加组件** | [链接徽章](#链接徽章) / [仓库卡片](#仓库卡片) / [西瓜游戏贡献者](#西瓜游戏贡献者) |
| **开发** | [npm 脚本](#npm-脚本) / [作为代码库使用](#作为代码库使用) / [目录结构](#目录结构) |

## 房间 JSON 规格

粘进编辑器的 JSON 框里，按 `Apply` 就会原样生效。

```jsonc
{
  "v": 1,
  "grid":  { "cols": 8, "rows": 8 },        // 各 4~12（房间变宽）
  "scale": 1,                                // 输出缩放 0.25~4，省略为 1（图不变，只是尺寸变大）
  "theme": {
    "wall": "#c4a875", "floor": "#b8945f",
    "wallStyle": "block",                  // 墙面花纹，省略为 block（见下表）
    "floorStyle": "grid"                   // 地板花纹，省略为 grid（见下表）
  },
  "weather": "none",                         // 季节特效，省略为 none（见下表）
  "items": [                                 // 地板物品（lift = 叠放的高度）
    { "id": "bed", "col": 0, "row": 2, "flip": false }
  ],
  "wallItems": [                             // 墙饰
    { "id": "window", "wall": "right", "u": 4 }   // wall: "left" | "right"
  ],
  "person": {                                // null 表示没有人的房间（编辑器的 ✕ Remove）
    "col": 3, "row": 6, "flip": false,
    "skin": "#e8b88a", "hair": "#4a3320",
    "hairStyle": "short",                    // 见下表（省略为 short）
    "outfit": "tee",                         // 见下表（省略为 tee）
    "glasses": false,
    "top": "#3aa0a8", "bottom": "#4a5ba8"    // 鞋子颜色由 bottom 自动推出
  },

  // 文字。不附在角色身上，可以立在任意格子上
  "texts": [
    { "text": "hello~", "col": 4, "row": 3, "style": "bubble", "anim": "type" }
  ],
  "effects": [{ "id": "heart", "col": 4, "row": 6 }],
  "skills":  [{ "id": "java", "col": 7, "row": 7 }],

  // 链接徽章。不进房间图，单独导出为 links/*.svg
  "linkScale": 1,                            // 徽章缩放（省略为 1）。只想改某一张就用下面的 scale
  "links": [
    { "label": "Blog", "url": "https://example.com", "color": "#3aa0a8", "icon": "doc" }
  ]
}
```

目录里没有的 `id` 会被安静忽略，坐标会被裁剪到格子范围内。绘制顺序按 `layer` → 前角深度自动排序。

### 叠放

可以把东西放到物品上面。点击已经有东西的格子，编辑器会自动叠上去，叠好的东西上面还能再叠。拖到别的格子会按那一格重新叠放，拖到没有支撑的格子就落回地板。

```jsonc
{ "id": "table", "col": 1, "row": 1 },
{ "id": "books", "col": 1, "row": 1, "lift": 9.6 }  // 放在桌面（9.6 点）上
```

`lift` 的单位是点，屏幕上是 2 倍。省略就是放在地板上。

能当支撑的物品在 [src/catalog-floor.js](../src/catalog-floor.js) 的 `FLOOR_ITEMS` 里写着 `top`（台面高度）。没有 `top` 的（地毯、盆栽、猫这种台面不平的）不能当支撑。改了图形，这个值也要跟着改。

叠在同一格上的东西深度相同，所以数组顺序决定前后：后放的画在上面。

### 文字

`texts[]` 是立在格子上的文字。它不附在角色身上，所以在房间里直接拖着挪就行。文案在编辑器的 `Text` 面板里写。

外观（`style`）和动作（`anim`）分开选。气泡可以固定不动，没有框的裸文字也可以加打字效果。

| `style` | `bubble` `paper` `mint` `rose` `slate` 是对话气泡（只是颜色不同）/ `plain` 是没有框，只有文字 |
|---|---|
| `anim` | `none` 不动 / `type` 逐字显示 / `float` 上下浮动 / `blink` 闪烁 / `pulse` 一大一小 |

`plain` 会把同样的文字加粗垫一层当作光晕，免得文字被房间的花纹吃掉。

`type` 不是一个字一个字画出来的，而是把盖住文字的 `<clipPath>` 从左边推回原位。用 `<img>` 嵌入的 SVG 里脚本是死的，但 CSS 动画还活着，所以在 README 里也会一直动。两行的文案会先写完第一行，第二行接着来。

> 用背景色遮罩会更简单，但有两个问题。`plain` 没有可以遮的颜色，而且在动画不运行的环境里文字会永远被挡住。裁剪路径的原位是「全部可见」，所以最坏情况下文字依然读得到。

> `person.bubble`（附在角色头上的旧写法）和 `bubbles[]`（`texts[]` 的旧名字）依然能读，以免以前做的 `room.json` 失效。编辑器打开时会把旧气泡搬进 `texts[]`。

---

## 素材目录

| 种类 | id |
|---|---|
| 地板物品 | `teddy` `dog` `mushroom` `snowman` `donut` `bunny` `penguin` `gift` `rainbow` `bigheart` `ribbon` `ducky` `frog` `dino` `ghost` `rug` `bed` `chest` `bookshelf` `ore` `creeper` `dirt` `grassblock` `grassgraph` `table` `desk` `tv` `fridge` `plant` `lamp` `stool` `drawer` `cactus` `sofa` `books` `turntable` `grass` `flowers` `tree` `sakura` |
| 能当支撑的物品（有 `top`） | `bed` `chest` `ore` `dirt` `grassblock` `table` `desk` `fridge` `stool` `drawer` `books` |
| 墙饰 | `window` `painting` |
| 特效 | `heart` `note` `zzz` `sweat` `star` `question` `exclaim` |
| 技能徽章 | `java` `js` `ts` `python` `go` `react` `git` `docker` `claude` `vue` `rust` `kotlin` `c` `sql` `html` |
| 墙面花纹（`theme.wallStyle`） | `block` `brick` `plank` `stripe` `panel` `tile` `plain` `solid` `none` |
| 地板花纹（`theme.floorStyle`） | `grid` `tile` `checker` `plank` `brick` `plain` `solid` `none` |
| 季节（`weather`） | `none` `sakura` `snow` `rain` `leaves` `hearts` `fireflies` `bubbles` |

其中三个是没有花纹的。`plain` 会保留底色上的斑驳质感，`solid` 是只有颜色的纯色，`none` 则完全不画（透明）。

`none` 会让那一部分空着，README 自身的背景直接透出来。

| `wallStyle` | `floorStyle` | 结果 |
|---|---|---|
| `none` | 保持原样 | 只有墙消失，东西摆在地板上的样子 |
| 保持原样 | `none` | 只有地板消失 |
| `none` | `none` | 背景完全透明，物品和角色像贴纸一样 |

去掉背景之后会自动适配 GitHub 的浅色/深色模式，因为剩下的不是一块有颜色的方块，而是房间里的东西。文件也小得多，示例房间从 `104KB` 降到 `21KB`。

墙饰（`window` `painting` …）在关掉墙之后依然会画。不喜欢画框悬在半空的话，把墙饰也一起删掉。

### 季节

`weather` 会把樱花、雪、雨等季节图层撒满整个房间。它是盖在最前面的一层，而不是物品或墙饰，所以任何房间都能直接套用。每季换一个，主页就自动焕然一新。

| `weather` | 落下的东西 |
|---|---|
| `sakura` | 36 片粉色花瓣，左右摇摆幅度大，落得慢 |
| `snow` | 46 片雪花，更慢，像是飘着而不是落下 |
| `rain` | 52 道雨丝，笔直向下，不摇摆 |
| `leaves` | 30 片四种暖色的落叶，比花瓣落得稍快，翻滚着下来 |
| `hearts` | 20 颗粉色爱心，慢悠悠地沉下来 |
| `fireflies` | 18 点萤火，不落下，原地眨眼摇曳 |
| `bubbles` | 22 个泡泡，唯一向上升而不是落下的天气 |

每个粒子的下落速度、摇摆幅度和起始位置都不同，所以不会排成一行落下。在关闭动画的环境里，散开的第一帧会原样留下。

### 角色

| 项目 | 值 |
|---|---|
| 发型 (`person.hairStyle`) | `bob` `short` `long` `ponytail` `bun` `pigtails` `curly` `bald` |
| 服装 (`person.outfit`) | `tee` `hoodie` `cardigan` `dress` `shirt` `overalls` `sweater` `blazer` `track` `sailor` `apron` `pajama` `vest` `coat` |
| 姿势 (`person.pose`) | `stand` `sit` `back` |
| 动作 (`person.anim`) | `none` `bob` `fly` |
| 配饰 (`person.accessory`) | `none` `glasses` `crown` `wand` `sword` `catEars` |
| 表情 (`person.expression`) | `normal` `smile` `wink` `surprised` `sleepy` |
| 大小 (`person.size`) | `small` `normal` `big` |
| 颜色 (`person.skin` `person.hair` `person.top` `person.bottom`) | 任意 hex，四者互相独立 |
| 体型 (`person.shape`) | 为了让旧房间文件仍能打开而保留。`pixel` `chibi` `round` `square` `stick` 都画成同一个迷你人 |

12 种发型 × 14 套服装 × 5 种姿势，任意组合都成立。遇到不认识的名字不会报错，而是退回 `bob`、`tee`、`stand`。

### 迷你人是怎么画的

角色是 [src/person-minimi.js](../src/person-minimi.js) 里的一个模块化图形。头发、皮肤、衣服、四肢、表情和配饰各自是独立的图板，钉在同一组锚点上，所以换衣服不会重画脸，改发色也不会碰到上衣。

以前有五种体型（`round`、`square`、`stick`、`chibi`、`pixel`），每种都带着按自己颅形裁的发型集；其中 `pixel` 把每个发型 × 服装的组合存成一整张成品图，所以它的衣橱不能自由搭配，表情和坐姿对它也不起作用。现在一个共享锚点的身体取代了全部。

叠放顺序是衣服、手臂、脸、头发。手臂画在衣服之后，是为了让衣领和下摆不会切断它们。靠近观者的一侧有一道窄接缝和略低的肩膀，读起来像是朝房间微微侧身，而不是正对镜头站着。

坐下时头和上身下移五行，脚保持原位，所以坐着的角色仍然落在当初放置的那块地砖上。

配饰的挂点是用坐标钉死的，不是凭眼睛挪。它们在 [src/catalog-person.js](../src/catalog-person.js) 的 `SHAPES` 里：`eyeRow`（10）、`mouthRow`（15）、`crownSink`（戴在头上的东西陷进去多少，1）、`hand`（第 6 行第 7 列）。

- 图形只声明自己的基准点。手持物带 `grip: [行, 列]`，即手合拢的位置，这样刀柄落进掌心，刀身立得起来。
- 王冠坐在头发上，不是颅骨上。对齐颅骨的话，它会陷进发髻或一团卷发里。
- 配饰永远最后画。放在后面，眼镜会被刘海挡住，看起来像一块污渍。

`fly` 是动作，不是姿势。它只靠 CSS 抬升，所以在动画不运行的地方角色是站在地上的。对话气泡会跟着升高，否则抬起的头会穿过气泡。

大小以脚为基准缩放，因为精灵图的原点在脚底。对话气泡也随之升高。

新增发型就是在 `MINI_HAIRS` 里加一条：id、标签，以及 `above`（比颅顶高出几行，对话气泡据此避让），再在 `miniGrid` 里画出那块图板。新增服装是 `MINI_OUTFITS` 里的一条加一段点阵字符串。两者都会直接出现在编辑器的选项里，不需要另外接线。`node scripts/preview-minimi.js` 会重新生成 [docs/minimi-gallery.html](minimi-gallery.html) 这张一览图，交互式衣橱在 `/docs/minimi.html`。
新素材只要以点阵字符串的形式加到对应的分区文件（`src/catalog-floor-*.js`、`catalog-wall.js`、`catalog-effects.js`、`catalog-skills.js`），再到 `catalog-floor.js` 的 `FLOOR_ITEMS` 登记一行，编辑器的调色板里就会自动出现。加一个徽章只要一行，如果是用 PNG 画的，`npm run import` 会转换成点阵字符串。

---

## 链接徽章

→ [怎么添加](../README.zh-CN.md#3-添加链接徽章)

| | |
|---|---|
| 预设 | `link` `blog` `github` `mail` `linkedin` `notion` `velog` `tistory` `youtube` `instagram` `x` `discord` |
| 图标（`icon`） | `link` `mail` `doc` `play` `cam` `chat` `user` `code`（或不用） |

尺寸由 `room.json` 的 `linkScale`（×1~×4）统一决定。只想让某一张不一样的话，在那个链接上直接写 `"scale": 2`。刻度是 0.5，所以点阵永远落在整数像素上。

徽章和房间图是彼此独立的文件，重新导出房间不会影响它们。

---

## 仓库卡片

→ [怎么添加](../README.zh-CN.md#4-添加仓库卡片)

| 主题（`theme`） | 外观 |
|---|---|
| `light` `dark` | 和 GitHub 置顶仓库卡片一致 |
| `pixel` | 点阵：切掉四角像素的 8 位黑白对话框，图标和文字也全是点阵 |
| `zebra` | 斑马：粗黑白条纹边框 |
| `retro` | 70 年代日落：顶部色带，右下角切片状的太阳 |
| `earth` | 地球：满天星的夜空，右下角是地球和绕行的卫星 |
| `y2k` | 全息：彩虹之上叠半透明玻璃板和闪光 |

带花纹的主题会在里面垫一块底板，免得文字被花纹吞掉，卡片因此会略高一点。

`zebra` `retro` `earth` `y2k` 会动：一道光斜着扫过卡片，y2k 的闪光会眨眼，retro 的太阳会明暗变化，earth 的卫星绕着地球转。写 `"sparkle": false` 就只保留花纹去掉动作。浏览器开启了减少动态效果时会自动停下。

| 键 | 范围 | 作用 |
|---|---|---|
| `width` | 240~900 | 文字可用的宽度，描述换行的位置和卡片高度都会变 |
| `scale` | 0.25~4 | 把画好的卡片整体放大 |

想让字变大用 `scale`，想让一行装下更多字用 `width`。
## 西瓜游戏贡献者

| 环境变量 | 默认值 | 作用 |
|---|---|---|
| `SUIKA_THEME` | `suika` | `suika` 原作奶油色、`dark`、`pixel` 点阵 |
| `SUIKA_TITLE` | `Contributors` | 左上角标题（右上角的 `SCORE` 是提交数之和） |
| `SUIKA_LIMIT` | `15` | 装进罐子的人数。调大卡片会变长（堆往上长） |
| `SUIKA_WIDTH` | `520` | 罐子宽度（280~1200） |
| `SUIKA_SCALE` | `1` | 画好的卡片的倍率（0.25~4） |
| `SUIKA_DROP` | `true` | 掉落动画 |
| `SUIKA_NAMES` | `true` | 大球上的 ID（小球不写，字会比球还宽） |
| `TARGET_REPO` | 跑工作流的仓库 | 只在要画的仓库不同时填 |

和仓库卡片不同，`WIDTH` 和 `SCALE` 两个都会把整张卡片放大。球的半径是罐子宽度的比例，所以罐子变宽球也跟着变大，高度就一起长了。想让卡片短一点，就调小 `LIMIT`。

罐子是上面开口的 U 形。墙内侧加了一条亮线，底下铺了阴影来做出厚度，墙顶还盖了一圈边；只描一条线的话看着不像罐子，就是个框。`suika` 和 `dark` 会在球上盖一层玻璃反光，点阵主题去掉了，半透明和点阵不搭。

---

## npm 脚本

| 命令 | 说明 |
|---|---|
| `npm run editor` | README 搭建器服务器（`PORT` 默认 5599） |
| `npm run preview:room` | 示例房间 → `room.svg` |
| `npm run render:room` | 房间 JSON → SVG（参数 `room.json [输出] [标题]`） |
| `npm run render:cards` | 仓库卡片 → SVG（参数 `[cards.json] [输出目录]`） |
| `npm run render:suika` | 西瓜游戏贡献者 → SVG（参数 `owner/repo [输出] [主题]`） |
| `npm run preview:suika` | 西瓜游戏 → `suika.svg`（参数 `owner/repo`、`--theme=all`、`--width=`） |
| `npm run import` | 像素画 PNG → 点阵字符串（参数 `图.png --kind effect`） |
| `node scripts/preview-minimi.js` | 迷你小人总览 → `docs/minimi-gallery.html` |
| `node scripts/build-dotfont.js` | BDF 字体 → 点阵 blob（参数 `<输入.bdf> [输出.dot]`） |
| `npm test` | `node --test` |

---

## 作为代码库使用

```js
import { renderRoom, DEMO_ROOM } from './src/room.js';
import { renderRepoCard } from './src/repocard.js';
import { fetchRepo } from './src/github.js';

// 房间
const svg = renderRoom(DEMO_ROOM, { title: 'my room', scale: 2 });

// 仓库卡片
const repo = await fetchRepo({ owner: 'kimjungminn24', repo: 'cute-readme' });
const card = renderRepoCard(repo, { theme: 'pixel', width: 400 });
```

`renderRoom(data, { title, editable })` 在 `editable: true` 时会附上用于点击判定的透明多边形和 `data-*` 属性（编辑器专用）。

### 缩放

三个渲染器都接受 `scale`：`renderRoom(data, { scale })`、`renderRepoCard(repo, { width, scale })`、`renderLinkBadge(link, { scale })`。

```js
renderRoom(room, { scale: 2 });          // 436×316 的图会以 872×632 导出
renderRoom({ ...room, scale: 2 });       // 写在房间 JSON 里也一样（工作流读的是这边）
renderLinkBadge({ label: 'Blog' }, { scale: 2 });
```

只有 `<svg>` 的 `width`/`height` 按倍数放大，`viewBox` 保持不变：不重画图形，所以文件大小不变，而且是矢量，放大也不会糊。取值会被裁剪到 0.25~4，不是数字的值不会抛错而是退回 1（免得一个拼写错误让工作流挂掉）。实现就是 [src/svg.js](../src/svg.js) 里 `clampScale` 和 `sizeAttrs` 这一对。

`width`（卡片）和缩放不是一回事。它是文字排版的宽度，所以换行和高度都会跟着变。

---

## 目录结构

```
src/catalog.js               素材总出口（重新导出下面的分区文件）
src/catalog-base.js          等距坐标辅助 + 石头颜色
src/catalog-floor.js         地板物品清单（FLOOR_ITEMS）
src/catalog-floor-ai.js      地板物品图形（floor-ai/ 下每件一个文件）
src/catalog-floor-blocks.js  手绘方块物品（矿石、苦力怕、泥土、草方块）
src/catalog-wall.js          墙饰
src/catalog-wall-ai.js       墙饰图形（wall-ai/）
src/catalog-effects.js       特效
src/catalog-skills.js        技能徽章
src/catalog-lines.js         README 生成器的线条贴纸
src/catalog-person.js        角色 API（SHAPES + personArt）
src/catalog-person-face.js   表情、配饰、尺寸
src/person-minimi.js         迷你小人渲染器（发型 × 服装 × 姿势共用锚点）
src/room.js                  房间渲染器（等距摆放 + z 排序）
src/room-*.js                房间部件（styles／geometry／text／weather）
src/pixel.js                 点阵网格 → 合并连续块 → 按颜色输出 path
src/dotfont.js               字形位图 → 点阵 path（点阵主题的文字）
src/iso.js                   等距瓦片常量、明暗
src/svg.js                   XML 转义、宽度计算、换行、输出缩放
src/links.js                 链接徽章渲染器 + 3x5 点阵字体、README 代码片段
src/repocard.js              仓库卡片渲染器 + 语言颜色
src/repocard-themes.js       仓库卡片主题表 + 花纹图形
src/suika.js                 贡献者合成西瓜（尺寸阶梯 + 堆叠物理 + 卡片）
src/github.js                仓库、贡献者和头像查询
src/png.js                   PNG 解码器（只用 node:zlib）
src/ascii.js                 像素网格 ↔ 点阵字符串
src/zip.js                   生成器下载用的 zip 写入器
index.html                   README 生成器页面（入口：readme/readme.js）
readme/                      README 生成器（区块、画板、预览、导出 Markdown）
editor/                      嵌在生成器里的房间编辑器（纯逻辑在 editor-core.js）
scripts/                     CLI 入口
templates/                   Actions 工作流模板
```
