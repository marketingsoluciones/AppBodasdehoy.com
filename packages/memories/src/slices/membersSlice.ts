import { StateCreator } from 'zustand/vanilla';
import type { MemoriesState } from '../initialState';
import { dedup } from '../dedup';
import { getConfig, getController } from './shared';

export interface MembersAction {
  fetchAlbumMembers: (albumId: string) => Promise<void>;
  inviteMember: (albumId: string, email: string, role: string) => Promise<string | null>;
  removeMember: (albumId: string, targetUserId: string) => Promise<void>;
  updateMemberRole: (albumId: string, targetUserId: string, role: string) => Promise<void>;
  getEventGuests: (eventId: string) => Promise<any[]>;
  sendQrToGuests: (albumId: string, guestIds: string[], method: 'email' | 'whatsapp') => Promise<any>;
}

export const membersSlice: StateCreator<MemoriesState, [], [], MembersAction> = (set, get) => ({
  fetchAlbumMembers: async (albumId) => {
    const { baseUrl, development } = getConfig(get);
    return dedup(`members_${albumId}`, async () => {
      set({ membersError: null, membersLoading: true });
      try {
        const controller = getController(`fetchMembers_${albumId}`);
        const res = await fetch(
          `${baseUrl}/api/memories/albums/${albumId}/members?development=${development}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data?.success) {
          set({ currentAlbumMembers: data.members || [], membersLoading: false });
        } else {
          set({ membersError: data?.detail || data?.error || 'Error', membersLoading: false });
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('[Memories] fetchAlbumMembers:', e);
        set({ membersError: e.message || 'Error', membersLoading: false });
      }
    });
  },

  inviteMember: async (albumId, email, role) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/invite?user_id=${userId}&development=${development}`,
        { body: JSON.stringify({ email, role }), headers: { 'Content-Type': 'application/json' }, method: 'POST' },
      );
      const result = await res.json();
      return result?.success && result.invitation ? result.invitation.token : null;
    } catch (e: any) {
      console.error('[Memories] inviteMember:', e);
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
        set((s) => ({ currentAlbumMembers: s.currentAlbumMembers.filter((m) => m.userId !== targetUserId) }));
      }
    } catch (e: any) {
      console.error('[Memories] removeMember:', e);
    }
  },

  updateMemberRole: async (albumId, targetUserId, role) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/members/${targetUserId}/role?user_id=${userId}&development=${development}`,
        { body: JSON.stringify({ role }), headers: { 'Content-Type': 'application/json' }, method: 'PUT' },
      );
      const result = await res.json();
      if (result?.success) {
        set((s) => ({
          currentAlbumMembers: s.currentAlbumMembers.map((m) =>
            m.userId === targetUserId ? { ...m, role: role as any } : m,
          ),
        }));
      }
    } catch (e: any) {
      console.error('[Memories] updateMemberRole:', e);
    }
  },

  getEventGuests: async (eventId) => {
    const { baseUrl, development } = getConfig(get);
    try {
      const res = await fetch(`${baseUrl}/api/memories/events/${eventId}/guests?development=${development}`);
      const result = await res.json();
      return result?.success && result.guests ? result.guests : [];
    } catch (e: any) {
      console.error('[Memories] getEventGuests:', e);
      return [];
    }
  },

  sendQrToGuests: async (albumId, guestIds, method) => {
    const { baseUrl, userId, development } = getConfig(get);
    try {
      const res = await fetch(
        `${baseUrl}/api/memories/albums/${albumId}/send-qr?user_id=${userId}&development=${development}`,
        { body: JSON.stringify({ guest_ids: guestIds, method }), headers: { 'Content-Type': 'application/json' }, method: 'POST' },
      );
      const result = await res.json();
      return result?.success ? result : null;
    } catch (e: any) {
      console.error('[Memories] sendQrToGuests:', e);
      return null;
    }
  },
});
