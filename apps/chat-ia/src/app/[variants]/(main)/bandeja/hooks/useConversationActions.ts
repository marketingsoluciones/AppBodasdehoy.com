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

// Referencia estable — ver useConversationMeta.ts para el motivo.
const EMPTY_MAP: ActionsMap = Object.freeze({}) as ActionsMap;

let listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readFromStorage(): ActionsMap {
  if (typeof window === 'undefined') return EMPTY_MAP;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_MAP;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : EMPTY_MAP;
  } catch {
    return EMPTY_MAP;
  }
}

let cachedSnapshot: ActionsMap = readFromStorage();

function notify() {
  cachedSnapshot = readFromStorage();
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
  return EMPTY_MAP;
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
    const map = { ...readFromStorage() };
    const current = map[conversationId] ?? {};
    map[conversationId] = { ...current, archived: !current.archived };
    saveMap(map);
  }, []);

  const toggleMute = useCallback((conversationId: string) => {
    const map = { ...readFromStorage() };
    const current = map[conversationId] ?? {};
    map[conversationId] = { ...current, muted: !current.muted };
    saveMap(map);
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    const map = { ...readFromStorage() };
    map[conversationId] = { ...map[conversationId], archived: true };
    saveMap(map);
  }, []);

  const clearChat = useCallback((_conversationId: string) => {
    // Placeholder — when backend supports it, this will clear messages.
    // For now it's a no-op that closes the menu.
  }, []);

  return { clearChat, deleteConversation, isArchived, isMuted, toggleArchive, toggleMute };
}
