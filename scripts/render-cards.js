import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fetchRepo } from '../src/github.js';
import { renderRepoCard, parseRepo, cardFile, cardSnippet, REPO_CARD_THEMES } from '../src/repocard.js';
import { readDotFont } from '../src/dotfont.js';

const [inFile = 'cards.json', outDir = 'cards'] = process.argv.slice(2);

if (!existsSync(inFile)) {
  console.log(`no ${inFile}, skipping repo cards.`);
  process.exit(0);
}

let config;
try {
  config = JSON.parse(readFileSync(inFile, 'utf8').replace(/^﻿/, ''));
} catch (err) {
  console.error(`${inFile}: ${err.message}`);
  process.exit(1);
}

const { repos = [], theme = 'light', width = 400, scale = 1, full = false, sparkle = true } =
  Array.isArray(config) ? { repos: config } : config;

if (!Array.isArray(repos) || !repos.length) {
  console.error(`${inFile}: the repos list is empty.`);
  process.exit(1);
}
if (!REPO_CARD_THEMES[theme]) {
  console.warn(`unknown theme "${theme}", drawing light. (${Object.keys(REPO_CARD_THEMES).join(', ')})`);
}

let dots = null;
try {
  dots = readDotFont(readFileSync(new URL('../assets/galmuri11.dot', import.meta.url)));
} catch (err) {
  console.warn(`could not read the dot font (${err.message}). Text goes out as <text>.`);
}

mkdirSync(outDir, { recursive: true });

const done = [];
for (const entry of repos) {
  const parsed = parseRepo(entry);
  if (!parsed) {
    console.warn(`skipped: "${entry}" (not owner/repo form)`);
    continue;
  }

  try {
    const repo = await fetchRepo({ ...parsed, token: process.env.GITHUB_TOKEN });
    const svg = renderRepoCard(repo, { theme, width, scale, full, sparkle, dots });
    const file = cardFile(repo);
    writeFileSync(path.join(outDir, file), svg);
    done.push(repo);
    console.log(`  ${path.join(outDir, file)}: ★ ${repo.stars} / ⑂ ${repo.forks}`);
  } catch (err) {
    console.warn(`skipped: ${entry} (${err.message})`);
  }
}

if (!done.length) {
  console.error('no cards were drawn.');
  process.exit(1);
}

console.log(`\n${done.length} cards. Snippets for the README:\n`);
console.log(cardSnippet(done, outDir));
