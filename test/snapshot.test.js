import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { renderRoom, wallSwatch, floorSwatch, DEMO_ROOM, WALL_STYLES, FLOOR_STYLES, WEATHER_STYLES } from '../src/room.js';
import { renderSuika, SUIKA_THEMES } from '../src/suika.js';
import { renderRepoCard, REPO_CARD_THEMES } from '../src/repocard.js';
import { readDotFont } from '../src/dotfont.js';
import {
  personArt, ACCESSORY_STYLES, EXPRESSION_STYLES, SHAPE_STYLES, DEFAULT_PERSON,
  FLOOR_ITEMS, WALL_ITEMS, EFFECTS, SKILLS,
} from '../src/catalog.js';

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'snapshots.json');

const CONTRIBUTORS = [
  { login: 'top', contributions: 412 },
  { login: 'second', contributions: 96 },
  { login: 'third', contributions: 54 },
  { login: 'fourth', contributions: 31 },
  { login: 'fifth', contributions: 11 },
  { login: 'sixth', contributions: 2 },
  { login: 'newbie', contributions: 1 },
];

const WITH_AVATARS = CONTRIBUTORS.slice(0, 3).map((c, i) => ({
  ...c, avatar: `https://example.invalid/a${i}.png`,
}));

const DOTS = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));

const REPO = {
  owner: 'kimjungminn24',
  name: 'cute-readme',
  description: 'GitHub 프로필 README에 붙이는 픽셀 아이소메트릭 미니룸 SVG 생성기',
  language: 'JavaScript',
  stars: 1234,
  forks: 56,
};

function renderAll() {
  const out = {};
  out['room:demo'] = renderRoom(DEMO_ROOM, { title: 'demo room' });
  out['room:editable'] = renderRoom(DEMO_ROOM, { editable: true });
  for (const id of Object.keys(WALL_STYLES)) {
    out[`room:wall-style:${id}`] = renderRoom({ ...DEMO_ROOM, theme: { ...DEMO_ROOM.theme, wallStyle: id } });
    out[`swatch:${id}`] = wallSwatch(id);
  }
  for (const id of Object.keys(FLOOR_STYLES)) {
    out[`room:floor-style:${id}`] = renderRoom({ ...DEMO_ROOM, theme: { ...DEMO_ROOM.theme, floorStyle: id } });
    out[`swatch:floor:${id}`] = floorSwatch(id);
  }

  for (const id of Object.keys(WEATHER_STYLES)) {
    if (id === 'none') continue;
    out[`room:weather:${id}`] = renderRoom({ ...DEMO_ROOM, weather: id });
  }

  for (const shape of Object.keys(SHAPE_STYLES)) {
    for (const accessory of Object.keys(ACCESSORY_STYLES)) {
      out[`person:${shape}:${accessory}`] = personArt({ ...DEFAULT_PERSON, shape, accessory });
    }
    for (const expression of Object.keys(EXPRESSION_STYLES)) {
      out[`face:${shape}:${expression}`] = personArt({ ...DEFAULT_PERSON, shape, expression });
    }
  }

  for (const [id, def] of Object.entries(FLOOR_ITEMS)) out[`item:${id}`] = def.art;

  for (const [id, def] of Object.entries(WALL_ITEMS)) {
    for (const wall of ['left', 'right']) out[`wall:${id}:${wall}`] = def.art(wall);
  }
  for (const [id, def] of Object.entries(EFFECTS)) out[`effect:${id}`] = def.art;
  for (const [id, def] of Object.entries(SKILLS)) out[`skill:${id}`] = def.art;

  for (const theme of Object.keys(SUIKA_THEMES)) {
    out[`suika:${theme}`] = renderSuika(CONTRIBUTORS, { theme });
  }
  out['suika:empty'] = renderSuika([]);
  out['suika:solo'] = renderSuika(CONTRIBUTORS.slice(0, 1));
  out['suika:avatars'] = renderSuika(WITH_AVATARS);
  out['suika:no-names'] = renderSuika(CONTRIBUTORS, { names: false });
  out['suika:no-drop'] = renderSuika(CONTRIBUTORS, { drop: false });
  out['suika:no-links'] = renderSuika(CONTRIBUTORS, { links: false });
  out['suika:limit'] = renderSuika(CONTRIBUTORS, { limit: 3 });
  out['suika:width-clamp-min'] = renderSuika(CONTRIBUTORS, { width: 10 });
  out['suika:width-clamp-max'] = renderSuika(CONTRIBUTORS, { width: 99999 });
  out['suika:bad-theme'] = renderSuika(CONTRIBUTORS, { theme: 'no-such-theme' });
  out['suika:scale'] = renderSuika(CONTRIBUTORS, { scale: 2 });

  for (const theme of Object.keys(REPO_CARD_THEMES)) {
    out[`repocard:${theme}`] = renderRepoCard(REPO, { theme });
  }
  out['repocard:full'] = renderRepoCard(REPO, { full: true });
  out['repocard:no-sparkle'] = renderRepoCard(REPO, { sparkle: false });
  out['repocard:archived'] = renderRepoCard({ ...REPO, archived: true });
  out['repocard:fork'] = renderRepoCard({ ...REPO, fork: true });
  out['repocard:no-lang'] = renderRepoCard({ ...REPO, language: null });
  out['repocard:empty'] = renderRepoCard();
  out['repocard:long-desc'] = renderRepoCard({
    ...REPO,
    description: '아주 긴 설명을 넣어 두 줄에서 잘리는지 본다. '.repeat(6),
  });

  out['repocard:dots'] = renderRepoCard(REPO, { theme: 'pixel', dots: DOTS });
  out['repocard:dots:full'] = renderRepoCard(REPO, { theme: 'pixel', dots: DOTS, full: true });
  out['repocard:dots:archived'] = renderRepoCard({ ...REPO, archived: true }, { theme: 'pixel', dots: DOTS });
  out['repocard:dots:fork'] = renderRepoCard({ ...REPO, fork: true }, { theme: 'pixel', dots: DOTS });
  out['repocard:dots:no-lang'] = renderRepoCard({ ...REPO, language: null }, { theme: 'pixel', dots: DOTS });
  out['repocard:dots:narrow'] = renderRepoCard(REPO, { theme: 'pixel', dots: DOTS, width: 100 });
  out['repocard:dots:empty'] = renderRepoCard({}, { theme: 'pixel', dots: DOTS });

  out['repocard:dots:mixed'] = renderRepoCard(
    { ...REPO, description: '한글은 그리고 漢字와 🙂 는 못 그린다' },
    { theme: 'pixel', dots: DOTS },
  );

  return out;
}

if (process.env.UPDATE_SNAPSHOTS) {
  mkdirSync(path.dirname(FIXTURE), { recursive: true });
  writeFileSync(FIXTURE, JSON.stringify(renderAll(), null, 2));
  test('snapshots updated', () => {});
} else {
  const expected = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const actual = renderAll();

  test('snapshot case list is unchanged', () => {
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort());
  });

  for (const [name, svg] of Object.entries(actual)) {
    test(`snapshot: ${name}`, () => {
      assert.equal(svg, expected[name]);
    });
  }
}
