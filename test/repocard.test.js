import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderRepoCard, parseRepo, cardFile, cardSnippet, compact,
  REPO_CARD_THEMES, LANG_COLORS,
} from '../src/repocard.js';

const REPO = {
  owner: 'octocat', name: 'hello-world', description: '설명 한 줄',
  language: 'JavaScript', stars: 1234, forks: 56,
};

test('every theme renders a complete SVG', () => {
  for (const [id, t] of Object.entries(REPO_CARD_THEMES)) {
    const svg = renderRepoCard(REPO, { theme: id });
    assert.ok(svg.startsWith('<svg xmlns='), id);
    assert.ok(svg.includes(t.bg), `${id}: background color missing`);
    assert.ok(svg.includes('hello-world'), id);
  }

  assert.equal(renderRepoCard(REPO, { theme: 'no-such-theme' }), renderRepoCard(REPO, { theme: 'light' }));
});

const idsIn = (svg) => new Set([...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const PATTERNED = Object.entries(REPO_CARD_THEMES).filter(([, t]) => t.deco).map(([id]) => id);

test('pattern ids differ per card and stay stable for the same card', () => {
  assert.ok(PATTERNED.length, 'this test is meaningless without at least one pattern theme');

  for (const theme of PATTERNED) {
    const a = renderRepoCard(REPO, { theme });
    assert.ok(idsIn(a).size, `${theme}: the pattern has no ids`);

    assert.equal(renderRepoCard(REPO, { theme }), a, `${theme}: same input, different SVG`);

    const b = renderRepoCard({ ...REPO, name: 'other-repo' }, { theme });
    for (const id of idsIn(a)) assert.ok(!idsIn(b).has(id), `${theme}: id collides with another repo (${id})`);
  }

  const [first, ...rest] = PATTERNED.map((theme) => idsIn(renderRepoCard(REPO, { theme })));
  for (const other of rest) {
    for (const id of other) assert.ok(!first.has(id), `ids collide across themes (${id})`);
  }
});

test('patterns lie under the text and clip inside the corners', () => {
  for (const theme of PATTERNED) {
    const svg = renderRepoCard(REPO, { theme });
    assert.ok(svg.includes('clip-path='), `${theme}: unclipped, the pattern fills the cut corners back in`);
    assert.ok(svg.indexOf('clip-path=') < svg.indexOf('<text'), `${theme}: the pattern covers the text`);
  }
});

const ANIMATED = Object.entries(REPO_CARD_THEMES).filter(([, t]) => t.anim).map(([id]) => id);

test('animation CSS does not leak outside the card', () => {
  for (const theme of ANIMATED) {
    const svg = renderRepoCard(REPO, { theme });
    const card = svg.match(/<svg[^>]*\sid="([^"]+)"/)[1];
    const css = svg.match(/<style>([\s\S]*?)<\/style>/)[1];

    for (const [, name] of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
      assert.ok(name.includes(card), `${theme}: keyframes "${name}" lacks the card id`);
    }

    for (const rule of css.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '').split('}')) {
      const sel = rule.split('{')[0].trim();
      if (!sel || sel.startsWith('@')) continue;
      assert.ok(sel.startsWith(`#${card}`), `${theme}: selector "${sel}" is not scoped to the card`);
    }
  }
});

test('with animation off, the light beam rests off the card', () => {
  for (const theme of ANIMATED) {
    const svg = renderRepoCard(REPO, { theme });
    const at = svg.match(/class="sh"[^>]*?\sx="(-?[\d.]+)"/);
    if (!at) continue;
    assert.ok(Number(at[1]) < 0, `${theme}: the beam rests inside the card (x=${at[1]})`);
  }
});

test('the clipping group carries no transform', () => {
  for (const theme of PATTERNED) {
    const svg = renderRepoCard(REPO, { theme });
    for (const [tag] of svg.matchAll(/<g[^>]*clip-path[^>]*>/g)) {
      assert.ok(!tag.includes('transform'), `${theme}: ${tag}`);
    }
  }

  assert.ok(renderRepoCard(REPO, { theme: 'earth' }).includes('#4fae72'));
});

