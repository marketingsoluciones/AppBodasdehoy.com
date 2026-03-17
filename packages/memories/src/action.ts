import { StateCreator } from 'zustand/vanilla';

import type { Album, AlbumMedia, MemoriesState } from './initialState';

const CACHE_KEY_PREFIX = 'memories_cache_';
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!cached) return null;
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* ignore */
  }
}

function invalidateCache(pattern: string): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX) && key.includes(pattern)) localStorage.removeItem(key);
    });
  } catch {
    /* ignore */
  }
}

function getConfig(get: () => MemoriesState) {
  const s = get();
  return {
    baseUrl: s.apiBaseUrl,
    userId: s.userId,
    development: s.development || 'bodasdehoy',
  };
}

export interface MemoriesAction {
  setConfig: (apiBaseUrl: string, userId: string, development?: string) => void;
  clearCurrentAlbum: () => void;
  fetchAlbums: () => Promise<void>;
  fetchAlbum: (albumId: string) => Promise<void>;
  fetchAlbumMedia: (albumId: string) => Promise<void>;
  fetchAlbumMembers: (albumId: string) => Promise<void>;
  fetchAlbumsByEvent: (eventId: string) => Promise<void>;
  fetchSubAlbums: (parentAlbumId: string) => Promise<void>;
  createAlbum: (data: Partial<Album>) => Promise<Album | null>;
  createEventAlbumStructure: (
    eventId: string,
    eventName: string,
    itineraryItems: any[],
  ) => Promise<any>;
  deleteAlbum: (albumId: string) => Promise<void>;
  deleteMedia: (albumId: string, mediaId: string) => Promise<void>;
  updateAlbum: (albumId: string, data: Partial<Album>) => Promise<void>;
  uploadMedia: (albumId: string, file: File, caption?: string) => Promise<AlbumMedia | null>;
  generateShareLink: (
    albumId: string,
    expiresInDays?: number,
  ) => Promise<{ shareToken: string; shareUrl: string } | null>;
  getAlbumByItinerary: (itineraryId: string) => Promise<Album | null>;
  getAlbumsByEvent: (eventId: string) => Promise<any>;
  getEventGuests: (eventId: string) => Promise<any[]>;
  getPublicAlbum: (
    shareToken: string,
  ) => Promise<{ album: Album; media: AlbumMedia[] } | null>;
  inviteMember: (albumId: string, email: string, role: string) => Promise<string | null>;
  removeMember: (albumId: string, targetUserId: string) => Promise<void>;
  updateMemberRole: (
    albumId: string,
    targetUserId: string,
    role: string,
  ) => Promise<void>;
  sendQrToGuests: (
    albumId: string,
    guestIds: string[],
    method: 'email' | 'whatsapp',
  ) => Promise<any>;
  toggleCreateAlbumModal: (open?: boolean) => void;
  toggleInviteModal: (open?: boolean) => void;
  toggleShareModal: (open?: boolean) => void;
  toggleUploadModal: (open?: boolean) => void;
  setSearchTerm: (term: string) => void;
  setSelectedMediaIds: (ids: string[]) => void;

}

export const memoriesActionSlice: StateCreator<
  MemoriesState,
  [],
  [],
  MemoriesAction
