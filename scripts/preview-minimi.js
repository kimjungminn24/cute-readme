import { writeFileSync } from 'node:fs';
import { personArt, DEFAULT_PERSON, EXPRESSION_STYLES, ACCESSORY_STYLES } from '../src/catalog.js';
import { MINI_HAIRS, MINI_OUTFITS, MINI_POSES } from '../src/person-minimi.js';

const svg = (person) => `<svg width="150" height="200" viewBox="-28 -80 56 84" shape-rendering="crispEdges">${personArt({ ...DEFAULT_PERSON, ...person })}</svg>`;
let html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>New minimi collection</title>
<style>body{background:#faf2e9;font:16px system-ui;color:#67534b;padding:24px}section{display:flex;flex-wrap:wrap;gap:14px}article{text-align:center;background:#fffdf7;border:1px solid #e7d6c5;border-radius:18px;width:164px;padding:10px}h2{margin-top:35px}p{margin:0}a{color:#587d67}</style>
<h1>New pixel minimi</h1><p>12 hairstyles, 14 outfits, 5 poses. <a href="http://localhost:5599/docs/minimi.html">Open the interactive wardrobe</a></p>`;
for (const [title, key, options] of [
  ['Hair', 'hairStyle', MINI_HAIRS], ['Wardrobe', 'outfit', MINI_OUTFITS], ['Pose', 'pose', MINI_POSES],
  ['Expressions', 'expression', EXPRESSION_STYLES], ['Accessories', 'accessory', ACCESSORY_STYLES],
]) {
  html += `<h2>${title}</h2><section>`;
  for (const [id, definition] of Object.entries(options)) html += `<article>${svg({ [key]: id })}<p>${definition.label ?? definition}</p></article>`;
  html += '</section>';
}
html += '<h2>Sitting wardrobe</h2><section>';
for (const [id, definition] of Object.entries(MINI_OUTFITS)) html += `<article>${svg({ outfit: id, pose: 'sit', hairStyle: 'bun' })}<p>${definition.label}</p></article>`;
html += '</section></html>';
writeFileSync(new URL('../docs/minimi-gallery.html', import.meta.url), html);
console.log('docs/minimi-gallery.html');
