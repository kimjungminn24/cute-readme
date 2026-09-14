import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderSuika, assignTiers, tierOf, pack, sampleAvatar, suikaSnippet,
  TIERS, TOP_TIER, SUIKA_THEMES,
} from '../src/suika.js';

const PEOPLE = [
  { login: 'top', contributions: 412 },
  { login: 'second', contributions: 96 },
  { login: 'third', contributions: 54 },
  { login: 'fourth', contributions: 31 },
  { login: 'fifth', contributions: 11 },
  { login: 'sixth', contributions: 2 },
  { login: 'newbie', contributions: 1 },
];

test('the size ladder ascends', () => {
  for (let i = 1; i < TIERS.length; i++) {
    assert.ok(TIERS[i] > TIERS[i - 1], `tier ${i} is smaller than tier ${i - 1}`);
  }

  assert.ok(TIERS[TOP_TIER] < 0.5, 'the biggest egg exceeds half the jar');
});

test('only first place gets the biggest egg', () => {
  const got = assignTiers(PEOPLE);
  assert.equal(got[0].tier, TOP_TIER);
  assert.equal(got.filter((c) => c.tier === TOP_TIER).length, 1);
});

test('similar commits, different ranks, different sizes', () => {
  const tight = [
    { login: 'a', contributions: 500 },
    { login: 'b', contributions: 495 },
    { login: 'c', contributions: 490 },
  ];
  const tiers = assignTiers(tight).map((c) => c.tier);
  assert.equal(new Set(tiers).size, 3, `sizes collide: ${tiers.join(', ')}`);
  assert.equal(tiers[0], TOP_TIER);
});

test('size never inverts rank', () => {
  const got = assignTiers(PEOPLE);
  for (let i = 1; i < got.length; i++) {
    assert.ok(got[i].tier <= got[i - 1].tier, `${got[i].login} is bigger than the one ahead`);
  }
});

test('few commits sink far below the rank ceiling', () => {
  const skew = [{ login: 'a', contributions: 4000 }, { login: 'b', contributions: 10 }];
  const [, second] = assignTiers(skew);
  assert.ok(second.tier < TOP_TIER - 1, `second place climbed to tier ${second.tier}`);
});

test('all-equal commits fall back to rank', () => {
  const flat = Array.from({ length: 5 }, (_, i) => ({ login: `u${i}`, contributions: 7 }));
  const tiers = assignTiers(flat).map((c) => c.tier);
  assert.deepEqual(tiers, [10, 9, 8, 7, 6], 'everyone at max size bursts the jar');
});

test('unsorted input gets re-sorted', () => {
  const shuffled = [...PEOPLE].reverse();
  assert.deepEqual(assignTiers(shuffled).map((c) => c.login), assignTiers(PEOPLE).map((c) => c.login));
});

test('people over the limit are cut', () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ login: `u${i}`, contributions: 40 - i }));
  assert.equal(assignTiers(many, 12).length, 12);

  assert.equal(assignTiers(many, 12).at(-1).login, 'u11');
});

test('tierOf stays in range', () => {
  for (const [c, hi, lo] of [[0, 100, 1], [1, 1, 1], [-5, 10, 2], [1e9, 10, 1], [NaN, 10, 1]]) {
    const t = tierOf(c, hi, lo);
    assert.ok(Number.isInteger(t) && t >= 0 && t <= TOP_TIER, `tierOf(${c}, ${hi}, ${lo}) = ${t}`);
  }
});

const packed = (people, W = 480) => {
  const FLOOR = 100000;
  const items = assignTiers(people, 15).map((c) => ({ ...c, r: c.ratio * W }));
  return { placed: pack(items, W, FLOOR, 7), W, FLOOR };
};

test('settled eggs do not overlap', () => {
  const { placed } = packed(PEOPLE);
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const d = Math.hypot(placed[i].x - placed[j].x, placed[i].y - placed[j].y);
      assert.ok(
        d >= placed[i].r + placed[j].r - 0.01,
        `${placed[i].login} and ${placed[j].login} overlap by ${(placed[i].r + placed[j].r - d).toFixed(1)}`,
      );
    }
  }
});

test('eggs do not pierce the jar walls', () => {
  const { placed, W } = packed(PEOPLE);
  for (const c of placed) {
    assert.ok(c.x >= c.r - 0.01, `${c.login} pierced the left wall`);
    assert.ok(c.x <= W - c.r + 0.01, `${c.login} pierced the right wall`);
  }
});

test('no egg floats in midair', () => {
  const { placed, FLOOR } = packed(PEOPLE);
  for (let i = 0; i < placed.length; i++) {
    const c = placed[i];
    if (c.y >= FLOOR - c.r - 0.01) continue;
    const below = placed.slice(0, i).filter((p) => {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      return d <= c.r + p.r + 0.5;
    });
    assert.ok(below.length, `${c.login} rests on nothing`);
  }
});

