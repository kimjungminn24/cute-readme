import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRoom, DEMO_ROOM, geometry, WEATHER_STYLES } from '../src/room.js';

test('each weather drops something different, none draws nothing', () => {
  const bare = renderRoom(DEMO_ROOM);
  assert.equal(renderRoom({ ...DEMO_ROOM, weather: 'none' }), bare);
  assert.equal(renderRoom({ ...DEMO_ROOM, weather: 'no-such-weather' }), bare, 'typos count as none');

  const seen = new Set();
  for (const id of Object.keys(WEATHER_STYLES)) {
    if (id === 'none') continue;
    const svg = renderRoom({ ...DEMO_ROOM, weather: id });
    assert.ok(svg.includes('class="weather"'), `${id} does not fall`);
    assert.ok(svg.includes('@keyframes wfall'), `${id} has no fall animation`);
    seen.add(svg.match(/<g class="weather"[\s\S]*?<\/g>/)[0]);
  }
  assert.equal(seen.size, Object.keys(WEATHER_STYLES).length - 1, 'weathers must not share artwork');
});

test('particles start scattered at static coords', () => {
  const svg = renderRoom({ ...DEMO_ROOM, weather: 'snow' });
  const ys = [...svg.matchAll(/<g transform="translate\(\d+ (-?\d+)\)"><g class="wy"/g)].map((m) => +m[1]);
  assert.ok(ys.length > 20, `only ${ys.length} particles`);
  const { height } = geometry(DEMO_ROOM.grid);
  assert.ok(Math.min(...ys) < height * 0.2, 'nothing near the top');
  assert.ok(Math.max(...ys) > height * 0.6, 'nothing near the bottom');
  assert.equal(new Set(ys).size > ys.length * 0.7, true, 'stacked at the same heights');
});

test('weather still fits the README size budget', () => {
  for (const id of Object.keys(WEATHER_STYLES)) {
    const bytes = renderRoom({ ...DEMO_ROOM, weather: id }).length;
    assert.ok(bytes < 130_000, `${id}: ${bytes} bytes`);
  }
});