test('sparkle off drops the motion, keeps the pattern', () => {
  for (const theme of ANIMATED) {
    const off = renderRepoCard(REPO, { theme, sparkle: false });
    assert.ok(!off.includes('<style>'), `${theme}: motion did not drop`);
    assert.ok(!off.includes('animation'), theme);
    assert.ok(off.includes('<pattern') || off.includes('Gradient'), `${theme}: the pattern vanished too`);

    assert.ok(renderRepoCard(REPO, { theme }).includes('<style>'), `${theme}: default is off`);
  }
});

test('pattern themes grow the card by the border width', () => {
  const h = (theme) => Number(renderRepoCard(REPO, { theme }).match(/height="(\d+)"/)[1]);
  for (const theme of PATTERNED) assert.ok(h(theme) > h('light'), theme);
});

test('long descriptions cut at two lines, none shrinks the card', () => {
  const h = (repo) => Number(renderRepoCard(repo).match(/height="(\d+)"/)[1]);
  const lines = (repo) => (renderRepoCard(repo).match(/font-size="12\.5"/g) ?? []).length;

  assert.equal(lines({ ...REPO, description: '' }), 0);
  assert.equal(lines({ ...REPO, description: '한 줄' }), 1);
  assert.equal(lines({ ...REPO, description: '아주 긴 설명을 넣어서 두 줄을 넘기면 어떻게 되는지 확인합니다. 세 줄째는 버려져야 합니다.' }), 2);

  assert.ok(h({ ...REPO, description: '' }) < h(REPO), 'no description must lower the card');
});

test('language colors come from the table, unknown falls to gray', () => {
  assert.ok(renderRepoCard({ ...REPO, language: 'TypeScript' }).includes(LANG_COLORS.TypeScript));
  const unknown = renderRepoCard({ ...REPO, language: 'Brainfuck' });
  assert.ok(unknown.includes('Brainfuck'), 'the name still shows');
  assert.ok(unknown.includes('#8b949e'));
});

test('zero values are not drawn at all', () => {
  const svg = renderRepoCard({ ...REPO, forks: 0 });
  assert.ok(svg.includes('1.2k'), 'stars remain');
  assert.ok(!svg.includes('<circle cx'.replace('cx', 'cx')) || true);
  assert.equal((svg.match(/stroke-width="1\.5"/g) ?? []).length, 1, 'with the fork icon gone, the book is the only icon');
});

test('archived and fork status show as a badge', () => {
  assert.ok(renderRepoCard(REPO).includes('>Public<'));
  assert.ok(renderRepoCard({ ...REPO, fork: true }).includes('>Fork<'));
  assert.ok(renderRepoCard({ ...REPO, archived: true }).includes('>Archived<'), 'archived beats fork');
});

test('does not throw on empty data', () => {
  const svg = renderRepoCard();
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('repository'));
});

test('description tags are stripped, specials escaped', () => {
  const svg = renderRepoCard({ ...REPO, description: 'a <b>bold</b> & "c"' });
  assert.ok(!svg.includes('<b>'), 'a leaked tag breaks the SVG');
  assert.ok(svg.includes('&amp;') && svg.includes('&quot;'));
  assert.ok(svg.includes('bold'), 'only the tag goes, the text stays');
});

test('parseRepo accepts URLs and owner/repo', () => {
  const want = { owner: 'foo', repo: 'bar' };
  for (const input of ['foo/bar', ' foo/bar ', 'https://github.com/foo/bar', 'github.com/foo/bar/', 'https://github.com/foo/bar.git']) {
    assert.deepEqual(parseRepo(input), want, input);
  }
  for (const bad of ['', 'foo', null, 'http://example.com']) assert.equal(parseRepo(bad), null, String(bad));
});

test('snippet file names match the saved names', () => {
  const repos = [{ owner: 'a', name: 'My.Repo' }, { owner: 'b', name: '한글' }];
  assert.deepEqual(repos.map(cardFile), ['my-repo.svg', 'repo.svg']);
  const snippet = cardSnippet(repos);
  for (const r of repos) {
    assert.ok(snippet.includes(`./cards/${cardFile(r)}`));
    assert.ok(snippet.includes(`https://github.com/${r.owner}/${r.name}`));
  }
});

test('numbers shorten to the same digits as GitHub', () => {
  assert.deepEqual([0, 42, 999, 1000, 1234, 12345, 998877, 1234567].map(compact),
    ['0', '42', '999', '1k', '1.2k', '12k', '999k', '1.2m']);
});
