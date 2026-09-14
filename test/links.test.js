import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLinkBadge, badgeFiles, linksSnippet, LINK_PRESETS } from '../src/links.js';

test('every preset renders as a standalone SVG', () => {
  for (const [id, p] of Object.entries(LINK_PRESETS)) {
    const svg = renderLinkBadge(p);
    assert.ok(svg.startsWith('<svg xmlns='), id);
    assert.ok(svg.includes('shape-rendering="crispEdges"'), id);
    assert.match(svg, /width="\d+" height="26"/, id);
    assert.ok(svg.length < 4000, `${id}: ${svg.length} bytes`);
  }
});

test('badge width follows the label', () => {
  const w = (label) => Number(renderLinkBadge({ label }).match(/width="(\d+)"/)[1]);
  assert.ok(w('LINKEDIN') > w('MAIL'));
  assert.ok(w('MAIL') > w('X'));
});

test('unsupported letters are dropped, not drawn', () => {
  const svg = renderLinkBadge({ label: '한글' });
  assert.ok(svg.startsWith('<svg'));
  assert.equal(
    renderLinkBadge({ label: '한글' }).match(/width="(\d+)"/)[1],
    renderLinkBadge({ label: '' }).match(/width="(\d+)"/)[1],
  );
});

test('file names are unique even when labels collide', () => {
  const files = badgeFiles([{ label: 'Blog' }, { label: 'Blog' }, { label: '한글' }]).map((f) => f.file);
  assert.deepEqual(files, ['blog.svg', 'blog-2.svg', 'link3.svg']);
  assert.equal(new Set(files).size, files.length);
});

test('snippet uses the same file names and skips url-less links', () => {
  const links = [{ label: 'Blog', url: 'https://a.b' }, { label: 'Draft' }];
  const snippet = linksSnippet(links);
  assert.ok(snippet.includes('href="https://a.b"'));
  assert.ok(snippet.includes('src="./links/blog.svg"'));
  assert.ok(!snippet.includes('draft.svg'));
});

test('snippet escapes quotes in urls and labels', () => {
  const snippet = linksSnippet([{ label: 'a"b', url: 'https://x/?q="1"&r=2' }]);
  assert.ok(!snippet.includes('?q="1"'));
  assert.ok(snippet.includes('&amp;r=2'));
  assert.ok(snippet.includes('alt="a&quot;b"'));
});