> = (set, get, _api) => ({
  setConfig: (apiBaseUrl, userId, development = 'bodasdehoy') =>
    set({ apiBaseUrl, userId, development }),

  clearCurrentAlbum: () =>
    set({
      currentAlbum: null,
      currentAlbumError: null,
      currentAlbumMedia: [],
      currentAlbumMembers: [],
      mediaError: null,
      membersError: null,
      selectedMediaIds: [],
    }),

  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedMediaIds: (ids) => set({ selectedMediaIds: ids }),
  toggleCreateAlbumModal: (open) =>
    set((s) => ({ isCreateAlbumModalOpen: open !== undefined ? open : !s.isCreateAlbumModalOpen })),
  toggleInviteModal: (open) =>
    set((s) => ({ isInviteModalOpen: open !== undefined ? open : !s.isInviteModalOpen })),
  toggleShareModal: (open) =>
    set((s) => ({ isShareModalOpen: open !== undefined ? open : !s.isShareModalOpen })),
  toggleUploadModal: (open) =>
    set((s) => ({ isUploadModalOpen: open !== undefined ? open : !s.isUploadModalOpen })),

  fetchAlbums: async () => {
    const { baseUrl, userId, development } = getConfig(get);
    const cacheKey = `albums_${userId}_${development}`;
    const cached = getCachedData<Album[]>(cacheKey);
    if (cached) {
      set({ albums: cached, albumsLoading: false });
      fetch(`${baseUrl}/api/memories/albums?user_id=${userId}&development=${development}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data.albums) {
            setCachedData(cacheKey, data.albums);
            set({ albums: data.albums });
          }
        })
        .catch(() => {});
      return;
    }
    set({ albumsError: null, albumsLoading: true });
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums?user_id=${userId}&development=${development}`,
      );
      const data = await res.json();
      if (data?.success) {
        const albums = data.albums || [];
        setCachedData(cacheKey, albums);
        set({ albums, albumsLoading: false });
      } else {
        set({ albumsError: data?.detail?.[0]?.message || 'Error', albumsLoading: false });
      }
    } catch (e) {
      set({ albumsError: (e as Error).message, albumsLoading: false });
    }
  },

  fetchAlbum: async (albumId) => {
    const { baseUrl, userId, development } = getConfig(get);
    const cacheKey = `album_${albumId}_${userId}_${development}`;
    const cached = getCachedData<Album>(cacheKey);
    if (cached) {
      set({ currentAlbum: cached, currentAlbumLoading: false });
      fetch(`${baseUrl}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data.album) {
            setCachedData(cacheKey, data.album);
            set({ currentAlbum: data.album });
          }
        })
        .catch(() => {});
      return;
    }
    set({ currentAlbumError: null, currentAlbumLoading: true });
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
        { signal: controller.signal },
      );
      clearTimeout(t);
      const data = await res.json();
      if (data?.success && data.album) {
        setCachedData(cacheKey, data.album);
        set({ currentAlbum: data.album, currentAlbumLoading: false });
      } else {
        set({
          currentAlbumError: data?.detail || data?.error || 'Error',
          currentAlbumLoading: false,
        });
      }
    } catch (e) {
      set({
        currentAlbumError: e instanceof Error ? e.message : 'Error',
        currentAlbumLoading: false,
      });
    }
  },

  fetchAlbumMedia: async (albumId) => {
    const { baseUrl, userId, development } = getConfig(get);
    const cacheKey = `media_${albumId}_${userId}_${development}`;
    const cached = getCachedData<AlbumMedia[]>(cacheKey);
    if (cached) {
      set({ currentAlbumMedia: cached, mediaLoading: false });
      fetch(
        `${baseUrl}/api/memories/albums/${albumId}/media?user_id=${userId}&development=${development}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data.media) {
            setCachedData(cacheKey, data.media);
            set({ currentAlbumMedia: data.media });
          }
        })
        .catch(() => {});
      return;
    }
    set({ mediaError: null, mediaLoading: true });
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/media?user_id=${userId}&development=${development}`,
        { signal: controller.signal },
      );
      clearTimeout(t);
      const data = await res.json();
      if (data?.success) {
        const media = data.media || [];
        setCachedData(cacheKey, media);
        set({ currentAlbumMedia: media, mediaLoading: false });
      } else {
        set({ mediaError: data?.detail || data?.error || 'Error', mediaLoading: false });
      }
    } catch (e) {
      set({ mediaError: e instanceof Error ? e.message : 'Error', mediaLoading: false });
    }
  },

  fetchAlbumMembers: async (albumId) => {
    const { baseUrl, development } = getConfig(get);
    set({ membersError: null, membersLoading: true });
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/members?development=${development}`,
        { signal: controller.signal },
      );
      clearTimeout(t);
      const data = await res.json();
      if (data?.success) {
        set({ currentAlbumMembers: data.members || [], membersLoading: false });
      } else {
        set({ membersError: data?.detail || data?.error || 'Error', membersLoading: false });
      }
    } catch (e) {
      set({ membersError: e instanceof Error ? e.message : 'Error', membersLoading: false });
    }
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
      settings: {
        allow_comments: true,
        allow_downloads: true,
        allow_reactions: true,
      },
      updatedAt: new Date().toISOString(),
      visibility: (data.visibility as Album['visibility']) || 'private',
      ...data,
    } as Album;
    set((s) => ({ albums: [tempAlbum, ...s.albums], isCreateAlbumModalOpen: false }));
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
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
        set((s) => ({
          albums: s.albums.map((a) => (a._id === tempId ? result.album : a)),
        }));
        invalidateCache(`albums_${userId}_${development}`);
        return result.album;
      }
      set((s) => ({ albums: s.albums.filter((a) => a._id !== tempId) }));
      throw new Error(result?.detail || result?.error || 'Error al crear el álbum');
    } catch (e) {
      set((s) => ({ albums: s.albums.filter((a) => a._id !== tempId) }));
      throw e;
    }
  },

  deleteAlbum: async (albumId) => {
    const { baseUrl, userId, development } = getConfig(get);
    const albumToDelete = get().albums.find((a) => a._id === albumId);
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
        set((s) => ({ albums: [...s.albums, albumToDelete] }));
      }
    } catch {
      if (albumToDelete) set((s) => ({ albums: [...s.albums, albumToDelete] }));
    }
  },

  deleteMedia: async (albumId, mediaId) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/media/${mediaId}?user_id=${userId}&development=${development}`,
        { method: 'DELETE' },
      );
      const result = await res.json();
      if (result?.success) {
        set((s) => ({
          currentAlbumMedia: s.currentAlbumMedia.filter((m) => m._id !== mediaId),
          selectedMediaIds: s.selectedMediaIds.filter((id) => id !== mediaId),
        }));
      }
    } catch {
      /* ignore */
    }
  },

  updateAlbum: async (albumId, data) => {
    const { baseUrl, userId, development } = getConfig(get);
    set((s) => ({
      albums: s.albums.map((a) => (a._id === albumId ? { ...a, ...data } : a)),
      currentAlbum:
        s.currentAlbum?._id === albumId ? { ...s.currentAlbum, ...data } : s.currentAlbum,
    }));
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );
      const result = await res.json();
      if (result?.success && result.album) {
        set((s) => ({
          albums: s.albums.map((a) => (a._id === albumId ? { ...a, ...result.album } : a)),
          currentAlbum:
            s.currentAlbum?._id === albumId
              ? { ...s.currentAlbum, ...result.album }
              : s.currentAlbum,
        }));
        invalidateCache(`album_${albumId}`);
        invalidateCache(`albums_${userId}_${development}`);
      }
    } catch {
      /* revert on error could be added */
    }
  },

  uploadMedia: async (albumId, file, caption) => {
    const { baseUrl, userId, development } = getConfig(get);
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
    set((s) => ({ currentAlbumMedia: [tempMedia, ...s.currentAlbumMedia] }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const params = new URLSearchParams({ development, user_id: userId });
      if (caption) params.append('caption', caption);
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/upload?${params.toString()}`,
        { body: formData, method: 'POST' },
      );
      const result = await res.json().catch(() => ({}));
      if (result?.success && result.media) {
        set((s) => ({
          currentAlbumMedia: s.currentAlbumMedia.map((m) =>
            m._id === tempId ? result.media : m,
          ),
        }));
        invalidateCache(`media_${albumId}`);
        URL.revokeObjectURL(tempUrl);
        return result.media;
      }
      set((s) => ({ currentAlbumMedia: s.currentAlbumMedia.filter((m) => m._id !== tempId) }));
      URL.revokeObjectURL(tempUrl);
      const errMsg =
        result?.error || result?.detail || (typeof result?.message === 'string' ? result.message : null);
      if (errMsg) throw new Error(errMsg);
      if (!res.ok) throw new Error(`Error ${res.status} al subir el archivo`);
    } catch (e) {
      set((s) => ({ currentAlbumMedia: s.currentAlbumMedia.filter((m) => m._id !== tempId) }));
      URL.revokeObjectURL(tempUrl);
      if (e instanceof Error) throw e;
      throw new Error('Error al subir el archivo');
    }
  },

  fetchAlbumsByEvent: async (eventId) => {
    const { baseUrl, development } = getConfig(get);
    set({ eventAlbumLoading: true });
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/by-event/${eventId}?development=${development}&include_sub_albums=true`,
      );
      const result = await res.json();
      if (result?.success) {
        set({
          eventAlbumLoading: false,
          eventAlbumStructure: {
            mainAlbum: result.main_album ?? null,
            subAlbums: result.sub_albums || [],
            totalMediaCount: result.total_media_count || 0,
          },
        });
      } else {
        set({ eventAlbumLoading: false });
      }
    } catch {
      set({ eventAlbumLoading: false });
    }
  },

  fetchSubAlbums: async (parentAlbumId) => {
    const { baseUrl } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${parentAlbumId}/sub-albums`,
      );
      const result = await res.json();
      if (result?.success) set({ subAlbums: result.sub_albums || [] });
    } catch {
      /* ignore */
    }
  },

  createEventAlbumStructure: async (eventId, eventName, itineraryItems) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/create-event-structure?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify({
            event_id: eventId,
            event_name: eventName,
            itinerary_items: itineraryItems,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
      const result = await res.json();
      return result?.success ? result : null;
    } catch {
      return null;
    }
  },

  generateShareLink: async (albumId, expiresInDays = 30) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const url = `${baseUrl}/api/memories/albums/${albumId}/share-link?user_id=${userId}&development=${development}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_days: expiresInDays, permissions: 'view' }),
      });
      const result = await res.json().catch(() => ({}));
      if (result?.success)
        return { shareToken: result.share_token, shareUrl: result.share_url };
      if (!res.ok) throw new Error(result?.detail || result?.error || result?.message || `Error ${res.status}`);
      return null;
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error('Error al generar el enlace de compartir');
    }
  },

  getAlbumByItinerary: async (itineraryId) => {
    const { baseUrl, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/by-itinerary/${itineraryId}?development=${development}`,
      );
      const result = await res.json();
      return result?.success && result.album ? result.album : null;
    } catch {
      return null;
    }
  },

  getAlbumsByEvent: async (eventId) => {
    const { baseUrl, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/by-event/${eventId}?development=${development}&include_sub_albums=true`,
      );
      const result = await res.json();
      return result?.success ? result : null;
    } catch {
      return null;
    }
  },

  getEventGuests: async (eventId) => {
    const { baseUrl, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/events/${eventId}/guests?development=${development}`,
      );
      const result = await res.json();
      return result?.success && result.guests ? result.guests : [];
    } catch {
      return [];
    }
  },

  getPublicAlbum: async (shareToken) => {
    const { baseUrl, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/public/${shareToken}?development=${development}`,
      );
      const result = await res.json();
      if (result?.success)
        return { album: result.album, media: result.media || [] };
      return null;
    } catch {
      return null;
    }
  },

  inviteMember: async (albumId, email, role) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/invite?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify({ email, role }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
      const result = await res.json();
      return result?.success && result.invitation ? result.invitation.token : null;
    } catch {
      return null;
    }
  },

  removeMember: async (albumId, targetUserId) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/members/${targetUserId}?user_id=${userId}&development=${development}`,
        { method: 'DELETE' },
      );
      const result = await res.json();
      if (result?.success) {
        set((s) => ({
          currentAlbumMembers: s.currentAlbumMembers.filter((m) => m.userId !== targetUserId),
        }));
      }
    } catch {
      /* ignore */
    }
  },

  updateMemberRole: async (albumId, targetUserId, role) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/members/${targetUserId}/role?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify({ role }),
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );
      const result = await res.json();
      if (result?.success) {
        set((s) => ({
          currentAlbumMembers: s.currentAlbumMembers.map((m) =>
            m.userId === targetUserId ? { ...m, role: role as any } : m,
          ),
        }));
      }
    } catch {
      /* ignore */
    }
  },

  sendQrToGuests: async (albumId, guestIds, method) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/send-qr?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify({ guest_ids: guestIds, method }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
      const result = await res.json();
      return result?.success ? result : null;
    } catch {
      return null;
    }
  },

});
