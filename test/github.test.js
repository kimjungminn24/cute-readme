import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchContributors, fetchRepo, withAvatars } from '../src/github.js';

const json = (status, body, headers = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const image = (bytes) =>
  new Response(new Uint8Array(bytes), { status: 200, headers: { 'content-type': 'image/png' } });

const CONTRIBUTORS = [
  { login: 'alice', contributions: 40, avatar_url: 'https://a/alice', html_url: 'https://github.com/alice', type: 'User' },
  { login: 'dependabot[bot]', contributions: 30, avatar_url: 'https://a/bot', type: 'Bot' },
  { login: 'renovate[bot]', contributions: 20, avatar_url: 'https://a/bot2', type: 'User' },
  { login: 'bob', contributions: 10, avatar_url: 'https://a/bob', type: 'User' },
  { login: 'carol', contributions: 5, avatar_url: 'https://a/carol', type: 'User' },
];

const mockFetch = (t, impl) => t.mock.method(globalThis, 'fetch', impl);

test('contributors: bots are dropped, the limit applies after that', async (t) => {
  const calls = mockFetch(t, async () => json(200, CONTRIBUTORS));
  const got = await fetchContributors({ owner: 'o', repo: 'r', limit: 2 });

  assert.deepEqual(got.map((c) => c.login), ['alice', 'bob']);
  assert.equal(got[0].url, 'https://github.com/alice');
  assert.equal(got[1].contributions, 10);

  const url = String(calls.mock.calls[0].arguments[0]);
  assert.match(url, /\/repos\/o\/r\/contributors\?per_page=4$/);
});

test('contributors: html_url falls back to the profile address', async (t) => {
  mockFetch(t, async () => json(200, [{ login: 'dave', avatar_url: 'https://a/dave' }]));
  const [dave] = await fetchContributors({ owner: 'o', repo: 'r' });
  assert.equal(dave.url, 'https://github.com/dave');
  assert.equal(dave.contributions, 0);
});

test('contributors: the token goes out as a bearer header', async (t) => {
  const calls = mockFetch(t, async () => json(200, []));
  await fetchContributors({ owner: 'o', repo: 'r', token: 'tok' });
  const { headers } = calls.mock.calls[0].arguments[1];
  assert.equal(headers.Authorization, 'Bearer tok');
  assert.equal(headers['User-Agent'], 'cute-readme');
});

test('contributors: an empty repo answers 204, which is an empty list', async (t) => {
  mockFetch(t, async () => json(204));
  assert.deepEqual(await fetchContributors({ owner: 'o', repo: 'r' }), []);
});

test('contributors: 404, the rate limit and server errors get readable messages', async (t) => {
  mockFetch(t, async () => json(404, { message: 'Not Found' }));
  await assert.rejects(fetchContributors({ owner: 'o', repo: 'nope' }), /no such repo: o\/nope/);

  mockFetch(t, async () => json(403, {}, { 'x-ratelimit-remaining': '0' }));
  await assert.rejects(fetchContributors({ owner: 'o', repo: 'r' }), /rate limit/);

  mockFetch(t, async () => json(500, {}));
  await assert.rejects(fetchContributors({ owner: 'o', repo: 'r' }), /500/);
});

test('avatars: one broken avatar does not sink the others', async (t) => {
  t.mock.method(console, 'warn', () => {});
  mockFetch(t, async (url) => {
    if (String(url).startsWith('https://a/bad')) throw new TypeError('fetch failed');
    if (String(url).startsWith('https://a/html')) {
      return new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } });
    }
    return image([1, 2, 3]);
  });

  const got = await withAvatars([
    { login: 'ok', avatarUrl: 'https://a/ok?x=1' },
    { login: 'bad', avatarUrl: 'https://a/bad' },
    { login: 'html', avatarUrl: 'https://a/html' },
    { login: 'none' },
  ], null);

  assert.equal(got[0].avatar, 'data:image/png;base64,AQID');
  assert.equal(got[0].login, 'ok');
  assert.deepEqual(got.slice(1).map((c) => c.avatar), [null, null, null]);
});

test('avatars: the size hint respects an existing query string', async (t) => {
  const calls = mockFetch(t, async () => image([0]));
  await withAvatars([{ avatarUrl: 'https://a/x?v=4' }, { avatarUrl: 'https://a/y' }], null);
  const urls = calls.mock.calls.map((c) => String(c.arguments[0]));
  assert.deepEqual(urls, ['https://a/x?v=4&s=64', 'https://a/y?s=64']);
});

test('avatars: a cache short-circuits the download', async (t) => {
  const calls = mockFetch(t, async () => { throw new Error('should not be called'); });
  const store = new Map([['avatar:https://a/x', 'data:image/png;base64,AA==']]);
  const cache = { get: async (k) => store.get(k) ?? null, put: async (k, v) => store.set(k, v) };
  const [got] = await withAvatars([{ avatarUrl: 'https://a/x' }], cache);
  assert.equal(got.avatar, 'data:image/png;base64,AA==');
  assert.equal(calls.mock.callCount(), 0);
});

test('repo: fields are mapped with safe defaults', async (t) => {
  mockFetch(t, async () => json(200, { name: 'r', owner: { login: 'o' }, stargazers_count: 7, archived: true }));
  const got = await fetchRepo({ owner: 'o', repo: 'r' });
  assert.deepEqual(got, {
    owner: 'o', name: 'r', description: '', language: '', stars: 7, forks: 0, archived: true, fork: false,
  });

  mockFetch(t, async () => json(403, {}, { 'x-ratelimit-remaining': '0' }));
  await assert.rejects(fetchRepo({ owner: 'o', repo: 'r' }), /rate limit/);
});
