import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import {
  fetchConversations as fetchConversationsData,
  type Conversation,
} from '../data/conversations';

import { useMessageStream } from './useMessageStream';

// El tipo vive en data/conversations; se re-exporta para no tocar a sus consumidores.
export type { Conversation };


export function useConversations(channel: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { checkAuth, isGuest } = useAuthCheck();
  const { isAuthenticated, development } = checkAuth();

  const fetchConversations = useCallback(async () => {
    if (isGuest) {
      setConversations([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // M1 (16-09): la llamada y la normalización viven en data/conversations. Aquí solo
      // queda el ciclo de vida de React. Antes este hook era el único sitio donde se
      // normalizaba una conversación, así que cualquier otro consumidor perdía campos.
      const list = await fetchConversationsData({
        channel,
        development: development || 'bodasdehoy',
      });
      setConversations(list);
      setError(null);
    } catch (err) {
      // 401/403: sesión aún no lista o sin permiso. Lista vacía SIN error visible, como
      // siempre — un cartel rojo mientras el SSO termina asustaba sin motivo.
      const status = (err as any)?.status;
      setConversations([]);
      setError(status === 401 || status === 403
        ? null
        : err instanceof Error ? err : new Error('Error de red'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, isGuest, development]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // SSE realtime: api-ia confirmó /api/messages/stream ACTIVO 24-jun (commit
  // refactor runtime-only-api-ia). Cuando llega un mensaje nuevo, refrescamos
  // la lista. Throttle 1.5s para coalescer ráfagas (varios mensajes seguidos).
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefetch = useCallback(() => {
    if (refetchTimerRef.current) return; // ya hay refetch pendiente
    refetchTimerRef.current = setTimeout(() => {
      refetchTimerRef.current = null;
      void fetchConversations();
    }, 1500);
  }, [fetchConversations]);

  useEffect(() => {
    return () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    };
  }, []);

  useMessageStream({
    channel: channel || undefined,
    enabled: isAuthenticated && !isGuest,
    onMessage: scheduleRefetch,
  });

  return { conversations, error, isAuthenticated, loading, refetch: fetchConversations };
}
