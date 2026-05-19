'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type ConversationStatus = 'open' | 'pending' | 'closed';

export interface ConversationMeta {
  assignedUserId?: string | null;
  status?: ConversationStatus;
}

type MetaMap = Record<string, ConversationMeta>;

const STORAGE_KEY = 'inbox_conversation_meta';

let listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getMap(): MetaMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

let cachedSnapshot: MetaMap = getMap();

function notify() {
  cachedSnapshot = getMap();
  listeners.forEach((cb) => cb());
}

function saveMap(map: MetaMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  notify();
}

function getSnapshot(): MetaMap {
  return cachedSnapshot;
}

function getServerSnapshot(): MetaMap {
  return {};
}

export function useConversationMeta(conversationId: string | null | undefined) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const meta = useMemo<ConversationMeta>(() => {
    if (!conversationId) return {};
    return state[conversationId] ?? {};
  }, [conversationId, state]);

  const setStatus = useCallback(
    (status: ConversationStatus) => {
      if (!conversationId) return;
      const map = getMap();
      const current = map[conversationId] ?? {};
      map[conversationId] = { ...current, status };
      saveMap(map);
    },
    [conversationId],
  );

  const assignToUser = useCallback(
    (assignedUserId: string | null) => {
      if (!conversationId) return;
      const map = getMap();
      const current = map[conversationId] ?? {};
      map[conversationId] = { ...current, assignedUserId };
      saveMap(map);
    },
    [conversationId],
  );

  const clearMeta = useCallback(() => {
    if (!conversationId) return;
    const map = getMap();
    delete map[conversationId];
    saveMap(map);
  }, [conversationId]);

  return {
    assignToUser,
    clearMeta,
    meta,
    setStatus,
  };
}

export function useConversationMetaState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
