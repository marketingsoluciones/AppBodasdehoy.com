import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

import { resolveApiIaOrigin } from '../utils/apiEndpoints';

/**
 * Conversaciones (WhatsApp / multicanal) vinculadas a UNA boda.
 *
 * LA OTRA MITAD DEL PUENTE. En chat-ia construí "de la conversación al evento" (asociar una
 * boda a una conversación y ver su contexto). Esto es el reflejo, en el sitio correcto:
 * desde la ficha de la boda en appEventos, ver las conversaciones de esa pareja y saltar a
 * ellas en chat-dev.
 *
 * El vínculo lo lleva la propia conversación (linkedEventId, que api-ia devuelve). Aquí solo
 * se filtran las que apuntan a este evento. Hoy puede salir vacío: solo aparecen las que
 * alguien haya asociado con el botón "Asociar a un evento". Vacío legítimo, no error.
 *
 * NO reimplementa la bandeja. appEventos es la casa del cliente; enlaza a chat-ia, no la copia.
 */

export interface ConversacionEvento {
  assignedAgentName?: string | null;
  canalParam: string;
  channel: string;
  contactName: string;
  id: string;
  lastMessage: string;
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
    assignedAgentName: c.assignedAgentName ?? c.assigned_agent_name ?? null,
    // chat-dev espera wa-{id} para WhatsApp; para otros canales, el propio channel.
    canalParam: c.channel === 'whatsapp' ? `wa-${c.id}` : c.channel || 'whatsapp',
    channel: c.channel || 'whatsapp',
    contactName: c.contact?.name || c.contactName || c.phoneNumber || 'Contacto',
    id: c.id,
    lastMessage: typeof c.lastMessage === 'string' ? c.lastMessage : c.lastMessage?.text || '',
    lastMessageAt: c.lastMessageAt,
    unreadCount: c.unreadCount ?? 0,
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

    const base = resolveApiIaOrigin().replace(/\/$/, '');
    const url = `${base}/api/messages/conversations?development=${encodeURIComponent(development)}&limit=100`;
    const idToken = Cookies.get('idTokenV0.1.0');
    const headers: Record<string, string> = { 'X-Development': development };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;

    fetch(url, { headers })
      .then(async (r) => {
        if (!r.ok) throw new Error(`api-ia ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelado) return;
        const todas = Array.isArray(data?.conversations) ? data.conversations : [];
        // El vínculo puede venir en cualquiera de las dos formas (api-ia mezcla camel/snake).
        const delEvento = todas.filter(
          (c: any) => c.linkedEventId === eventId || c.linked_event_id === eventId,
        );
        setConversaciones(delEvento.map(mapear));
      })
      .catch((e) => {
        // El error se dice: un panel vacío haría creer que la pareja no ha escrito, cuando en
        // realidad no se pudo consultar.
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
