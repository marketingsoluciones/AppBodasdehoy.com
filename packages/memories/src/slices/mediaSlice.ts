import { StateCreator } from 'zustand/vanilla';
import type { AlbumMedia, MemoriesState } from '../initialState';
import { getCached, setCache, invalidateCache } from '../cache';
import { dedup } from '../dedup';
import { getConfig, getController, resolveWriteId } from './shared';
import { compressImage, convertHeicIfNeeded, validateFile, withRetry } from '@bodasdehoy/shared/upload';

export interface MediaAction {
  fetchAlbumMedia: (albumId: string) => Promise<void>;
  uploadMedia: (albumId: string, file: File, caption?: string) => Promise<AlbumMedia | null>;
  deleteMedia: (albumId: string, mediaId: string) => Promise<void>;
}

/** API devuelve snake_case; nuestro tipo usa camelCase. */
function toAlbumMedia(raw: any): AlbumMedia {
  return {
    _id: raw._id,
    albumId: raw.albumId ?? raw.album_id,
    caption: raw.caption,
    createdAt: raw.createdAt ?? raw.created_at,
    fileId: raw.fileId ?? raw.file_id,
    location: raw.location,
    mediaType: raw.mediaType ?? raw.media_type,
    originalUrl: raw.originalUrl ?? raw.original_url,
    sortOrder: raw.sortOrder ?? raw.sort_order,
    takenAt: raw.takenAt ?? raw.taken_at,
    thumbnailUrl: raw.thumbnailUrl ?? raw.thumbnail_url,
    userId: raw.userId ?? raw.user_id,
  };
}

export const mediaSlice: StateCreator<MemoriesState, [], [], MediaAction> = (set, get) => ({
  fetchAlbumMedia: async (albumId) => {
    const { baseUrl, userId, development } = getConfig(get);
    const readId = resolveWriteId(albumId, get);
    const cacheKey = `media_${albumId}_${userId}_${development}`;

    return dedup(cacheKey, async () => {
      const cached = getCached<AlbumMedia[]>(cacheKey);
      if (cached) {
        set({ currentAlbumMedia: cached, mediaLoading: false });
        const controller = getController(`fetchMedia_${albumId}`);
        fetch(
          `${baseUrl}/api/memories/albums/${readId}/media?user_id=${userId}&development=${development}`,
          { signal: controller.signal },
        )
          .then((r) => r.json())
          .then((data) => {
            if (data?.success && data.media) {
              const media = data.media.map(toAlbumMedia);
              setCache(cacheKey, media);
              set({ currentAlbumMedia: media });
            }
          })
          .catch((e) => {
            if (e.name !== 'AbortError') console.error('[Memories] fetchAlbumMedia revalidate:', e);
          });
        return;
      }

      set({ mediaError: null, mediaLoading: true });
      try {
        const controller = getController(`fetchMedia_${albumId}`);
        const res = await fetch(
          `${baseUrl}/api/memories/albums/${readId}/media?user_id=${userId}&development=${development}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data?.success) {
          const media = (data.media || []).map(toAlbumMedia);
          setCache(cacheKey, media);
          set({ currentAlbumMedia: media, mediaLoading: false });
        } else {
          set({ mediaError: data?.detail || data?.error || 'Error', mediaLoading: false });
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('[Memories] fetchAlbumMedia:', e);
        set({ mediaError: e.message || 'Error', mediaLoading: false });
      }
    });
  },

  uploadMedia: async (albumId, rawFile, caption) => {
    const { baseUrl, userId, development } = getConfig(get);
    const writeId = resolveWriteId(albumId, get);

    // Validate
    const validation = validateFile(rawFile);
    if (!validation.valid) throw new Error(validation.error || 'Archivo no válido');

    // HEIC conversion + compression
    let file = await convertHeicIfNeeded(rawFile);
    file = await compressImage(file);

    const tempId = `temp_${Date.now()}`;
    const tempUrl = URL.createObjectURL(file);
    const tempMedia: AlbumMedia = {
      _id: tempId,
      albumId,
      caption: caption || '',
      createdAt: new Date().toISOString(),
      fileId: tempId,
      mediaType: file.type.startsWith('video/') ? 'video' : 'photo',
      originalUrl: tempUrl,
      sortOrder: 0,
      thumbnailUrl: tempUrl,
      userId,
    } as AlbumMedia;
    set((s) => ({ currentAlbumMedia: [tempMedia, ...s.currentAlbumMedia], uploadProgress: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      const params = new URLSearchParams({ development, user_id: userId });
      if (caption) params.append('caption', caption);
      const url = `${baseUrl}/api/memories/albums/${writeId}/upload?${params.toString()}`;

      const result = await withRetry(() => new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) set({ uploadProgress: Math.round((e.loaded / e.total) * 100) });
        });
        xhr.addEventListener('load', () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error(`Error ${xhr.status} al subir el archivo`)); }
        });
        xhr.addEventListener('error', () => reject(new Error('Error de red al subir')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelado')));
        xhr.send(formData);
      }));

      set({ uploadProgress: 100 });

      if (result?.success && result.media) {
        const savedMedia = toAlbumMedia(result.media);
        set((s) => ({
          currentAlbumMedia: s.currentAlbumMedia.map((m) => (m._id === tempId ? savedMedia : m)),
          uploadProgress: 0,
        }));
        invalidateCache(`media_${albumId}`);
        URL.revokeObjectURL(tempUrl);
        return savedMedia;
      }

      set((s) => ({ currentAlbumMedia: s.currentAlbumMedia.filter((m) => m._id !== tempId), uploadProgress: 0 }));
      URL.revokeObjectURL(tempUrl);
      const errMsg = result?.error || result?.detail || (typeof result?.message === 'string' ? result.message : null);
      if (errMsg) throw new Error(errMsg);
      return null;
    } catch (e) {
      set((s) => ({ currentAlbumMedia: s.currentAlbumMedia.filter((m) => m._id !== tempId), uploadProgress: 0 }));
      URL.revokeObjectURL(tempUrl);
      console.error('[Memories] uploadMedia:', e);
      if (e instanceof Error) throw e;
      throw new Error('Error al subir el archivo');
    }
  },

  deleteMedia: async (albumId, mediaId) => {
    const { baseUrl, userId, development } = getConfig(get);
    const writeId = resolveWriteId(albumId, get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${writeId}/media/${mediaId}?user_id=${userId}&development=${development}`,
        { method: 'DELETE' },
      );
      const result = await res.json();
      if (result?.success) {
        set((s) => ({
          currentAlbumMedia: s.currentAlbumMedia.filter((m) => m._id !== mediaId),
          selectedMediaIds: s.selectedMediaIds.filter((id) => id !== mediaId),
        }));
        invalidateCache(`media_${albumId}`);
      }
    } catch (e: any) {
      console.error('[Memories] deleteMedia:', e);
    }
  },
});
