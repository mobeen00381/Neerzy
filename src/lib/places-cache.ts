/**
 * Tiny best-effort TTL cache for Google Places lookups.
 *
 * Every search/detail call here costs real money, and the most repeated search
 * there is is "my own business name" — the same query, again and again, by the
 * same visitor and their neighbours. Memoising identical queries turns those
 * repeats into zero API calls with no new table, RLS or migration: the store is
 * a per-instance in-memory Map.
 *
 * Deliberately NOT a source of truth. It lives in the module scope of a
 * serverless instance, so entries vanish on cold starts and each instance keeps
 * its own copy. The worst case is a miss, i.e. exactly the behaviour we had
 * before. Empty/nil results are never stored, so a transient Google failure
 * can't be replayed for 24 hours.
 */

/** Identical search queries are stable for a long time. */
export const SEARCH_CACHE_MS = 24 * 60 * 60 * 1000;

/** Place details drift slowly (review counts), so keep this one short. */
export const DETAIL_CACHE_MS = 10 * 60 * 1000;

/** Upper bound on live entries per instance — keeps memory flat on a busy node. */
const MAX_ENTRIES = 300;

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();

/** `"Smith Plumbing "` and `"smith  plumbing"` are the same search. */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

export function searchCacheKey(namespace: string, query: string, limit?: number): string {
  return `${namespace}:${normalizeQuery(query)}${limit ? `:${limit}` : ""}`;
}

export function detailCacheKey(namespace: string, placeId: string): string {
  return `${namespace}:${placeId.trim()}`;
}

/** Never memoise "nothing" — that is how a stale empty result becomes a bug. */
function isCacheable(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.length > 0;
  return true;
}

function prune(now: number): void {
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
  // Map preserves insertion order → dropping from the front drops the oldest.
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

/** `undefined` when absent or expired (callers: treat as "go ask Google"). */
export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/** Cache a non-empty result. No-op for empty values. */
export function setCached(key: string, value: unknown, ttlMs: number): void {
  if (!isCacheable(value)) return;
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  prune(Date.now());
}
