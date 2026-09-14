import { toBase64 } from './svg.js';

const API = 'https://api.github.com';
const UA = 'cute-readme';
const TIMEOUT_MS = 15_000;
const RATE_LIMIT_MESSAGE = 'GitHub API rate limit exceeded (60/hour without a token).';

function headers(token) {
  const h = { 'User-Agent': UA, Accept: 'application/vnd.github+json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function request(url, extra = {}) {
  return fetch(url, { headers: { 'User-Agent': UA, ...extra }, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

function rateLimited(res) {
  return res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0');
}

async function fetchAvatar(avatarUrl) {
  if (!avatarUrl) return null;
  const sized = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}s=64`;
  try {
    const res = await request(sized);
    const type = res.headers.get('content-type') ?? 'image/png';
    if (!res.ok || !type.startsWith('image/')) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return `data:${type};base64,${toBase64(bytes)}`;
  } catch (err) {
    console.warn(`avatar skipped (${err.message}): ${avatarUrl}`);
    return null;
  }
}

export async function withAvatars(entries, cache) {
  return Promise.all(
    entries.map(async (c) => {
      const key = `avatar:${c.avatarUrl}`;
      let uri = cache ? await cache.get(key) : null;
      if (!uri) {
        uri = await fetchAvatar(c.avatarUrl);
        if (uri && cache) await cache.put(key, uri, { expirationTtl: 86400 });
      }
      return { ...c, avatar: uri };
    }),
  );
}

export async function fetchContributors({ owner, repo, token, limit = 15 }) {
  const per = Math.min(100, Math.max(1, limit) * 2);
  const res = await request(`${API}/repos/${owner}/${repo}/contributors?per_page=${per}`, headers(token));

  if (res.status === 404) throw new Error(`no such repo: ${owner}/${repo}`);
  if (rateLimited(res)) throw new Error(RATE_LIMIT_MESSAGE);
  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`contributor fetch failed (${res.status})`);

  const list = await res.json();
  if (!Array.isArray(list)) return [];

  return list
    .filter((c) => c?.login && c.type !== 'Bot' && !c.login.endsWith('[bot]'))
    .slice(0, limit)
    .map((c) => ({
      login: c.login,
      contributions: c.contributions ?? 0,
      avatarUrl: c.avatar_url,
      url: c.html_url ?? `https://github.com/${c.login}`,
    }));
}

export async function fetchRepo({ owner, repo, token }) {
  const res = await request(`${API}/repos/${owner}/${repo}`, headers(token));
  if (!res.ok) {
    if (res.status === 404) throw new Error(`no such repo: ${owner}/${repo}`);
    if (rateLimited(res)) throw new Error(RATE_LIMIT_MESSAGE);
    throw new Error(`repo fetch failed (${res.status})`);
  }
  const r = await res.json();
  return {
    owner: r.owner?.login ?? owner,
    name: r.name ?? repo,
    description: r.description ?? '',
    language: r.language ?? '',
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    archived: !!r.archived,
    fork: !!r.fork,
  };
}
