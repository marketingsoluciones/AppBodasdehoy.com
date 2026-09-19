'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { persistArchived } from '../data/conversationMeta';

// ─── Acciones de conversación ────────────────────────────────────────────────
// Archivar se guarda en el SERVIDOR (api-mcp, estado ARCHIVED): hasta el 17-09 vivía solo en
// este `localStorage`, así que cada persona archivaba para sí misma y el resto del equipo
// seguía viendo la conversación en la bandeja. Aquí localStorage queda como respuesta
// inmediata mientras el servidor confirma, y se revierte si lo rechaza.
//
// Silenciar sigue siendo local a propósito: api-mcp no tiene dónde guardarlo y es una
// preferencia de quien mira, no del equipo. La interfaz lo dice.

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
    const siguiente = !current.archived;
    map[conversationId] = { ...current, archived: siguiente };
    saveMap(map);
    // El servidor manda: si rechaza, se deshace en vez de dejar la lista mintiendo.
    void persistArchived(conversationId, siguiente).then((ok) => {
      if (ok) return;
      const vuelta = { ...readFromStorage() };
      vuelta[conversationId] = { ...(vuelta[conversationId] ?? {}), archived: !siguiente };
      saveMap(vuelta);
    });
  }, []);

  const toggleMute = useCallback((conversationId: string) => {
    const map = { ...readFromStorage() };
    const current = map[conversationId] ?? {};
    map[conversationId] = { ...current, muted: !current.muted };
    saveMap(map);
  }, []);

  // "Eliminar" nunca borró nada: archivaba. Se mantiene el nombre que usa el menú, pero
  // apunta al mismo archivado del servidor para que no haya dos verdades.
  const deleteConversation = useCallback(
    (conversationId: string) => {
      const map = { ...readFromStorage() };
      map[conversationId] = { ...map[conversationId], archived: true };
      saveMap(map);
      void persistArchived(conversationId, true);
    },
    [],
  );

  const clearChat = useCallback((_conversationId: string) => {
    // Sin soporte en el backend: no se ofrece en ningún menú. Se conserva la función para no
    // romper a quien la importe, pero no finge hacer nada.
  }, []);

  return { clearChat, deleteConversation, isArchived, isMuted, toggleArchive, toggleMute };
}
