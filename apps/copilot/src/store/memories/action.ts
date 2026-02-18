import { StateCreator } from 'zustand/vanilla';

import { Album, AlbumMedia, AlbumMember } from './initialState';
import { MemoriesStore } from './store';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// ============================================================================
// CACHE SYSTEM - Reduce loading times from 30s to 0ms on revisits
// ============================================================================
const CACHE_KEY_PREFIX = 'memories_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    const age = Date.now() - entry.timestamp;

    if (age > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

function invalidateCache(pattern: string): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX) && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}
// ============================================================================

export interface MemoriesAction {
  addMedia: (
    albumId: string,
    media: Partial<AlbumMedia>,
    userId: string,
    development?: string,
  ) => Promise<AlbumMedia | null>;
  clearCurrentAlbum: () => void;
  createAlbum: (
    data: Partial<Album>,
    userId: string,
    development?: string,
  ) => Promise<Album | null>;
  createEventAlbumStructure: (
    eventId: string,
    eventName: string,
    itineraryItems: any[],
    userId: string,
    development?: string,
  ) => Promise<any>;
  deleteAlbum: (albumId: string, userId: string, development?: string) => Promise<void>;
  deleteMedia: (
    albumId: string,
    mediaId: string,
    userId: string,
    development?: string,
  ) => Promise<void>;
  fetchAlbum: (albumId: string, userId: string, development?: string) => Promise<void>;
  fetchAlbumMedia: (albumId: string, userId: string, development?: string) => Promise<void>;
  fetchAlbumMembers: (albumId: string, userId: string, development?: string) => Promise<void>;
  fetchAlbums: (userId: string, development?: string) => Promise<void>;
  fetchAlbumsByEvent: (
    eventId: string,
    development?: string,
  ) => Promise<void>;
  fetchSubAlbums: (
    parentAlbumId: string,
  ) => Promise<void>;
  generateShareLink: (
    albumId: string,
    userId: string,
    expiresInDays?: number,
    development?: string,
  ) => Promise<{ shareToken: string; shareUrl: string } | null>;
  getAlbumByItinerary: (
    itineraryId: string,
    development?: string,
  ) => Promise<Album | null>;
  getAlbumsByEvent: (
    eventId: string,
    development?: string,
  ) => Promise<any>;
  getEventGuests: (
    eventId: string,
    development?: string,
  ) => Promise<any[]>;
  getPublicAlbum: (
    shareToken: string,
    development?: string,
  ) => Promise<{ album: Album; media: AlbumMedia[] } | null>;
  inviteMember: (
    albumId: string,
    email: string,
    role: string,
    userId: string,
    development?: string,
  ) => Promise<string | null>;
  removeMember: (
    albumId: string,
    targetUserId: string,
    userId: string,
    development?: string,
  ) => Promise<void>;
  sendQrToGuests: (
    albumId: string,
    guestIds: string[],
    method: 'email' | 'whatsapp',
    userId: string,
    development?: string,
  ) => Promise<any>;
  setSearchTerm: (term: string) => void;
  setSelectedMediaIds: (ids: string[]) => void;
  toggleCreateAlbumModal: (open?: boolean) => void;
  toggleInviteModal: (open?: boolean) => void;
  toggleShareModal: (open?: boolean) => void;
  toggleUploadModal: (open?: boolean) => void;
  updateAlbum: (
    albumId: string,
    data: Partial<Album>,
    userId: string,
    development?: string,
  ) => Promise<void>;
  updateMemberRole: (
    albumId: string,
    targetUserId: string,
    role: string,
    userId: string,
    development?: string,
  ) => Promise<void>;
  uploadMedia: (
    albumId: string,
    file: File,
    userId: string,
    caption?: string,
    development?: string,
  ) => Promise<AlbumMedia | null>;
}

export const memoriesActionSlice: StateCreator<
  MemoriesStore,
  [['zustand/devtools', never]],
  [],
  MemoriesAction
