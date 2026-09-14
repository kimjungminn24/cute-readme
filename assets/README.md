# assets

## galmuri11.dot

도트 테마(`pixel`)가 글자를 도트로 찍을 때 쓰는 글자 비트맵입니다.
[Galmuri11](https://github.com/quiple/galmuri)의 BDF에서 필요한 구간만 추려 구웠습니다.

- 담긴 글자: ASCII, 라틴 확장, 붙임표와 따옴표, 한글 낱자, 한글 음절 11,172자 (총 11,811자)
- 굽는 법: `node scripts/build-dotfont.js <Galmuri11.bdf> assets/galmuri11.dot`
- 원본 BDF는 리포에 두지 않습니다 (2.9MB). [배포 페이지](https://github.com/quiple/galmuri/tree/main/dist)에서 받으세요.

글꼴은 **SIL Open Font License 1.1**. 전문은 [Galmuri-OFL.md](Galmuri-OFL.md).
Copyright (c) 2019–2025 Lee Minseo (quiple@quiple.dev)
