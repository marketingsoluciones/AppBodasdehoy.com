/**
 * Granular selectors for useMemoriesStore.
 * Use these instead of destructuring to avoid unnecessary re-renders.
 *
 * Usage: const albums = useMemoriesStore(selectAlbums);
 */
import type { MemoriesStore } from './store';

// Albums
export const selectAlbums = (s: MemoriesStore) => s.albums;
export const selectAlbumsLoading = (s: MemoriesStore) => s.albumsLoading;
export const selectAlbumsError = (s: MemoriesStore) => s.albumsError;

// Current album
export const selectCurrentAlbum = (s: MemoriesStore) => s.currentAlbum;
export const selectCurrentAlbumLoading = (s: MemoriesStore) => s.currentAlbumLoading;
export const selectCurrentAlbumError = (s: MemoriesStore) => s.currentAlbumError;

// Media
export const selectCurrentMedia = (s: MemoriesStore) => s.currentAlbumMedia;
export const selectMediaLoading = (s: MemoriesStore) => s.mediaLoading;
export const selectMediaError = (s: MemoriesStore) => s.mediaError;

// Members
export const selectCurrentMembers = (s: MemoriesStore) => s.currentAlbumMembers;
export const selectMembersLoading = (s: MemoriesStore) => s.membersLoading;
export const selectMembersError = (s: MemoriesStore) => s.membersError;

// Upload
export const selectUploadProgress = (s: MemoriesStore) => s.uploadProgress;

// UI
export const selectSearchTerm = (s: MemoriesStore) => s.searchTerm;
export const selectSelectedMediaIds = (s: MemoriesStore) => s.selectedMediaIds;
export const selectIsCreateAlbumModalOpen = (s: MemoriesStore) => s.isCreateAlbumModalOpen;

// Event albums
export const selectEventAlbumStructure = (s: MemoriesStore) => s.eventAlbumStructure;
export const selectEventAlbumLoading = (s: MemoriesStore) => s.eventAlbumLoading;
