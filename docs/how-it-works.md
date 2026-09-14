# How it works

Why cute-readme made the choices it did. You do not need any of this to use it; read it if you want to change it or contribute.

[← back to the README](../README.md)

## Text in the pixel theme

`pixel` draws text **as dots**, not as `<text>`. Descriptions in any script come out as dots everywhere.

An SVG loaded through `<img>` only gets **the fonts installed on the viewer's machine**. Pixel fonts for CJK are rarely installed, so naming a font would leave the repo name in dots while the description falls back to a normal serif. So the trick the link badges use for Latin text, drawing letters as shapes, was extended to full-width scripts.

The glyph bitmaps live in [assets/galmuri11.dot](../assets/galmuri11.dot): a 340KB blob baked from the BDF of [Galmuri11](https://github.com/quiple/galmuri) (SIL OFL 1.1), keeping only Hangul syllables, ASCII and jamo. The workflow and the editor read it and pass it as `renderRepoCard(repo, { dots })`. **The card still renders if it cannot be read**: it quietly falls back to `<text>`.

A line containing glyphs the font does not have (Han characters, emoji) is drawn with `<text>` as a whole line. Mixing the two within a line looks worse, because the letter heights stop matching.

> Because the text is shapes, no words remain in the SVG body. `<title>` and `aria-label` carry `owner/repo` instead, so screen readers and search still find it.

To bake the blob again, grab `Galmuri11.bdf` from the [releases](https://github.com/quiple/galmuri/tree/main/dist):

```bash
node scripts/build-dotfont.js Galmuri11.bdf assets/galmuri11.dot
```

Repos that do not exist, or entries that are not in `owner/repo` form, are skipped and the rest of the cards are refreshed as usual. If there is no `cards.json` at all, the workflow does nothing and moves on.

Transferred repos are drawn under their **current name** (write `facebook/react` and the card and link come out as `react/react`), because the GitHub API reports the redirect.

To preview locally:

```bash
npm run render:cards -- cards.json cards
```
## Who gets the big ball

GitHub does the ranking. `GET /repos/{owner}/{repo}/contributors` returns **a list already sorted by commit count**, each entry carrying `login`, `avatar_url` and `contributions` (the commit count).

Sizes come from that count **flattened by a logarithm**. Scale it linearly and 20 commits next to 500 is 0.04, so everyone but first place lands on the smallest size. Most old repos look like that, and the jar fills with grit. A log keeps 20 commits somewhere in the middle: the gap survives and there is still a picture.

**Rank then caps it.** Second place stops two steps below the top no matter how many commits it has, third place three steps below. Repos where first and second are neck and neck are common (`facebook/react` is one), and two largest balls break the original's ladder and stretch the jar with it. Few commits still fall well under the cap: second place at 1/400 of first is a small ball regardless.

Bot accounts (`dependabot[bot]` and friends) are dropped. Their commit counts dwarf humans and they fill the jar on their own.

Profile pictures are **baked into the SVG as base64.** An SVG that enters a README through `<img>` cannot fetch anything from outside, so a bare URL would leave every ball an empty circle. Anyone whose picture could not be fetched gets the first letter of their login instead.

The preview and the examples from `npm run preview:suika` use **shape avatars with no people in them** (`sampleAvatar`). They are the same patterns GitHub puts on accounts without a photo, with colours spun by the golden angle so neighbours stay far apart. There is no reason to bake a stranger's face into an example. To see how real photos crop, run `npm run preview:suika -- owner/repo`.

---

## How the pile forms

**Physics runs once, at draw time.** An SVG that reaches a README through `<img>` has its scripts killed, so nothing can be simulated in the browser. Instead Node drops the balls one at a time, biggest first, bakes the resulting coordinates into the SVG, and **fakes only the falling, with a CSS animation.**

Dropping straight down alone leaves balls frozen on someone's shoulder, which reads as pasted on rather than stacked. So a ball that lands on another **rolls down the slope** until it touches in two places or reaches the floor.

The packing seed comes **only from the contributor list**. With a random seed, the daily workflow would recommit an SVG whose commit counts had not changed and whose coordinates had merely jiggled. The theme stays out of the seed; mixing it in would make picking a theme reroll the packing instead.

---

## Why the turntable does not spin

The room's turntable is isometric, so its platter is a slanted ellipse. Rotating an ellipse made of dots turns the staircase edges with it and looks filthy. So the platter stays put and only the label flips through four frames with `scaleX`.
