# 레퍼런스

방 JSON 스펙, 카탈로그 목록, 절별 옵션 표, npm 스크립트, 코드로 부르는 법, 파일 구조.

[← README로](../README.ko.md)

| | |
| --- | --- |
| **방** | [방 JSON 스펙](#방-json-스펙) / [카탈로그](#카탈로그) |
| **붙임 요소** | [링크 뱃지](#링크-뱃지) / [리포지토리 카드](#리포지토리-카드) / [수박게임 기여자](#수박게임-기여자) |
| **개발** | [npm 스크립트](#npm-스크립트) / [코드로 쓰기](#코드로-쓰기) / [구조](#구조) |

## 방 JSON 스펙

에디터의 JSON 창에 붙여넣고 `Apply`를 누르면 그대로 반영됩니다.

```jsonc
{
  "v": 1,
  "grid":  { "cols": 8, "rows": 8 },        // 각 4~12 (방이 넓어진다)
  "scale": 1,                                // 출력 배율 0.25~4, 생략하면 1 (그림은 그대로, 크기만 커진다)
  "theme": {
    "wall": "#c4a875", "floor": "#b8945f",
    "wallStyle": "block",                  // 벽 무늬, 생략하면 block (아래 표)
    "floorStyle": "grid"                   // 바닥 무늬, 생략하면 grid (아래 표)
  },
  "weather": "none",                         // 계절 이펙트, 생략하면 none (아래 표)
  "items": [                                 // 바닥 아이템 (lift = 위에 얹힌 높이)
    { "id": "bed", "col": 0, "row": 2, "flip": false }
  ],
  "wallItems": [                             // 벽 장식
    { "id": "window", "wall": "right", "u": 4 }   // wall: "left" | "right"
  ],
  "person": {                                // null이면 사람 없는 방 (에디터의 ✕ Remove)
    "col": 3, "row": 6, "flip": false,
    "skin": "#e8b88a", "hair": "#4a3320",
    "hairStyle": "short",                    // 아래 표 (생략하면 short)
    "outfit": "tee",                         // 아래 표 (생략하면 tee)
    "glasses": false,
    "top": "#3aa0a8", "bottom": "#4a5ba8"    // 신발은 bottom에서 자동으로 뽑는다
  },

  // 글자. 캐릭터에 붙지 않고 아무 칸에나 선다
  "texts": [
    { "text": "hello~", "col": 4, "row": 3, "style": "bubble", "anim": "type" }
  ],
  "effects": [{ "id": "heart", "col": 4, "row": 6 }],
  "skills":  [{ "id": "java", "col": 7, "row": 7 }],

  // 링크 뱃지. 방 그림에는 안 들어가고 links/*.svg로 따로 뽑는다
  "linkScale": 1,                            // 뱃지 배율 (생략하면 1). 한 장만 다르게 하려면 아래 scale
  "links": [
    { "label": "Blog", "url": "https://example.com", "color": "#3aa0a8", "icon": "doc" }
  ]
}
```

카탈로그에 없는 `id`는 조용히 무시되고, 좌표는 격자 범위로 잘립니다. 그리기 순서는 `layer` → 앞쪽 꼭짓점 깊이 순으로 자동 정렬됩니다.

### 위에 쌓기

아이템 위에 다른 걸 올릴 수 있습니다. 이미 뭔가 있는 칸을 클릭하면 에디터가 알아서 그 위에 얹습니다. 쌓은 것 위에 또 쌓아도 됩니다. 끌어서 다른 칸으로 옮기면 그 칸 기준으로 다시 얹히고, 받침이 없는 칸으로 옮기면 바닥으로 내려옵니다.

```jsonc
{ "id": "table", "col": 1, "row": 1 },
{ "id": "books", "col": 1, "row": 1, "lift": 9.6 }  // 탁자 윗면(9.6도트) 위에
```

`lift`는 도트 단위이고 화면에서는 2배입니다. 생략하면 바닥입니다.

받침이 될 수 있는 아이템에는 [src/catalog-floor.js](../src/catalog-floor.js)의 `FLOOR_ITEMS`에 `top`(윗면 높이) 이 적혀 있습니다. `top`이 없는 것(러그, 화분, 고양이처럼 윗면이 평평하지 않은 것)은 받침이 되지 않습니다. 그림을 고치면 이 값도 같이 고쳐야 합니다.

같은 칸에 얹은 것들은 깊이가 같아서 배열 순서가 앞뒤를 정합니다. 나중에 놓은 것이 위로 갑니다.

### 글자

`texts[]`는 칸마다 하나씩 세우는 글자입니다. 캐릭터에 붙지 않으므로 방 안에서 그냥 끌어 옮기면 됩니다. 에디터의 `Text` 패널에서 문구를 적습니다.

생김새(`style`)와 움직임(`anim`)은 따로 고릅니다. 말풍선을 고정해 둘 수도 있고, 상자 없는 맨 글자에 타자 효과를 걸 수도 있습니다.

| `style` | `bubble` `paper` `mint` `rose` `slate`은 말풍선 (색만 다름) / `plain`은 상자 없이 글자만 |
|---|---|
| `anim` | `none` 고정 / `type` 한 글자씩 / `float` 위아래 / `blink` 깜빡임 / `pulse` 커졌다 작아졌다 |

`plain`은 방 무늬 위에 글자가 묻히지 않도록 같은 글자를 굵게 한 번 깔아 광배를 만듭니다.

`type`은 글자를 하나씩 그리는 게 아니라 글자를 덮는 `<clipPath>`를 왼쪽 밖에서 제자리로 밀어 넣는 방식입니다. `<img>`로 넣은 SVG는 스크립트가 죽지만 CSS 애니메이션은 살아 있어서 README에서도 계속 돕니다. 두 줄짜리 문구는 윗줄을 다 찍은 뒤 아랫줄이 이어집니다.

> 배경색 덮개를 씌우는 방법이 더 쉽지만 두 가지가 걸립니다. `plain`에는 덮을 색이 없고, 애니메이션이 안 도는 환경에서 글자가 영영 가려집니다. 클립은 제자리가 "전부 보임"이라 최악의 경우에도 글자는 읽힙니다.

> `person.bubble`(캐릭터 머리에 붙는 옛 방식)과 `bubbles[]`(`texts[]`의 옛 이름)도 그대로 읽힙니다. 예전에 만든 `room.json`이 깨지지 않게 남겨둔 것으로, 에디터는 열 때 옛 말풍선을 `texts[]`로 옮깁니다.

---

## 카탈로그

| 종류 | id |
|---|---|
| 바닥 아이템 | `teddy` `dog` `mushroom` `snowman` `donut` `bunny` `penguin` `gift` `rainbow` `bigheart` `ribbon` `ducky` `frog` `dino` `ghost` `rug` `bed` `chest` `bookshelf` `ore` `creeper` `dirt` `grassblock` `table` `desk` `tv` `fridge` `plant` `lamp` `stool` `drawer` `cactus` `sofa` `books` `turntable` `grass` `flowers` `tree` `sakura` |
| 받침이 되는 아이템 (`top` 있음) | `bed` `chest` `ore` `dirt` `grassblock` `table` `desk` `fridge` `stool` `drawer` `books` |
| 벽 장식 | `window` `painting` |
| 이펙트 | `heart` `note` `zzz` `sweat` `star` `question` `exclaim` |
| 스킬 뱃지 | `java` `js` `ts` `python` `go` `react` `git` `docker` `claude` `vue` `rust` `kotlin` `c` `sql` `html` |
| 벽 무늬 (`theme.wallStyle`) | `block` `brick` `plank` `stripe` `panel` `tile` `plain` `solid` `none` |
| 바닥 무늬 (`theme.floorStyle`) | `grid` `tile` `checker` `plank` `brick` `plain` `solid` `none` |
| 계절 (`weather`) | `none` `sakura` `snow` `rain` `leaves` `hearts` `fireflies` `bubbles` |

무늬 없는 것이 셋입니다. `plain`은 밑색에 얼룩 질감이 남고, `solid`는 색만 있는 완전한 단색, `none`은 아예 안 그립니다(투명).

`none`은 그 부분이 투명하게 비어서 README의 배경이 그대로 비칩니다.

| `wallStyle` | `floorStyle` | 결과 |
|---|---|---|
| `none` | 그대로 | 벽만 사라짐, 바닥 위에 놓인 모양 |
| 그대로 | `none` | 바닥만 사라짐 |
| `none` | `none` | 배경 완전 투명, 아이템과 캐릭터만 스티커처럼 |

배경을 지우면 GitHub의 라이트/다크 모드에 저절로 맞습니다. 색 있는 사각형이 아니라 방 안의 물건만 남기 때문입니다. 파일도 훨씬 작아집니다. 데모 방 기준 `104KB → 21KB`.

벽 장식(`window` `painting` …)은 벽을 껐어도 그대로 그려집니다. 벽 없이 액자만 떠 있는 게 싫으면 벽 장식도 같이 지우세요.

### 계절

`weather`는 벚꽃잎, 눈, 비 같은 계절 겹을 방 전체에 뿌립니다. 아이템이나 벽 장식이 아니라 화면 맨 앞에 깔리는 겹이라 어떤 방에도 그대로 얹힙니다. 계절마다 하나씩 갈아 끼우면 프로필이 저절로 새로 보입니다.

| `weather` | 내리는 것 |
|---|---|
| `sakura` | 분홍 꽃잎 36장, 좌우로 크게 흔들리며 천천히 |
| `snow` | 흰 눈 46송이, 더 느리게 떠다니듯 |
| `rain` | 빗줄기 52개, 흔들림 없이 곧게 |
| `leaves` | 따뜻한 네 색 낙엽 30장, 꽃잎보다 조금 빠르게 뒹굴며 |
| `hearts` | 분홍 하트 20개, 느긋하게 가라앉듯 |
| `fireflies` | 반딧불 18점, 떨어지지 않고 제자리에서 깜빡이며 흔들림 |
| `bubbles` | 비눗방울 22개, 유일하게 아래가 아니라 위로 떠오름 |

떨어지는 속도, 흔들리는 폭, 시작 위치가 입자마다 달라서 줄 맞춰 내리지 않습니다. 움직임을 끈 환경에서는 흩뿌려진 첫 장면이 그대로 남습니다.

### 캐릭터

| 항목 | 값 |
|---|---|
| 머리 (`person.hairStyle`) | `bob` `short` `long` `ponytail` `bun` `pigtails` `curly` `bald` |
| 의상 (`person.outfit`) | `tee` `hoodie` `cardigan` `dress` `shirt` `overalls` `sweater` `blazer` `track` `sailor` `apron` `pajama` `vest` `coat` |
| 자세 (`person.pose`) | `stand` `sit` `back` |
| 움직임 (`person.anim`) | `none` `bob` `fly` |
| 악세사리 (`person.accessory`) | `none` `glasses` `crown` `wand` `sword` `catEars` |
| 표정 (`person.expression`) | `normal` `smile` `wink` `surprised` `sleepy` |
| 크기 (`person.size`) | `small` `normal` `big` |
| 색 (`person.skin` `person.hair` `person.top` `person.bottom`) | 아무 hex나 됩니다. 넷은 서로 독립입니다 |
| 모양 (`person.shape`) | 예전 방 파일이 그대로 열리도록 남겨둔 항목입니다. `pixel` `chibi` `round` `square` `stick` 모두 같은 미니미로 그려집니다 |

머리 12종 × 의상 14종 × 자세 5종, 조합에 빈칸이 없습니다. 모르는 이름이 들어오면 실패하지 않고 `bob` · `tee` · `stand` 으로 내려갑니다.

### 미니미를 그리는 방식

캐릭터는 [src/person-minimi.js](../src/person-minimi.js) 안의 모듈식 그림 하나입니다. 머리 · 피부 · 옷 · 팔다리 · 표정 · 악세사리가 같은 앵커 위에 각각 따로 찍히기 때문에, 옷을 갈아입혀도 얼굴이 다시 그려지지 않고 머리색을 바꿔도 상의는 건드리지 않습니다.

예전에는 모양이 다섯 개(`round` `square` `stick` `chibi` `pixel`)였고 각자 자기 두상에 맞춘 머리 세트를 따로 들고 있었습니다. 그중 `pixel` 은 머리 × 의상 조합마다 통짜 그림을 저장하는 방식이라, 옷장을 자유롭게 섞을 수 없었고 표정과 앉기가 먹지 않았습니다. 앵커를 공유하는 몸 하나가 이 전부를 대신합니다.

겹치는 순서는 옷, 팔, 얼굴, 머리입니다. 팔을 옷보다 나중에 그리는 건 깃이나 밑단이 팔을 잘라먹지 않게 하기 위해서입니다. 앞쪽 옆면에는 좁은 솔기와 조금 낮은 어깨가 들어가는데, 정면으로 선 인물이 아니라 방 쪽으로 살짝 돌아선 것처럼 보이게 하는 장치입니다.

앉으면 머리와 상체가 다섯 줄 내려가고 발은 그대로 있습니다. 앉은 캐릭터도 처음 놓은 바닥 칸 위에 그대로 앉아 있게 됩니다.

악세사리가 붙는 자리는 눈대중이 아니라 좌표로 못박혀 있습니다. [src/catalog-person.js](../src/catalog-person.js) 의 `SHAPES` 에 있습니다. `eyeRow`(10), `mouthRow`(15), `crownSink`(머리에 쓰는 물건이 얼마나 파묻히는지, 1), `hand`(6번째 줄 7번째 칸) 입니다.

- 그림은 자기 기준점만 적습니다. 손에 드는 물건은 `grip: [줄, 칸]` 으로 잡히는 지점을 들고 다니고, 그래서 손잡이가 손바닥에 들어가고 날이 위로 섭니다.
- 왕관은 두상이 아니라 머리카락 위에 앉습니다. 두상에 맞추면 쪽진 머리나 곱슬 뭉치 속으로 파묻힙니다.
- 악세사리는 항상 맨 마지막에 그립니다. 뒤에 두면 안경이 앞머리에 가려 얼룩처럼 보입니다.

`fly` 는 자세가 아니라 움직임입니다. CSS 로만 띄우기 때문에 애니메이션이 안 도는 환경에서는 바닥에 서 있습니다. 말풍선도 같이 올라가는데, 안 그러면 떠오른 머리가 말풍선을 뚫습니다.

크기는 발을 기준으로 커집니다. 스프라이트의 원점이 발끝이기 때문입니다. 말풍선도 따라 올라갑니다.

머리를 새로 넣으려면 `MINI_HAIRS` 에 항목 하나를 더합니다. id, 라벨, 그리고 두상보다 몇 줄 솟는지 적는 `above`(말풍선이 이 값을 보고 비켜줍니다) 입니다. 여기에 `miniGrid` 에 그 판을 그리면 됩니다. 의상은 `MINI_OUTFITS` 에 항목 하나와 도트 문자열 한 덩어리입니다. 둘 다 따로 연결할 것 없이 에디터 칩에 바로 뜹니다. `node scripts/preview-minimi.js` 로 [docs/minimi-gallery.html](minimi-gallery.html) 컨택트시트를 다시 만들고, 대화형 옷장은 `/docs/minimi.html` 입니다.
새 아이템은 구역 파일(`src/catalog-floor-*.js`, `catalog-wall.js`, `catalog-effects.js`, `catalog-skills.js`)에 도트 문자열로 그리고 `catalog-floor.js`의 `FLOOR_ITEMS`에 한 줄 등록하면 에디터 팔레트에도 자동으로 뜹니다. 뱃지 하나 추가하는 건 한 줄이고, PNG로 그렸다면 `npm run import`이 도트 문자열로 바꿔줍니다.

---

## 링크 뱃지

→ [붙이는 법](../README.ko.md#3-링크-뱃지-붙이기)

| | |
|---|---|
| 프리셋 | `link` `blog` `github` `mail` `linkedin` `notion` `velog` `tistory` `youtube` `instagram` `x` `discord` |
| 아이콘 (`icon`) | `link` `mail` `doc` `play` `cam` `chat` `user` `code` (또는 없음) |

크기는 `room.json`의 `linkScale`(×1~×4)로 전체에 한 벌로 걸립니다. 한 장만 다르게 뽑고 싶으면 그 링크에 `"scale": 2`를 직접 적으면 됩니다. 0.5 눈금이라 도트가 항상 정수 픽셀로 떨어집니다.

뱃지는 방 그림과 별개의 파일이라 방을 다시 뽑아도 영향받지 않습니다.

---

## 리포지토리 카드

→ [붙이는 법](../README.ko.md#4-리포지토리-카드-붙이기)

| 테마 (`theme`) | 모양 |
|---|---|
| `light` `dark` | GitHub 고정 리포 카드 그대로 |
| `pixel` | 도트: 모서리 픽셀을 잘라낸 8비트 흑백 대화상자, 아이콘과 글자까지 전부 도트 |
| `zebra` | 얼룩말: 굵은 흑백 줄무늬 테두리 |
| `retro` | 70년대 석양: 위에 색 띠, 오른쪽 아래에 썰어 낸 해 |
| `earth` | 지구: 별 뜬 밤하늘, 오른쪽 아래 지구와 궤도를 도는 위성 |
| `y2k` | 홀로그램: 무지개 위에 반투명 유리판과 반짝이 |

무늬 테마는 글자가 무늬에 묻히지 않게 안쪽에 판을 한 장 깔고, 그만큼 카드가 조금 높아집니다.

`zebra` `retro` `earth` `y2k`는 움직입니다. 빛줄기가 카드를 비스듬히 훑고, y2k는 반짝이가 깜빡이고, retro는 해가 은은해지고, earth는 위성이 지구를 돕니다. `"sparkle": false`로 끄면 무늬는 그대로 남고 움직임만 빠집니다. 브라우저에 동작 줄이기가 켜져 있으면 알아서 멈춥니다.

| 키 | 범위 | 설명 |
|---|---|---|
| `width` | 240~900 | 글이 놓이는 폭. 설명이 접히는 자리와 카드 높이까지 달라집니다 |
| `scale` | 0.25~4 | 다 그린 카드를 통째로 늘립니다 |

글씨를 크게 하고 싶으면 `scale`, 한 줄에 더 담고 싶으면 `width`입니다.
## 수박게임 기여자

| 환경변수 | 기본값 | 설명 |
|---|---|---|
| `SUIKA_THEME` | `suika` | `suika` 원작 크림색, `dark`, `pixel` 도트 |
| `SUIKA_TITLE` | `Contributors` | 왼쪽 위 제목 (오른쪽 위 `SCORE`는 커밋 수의 합) |
| `SUIKA_LIMIT` | `15` | 통에 담을 인원. 늘리면 카드가 길어집니다 (더미가 위로 쌓이므로) |
| `SUIKA_WIDTH` | `520` | 통 폭 (280~1200) |
| `SUIKA_SCALE` | `1` | 다 그린 카드의 배율 (0.25~4) |
| `SUIKA_DROP` | `true` | 떨어지는 연출 |
| `SUIKA_NAMES` | `true` | 큰 알 위 아이디 (작은 알은 글자가 알보다 넓어져서 안 붙습니다) |
| `TARGET_REPO` | 워크플로가 도는 리포 | 그릴 리포가 다를 때만 |

`WIDTH`와 `SCALE`은 리포 카드와 달리 둘 다 카드를 통째로 키웁니다. 알 반지름이 통 폭에 대한 비율이라, 폭을 키우면 알도 같이 커져서 가로세로가 함께 늘어납니다. 카드 길이를 줄이고 싶으면 `LIMIT`을 줄이세요.

통은 위가 열린 U자입니다. 벽 안쪽에 밝은 선을 덧대고 바닥에 그늘을 깔아 두께를 냈고, 벽 위에는 테를 얹었습니다. 선 하나만 두르면 통이 아니라 그냥 테두리로 보입니다. `suika`와 `dark`는 알 위로 유리 반사가 한 겹 지나가고, 도트 테마는 반투명이 안 어울려서 뺐습니다.

---

## npm 스크립트

| 명령 | 설명 |
|---|---|
| `npm run editor` | 리드미 빌더 서버 (`PORT` 기본 5599) |
| `npm run preview:room` | 데모 방 → `room.svg` |
| `npm run render:room` | 방 JSON → SVG (인자로 `room.json [출력] [제목]`) |
| `npm run render:cards` | 리포 카드 → SVG (인자로 `[cards.json] [출력폴더]`) |
| `npm run render:suika` | 기여자 수박게임 → SVG (인자로 `owner/repo [출력] [테마]`) |
| `npm run preview:suika` | 수박게임 → `suika.svg` (인자로 `owner/repo`, `--theme=all`, `--width=`) |
| `npm run import` | 픽셀아트 PNG → 도트 문자열 (인자로 `그림.png --kind effect`) |
| `node scripts/preview-minimi.js` | 미니미 모음표 → `docs/minimi-gallery.html` |
| `node scripts/build-dotfont.js` | BDF 글꼴 → 도트 블롭 (인자로 `<입력.bdf> [출력.dot]`) |
| `npm test` | `node --test` |

---

## 코드로 쓰기

```js
import { renderRoom, DEMO_ROOM } from './src/room.js';
import { renderRepoCard } from './src/repocard.js';
import { fetchRepo } from './src/github.js';

// 방
const svg = renderRoom(DEMO_ROOM, { title: 'my room', scale: 2 });

// 리포 카드
const repo = await fetchRepo({ owner: 'kimjungminn24', repo: 'cute-readme' });
const card = renderRepoCard(repo, { theme: 'pixel', width: 400 });
```

`renderRoom(data, { title, editable })`은 `editable: true`면 클릭 판정용 투명 폴리곤과 `data-*` 속성이 붙습니다(에디터 전용).

### 크기 조절

세 렌더러가 다 `scale`을 받습니다. `renderRoom(data, { scale })`, `renderRepoCard(repo, { width, scale })`, `renderLinkBadge(link, { scale })`.

```js
renderRoom(room, { scale: 2 });          // 436×316 그림이 872×632로 나간다
renderRoom({ ...room, scale: 2 });       // 방 JSON에 실어도 같다 (워크플로는 이쪽을 읽는다)
renderLinkBadge({ label: 'Blog' }, { scale: 2 });
```

`<svg>`의 `width`/`height`만 배율만큼 늘리고 `viewBox`는 그대로 둡니다. 도형을 다시 그리지 않으므로 파일 크기가 변하지 않고, 벡터라 확대해도 뭉개지지 않습니다. 0.25~4로 잘리고, 숫자가 아닌 값은 던지지 않고 1로 떨어집니다(워크플로가 오타 하나로 죽지 않게). 구현은 [src/svg.js](../src/svg.js)의 `clampScale`과 `sizeAttrs` 한 쌍이 전부입니다.

`width`(카드)는 배율과 다릅니다. 글이 놓이는 폭이라 줄바꿈과 높이까지 달라집니다.

---

## 구조

```
src/catalog.js               카탈로그 배럴 (아래 구역 파일을 다시 내보냄)
src/catalog-base.js          아이소메트릭 좌표 헬퍼 + 돌 색
src/catalog-floor.js         바닥 아이템 목록 (FLOOR_ITEMS)
src/catalog-floor-ai.js      PixelLab로 만든 바닥 아이템 그림 (floor-ai/에 하나씩)
src/catalog-floor-blocks.js  손으로 그린 블록 아이템 (광석, 크리퍼, 흙, 잔디 블록)
src/catalog-wall.js          벽 장식
src/catalog-wall-ai.js       PixelLab로 만든 벽 장식 그림 (wall-ai/)
src/catalog-effects.js       이펙트
src/catalog-skills.js        스킬 뱃지
src/catalog-lines.js         리드미 빌더의 줄 스티커
src/catalog-person.js        캐릭터 API (SHAPES + personArt)
src/catalog-person-face.js   표정, 소품, 크기
src/person-minimi.js         미니미 렌더러 (머리 × 옷 × 자세를 공통 기준점에 찍음)
src/room.js                  방 렌더러 (아이소메트릭 배치 + z정렬)
src/room-*.js                방 조각 (styles, geometry, text, weather)
src/pixel.js                 도트 격자 → 런 병합 → 색상별 path
src/dotfont.js               글자 비트맵 → 도트 path (도트 테마의 글자)
src/iso.js                   아이소메트릭 타일 상수, 명암
src/svg.js                   XML 이스케이프, 폭 계산, 줄바꿈, 출력 배율
src/links.js                 링크 뱃지 렌더러 + 3x5 도트 폰트, README 스니펫
src/repocard.js              리포지토리 카드 렌더러 + 언어색
src/repocard-themes.js       리포 카드 테마 표 + 무늬 도형
src/suika.js                 기여자 수박게임 (크기 사다리 + 쌓기 물리 + 카드)
src/github.js                리포, 기여자, 아바타 조회
src/png.js                   PNG 디코더 (node:zlib만 사용)
src/ascii.js                 픽셀 격자 ↔ 도트 문자열
src/zip.js                   빌더 다운로드용 zip 작성기
index.html                   리드미 빌더 페이지 (엔트리: readme/readme.js)
readme/                      리드미 빌더 (블록, 보드, 미리보기, 마크다운 내보내기)
editor/                      빌더 안에 들어가는 방 편집기 (순수 로직은 editor-core.js)
scripts/                     CLI 진입점
templates/                   Actions 워크플로 템플릿
```
