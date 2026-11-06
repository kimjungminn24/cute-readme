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

// The profile's contribution calendar, as the page shows it: private days count too when the user shares them.
export function parseContributionDays(html) {
  const days = [];
  for (const tag of String(html).match(/<td\b[^>]*\bContributionCalendar-day\b[^>]*>/g) ?? []) {
    const date = tag.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const level = Number(tag.match(/\bdata-level="([0-4])"/)?.[1]);
    if (date && Number.isInteger(level)) days.push({ date, level });
  }
  return days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export async function fetchContributionDays(user) {
  if (!/^[A-Za-z0-9-]{1,39}$/.test(String(user ?? ''))) throw new Error(`not a GitHub user name: ${user}`);
  const res = await request(`https://github.com/users/${user}/contributions`, { Accept: 'text/html' });
  if (res.status === 404) throw new Error(`no such user: ${user}`);
  if (!res.ok) throw new Error(`contributions fetch failed (${res.status})`);
  const days = parseContributionDays(await res.text());
  if (!days.length) throw new Error('found no days in the contribution graph; GitHub may have changed the page');
  return days;
}

export async function graphql(query, variables, token) {
  if (!token) throw new Error('the Discussions API needs a token (GITHUB_TOKEN)');
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (rateLimited(res)) throw new Error(RATE_LIMIT_MESSAGE);
  if (!res.ok) throw new Error(`GraphQL request failed (${res.status})`);
  const out = await res.json();
  if (out.errors?.length) throw new Error(out.errors.map((e) => e.message).join('; '));
  return out.data;
}

const DISCUSSION_LIST = `query($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    hasDiscussionsEnabled
    discussions(first: 50, orderBy: { field: CREATED_AT, direction: DESC }) { nodes { number title } }
  }
}`;

const DISCUSSION_COMMENTS = `query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    discussion(number: $number) {
      number title url
      comments(last: 50) {
        nodes { body createdAt url isMinimized author { login avatarUrl } }
      }
    }
  }
}`;

// Finds the guestbook discussion (by number, or by a title that contains `match`)
// and returns its comments. Returns null when there is no such discussion.
export async function fetchGuestbook({ owner, repo, token, number, match = 'guestbook' }) {
  let num = Number(number) || 0;

  if (!num) {
    const data = await graphql(DISCUSSION_LIST, { owner, repo }, token);
    const r = data?.repository;
    if (!r) throw new Error(`no such repo: ${owner}/${repo}`);
    if (!r.hasDiscussionsEnabled) throw new Error(`Discussions are turned off in ${owner}/${repo}`);
    const want = String(match).toLowerCase();
    num = r.discussions.nodes.find((d) => d.title.toLowerCase().includes(want))?.number ?? 0;
    if (!num) return null;
  }

  const data = await graphql(DISCUSSION_COMMENTS, { owner, repo, number: num }, token);
  const d = data?.repository?.discussion;
  if (!d) return null;
  return { number: d.number, title: d.title, url: d.url, comments: d.comments?.nodes ?? [] };
}
