import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../readme/readme-blocks.js';
import '../readme/readme-embeds.js';
import '../readme/readme-stickers.js';
import { app, BLOCKS } from '../readme/readme-shared.js';
import { row } from '../readme/readme-doc.js';
import { markdown, rowMode, esc, texEscape } from '../readme/readme-markdown.js';
import { DEMO_ROOM } from '../src/room.js';

const md = (...rows) => {
  app.doc = rows;
  return markdown();
};

const fresh = (type, extra = {}) => ({ type, ...BLOCKS[type].fresh(), ...extra });

test('escaping covers markup and TeX', () => {
  assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  assert.equal(texEscape('a_b#c\\d{e}'), 'a\\_b\\#c\\textbackslash d\\{e\\}');
});

test('plain blocks come out as markdown, aligned ones as HTML', () => {
  assert.equal(md(row(fresh('heading', { level: 2, text: 'Work' }))), '## Work\n');
  assert.equal(
    md(row(fresh('heading', { level: 1, text: 'Hi <you>', align: 'center' }))),
    '<h1 align="center">Hi &lt;you&gt;</h1>\n',
  );
  assert.equal(md(row(fresh('text', { text: '  hello  ' }))), 'hello\n');
  assert.equal(md(row(fresh('text', { text: 'a\nb', align: 'right' }))), '<p align="right">a<br>b</p>\n');
  assert.equal(md(row(fresh('list', { text: 'one\ntwo' }))), '- one\n- two\n');
  assert.equal(md(row(fresh('divider'))), '---\n');
  assert.equal(md(row(fresh('spacer', { lines: 3 }))), '<br><br><br>\n');
});

test('a colour banner is TeX, and its text is TeX-escaped', () => {
  const b = fresh('banner', { text: 'C_lang & co', color: '#c05b76', size: 'big', align: 'center' });
  assert.equal(md(row(b)), '$${\\color{#c05b76}\\Large \\textsf{C\\_lang \\& co}}$$\n');
  b.align = 'left';
  assert.equal(md(row(b)), '${\\color{#c05b76}\\Large \\textsf{C\\_lang \\& co}}$\n');
  b.align = 'right';
  assert.match(md(row(b)), /^<div align="right">\n\n\$\{.*\}\$\n\n<\/div>\n$/);
});

test('an image by url or by file, and the file it ships', () => {
  const byUrl = fresh('image', { src: 'https://x/y.png', width: 320, align: 'center' });
  assert.equal(md(row(byUrl)), '<p align="center"><img src="https://x/y.png" width="320" alt=""></p>\n');
  byUrl.align = 'left';
  assert.equal(md(row(byUrl)), '<img src="https://x/y.png" width="320" alt="">\n');

  const byFile = fresh('image', { width: 480, file: { name: 'shot.png', uri: 'data:image/png;base64,AQID' } });
  assert.equal(md(row(byFile)), '<p align="center"><img src="assets/images/shot.png" width="480" alt=""></p>\n');
  const [file] = BLOCKS.image.files(byFile);
  assert.equal(file.name, 'assets/images/shot.png');
  assert.deepEqual([...file.data], [1, 2, 3]);

  assert.equal(md(row(fresh('image'))), '\n', 'an empty image block writes nothing');
});

test('rows pick a layout: table, float, flank, or a line of pictures', () => {
  const pic = () => fresh('image', { src: 'https://x/p.png', width: 200 });
  const txt = (t) => fresh('text', { text: t });

  const table = { id: 't', cells: [[txt('left')], [txt('right')]] };
  assert.equal(rowMode(table), 'table');
  assert.equal(
    md(table),
    '<table>\n<tr>\n<td valign="top" width="50%">\n\nleft\n\n</td>\n<td valign="top" width="50%">\n\nright\n\n</td>\n</tr>\n</table>\n',
  );

  const float = { id: 'f', cells: [[pic()], [txt('beside')]] };
  assert.equal(rowMode(float), 'float-left');
  assert.equal(md(float), '<img align="left" src="https://x/p.png" width="200" alt="">\n\nbeside\n\n<br clear="both">\n');

  const flank = { id: 'k', cells: [[pic()], [txt('middle')], [pic()]] };
  assert.equal(rowMode(flank), 'flank');
  assert.match(md(flank), /^<img align="left" [^>]*><img align="right" [^>]*>\n\nmiddle\n\n<br clear="both">\n$/);

  const pics = { id: 'p', cells: [[pic()], [pic()]] };
  assert.equal(rowMode(pics), 'pictures');
  assert.equal(md(pics), '<p align="center">\n  <img src="https://x/p.png" width="200" alt="">\n  <img src="https://x/p.png" width="200" alt="">\n</p>\n');
});

