import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseContributionDays, fetchContributionDays } from '../src/github.js';
import { grassRows } from '../src/catalog-floor-blocks.js';
import { renderRoom } from '../src/room.js';
import { embedRoom, parseRoomText } from '../editor/editor-core.js';
import { refreshGrass } from '../scripts/render-grass.js';

const td = (date, level) =>
  `<td tabindex="0" data-ix="0" style="width: 11px" data-date="${date}" id="x" data-level="${level}" role="gridcell" class="ContributionCalendar-day"></td>`;

// Every day from start to end inclusive, with a level picked by the callback.
function calendar(start, end, levelOf = () => 1) {
  const days = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${end}T00:00:00Z`); t += 86_400_000) {
    const date = new Date(t).toISOString().slice(0, 10);
    days.push({ date, level: levelOf(date, days.length) });
  }
  return days;
}

test('the calendar page is read into sorted days, ignoring the legend and other cells', () => {
  const html = `<table>${td('2026-11-03', 4)}${td('2026-11-01', 1)}<td class="ContributionCalendar-label">Mon</td>`
    + `${td('2026-11-02', 2)}</table><span class="ContributionCalendar-day" data-level="3"></span>`;
  assert.deepEqual(parseContributionDays(html), [
    { date: '2026-11-01', level: 1 },
    { date: '2026-11-02', level: 2 },
    { date: '2026-11-03', level: 4 },
  ]);
});

test('fetching the calendar checks the user name and fails loudly on an empty page', async (t) => {
  await assert.rejects(fetchContributionDays('../etc'), /not a GitHub user name/);

  const calls = t.mock.method(globalThis, 'fetch', async () => new Response('<html>nothing</html>', { status: 200 }));
  await assert.rejects(fetchContributionDays('octocat'), /found no days/);
  assert.equal(calls.mock.calls[0].arguments[0], 'https://github.com/users/octocat/contributions');

  calls.mock.mockImplementation(async () => new Response(td('2026-11-03', 2), { status: 200 }));
  assert.deepEqual(await fetchContributionDays('octocat'), [{ date: '2026-11-03', level: 2 }]);
});

test('rows run Sunday to Saturday, the last column is this week, and days still to come are spaces', () => {
  // 2026-11-03 is a Tuesday.
  const days = calendar('2026-08-01', '2026-11-03', (date) => (date === '2026-11-03' ? 4 : date === '2026-11-01' ? 3 : 0));
  const rows = grassRows(days, 3);
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.map((r) => r.at(-1)), ['3', '0', '4', ' ', ' ', ' ', ' ']);
  assert.ok(rows.every((r) => r.length === 3));
});

test('days missing from the list count as empty', () => {
  const rows = grassRows([{ date: '2026-10-31', level: 2 }], 2);
  assert.deepEqual(rows.map((r) => r[1]), ['0', '0', '0', '0', '0', '0', '2']);
});

test('a room with calendar rows draws them instead of the sample, and bad rows fall back', () => {
  const room = { items: [{ id: 'grasslong', col: 0, row: 0 }, { id: 'grassgraph', col: 4, row: 4 }] };
  const sample = renderRoom(room);
  const quiet = renderRoom({ ...room, grass: { rows: Array(7).fill('0'.repeat(14)) } });
  assert.notEqual(quiet, sample);
  assert.equal(renderRoom({ ...room, grass: { rows: Array(7).fill('0'.repeat(14)) } }), quiet, 'same rows, same picture');
  assert.equal(renderRoom({ ...room, grass: { rows: ['bad'] } }), sample);
  assert.equal(renderRoom({ ...room, grass: { rows: Array(7).fill('0'.repeat(5)) } }), sample, 'too few weeks for the long one');
});

test('refreshGrass rewrites a builder room.svg and leaves it alone when nothing changed', () => {
  const room = { v: 1, grid: { cols: 8, rows: 8 }, items: [{ id: 'grasslong', col: 0, row: 3 }], wallItems: [] };
  const svg = embedRoom(renderRoom(room, { title: 'miniroom' }), room);
  const days = calendar('2026-07-01', '2026-11-03', (_, i) => i % 5);

  const first = refreshGrass(svg, days, 'octocat');
  assert.ok(first.changed && first.hasGrass);
  assert.match(first.svg, /<title>miniroom<\/title>/);
  const saved = parseRoomText(first.svg);
  assert.equal(saved.grass.user, 'octocat');
  assert.equal(saved.grass.updated, '2026-11-03');
  assert.deepEqual(saved.items, room.items, 'the room itself is kept');

  assert.equal(refreshGrass(first.svg, days, 'octocat').changed, false);
  assert.throws(() => refreshGrass('<svg></svg>', days, 'octocat'), /no room inside/);
});
