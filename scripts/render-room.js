import { readFileSync, writeFileSync } from 'node:fs';
import { renderRoom } from '../src/room.js';

const [inFile, outFile = 'room.svg', title = 'miniroom'] = process.argv.slice(2);

if (!inFile) {
  console.error('usage: node scripts/render-room.js <room.json> [outfile] [title]');
  process.exit(1);
}

let room;
try {
  room = JSON.parse(readFileSync(inFile, 'utf8').replace(/^\uFEFF/, ''));
} catch (err) {
  console.error(`${inFile}: ${err.message}`);
  process.exit(1);
}

if (room === null || typeof room !== 'object' || Array.isArray(room)) {
  console.error(`${inFile}: room JSON must be an object (paste the editor Copy button output as is)`);
  process.exit(1);
}

const svg = renderRoom(room, { title });
writeFileSync(outFile, svg);
const size = svg.match(/width="(\d+)" height="(\d+)"/);
console.log(`${outFile} (${svg.length.toLocaleString()} bytes, ${size[1]}x${size[2]})`);