test('link badges skip untouched presets and point into assets/links', () => {
  const b = fresh('links', {
    items: [
      { label: 'Blog', url: 'https://a.dev', color: '#3aa0a8', fg: '#ffffff', icon: 'doc' },
      { label: 'Mail', url: 'mailto:', color: '#d97757', fg: '#ffffff', icon: 'mail' },
      { label: 'X "q"', url: 'https://x.com/me', color: '#1e1e1e', fg: '#ffffff', icon: null },
    ],
  });
  assert.equal(
    md(row(b)),
    '<p align="center">\n  <a href="https://a.dev"><img src="assets/links/blog.svg" alt="Blog"></a>\n'
    + '  <a href="https://x.com/me"><img src="assets/links/x-q.svg" alt="X &quot;q&quot;"></a>\n</p>\n',
  );
  const files = BLOCKS.links.files(b);
  assert.deepEqual(files.map((f) => f.name), ['assets/links/blog.svg', 'assets/links/x-q.svg']);
  assert.match(files[0].data, /^<svg /);
});

test('repo cards link to GitHub and ship one SVG each', () => {
  const repo = { owner: 'o', name: 'My Repo', description: 'd', language: 'JavaScript', stars: 3, forks: 1 };
  const b = fresh('repocards', { repos: [repo], align: 'left' });
  assert.equal(md(row(b)), '<a href="https://github.com/o/My Repo"><img src="assets/cards/my-repo.svg" alt="o/My Repo"></a>\n');
  const [file] = BLOCKS.repocards.files(b);
  assert.equal(file.name, 'assets/cards/my-repo.svg');
  assert.match(file.data, /<svg /);
});

test('miniroom blocks are numbered room files carrying their own JSON', () => {
  const rows = [row(fresh('miniroom', { room: structuredClone(DEMO_ROOM) })), row(fresh('miniroom', { room: structuredClone(DEMO_ROOM), width: 400 }))];
  assert.equal(
    md(...rows),
    '<p align="center"><img src="assets/room.svg" width="100%" alt="my room"></p>\n\n'
    + '<p align="center"><img src="assets/room-2.svg" width="400" alt="my room"></p>\n',
  );
  const second = rows[1].cells[0][0];
  const [file] = BLOCKS.miniroom.files(second);
  assert.equal(file.name, 'assets/room-2.svg');
  assert.match(file.data, /<metadata id="gitroom">/);
  assert.equal(md(row(fresh('miniroom'))), '\n', 'no room, no picture');
});

test('the whole document is rows joined by blank lines', () => {
  const out = md(
    row(fresh('heading', { level: 1, text: 'Hi', align: 'center' })),
    row(fresh('text', { text: 'body' })),
    row(fresh('divider')),
  );
  assert.equal(out, '<h1 align="center">Hi</h1>\n\nbody\n\n---\n');
});
test('a picture aimed at the words beside it joins their line', () => {
  // Use an unknown art key to test layout without DOM measurements.
  const sticker = (align) => fresh('sticker', { art: 'unmeasured', size: 30, align });
  const head = fresh('heading', { level: 1, text: 'cute readme', align: 'center' });
  const rowOf = (...cells) => ({ id: 'r' + Math.random(), cells });

  for (const cells of [
    [[sticker('right')], [head]],
    [[head], [sticker('left')]],
    [[sticker('right')], [head], [sticker('left')]],
  ]) {
    const r = rowOf(...cells);
    assert.equal(rowMode(r), 'tight');
    const out = md(r);
    assert.match(out, /^<h1 align="center">.*cute readme.*<\/h1>/s);
    assert.ok(!out.includes('align="left"') && !out.includes('align="right"'),
      'float 은 페이지 가장자리까지밖에 못 간다');
  }

  assert.equal(rowMode(rowOf([sticker('left')], [head])), 'float-left');
  assert.equal(rowMode(rowOf([head], [sticker('right')])), 'float-right');
  assert.equal(rowMode(rowOf([sticker('center')], [head])), 'float-left');
  assert.equal(rowMode(rowOf([sticker('left')], [head], [sticker('right')])), 'flank');
});
test('a colour banner can share the line, with the blank lines maths needs', () => {
  const sticker = (align) => fresh('sticker', { art: 'unmeasured', size: 30, align });
  const banner = fresh('banner', { text: 'cute readme', color: '#c05b76', align: 'center' });
  const r = { id: 'rb', cells: [[sticker('right')], [banner], [sticker('left')]] };

  assert.equal(rowMode(r), 'tight');
  const out = md(r);
  // GitHub requires blank lines to parse Markdown inside a div.
  assert.match(out, /^<div align="center">\n\n<img [^>]*> \$.*\$ <img [^>]*>\n\n<\/div>/);
  assert.ok(!out.includes('$$'), 'display maths is a block and cannot share a line');
});
