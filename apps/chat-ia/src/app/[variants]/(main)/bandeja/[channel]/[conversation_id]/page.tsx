'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationList } from '../../components/ConversationList';
import { MessageList } from '../../components/MessageList';
import { MessageInput } from '../../components/MessageInput';
import { ConversationHeader } from '../../components/ConversationHeader';
import { ConversationNotesSidebar } from '../../components/ConversationNotesSidebar';
import { EventSidebar } from '../../components/EventSidebar';
import { TaskDetailWorkspace } from '../../components/TaskDetailWorkspace';
import { BottomSheet } from '../../components/BottomSheet';
import { useConversations } from '../../hooks/useConversations';

interface ConversationPageProps {
  params: Promise<{
    channel: string;
    conversation_id: string;
  }>;
}

// Matches ev-{eventId}-task pattern
function parseTaskChannel(channel: string): string | null {
  const m = channel.match(/^ev-(.+)-task$/);
  return m ? m[1] : null;
}

const SIDEBAR_EXPANDED_KEY = 'messages_sidebar_expanded_default';

export default function ConversationPage({ params }: ConversationPageProps) {
  const { channel, conversation_id } = use(params);
  const router = useRouter();
  const [searchFilter, setSearchFilter] = useState('');
  // Móvil: bottom sheet con sidebar info contacto (Diseño 24-jun móvil)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);

  // Rediseño A.4 (18-jul): panel derecho (EventSidebar / ConversationNotesSidebar)
  // pasa de fijo 280px a desplegable con toggle "Detalles" en el header.
  // Estado inicial COLAPSADO — persistido en localStorage. Hidratación via
  // useEffect post-mount para no romper SSR (BUG-04 QA #13).
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(SIDEBAR_EXPANDED_KEY) === '1') {
        setSidebarExpanded(true);
      }
    } catch {
      /* ignore */
    }
  }, []);
  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(SIDEBAR_EXPANDED_KEY, next ? '1' : '0');
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Datos extra de la conversación para el sidebar de notas (linked_contact_id,
  // linked_event_id, nombre del contacto). useConversations ya carga la lista.
  const { conversations } = useConversations(channel);
  const conv = conversations.find((c) => c.id === conversation_id);

  const taskEventId = parseTaskChannel(channel);

  if (taskEventId) {
    return <TaskDetailWorkspace eventId={taskEventId} taskId={conversation_id} />;
  }

  return (
    <>
      <div
        className="hidden w-[300px] shrink-0 overflow-auto md:block"
        style={{ borderRight: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
      >
        <ConversationList channel={channel} selectedId={conversation_id} />
      </div>

      <div className="flex flex-1 flex-col" style={{ backgroundColor: '#FCFCFD' }}>
        <div className="md:hidden flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-1">
          <button
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => router.push('/bandeja')}
            type="button"
          >
            ←
          </button>
          <div className="flex-1">
            <ConversationHeader
              channel={channel}
              conversationId={conversation_id}
              onSearchFilter={setSearchFilter}
            />
          </div>
          {/* Botón ℹ — abre bottom sheet con sidebar info (Diseño móvil) */}
          <button
            aria-label="Información del contacto"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setInfoSheetOpen(true)}
            type="button"
          >
            ℹ
          </button>
        </div>

        <div className="hidden md:block">
          <ConversationHeader
            channel={channel}
            conversationId={conversation_id}
            onSearchFilter={setSearchFilter}
            detailsOpen={sidebarExpanded}
            onToggleDetails={toggleSidebar}
          />
        </div>

        <div className="flex-1 overflow-auto">
          <MessageList channel={channel} conversationId={conversation_id} searchFilter={searchFilter} />
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <MessageInput channel={channel} conversationId={conversation_id} />
        </div>
      </div>

      {/* Sidebar derecho DESPLEGABLE 280px — Rediseño A.4 (18-jul).
          Antes era fijo siempre visible ≥1024. Ahora se controla con toggle
          "Detalles" en el header. Estado persistido en localStorage.
          Render condicional (preservado):
            · linkedEventId presente → EventSidebar (RSVP + asignación + notas)
            · linkedEventId vacío    → ConversationNotesSidebar (modo Soporte) */}
      {sidebarExpanded && (
        <aside
          className="hidden w-[280px] shrink-0 overflow-hidden lg:flex lg:flex-col"
          style={{ borderLeft: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
        >
          {conv?.linkedEventId ? (
            <EventSidebar
              conversationId={conversation_id}
              contactName={conv.contact?.name}
              contactPhone={conv.contact?.phone}
              linkedContactId={conv.linkedContactId}
              linkedEventId={conv.linkedEventId}
              channel={conv.channel ?? channel}
              rsvpStatus={conv.guestStatus ?? undefined}
            />
          ) : (
            <ConversationNotesSidebar
              conversationId={conversation_id}
              contactName={conv?.contact?.name}
              linkedContactId={conv?.linkedContactId}
              linkedEventId={conv?.linkedEventId}
              channel={conv?.channel ?? channel}
            />
          )}
        </aside>
      )}

      {/* Bottom sheet móvil 75% con sidebar info contacto.
          El sidebar derecho lateral NO existe en móvil (Diseño 24-jun). */}
      <BottomSheet
        open={infoSheetOpen}
        onClose={() => setInfoSheetOpen(false)}
        title={conv?.contact?.name ?? 'Detalles de la conversación'}
      >
        {conv?.linkedEventId ? (
          <EventSidebar
            conversationId={conversation_id}
            contactName={conv.contact?.name}
            contactPhone={conv.contact?.phone}
            linkedContactId={conv.linkedContactId}
            linkedEventId={conv.linkedEventId}
            channel={conv.channel ?? channel}
            rsvpStatus={conv.guestStatus ?? undefined}
          />
        ) : (
          <ConversationNotesSidebar
            conversationId={conversation_id}
            contactName={conv?.contact?.name}
            linkedContactId={conv?.linkedContactId}
            linkedEventId={conv?.linkedEventId}
            channel={conv?.channel ?? channel}
            compact
          />
        )}
      </BottomSheet>
    </>
  );
}