test('same input always piles the same way', () => {
  const a = packed(PEOPLE).placed.map((c) => `${c.login}:${c.x.toFixed(3)},${c.y.toFixed(3)}`);
  const b = packed(PEOPLE).placed.map((c) => `${c.login}:${c.x.toFixed(3)},${c.y.toFixed(3)}`);
  assert.deepEqual(a, b);
});

test('eggs wider than the jar shrink to fit', () => {
  const { placed, W } = packed(PEOPLE, 60);
  for (const c of placed) assert.ok(c.r <= W / 2, `${c.login} r=${c.r} > ${W / 2}`);
});

test('every theme renders a complete SVG', () => {
  for (const [id, t] of Object.entries(SUIKA_THEMES)) {
    const svg = renderSuika(PEOPLE, { theme: id });
    assert.ok(svg.startsWith('<svg xmlns='), id);
    assert.ok(svg.endsWith('</svg>'), id);
    assert.ok(svg.includes(t.bg), `${id}: background color missing`);
    assert.ok(svg.includes('top'), id);
  }

  assert.equal(renderSuika(PEOPLE, { theme: 'no-such-theme' }), renderSuika(PEOPLE, { theme: 'suika' }));
});

test('the score is the commit sum', () => {
  const total = PEOPLE.reduce((s, c) => s + c.contributions, 0);
  assert.ok(renderSuika(PEOPLE).includes(`>${total.toLocaleString('en-US')}<`));
});

test('themes share the same pile shape', () => {
  const at = (theme) => [...renderSuika(PEOPLE, { theme })
    .matchAll(/<g transform="translate\(([-\d.]+) ([-\d.]+)\)"/g)]
    .map((m) => `${m[1]},${m[2]}`);
  const base = at('suika');
  assert.ok(base.length, 'no eggs were drawn at all');
  for (const theme of Object.keys(SUIKA_THEMES)) assert.deepEqual(at(theme), base, theme);
});

test('same input always gives the same SVG', () => {
  assert.equal(renderSuika(PEOPLE), renderSuika(PEOPLE));
  assert.notEqual(renderSuika(PEOPLE), renderSuika(PEOPLE.slice(0, 3)));
});

const idsIn = (svg) => new Set([...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));

test('ids differ per card', () => {
  const a = idsIn(renderSuika(PEOPLE));
  const b = idsIn(renderSuika(PEOPLE.slice(0, 4)));
  for (const id of a) assert.ok(!b.has(id), `ids collide (${id})`);
});

test('the falling entrance does not leak outside the card', () => {
  const svg = renderSuika(PEOPLE);
  const card = svg.match(/<svg[^>]*\sid="([^"]+)"/)[1];
  const css = svg.match(/<style>([\s\S]*?)<\/style>/)[1];

  for (const [, name] of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
    assert.ok(name.includes(card), `keyframes "${name}" lacks the card id`);
  }
  for (const rule of css.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '').split('}')) {
    const sel = rule.split('{')[0].trim();
    if (!sel || sel.startsWith('@')) continue;
    assert.ok(sel.startsWith(`#${card}`), `selector "${sel}" is not scoped to the card`);
  }
});

test('drop off removes the motion, keeps the eggs', () => {
  const off = renderSuika(PEOPLE, { drop: false });
  assert.ok(!off.includes('<style>'), 'motion did not drop');
  assert.ok(!off.includes('animation'));
  assert.ok(off.includes('top'), 'the eggs vanished too');
  assert.ok(renderSuika(PEOPLE).includes('animation'), 'default is off');
});

test('position g and entrance g are separate', () => {
  for (const [tag] of renderSuika(PEOPLE).matchAll(/<g[^>]*class="f[^"]*"[^>]*>/g)) {
    assert.ok(!tag.includes('transform'), tag);
  }
});

test('photos clip to circles, missing ones show the first letter', () => {
  const withPhoto = renderSuika([{ login: 'aria', contributions: 5, avatar: 'data:image/png;base64,AAAA' }]);
  assert.ok(withPhoto.includes('<image href="data:image/png;base64,AAAA"'));
  assert.ok(withPhoto.includes('clip-path='), 'unclipped photos land square');

  assert.ok(renderSuika([{ login: 'aria', contributions: 5 }]).includes('>A</text>'));
});

test('the no-photo background color is fixed per login', () => {
  const of = (login) => renderSuika([{ login, contributions: 5 }]).match(/<circle[^>]*fill="(#[0-9a-f]{6})"/)[1];
  assert.equal(of('aria'), of('aria'));
  assert.notEqual(of('aria'), of('zed'));
});

