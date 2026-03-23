import { StateCreator } from 'zustand/vanilla';
import type { MemoriesState } from '../initialState';

export interface UIAction {
  setConfig: (apiBaseUrl: string, userId: string, development?: string) => void;
  clearCurrentAlbum: () => void;
  setSearchTerm: (term: string) => void;
  setSelectedMediaIds: (ids: string[]) => void;
  toggleCreateAlbumModal: (open?: boolean) => void;
  toggleInviteModal: (open?: boolean) => void;
  toggleShareModal: (open?: boolean) => void;
  toggleUploadModal: (open?: boolean) => void;
}

export const uiSlice: StateCreator<MemoriesState, [], [], UIAction> = (set) => ({
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
});
