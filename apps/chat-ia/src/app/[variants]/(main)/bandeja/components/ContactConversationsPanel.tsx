'use client';

/**
 * ContactConversationsPanel — R2 (23-jul): conversaciones cross-canal y
 * cross-evento del CONTACTO (diseño PLAN-CHAT-IA-REDISENO, caso "Carmen":
 * un contacto único con N conversaciones agrupadas por scope Marca/Evento).
 *
 * Fuente: api-mcp `getContactConversations(contactId, developerId)` (pieza R2
 * verificada implementada 23-jul). Se muestra bajo el sidebar derecho de la
 * conversación cuando la conv tiene linkedContactId.
 *
 * Nota backend pendiente (reportado): el tipo GraphQL WhatsAppConversation NO
 * expone `channel` → mientras tanto se navega con el canal por defecto
 * 'whatsapp' (hoy todos los docs de esa colección lo son).
 */
import { gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getCurrentDevelopment } from '@/utils/developmentDetector';
import { apolloClient } from '@/libs/graphql/client';

import { ChannelBadge } from './ChannelBadge';

const GET_CONTACT_CONVERSATIONS = gql`
  query GetContactConversations($contactId: ID!, $developerId: String, $limit: Int) {
    getContactConversations(contactId: $contactId, developerId: $developerId, limit: $limit) {
      success
      total
      conversations {
        id
        channel
        phoneNumber
        contactInfo {
          name
        }
        status
        lastMessageAt
        messageCount
        unread_count_for_agent
        linked_event_id
        guestStatus
      }
      errors {
        message
      }
    }
  }
`;

interface ContactConversation {
  channel?: string | null;
  contactInfo?: { name?: string | null } | null;
  guestStatus?: string | null;
  id: string;
  lastMessageAt?: string | null;
  linked_event_id?: string | null;
  messageCount?: number | null;
  phoneNumber?: string | null;
  status?: string | null;
  unread_count_for_agent?: number | null;
}

interface ContactConversationsPanelProps {
  contactId: string;
  contactName?: string;
  /** Conversación abierta ahora — se marca como "Actual" y no navega. */
  currentConversationId: string;
}

function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '';
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Dot de RSVP (mismo código de color que ConversationItem / EventSidebar).
const RSVP_DOT: Record<string, string> = {
  confirmed: '#22C55E',
  declined: '#EF4444',
  pending: '#F59E0B',
};

export function ContactConversationsPanel({
  contactId,
  contactName,
  currentConversationId,
}: ContactConversationsPanelProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ContactConversation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apolloClient.query<{
          getContactConversations: {
            conversations: ContactConversation[];
            errors?: { message: string }[] | null;
            success: boolean;
          };
        }>({
          fetchPolicy: 'network-only',
          query: GET_CONTACT_CONVERSATIONS,
          variables: {
            contactId,
            developerId: getCurrentDevelopment(),
            limit: 20,
          },
        });
        if (cancelled) return;
        const res = data?.getContactConversations;
        if (!res?.success) throw new Error(res?.errors?.[0]?.message || 'error');
        setConversations(res.conversations ?? []);
        setLoadError(null);
      } catch (error: any) {
        if (cancelled) return;
        setConversations([]);
        setLoadError(error?.message || 'error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  if (conversations === null) {
    return (
      <div className="px-4 py-3 text-xs text-gray-400">Cargando conversaciones del contacto…</div>
    );
  }

  if (loadError) {
    return (
      <div className="px-4 py-3 text-xs text-gray-400">
        No se pudieron cargar las conversaciones del contacto.
      </div>
    );
  }

  // Agrupación por scope (diseño "Carmen"): Marca/Soporte (sin evento) vs Evento.
  const marca = conversations.filter((c) => !c.linked_event_id);
  const porEvento = new Map<string, ContactConversation[]>();
  for (const c of conversations) {
    if (!c.linked_event_id) continue;
    const list = porEvento.get(c.linked_event_id) ?? [];
    list.push(c);
    porEvento.set(c.linked_event_id, list);
  }

  const renderRow = (c: ContactConversation) => {
    const isCurrent = c.id === currentConversationId;
    const name = c.contactInfo?.name || c.phoneNumber || c.id;
    const unread = c.unread_count_for_agent ?? 0;
    const rsvpColor = c.guestStatus ? RSVP_DOT[c.guestStatus] : undefined;
    return (
      <button
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
          isCurrent ? 'cursor-default bg-gray-100' : 'hover:bg-gray-50'
        }`}
        disabled={isCurrent}
        key={c.id}
        onClick={() => {
          // channel ya expuesto por api-mcp (25-jul) → navegar al canal REAL de la conv.
          if (!isCurrent) router.push(`/bandeja/${c.channel || 'whatsapp'}/${c.id}`);
        }}
        type="button"
      >
        <ChannelBadge channel={(c.channel as any) || 'whatsapp'} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-gray-700">
            {name}
            {isCurrent && <span className="ml-1 text-[10px] font-normal text-gray-400">· actual</span>}
          </span>
          <span className="block text-[10px] text-gray-400">
            {c.messageCount ?? 0} msjs · {relativeTime(c.lastMessageAt)}
          </span>
        </span>
        {rsvpColor && (
          <span
            className="h-2 w-2 flex-none rounded-full"
            style={{ backgroundColor: rsvpColor }}
            title={`RSVP: ${c.guestStatus}`}
          />
        )}
        {unread > 0 && (
          <span className="flex-none rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold leading-4 text-white">
            {unread}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="border-t border-gray-100 px-2 py-3">
      <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
        Conversaciones de {contactName || 'este contacto'} ({conversations.length})
      </div>

      {conversations.length === 0 && (
        <div className="px-2 text-xs text-gray-400">Sin más conversaciones registradas.</div>
      )}

      {marca.length > 0 && (
        <div className="mb-2">
          <div className="px-2 text-[10px] font-semibold uppercase text-gray-300">
            Marca / Soporte
          </div>
          {marca.map(renderRow)}
        </div>
      )}

      {[...porEvento.entries()].map(([eventId, list]) => (
        <div className="mb-2" key={eventId}>
          <div className="px-2 text-[10px] font-semibold uppercase text-gray-300">
            Evento ·{eventId.slice(-6)}
          </div>
          {list.map(renderRow)}
        </div>
      ))}
    </div>
  );
}
