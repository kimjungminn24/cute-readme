import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { fetchContributionDays } from '../src/github.js';
import { grassRows } from '../src/catalog-floor-blocks.js';
import { FLOOR_ITEMS } from '../src/catalog.js';
import { renderRoom } from '../src/room.js';
import { embedRoom, parseRoomText } from '../editor/editor-core.js';

// Redraw a room.svg from the builder with today's contribution calendar in its grass.
export function refreshGrass(svg, days, user) {
  let state;
  try {
    state = parseRoomText(svg);
  } catch {
    state = null;
  }
  if (!state || typeof state !== 'object') {
    throw new Error('no room inside this SVG. Download room.svg from the builder and commit that file.');
  }

  const title = svg.match(/<title>([^<]*)<\/title>/)?.[1] || 'miniroom';
  const hasGrass = (state.items ?? []).some((it) => FLOOR_ITEMS[it?.id]?.live);
  state.grass = { user, updated: days.at(-1).date, rows: grassRows(days) };
  const out = embedRoom(renderRoom(state, { title }), state);
  return { svg: out, changed: out !== svg, hasGrass };
}

async function main() {
  const [file = 'assets/room.svg', user = process.env.GITHUB_REPOSITORY_OWNER] = process.argv.slice(2);
  if (!user) {
    console.error('usage: node scripts/render-grass.js <room.svg> <github-user>');
    process.exit(1);
  }

  let svg;
  try {
    svg = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`${file}: ${err.message}`);
    process.exit(1);
  }

  try {
    const days = await fetchContributionDays(user);
    const { svg: out, changed, hasGrass } = refreshGrass(svg, days, user);
    if (!hasGrass) console.warn('this room has no contribution grass. Add one in the builder to see your graph.');
    if (changed) writeFileSync(file, out);
    console.log(`${file}: ${changed ? 'updated' : 'unchanged'} (${user}, up to ${days.at(-1).date})`);
  } catch (err) {
    console.error(`${file}: ${err.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