> = (set) => ({
  addMedia: async (albumId, media, userId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/media?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify(media),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
      const result = await response.json();

      if (result.success && result.media) {
        set((state) => ({
          currentAlbumMedia: [...state.currentAlbumMedia, result.media],
        }));
        return result.media;
      }
      return null;
    } catch (error) {
      console.error('Error adding media:', error);
      return null;
    }
  },

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

  createAlbum: async (data, userId, development = 'bodasdehoy') => {
    // Optimistic Update - Create temp album instantly
    const tempId = `temp_${Date.now()}`;
    const tempAlbum: Album = {
      _id: tempId,
      albumType: data.albumType,
      coverImageUrl: data.coverImageUrl || '',
      createdAt: new Date().toISOString(),
      description: data.description || '',
      eventId: data.eventId,
      isOptimistic: true,
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
      visibility: (data.visibility as Album['visibility']) || 'private', // Mark as temporary
      ...data,
    } as Album;

    // Add temp album immediately to UI
    set((state) => ({
      albums: [tempAlbum, ...state.albums],
      isCreateAlbumModalOpen: false,
    }));

    try {
      // Create album on backend
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
      const result = await response.json();

      if (result.success && result.album) {
        // Replace temp album with real one
        set((state) => ({
          albums: state.albums.map((a) => (a._id === tempId ? result.album : a)),
        }));
        // Invalidate cache to force refresh
        invalidateCache(`albums_${userId}_${development}`);
        return result.album;
      } else {
        // Remove temp album on error
        set((state) => ({
          albums: state.albums.filter((a) => a._id !== tempId),
        }));
        console.error('Error creating album:', result);
        throw new Error(result.detail || result.error || 'Error al crear el álbum');
      }
    } catch (error) {
      // Remove temp album on error
      set((state) => ({
        albums: state.albums.filter((a) => a._id !== tempId),
      }));
      console.error('Error creating album:', error);
      throw error;
    }
  },

  createEventAlbumStructure: async (eventId, eventName, itineraryItems, userId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/create-event-structure?user_id=${userId}&development=${development}`,
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
      const result = await response.json();

      if (result.success) {
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error creating event album structure:', error);
      return null;
    }
  },

  deleteAlbum: async (albumId, userId, development = 'bodasdehoy') => {
    // Optimistic delete
    const albumToDelete = (set as any).getState?.()?.albums?.find((a: Album) => a._id === albumId);
    set((state) => ({
      albums: state.albums.filter((a) => a._id !== albumId),
      currentAlbum: state.currentAlbum?._id === albumId ? null : state.currentAlbum,
    }));

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
        { method: 'DELETE' },
      );
      const result = await response.json();

      if (result.success) {
        // Invalidate cache
        invalidateCache(`albums_${userId}_${development}`);
        invalidateCache(`album_${albumId}`);
      } else {
        // Restore album on error
        if (albumToDelete) {
          set((state) => ({ albums: [...state.albums, albumToDelete] }));
        }
      }
    } catch (error) {
      // Restore album on error
      if (albumToDelete) {
        set((state) => ({ albums: [...state.albums, albumToDelete] }));
      }
      console.error('Error deleting album:', error);
    }
  },

  deleteMedia: async (albumId, mediaId, userId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/media/${mediaId}?user_id=${userId}&development=${development}`,
        { method: 'DELETE' },
      );
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          currentAlbumMedia: state.currentAlbumMedia.filter((m) => m._id !== mediaId),
          selectedMediaIds: state.selectedMediaIds.filter((id) => id !== mediaId),
        }));
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  },

  fetchAlbum: async (albumId, userId, development = 'bodasdehoy') => {
    const cacheKey = `album_${albumId}_${userId}_${development}`;

    // 1. Try cache first
    const cached = getCachedData<Album>(cacheKey);
    if (cached) {
      set({ currentAlbum: cached, currentAlbumLoading: false });
      // Background refresh
      fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.album) {
            setCachedData(cacheKey, data.album);
            set({ currentAlbum: data.album });
          }
        })
        .catch(() => {
          /* Silent fail */
        });
      return;
    }

    // 2. No cache - Load from backend
    try {
      set({ currentAlbumError: null, currentAlbumLoading: true });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Error al cargar el álbum`);
      }

      const data = await response.json();

      if (data.success && data.album) {
        setCachedData(cacheKey, data.album); // Save to cache
        set({ currentAlbum: data.album, currentAlbumLoading: false });
      } else {
        const errorMsg = data.detail || data.error || 'Error al cargar el álbum';
        set({
          currentAlbumError: errorMsg,
          currentAlbumLoading: false,
        });
        console.error('Error loading album:', data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        set({
          currentAlbumError: 'Tiempo de espera agotado al cargar el álbum',
          currentAlbumLoading: false,
        });
      } else {
        const errorMsg =
          error instanceof Error ? error.message : 'Error desconocido al cargar el álbum';
        set({ currentAlbumError: errorMsg, currentAlbumLoading: false });
      }
      console.error('Error fetching album:', error);
    }
  },

  fetchAlbumMedia: async (albumId, userId, development = 'bodasdehoy') => {
    const cacheKey = `media_${albumId}_${userId}_${development}`;

    // 1. Try cache first
    const cached = getCachedData<AlbumMedia[]>(cacheKey);
    if (cached) {
      set({ currentAlbumMedia: cached, mediaLoading: false });
      // Background refresh
      fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/media?user_id=${userId}&development=${development}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.media) {
            setCachedData(cacheKey, data.media);
            set({ currentAlbumMedia: data.media });
          }
        })
        .catch(() => {
          /* Silent fail */
        });
      return;
    }

    // 2. No cache - Load from backend
    set({ mediaError: null, mediaLoading: true });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/media?user_id=${userId}&development=${development}`,
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Error al cargar las fotos`);
      }

      const data = await response.json();

      if (data.success) {
        const media = data.media || [];
        setCachedData(cacheKey, media); // Save to cache
        set({ currentAlbumMedia: media, mediaLoading: false });
      } else {
        const errorMsg = data.detail || data.error || 'Error al cargar las fotos';
        set({
          mediaError: errorMsg,
          mediaLoading: false,
        });
        console.error('Error loading media:', data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        set({
          mediaError: 'Tiempo de espera agotado al cargar las fotos',
          mediaLoading: false,
        });
      } else {
        const errorMsg =
          error instanceof Error ? error.message : 'Error desconocido al cargar las fotos';
        set({ mediaError: errorMsg, mediaLoading: false });
      }
      console.error('Error fetching media:', error);
    }
  },

  fetchAlbumMembers: async (albumId, userId, development = 'bodasdehoy') => {
    set({ membersError: null, membersLoading: true });
    try {
      // Timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/members?development=${development}`,
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Error al cargar los miembros`);
      }

      const data = await response.json();

      if (data.success) {
        set({ currentAlbumMembers: data.members || [], membersLoading: false });
      } else {
        const errorMsg = data.detail || data.error || 'Error al cargar los miembros';
        set({
          membersError: errorMsg,
          membersLoading: false,
        });
        console.error('Error loading members:', data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        set({
          membersError: 'Tiempo de espera agotado al cargar los miembros',
          membersLoading: false
        });
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido al cargar los miembros';
        set({ membersError: errorMsg, membersLoading: false });
      }
      console.error('Error fetching members:', error);
    }
  },

  fetchAlbums: async (userId, development = 'bodasdehoy') => {
    const cacheKey = `albums_${userId}_${development}`;

    // 1. Try cache first - Instant loading (0ms)
    const cached = getCachedData<Album[]>(cacheKey);
    if (cached) {
      set({ albums: cached, albumsLoading: false });
      // Background refresh - update cache silently
      fetch(`${BACKEND_URL}/api/memories/albums?user_id=${userId}&development=${development}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.albums) {
            setCachedData(cacheKey, data.albums);
            set({ albums: data.albums });
          }
        })
        .catch(() => {
          /* Silent fail for background refresh */
        });
      return;
    }

    // 2. No cache - Load from backend (30s first time)
    set({ albumsError: null, albumsLoading: true });
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums?user_id=${userId}&development=${development}`,
      );
      const data = await response.json();

      if (data.success) {
        const albums = data.albums || [];
        setCachedData(cacheKey, albums); // Save to cache
        set({ albums, albumsLoading: false });
      } else {
        set({
          albumsError: data.detail?.[0]?.message || 'Error loading albums',
          albumsLoading: false,
        });
      }
    } catch (error) {
      set({ albumsError: (error as Error).message, albumsLoading: false });
    }
  },

  fetchAlbumsByEvent: async (eventId, development = 'bodasdehoy') => {
    set({ eventAlbumLoading: true });
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/by-event/${eventId}?development=${development}&include_sub_albums=true`,
      );
      const result = await response.json();

      if (result.success) {
        set({
          eventAlbumLoading: false,
          eventAlbumStructure: {
            mainAlbum: result.main_album,
            subAlbums: result.sub_albums || [],
            totalMediaCount: result.total_media_count || 0,
          },
        });
      } else {
        set({ eventAlbumLoading: false });
      }
    } catch (error) {
      console.error('Error fetching albums by event:', error);
      set({ eventAlbumLoading: false });
    }
  },

  fetchSubAlbums: async (parentAlbumId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${parentAlbumId}/sub-albums`,
      );
      const result = await response.json();

      if (result.success) {
        set({ subAlbums: result.sub_albums || [] });
      }
    } catch (error) {
      console.error('Error fetching sub-albums:', error);
    }
  },

  generateShareLink: async (albumId, userId, expiresInDays = 30, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/share-link?user_id=${userId}&expires_in_days=${expiresInDays}&development=${development}`,
        { method: 'POST' },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          shareToken: result.share_token,
          shareUrl: result.share_url,
        };
      }
      throw new Error(result.detail || 'Error al generar enlace');
    } catch (error) {
      console.error('Error generating share link:', error);
      throw error;
    }
  },

  getAlbumByItinerary: async (itineraryId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/by-itinerary/${itineraryId}?development=${development}`,
      );
      const result = await response.json();

      if (result.success && result.album) {
        return result.album;
      }
      return null;
    } catch (error) {
      console.error('Error getting album by itinerary:', error);
      return null;
    }
  },

  getAlbumsByEvent: async (eventId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/by-event/${eventId}?development=${development}&include_sub_albums=true`,
      );
      const result = await response.json();

      if (result.success) {
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error getting albums by event:', error);
      return null;
    }
  },

  getEventGuests: async (eventId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/events/${eventId}/guests?development=${development}`,
      );
      const result = await response.json();

      if (result.success && result.guests) {
        return result.guests;
      }
      return [];
    } catch (error) {
      console.error('Error getting event guests:', error);
      return [];
    }
  },

  getPublicAlbum: async (shareToken, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/public/${shareToken}?development=${development}`,
      );
      const result = await response.json();

      if (result.success) {
        return {
          album: result.album,
          media: result.media || [],
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting public album:', error);
      return null;
    }
  },

  inviteMember: async (albumId, email, role, userId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/invite?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify({ email, role }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
      const result = await response.json();

      if (result.success && result.invitation) {
        return result.invitation.token;
      }
      return null;
    } catch (error) {
      console.error('Error inviting member:', error);
      return null;
    }
  },

  removeMember: async (albumId, targetUserId, userId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/members/${targetUserId}?user_id=${userId}&development=${development}`,
        { method: 'DELETE' },
      );
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          currentAlbumMembers: state.currentAlbumMembers.filter((m) => m.userId !== targetUserId),
        }));
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  },

  sendQrToGuests: async (
    albumId: string,
    guestIds: string[],
    method: 'email' | 'whatsapp',
    userId: string,
    development = 'bodasdehoy'
  ) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/send-qr?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify({
            guest_ids: guestIds,
            method: method,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );
      const result = await response.json();

      if (result.success) {
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error sending QR to guests:', error);
      return null;
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),

  setSelectedMediaIds: (ids) => set({ selectedMediaIds: ids }),

  toggleCreateAlbumModal: (open) =>
    set((state) => ({
      isCreateAlbumModalOpen: open !== undefined ? open : !state.isCreateAlbumModalOpen,
    })),

  toggleInviteModal: (open) =>
    set((state) => ({
      isInviteModalOpen: open !== undefined ? open : !state.isInviteModalOpen,
    })),

  toggleShareModal: (open) =>
    set((state) => ({
      isShareModalOpen: open !== undefined ? open : !state.isShareModalOpen,
    })),

  toggleUploadModal: (open) =>
    set((state) => ({
      isUploadModalOpen: open !== undefined ? open : !state.isUploadModalOpen,
    })),

  updateAlbum: async (albumId, data, userId, development = 'bodasdehoy') => {
    // Optimistic update
    set((state) => ({
      albums: state.albums.map((a) => (a._id === albumId ? { ...a, ...data } : a)),
      currentAlbum:
        state.currentAlbum?._id === albumId ? { ...state.currentAlbum, ...data } : state.currentAlbum,
    }));

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );
      const result = await response.json();

      if (result.success && result.album) {
        set((state) => ({
          albums: state.albums.map((a) => (a._id === albumId ? { ...a, ...result.album } : a)),
          currentAlbum:
            state.currentAlbum?._id === albumId
              ? { ...state.currentAlbum, ...result.album }
              : state.currentAlbum,
        }));
        // Invalidate cache
        invalidateCache(`album_${albumId}`);
        invalidateCache(`albums_${userId}_${development}`);
      }
    } catch (error) {
      console.error('Error updating album:', error);
      // TODO: Revert optimistic update on error
    }
  },

  updateMemberRole: async (albumId, targetUserId, role, userId, development = 'bodasdehoy') => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/members/${targetUserId}/role?user_id=${userId}&development=${development}`,
        {
          body: JSON.stringify({ role }),
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          currentAlbumMembers: state.currentAlbumMembers.map((m) =>
            m.userId === targetUserId ? { ...m, role: role as AlbumMember['role'] } : m,
          ),
        }));
      }
    } catch (error) {
      console.error('Error updating member role:', error);
    }
  },

  uploadMedia: async (albumId, file, userId, caption, development = 'bodasdehoy') => {
    // Create temp media for optimistic update
    const tempId = `temp_${Date.now()}`;
    const tempUrl = URL.createObjectURL(file);
    const tempMedia: AlbumMedia = {
      _id: tempId,
      albumId,
      caption: caption || '', 
      createdAt: new Date().toISOString(),
      
fileId: tempId,
      
isOptimistic: true,
      
mediaType: file.type.startsWith('video/') ? 'video' : 'photo',
      
originalUrl: tempUrl,
      
sortOrder: 0,
      // Temporary local URL
thumbnailUrl: tempUrl,
      userId,
    } as AlbumMedia;

    // Add temp media immediately
    set((state) => ({
      currentAlbumMedia: [tempMedia, ...state.currentAlbumMedia],
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const params = new URLSearchParams({
        development,
        user_id: userId,
      });
      if (caption) params.append('caption', caption);

      const response = await fetch(
        `${BACKEND_URL}/api/memories/albums/${albumId}/upload?${params.toString()}`,
        {
          body: formData,
          method: 'POST',
        },
      );
      const result = await response.json();

      if (result.success && result.media) {
        // Replace temp media with real one
        set((state) => ({
          currentAlbumMedia: state.currentAlbumMedia.map((m) =>
            m._id === tempId ? result.media : m,
          ),
        }));
        // Invalidate cache
        invalidateCache(`media_${albumId}`);
        URL.revokeObjectURL(tempUrl); // Clean up temp URL
        return result.media;
      } else {
        // Remove temp media on error
        set((state) => ({
          currentAlbumMedia: state.currentAlbumMedia.filter((m) => m._id !== tempId),
        }));
        URL.revokeObjectURL(tempUrl);
      }
      return null;
    } catch (error) {
      // Remove temp media on error
      set((state) => ({
        currentAlbumMedia: state.currentAlbumMedia.filter((m) => m._id !== tempId),
      }));
      URL.revokeObjectURL(tempUrl);
      console.error('Error uploading media:', error);
      return null;
    }
  },
});
