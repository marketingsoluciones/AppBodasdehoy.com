/**
 * Request deduplication — prevents duplicate in-flight requests.
 * If a request with the same key is already in progress, returns
 * the existing promise instead of firing a new one.
 */

const inflight = new Map<string, Promise<unknown>>();

export function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
