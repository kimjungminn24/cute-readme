import { writeFileSync } from 'node:fs';
import { renderRoom, DEMO_ROOM } from '../src/room.js';

const svg = renderRoom(DEMO_ROOM, { title: 'demo room' });
writeFileSync('room.svg', svg);
console.log(`room.svg (${svg.length.toLocaleString()} bytes)`);
