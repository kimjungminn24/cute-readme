<div align="center">

<img src="./docs/stickers/items-rainbow.svg" width="38" height="32.82" alt="Rainbow"> ${\color{#c05b76}\huge \textbf{cute readme}}$ <img src="./docs/stickers/items-ribbon.svg" width="36" height="34.56" alt="Ribbon">

<img src="./docs/stickers/lines-lace-x19.svg" width="100%" alt="">

[English](README.md) | **한국어** | [简体中文](README.zh-CN.md)

make your GitHub profile a tiny pixel home

깃허브 프로필용 픽셀 도구 모음입니다. 미니룸 에디터, 블록으로 쌓는 리드미 빌더, 링크 뱃지, 저장소 카드, 기여자 그래프가 들어 있습니다.

<img src="./docs/room.svg" width="80%" alt="mini-room">

[빌더](https://kimjungminn24.github.io/cute-readme/)에서 `+ miniroom` 블록을 놓고 `Make a room` 을 누르세요. `Items` 탭에서 가구를 골라 바닥에 놓고, 색을 고르고, 말풍선을 답니다. `room.svg` 로 나옵니다.

`Contribution Grass` 는 GitHub 잔디를 바닥에 깔아 줍니다. [templates/grass.yml](templates/grass.yml) 을 `.github/workflows/grass.yml` 로 복사하면 하루 한 번 `room.svg` 속 잔디를 최신으로 다시 그립니다.

## Assemble your README

<img src="./docs/assemble.png" width="100%" alt="리드미 빌더">

블록을 쌓습니다. 제목, 글, 그림, 스티커, 방, 뱃지, 카드. 끌어서 순서를 바꾸고, 옆에 떨어뜨리면 단이 됩니다. `Download README.md` 를 누르면 그림까지 zip 으로 받습니다.

## Add link badges

<img src="./docs/sample-link-github.svg" height="22" alt="GitHub"> <img src="./docs/sample-link-blog.svg" height="22" alt="Blog"> <img src="./docs/sample-link-mail.svg" height="22" alt="Mail"> <img src="./docs/sample-link-linkedin.svg" height="22" alt="LinkedIn"> <img src="./docs/sample-link-notion.svg" height="22" alt="Notion"> <img src="./docs/sample-link-velog.svg" height="22" alt="velog"> <img src="./docs/sample-link-youtube.svg" height="22" alt="YouTube"> <img src="./docs/sample-link-discord.svg" height="22" alt="Discord">

`+ link badges` 블록을 놓고 프리셋을 고르거나 이름과 주소를 직접 적습니다.

## Add repository cards

<a href="https://github.com/kimjungminn24/cute-readme"><img src="./docs/sample-card-cute-readme.svg" alt="kimjungminn24/cute-readme"></a>

`+ repo cards` 블록을 놓고 `owner/repo` 를 적습니다. 위 카드는 `pixel` 테마입니다.

## Add a music card

<img src="./docs/sample-music.svg" alt="Now playing"> <img src="./docs/sample-music-square.svg" alt="Now playing, square">

`+ music` 블록에 유튜브 링크를 붙여 넣으세요. `Load`를 누르면 제목과 영상 썸네일을 가져옵니다. 썸네일을 가져오지 못하면 픽셀 커버로 대신 그립니다. 모양은 `wide`와 `square` 중에 고를 수 있습니다. 카드를 누르면 영상으로 이동하고, 따로 돌아가는 워크플로는 없습니다.

## CONTRIBUTORS

<img src="./docs/suika.svg" width="520" alt="기여자">

## Guestbook

<img src="./docs/sample-guestbook.svg" width="520" alt="방명록">

방문자가 GitHub Discussion에 댓글을 달면, 프로필 사진과 이름이 함께 README 방명록에 올라갑니다.

> **Discussions를 먼저 켜야 합니다.** 기본으로 꺼져 있고, 꺼져 있으면 워크플로가 방명록 글을 찾지 못합니다.

1. Settings > General > Features에서 Discussions를 켭니다.
2. 제목에 `Guestbook`이 들어간 글을 하나 만듭니다. Announcements 카테고리를 추천합니다. 새 글은 나만 쓸 수 있고 댓글은 누구나 달 수 있습니다.
3. [templates/guestbook.yml](templates/guestbook.yml)을 `.github/workflows/guestbook.yml`로 복사합니다. 댓글이 달릴 때마다 `guestbook.svg`를 다시 그립니다.

방문자가 어디에 쓰면 되는지 알 수 있게 이미지를 글에 연결해 두세요.

```html
<a href="https://github.com/YOU/YOU/discussions/1"><img src="./guestbook.svg" width="100%" alt="방명록"></a>
```

방명록에서 내리고 싶은 글은 Discussion에서 댓글을 숨기면 됩니다. 다음 실행 때 빠집니다.

GitHub은 댓글을 단 사람을 그 글에 자동으로 구독시킵니다. 그래서 먼저 쓴 방문자는 새 글이 올라올 때마다 알림을 받습니다. 다른 사람의 알림은 대신 꺼 줄 수 없으니, 방명록 글 본문에 끄는 방법을 적어 두면 좋습니다.

```md
댓글을 남기면 이 글의 알림이 켜져요. 알림이 싫으면 오른쪽 **Unsubscribe**를 눌러 주세요.
```

## When something does not work

- 그림이 안 보이면: `./room.svg` 처럼 상대 경로인지, 파일을 커밋했는지 봅니다.
- 눌러도 안 열리면: 그림 전체를 `<a>` 로 감쌌는지 봅니다. SVG 안의 `<a>` 는 무시됩니다.
- 안 움직이면: 브라우저나 OS 에서 동작 줄이기가 켜져 있는지 봅니다.

## Docs

방 JSON, 카탈로그, 모든 옵션은 [레퍼런스](docs/reference.ko.md) 에 있습니다 · [어떻게 만들었나](docs/how-it-works.ko.md) · [미니미](docs/minimi.md)

## License

MIT ([LICENSE](LICENSE)). [assets/galmuri11.dot](assets/galmuri11.dot) 만 [Galmuri11](https://github.com/quiple/galmuri) 글꼴에서 왔고 SIL OFL 1.1 을 따릅니다. 이 도구가 만든 SVG 에는 아무 제약이 없습니다.

<img src="./docs/stickers/lines-hearts-x38.svg" width="100%" alt="">

</div>
