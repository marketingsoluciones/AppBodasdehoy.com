import { useEffect, useState } from 'react';

import { fetchApiBodas } from '../utils/Fetching';

/**
 * Conversaciones (WhatsApp) vinculadas a UNA boda.
 *
 * LA OTRA MITAD DEL PUENTE. En chat-ia se construyó "de la conversación al evento"; esto es
 * el reflejo: desde la ficha de la boda, ver las conversaciones de esa pareja.
 *
 * CÓMO SE LEE (corregido 30-ago tras QA headless):
 * El vínculo NO es un campo `linkedEventId` por conversación — vive en un array `linkedEvents[]`
 * (N:M: un contacto puede tener varias bodas) y se lee con el FILTRO server-side
 * `getWhatsAppConversations(filters: { linked_event_id })`. La versión anterior leía api-ia y
 * filtraba por un `linkedEventId` que api-ia no rellena → salía SIEMPRE vacío. Verificado en vivo:
 * con este filtro, una conversación recién asociada aparece; la versión vieja daba 0.
 *
 * Va contra api-mcp (fetchApiBodas), que es el dueño del dato del vínculo.
 */

// Sin comentarios `#` dentro del template: el proxy GraphQL no los soporta (400 GRAPHQL_PARSE_FAILED).
const GET_CONVS_BY_EVENTO = `
  query GetConvsByEvento($developerId: String!, $filters: WhatsAppConversationFilters) {
    getWhatsAppConversations(developerId: $developerId, filters: $filters) {
      conversations {
        id
        phoneNumber
        contactInfo { name }
        lastMessageAt
        unread_count_for_agent
      }
    }
  }
`;

export interface ConversacionEvento {
  canalParam: string;
  contactName: string;
  id: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface Estado {
  conversaciones: ConversacionEvento[];
  error: string | null;
  loading: boolean;
}

function mapear(c: any): ConversacionEvento {
  return {
    // chat-dev espera wa-{id} para WhatsApp.
    canalParam: `wa-${c.id}`,
    contactName: c.contactInfo?.name || c.phoneNumber || 'Contacto',
    id: c.id,
    lastMessageAt: c.lastMessageAt,
    unreadCount: c.unread_count_for_agent ?? 0,
  };
}

export function useConversacionesDeEvento(
  eventId: string | null | undefined,
  development = 'bodasdehoy',
): Estado {
  const [conversaciones, setConversaciones] = useState<ConversacionEvento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelado = false;
    setLoading(true);
    setError(null);

    fetchApiBodas({
      query: GET_CONVS_BY_EVENTO,
      variables: { developerId: development, filters: { linked_event_id: eventId } },
      development,
    })
      .then((res: any) => {
        if (cancelado) return;
        // fetchApiBodas devuelve null ante error GraphQL (no lanza) → tratarlo como error,
        // no como "0 conversaciones" (un vacío mentiroso haría creer que la pareja no escribió).
        if (!res) {
          setError('No se pudieron cargar las conversaciones.');
          return;
        }
        const cs = Array.isArray(res?.conversations) ? res.conversations : [];
        setConversaciones(cs.map(mapear));
      })
      .catch((e: any) => {
        if (!cancelado) setError(e?.message || 'No se pudieron cargar las conversaciones.');
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [eventId, development]);

  return { conversaciones, error, loading };
}
