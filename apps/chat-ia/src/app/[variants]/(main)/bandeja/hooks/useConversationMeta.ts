'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type ConversationStatus = 'open' | 'pending' | 'closed';

export interface ConversationMeta {
  assignedUserId?: string | null;
  status?: ConversationStatus;
}

type MetaMap = Record<string, ConversationMeta>;

const STORAGE_KEY = 'inbox_conversation_meta';

// Referencia estable para SSR y para el estado inicial vacío en cliente.
// useSyncExternalStore compara con Object.is; devolver `{}` nuevo en cada
// llamada disparaba loop "Maximum update depth" en tests con jsdom.
const EMPTY_MAP: MetaMap = Object.freeze({}) as MetaMap;

let listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readFromStorage(): MetaMap {
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

let cachedSnapshot: MetaMap = readFromStorage();

function notify() {
  cachedSnapshot = readFromStorage();
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
  return EMPTY_MAP;
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
      const map = { ...readFromStorage() };
      const current = map[conversationId] ?? {};
      map[conversationId] = { ...current, status };
      saveMap(map);
    },
    [conversationId],
  );

  const assignToUser = useCallback(
    (assignedUserId: string | null) => {
      if (!conversationId) return;
      const map = { ...readFromStorage() };
      const current = map[conversationId] ?? {};
      map[conversationId] = { ...current, assignedUserId };
      saveMap(map);
    },
    [conversationId],
  );

  const clearMeta = useCallback(() => {
    if (!conversationId) return;
    const map = { ...readFromStorage() };
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
