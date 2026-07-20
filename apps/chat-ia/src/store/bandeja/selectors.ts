/**
 * Selectores ergonómicos para useBandejaStore.
 *
 * Patrón: hooks pequeños que extraen una porción del state para los
 * componentes. Evita que cada componente recompute filtros desde el state
 * crudo y permite memoización fina.
 */
import { useShallow } from 'zustand/react/shallow';

import { useBandejaStore } from './index';
import type { ChannelKind, Conversation } from './types';

// Referencia estable para el caso "sin typers" — evita crear array nuevo cada
// llamada del selector, lo que disparaba loop "Maximum update depth" en tests
// con jsdom (Zustand compara por identity por default).
const EMPTY_TYPERS: readonly never[] = Object.freeze([]);

/** Lista plana de conversaciones ordenadas por lastMessageAt desc. */
export const useConversationsList = (): Conversation[] => {
  return useBandejaStore((s) => {
    const arr = Object.values(s.conversations);
    return arr.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
  });
};

/** Conversaciones filtradas por canal. */
export const useConversationsByChannel = (channel: ChannelKind): Conversation[] => {
  return useBandejaStore((s) => Object.values(s.conversations).filter((c) => c.channel === channel));
};

/** Conversaciones filtradas por scope (evento concreto o 'support'). */
export const useConversationsByScope = (scope: string): Conversation[] => {
  return useBandejaStore((s) =>
    Object.values(s.conversations).filter((c) =>
      scope === 'support' ? !c.linkedEventId : c.linkedEventId === scope,
    ),
  );
};

/** Conversación por id. */
export const useConversationById = (id: string | null | undefined): Conversation | undefined => {
  return useBandejaStore((s) => (id ? s.conversations[id] : undefined));
};

/** Totales unread. */
export const useUnreadCounts = () => useBandejaStore((s) => s.unreadCounts);

/** Notificaciones. */
export const useNotifications = () => useBandejaStore((s) => s.notifications);

/** Indicador de typing en una conversación.
 *  useShallow: si el array resultante tiene los mismos userIds vigentes,
 *  Zustand no dispara rerender aunque el selector cree un array nuevo.
 *  Sin esto entraba en loop "Maximum update depth" al montar. */
export const useTypingInConv = (convId: string) =>
  useBandejaStore(
    useShallow((s) => {
      const list = s.typingByConv[convId];
      if (!list || list.length === 0) return EMPTY_TYPERS;
      const now = Date.now();
      const filtered = list.filter((t) => t.expiresAt > now);
      return filtered.length === 0 ? EMPTY_TYPERS : filtered;
    }),
  );

/** Loading + error global. */
export const useBandejaStatus = () =>
  useBandejaStore((s) => ({ loading: s.loading, error: s.error }));