test('the photo clip circle matches the egg size', () => {
  const svg = renderSuika([{ login: 'a', contributions: 5, avatar: 'data:image/png;base64,AAAA' }]);
  const clip = Number(svg.match(/<clipPath[^>]*><circle cx="0" cy="0" r="([\d.]+)"/)[1]);
  const img = Number(svg.match(/<image[^>]*width="([\d.]+)"/)[1]);
  assert.equal(clip * 2, img);
});

test('does not throw on an empty list', () => {
  for (const input of [[], undefined, [{ contributions: 3 }], [null]]) {
    const svg = renderSuika(input);
    assert.ok(svg.startsWith('<svg'), String(input));
    assert.ok(/viewBox="0 0 \d+ \d+"/.test(svg), 'non-integer sizes disagree with the viewBox');
  }
});

test('specials in logins are escaped', () => {
  const svg = renderSuika([{ login: 'a<b>&"c"', contributions: 9 }]);
  assert.ok(!svg.includes('<b>'), 'a leaked tag breaks the SVG');
  assert.ok(svg.includes('&amp;') && svg.includes('&quot;'));
});

test('width stays in range and height is an integer', () => {
  for (const w of [0, 10, 5000, NaN, undefined, 640]) {
    const svg = renderSuika(PEOPLE, { width: w });
    const [, ww, hh] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    assert.ok(Number(ww) >= 280 && Number(ww) <= 1200, `width=${w} -> ${ww}`);
    assert.ok(Number(hh) > 0, `width=${w} -> height ${hh}`);
  }
});

test('each egg links to its profile', () => {
  const svg = renderSuika(PEOPLE);
  for (const c of PEOPLE) {
    assert.ok(svg.includes(`href="https://github.com/${c.login}"`), c.login);
  }

  assert.equal((svg.match(/<a href="https:\/\/github\.com\//g) ?? []).length, PEOPLE.length);
});

test('the URL from the contributor list wins', () => {
  const svg = renderSuika([{ login: 'a', contributions: 5, url: 'https://github.enterprise.io/a' }]);
  assert.ok(svg.includes('href="https://github.enterprise.io/a"'));
});

test('specials in logins do not leak into URLs', () => {
  const svg = renderSuika([{ login: 'a"b', contributions: 5 }]);
  assert.ok(!svg.includes('href="https://github.com/a"b"'), 'a quote would close the attribute');
  assert.ok(svg.includes('a%22b'));
});

test('links off removes the links, keeps the eggs', () => {
  const off = renderSuika(PEOPLE, { links: false });
  assert.ok(!off.includes('<a href='), 'links did not drop');
  assert.ok(off.includes('top'), 'the eggs vanished too');
});

test('the README snippet wraps the whole card to the contributor graph', () => {
  const s = suikaSnippet('owner/repo');
  assert.ok(s.startsWith('<a href="https://github.com/owner/repo/graphs/contributors">'));
  assert.ok(s.includes('<img src="./suika.svg"'));

  assert.ok(suikaSnippet().includes('href="../../graphs/contributors"'));
  assert.ok(suikaSnippet('owner/repo', 'docs/suika.svg').includes('src="./docs/suika.svg"'));
});

test('default avatars are shapes, not people, and stable per login', () => {
  const a = sampleAvatar('octocat');
  assert.ok(a.startsWith('data:image/svg+xml,'), 'must drop straight into <image href>');
  assert.equal(a, sampleAvatar('octocat'), 'if it varied, the workflow would recommit pattern-only changes');
  assert.notEqual(a, sampleAvatar('defunkt'));

  const svg = decodeURIComponent(a.slice('data:image/svg+xml,'.length));
  assert.ok(svg.includes('<rect') && !svg.includes('<text'), 'no face and no text');
});

test('default avatar patterns are symmetric', () => {
  const svg = decodeURIComponent(sampleAvatar('octocat').slice('data:image/svg+xml,'.length));
  const cols = new Set([...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="14"/g)]
    .map((m) => `${m[1]},${m[2]}`));
  assert.ok(cols.size, 'not a single cell lit');
  for (const key of cols) {
    const [x, y] = key.split(',').map(Number);
    const mirrored = 10 + (4 - (x - 10) / 14) * 14;
    assert.ok(cols.has(`${mirrored},${y}`), `(${x},${y}) has no mirror`);
  }
});

test('given an index, neighbor colors spread apart', () => {
  const hue = (i) => Number(decodeURIComponent(sampleAvatar(`u${i}`, i))
    .match(/hsl\((\d+)/)[1]);
  for (let i = 1; i < 12; i++) {
    const gap = Math.abs(hue(i) - hue(i - 1));
    assert.ok(Math.min(gap, 360 - gap) > 40, `colors ${i - 1} and ${i} are ${gap} degrees apart`);
  }
});
