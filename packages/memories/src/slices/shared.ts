import type { MemoriesState } from '../initialState';

// Abort controllers for cancelling in-flight requests
const controllers = new Map<string, AbortController>();

export function getController(key: string): AbortController {
  const prev = controllers.get(key);
  if (prev) prev.abort();
  const next = new AbortController();
  controllers.set(key, next);
  return next;
}

export function getConfig(get: () => MemoriesState) {
  const s = get();
  return {
    baseUrl: s.apiBaseUrl,
    userId: s.userId,
    development: s.development || 'bodasdehoy',
  };
}
