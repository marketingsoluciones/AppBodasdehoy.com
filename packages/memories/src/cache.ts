/**
 * In-memory cache — replaces localStorage-based caching.
 * O(1) lookup, no JSON parsing overhead, no QuotaExceeded risk,
 * and no sensitive data persisted to disk.
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

export function clearAllCache(): void {
  cache.clear();
}
