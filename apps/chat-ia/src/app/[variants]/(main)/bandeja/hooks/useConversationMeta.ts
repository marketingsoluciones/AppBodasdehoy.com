'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { persistAssignee, persistStatus } from '../data/conversationMeta';

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

  // M2: se escribe primero en local para que la interfaz responda al instante, y acto
  // seguido en el servidor. Si el servidor lo rechaza se revierte: antes esto solo vivía en
  // este navegador, así que el resto del equipo veía otro estado y nadie se enteraba.
  const setStatus = useCallback(
    (status: ConversationStatus) => {
      if (!conversationId) return;
      const map = { ...readFromStorage() };
      const previous = map[conversationId] ?? {};
      map[conversationId] = { ...previous, status };
      saveMap(map);
      void persistStatus(conversationId, status).then((ok) => {
        if (ok) return;
        const revert = { ...readFromStorage() };
        revert[conversationId] = previous;
        saveMap(revert);
        // eslint-disable-next-line no-console
        console.warn('[bandeja] el servidor no guardó el estado de la conversación');
      });
    },
    [conversationId],
  );

  const assignToUser = useCallback(
    (assignedUserId: string | null) => {
      if (!conversationId) return;
      const map = { ...readFromStorage() };
      const previous = map[conversationId] ?? {};
      map[conversationId] = { ...previous, assignedUserId };
      saveMap(map);
      void persistAssignee(conversationId, assignedUserId).then((ok) => {
        if (ok) return;
        const revert = { ...readFromStorage() };
        revert[conversationId] = previous;
        saveMap(revert);
        // eslint-disable-next-line no-console
        console.warn('[bandeja] el servidor no guardó el responsable de la conversación');
      });
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
