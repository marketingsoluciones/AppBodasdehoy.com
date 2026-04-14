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

/**
 * La API requiere el slug `album_id` (formato `alb_*`) para todas las operaciones
 * de escritura (upload, delete, update, share-link). Los callers suelen pasar el
 * `_id` de MongoDB (que viene de la URL). Este helper resuelve el slug desde el
 * estado del store cuando está disponible, y cae al `albumId` original si no.
 */
export function resolveWriteId(albumId: string, get: () => MemoriesState): string {
  const s = get();
  const album =
    s.currentAlbum?._id === albumId
      ? s.currentAlbum
      : s.albums.find((a) => a._id === albumId);
  return album?.album_id ?? albumId;
}
