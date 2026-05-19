'use client';

import { useCallback, useSyncExternalStore } from 'react';

// ─── localStorage-based conversation actions ─────────────────────────────────
// Persists archive/mute state per conversation until backend support is added.

const STORAGE_KEY = 'inbox_conversation_actions';

type ActionState = {
  archived?: boolean;
  muted?: boolean;
};

type ActionsMap = Record<string, ActionState>;

// ─── external store for cross-component reactivity ──────────────────────────

let listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getMap(): ActionsMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

let cachedSnapshot: ActionsMap = getMap();

function notify() {
  cachedSnapshot = getMap();
  listeners.forEach((cb) => cb());
}

function saveMap(map: ActionsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  notify();
}

function getSnapshot(): ActionsMap {
  return cachedSnapshot;
}

function getServerSnapshot(): ActionsMap {
  return {};
}

// ─── hook ───────────────────────────────────────────────────────────────────

export function useConversationActions() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isArchived = useCallback(
    (conversationId: string) => !!state[conversationId]?.archived,
    [state],
  );

  const isMuted = useCallback(
    (conversationId: string) => !!state[conversationId]?.muted,
    [state],
  );

  const toggleArchive = useCallback((conversationId: string) => {
    const map = getMap();
    const current = map[conversationId] ?? {};
    map[conversationId] = { ...current, archived: !current.archived };
    saveMap(map);
  }, []);

  const toggleMute = useCallback((conversationId: string) => {
    const map = getMap();
    const current = map[conversationId] ?? {};
    map[conversationId] = { ...current, muted: !current.muted };
    saveMap(map);
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    const map = getMap();
    map[conversationId] = { ...map[conversationId], archived: true };
    saveMap(map);
  }, []);

  const clearChat = useCallback((_conversationId: string) => {
    // Placeholder — when backend supports it, this will clear messages.
    // For now it's a no-op that closes the menu.
  }, []);

  return { clearChat, deleteConversation, isArchived, isMuted, toggleArchive, toggleMute };
}
