import { StateCreator } from 'zustand/vanilla';
import type { Album, MemoriesState } from '../initialState';
import { getCached, setCache, invalidateCache } from '../cache';
import { dedup } from '../dedup';
import { getConfig, getController } from './shared';

export interface AlbumsAction {
  fetchAlbums: () => Promise<void>;
  fetchAlbum: (albumId: string) => Promise<void>;
  createAlbum: (data: Partial<Album>) => Promise<Album | null>;
  deleteAlbum: (albumId: string) => Promise<void>;
  updateAlbum: (albumId: string, data: Partial<Album>) => Promise<void>;
  fetchAlbumsByEvent: (eventId: string) => Promise<void>;
  fetchSubAlbums: (parentAlbumId: string) => Promise<void>;
  createEventAlbumStructure: (eventId: string, eventName: string, itineraryItems: any[]) => Promise<any>;
  generateShareLink: (albumId: string, expiresInDays?: number) => Promise<{ shareToken: string; shareUrl: string } | null>;
  getAlbumByItinerary: (itineraryId: string) => Promise<Album | null>;
  getAlbumsByEvent: (eventId: string) => Promise<any>;
  getPublicAlbum: (shareToken: string) => Promise<{ album: Album; media: any[] } | null>;
}

export const albumsSlice: StateCreator<MemoriesState, [], [], AlbumsAction> = (set, get) => ({
  fetchAlbums: async () => {
    const { baseUrl, userId, development } = getConfig(get);
    if (!userId) return;
    const cacheKey = `albums_${userId}_${development}`;

    return dedup(cacheKey, async () => {
      const cached = getCached<Album[]>(cacheKey);
      if (cached) {
        set({ albums: cached, albumsLoading: false });
        const controller = getController('fetchAlbums');
        fetch(`${baseUrl}/api/memories/albums?user_id=${userId}&development=${development}`, {
          signal: controller.signal,
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.success && data.albums) {
              setCache(cacheKey, data.albums);
              set({ albums: data.albums });
            }
          })
          .catch((e) => {
            if (e.name !== 'AbortError') console.error('[Memories] fetchAlbums revalidate:', e);
          });
        return;
      }

      set({ albumsError: null, albumsLoading: true });
      try {
        const controller = getController('fetchAlbums');
        const res = await fetch(
          `${baseUrl}/api/memories/albums?user_id=${userId}&development=${development}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data?.success) {
          const albums = data.albums || [];
          setCache(cacheKey, albums);
          set({ albums, albumsLoading: false });
        } else {
          set({ albumsError: data?.detail?.[0]?.message || 'Error', albumsLoading: false });
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('[Memories] fetchAlbums:', e);
        set({ albumsError: e.message, albumsLoading: false });
      }
    });
  },

  fetchAlbum: async (albumId) => {
    const { baseUrl, userId, development } = getConfig(get);
    const cacheKey = `album_${albumId}_${userId}_${development}`;

    return dedup(cacheKey, async () => {
      const cached = getCached<Album>(cacheKey);
      if (cached) {
        set({ currentAlbum: cached, currentAlbumLoading: false });
        const controller = getController(`fetchAlbum_${albumId}`);
        fetch(`${baseUrl}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`, {
          signal: controller.signal,
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.success && data.album) {
              setCache(cacheKey, data.album);
              set({ currentAlbum: data.album });
            }
          })
          .catch((e) => {
            if (e.name !== 'AbortError') console.error('[Memories] fetchAlbum revalidate:', e);
          });
        return;
      }

      set({ currentAlbumError: null, currentAlbumLoading: true });
      try {
        const controller = getController(`fetchAlbum_${albumId}`);
        const res = await fetch(
          `${baseUrl}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data?.success && data.album) {
          setCache(cacheKey, data.album);
          set({ currentAlbum: data.album, currentAlbumLoading: false });
        } else {
          set({ currentAlbumError: data?.detail || data?.error || 'Error', currentAlbumLoading: false });
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('[Memories] fetchAlbum:', e);
        set({ currentAlbumError: e.message || 'Error', currentAlbumLoading: false });
      }
    });
  },

  createAlbum: async (data) => {
    const { baseUrl, userId, development } = getConfig(get);
    const tempId = `temp_${Date.now()}`;
    const tempAlbum: Album = {
      _id: tempId,
      albumType: data.albumType,
      coverImageUrl: data.coverImageUrl || '',
      createdAt: new Date().toISOString(),
      description: data.description || '',
      eventId: data.eventId,
      itineraryId: data.itineraryId,
      mediaCount: 0,
      memberCount: 0,
      name: data.name || 'Nuevo Álbum',
      ownerId: userId,
      parentAlbumId: data.parentAlbumId,
      settings: { allow_comments: true, allow_downloads: true, allow_reactions: true },
      updatedAt: new Date().toISOString(),
      visibility: (data.visibility as Album['visibility']) || 'private',
      ...data,
    } as Album;
    set((s) => ({ albums: [tempAlbum, ...s.albums], isCreateAlbumModalOpen: false }));
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums?user_id=${userId}&development=${development}`,
        { body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }, method: 'POST' },
      );
      let result: any;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) result = await res.json();
      else {
        const text = await res.text().catch(() => '');
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        result = { success: false };
      }
      if (result?.success && result.album) {
        set((s) => ({ albums: s.albums.map((a) => (a._id === tempId ? result.album : a)) }));
        invalidateCache(`albums_${userId}_${development}`);
        return result.album;
      }
      set((s) => ({ albums: s.albums.filter((a) => a._id !== tempId) }));
      throw new Error(result?.detail || result?.error || 'Error al crear el álbum');
    } catch (e) {
      set((s) => ({ albums: s.albums.filter((a) => a._id !== tempId) }));
      console.error('[Memories] createAlbum:', e);
      throw e;
    }
  },

  deleteAlbum: async (albumId) => {
    const { baseUrl, userId, development } = getConfig(get);
    const albums = get().albums;
    const index = albums.findIndex((a) => a._id === albumId);
    const albumToDelete = index >= 0 ? albums[index] : null;

    set((s) => ({
      albums: s.albums.filter((a) => a._id !== albumId),
      currentAlbum: s.currentAlbum?._id === albumId ? null : s.currentAlbum,
    }));
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
        { method: 'DELETE' },
      );
      const result = await res.json();
      if (result?.success) {
        invalidateCache(`albums_${userId}_${development}`);
        invalidateCache(`album_${albumId}`);
      } else if (albumToDelete) {
        set((s) => { const r = [...s.albums]; r.splice(index, 0, albumToDelete); return { albums: r }; });
      }
    } catch (e: any) {
      console.error('[Memories] deleteAlbum:', e);
      if (albumToDelete) {
        set((s) => { const r = [...s.albums]; r.splice(index, 0, albumToDelete); return { albums: r }; });
      }
    }
  },

  updateAlbum: async (albumId, data) => {
    const { baseUrl, userId, development } = getConfig(get);
    const prevAlbum = get().currentAlbum;
    const prevAlbumInList = get().albums.find((a) => a._id === albumId);

    set((s) => ({
      albums: s.albums.map((a) => (a._id === albumId ? { ...a, ...data } : a)),
      currentAlbum: s.currentAlbum?._id === albumId ? { ...s.currentAlbum, ...data } : s.currentAlbum,
    }));
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
        { body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }, method: 'PUT' },
      );
      const result = await res.json();
      if (result?.success && result.album) {
        set((s) => ({
          albums: s.albums.map((a) => (a._id === albumId ? { ...a, ...result.album } : a)),
          currentAlbum: s.currentAlbum?._id === albumId ? { ...s.currentAlbum, ...result.album } : s.currentAlbum,
        }));
        invalidateCache(`album_${albumId}`);
        invalidateCache(`albums_${userId}_${development}`);
      }
    } catch (e: any) {
      console.error('[Memories] updateAlbum:', e);
      if (prevAlbumInList) {
        set((s) => ({
          albums: s.albums.map((a) => (a._id === albumId ? prevAlbumInList : a)),
          currentAlbum: s.currentAlbum?._id === albumId ? prevAlbum : s.currentAlbum,
        }));
      }
    }
  },

  fetchAlbumsByEvent: async (eventId) => {
    const { baseUrl, development } = getConfig(get);
    return dedup(`eventAlbums_${eventId}`, async () => {
      set({ eventAlbumLoading: true });
      try {
        const controller = getController(`fetchEventAlbums_${eventId}`);
        const res = await fetch(
          `${baseUrl}/api/memories/by-event/${eventId}?development=${development}&include_sub_albums=true`,
          { signal: controller.signal },
        );
        const result = await res.json();
        if (result?.success) {
          set({
            eventAlbumLoading: false,
            eventAlbumStructure: { mainAlbum: result.main_album ?? null, subAlbums: result.sub_albums || [], totalMediaCount: result.total_media_count || 0 },
          });
        } else {
          set({ eventAlbumLoading: false });
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('[Memories] fetchAlbumsByEvent:', e);
        set({ eventAlbumLoading: false });
      }
    });
  },

  fetchSubAlbums: async (parentAlbumId) => {
    const { baseUrl } = getConfig(get);
    try {
      const controller = getController(`fetchSub_${parentAlbumId}`);
      const res = await fetch(`${baseUrl}/api/memories/albums/${parentAlbumId}/sub-albums`, { signal: controller.signal });
      const result = await res.json();
      if (result?.success) set({ subAlbums: result.sub_albums || [] });
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('[Memories] fetchSubAlbums:', e);
    }
  },

  createEventAlbumStructure: async (eventId, eventName, itineraryItems) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/create-event-structure?user_id=${userId}&development=${development}`,
        { body: JSON.stringify({ event_id: eventId, event_name: eventName, itinerary_items: itineraryItems }), headers: { 'Content-Type': 'application/json' }, method: 'POST' },
      );
      const result = await res.json();
      return result?.success ? result : null;
    } catch (e: any) {
      console.error('[Memories] createEventAlbumStructure:', e);
      return null;
    }
  },

  generateShareLink: async (albumId, expiresInDays = 30) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/share-link?user_id=${userId}&development=${development}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expires_in_days: expiresInDays, permissions: 'view' }) },
      );
      const result = await res.json().catch(() => ({}));
      if (result?.success) return { shareToken: result.share_token, shareUrl: result.share_url };
      if (!res.ok) throw new Error(result?.detail || result?.error || result?.message || `Error ${res.status}`);
      return null;
    } catch (e) {
      console.error('[Memories] generateShareLink:', e);
      if (e instanceof Error) throw e;
      throw new Error('Error al generar el enlace de compartir');
    }
  },

  getAlbumByItinerary: async (itineraryId) => {
    const { baseUrl, development } = getConfig(get);
    try {
      const res = await fetch(`${baseUrl}/api/memories/by-itinerary/${itineraryId}?development=${development}`);
      const result = await res.json();
      return result?.success && result.album ? result.album : null;
    } catch (e: any) {
      console.error('[Memories] getAlbumByItinerary:', e);
      return null;
    }
  },

  getAlbumsByEvent: async (eventId) => {
    const { baseUrl, development } = getConfig(get);
    try {
      const res = await fetch(`${baseUrl}/api/memories/by-event/${eventId}?development=${development}&include_sub_albums=true`);
      const result = await res.json();
      return result?.success ? result : null;
    } catch (e: any) {
      console.error('[Memories] getAlbumsByEvent:', e);
      return null;
    }
  },

  getPublicAlbum: async (shareToken) => {
    const { baseUrl, development } = getConfig(get);
    try {
      const res = await fetch(`${baseUrl}/api/memories/public/${shareToken}?development=${development}`);
      const result = await res.json();
      if (result?.success) return { album: result.album, media: result.media || [] };
      return null;
    } catch (e: any) {
      console.error('[Memories] getPublicAlbum:', e);
      return null;
    }
  },
});
