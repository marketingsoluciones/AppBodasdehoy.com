'use client';

import { use, useState } from 'react';
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

export default function ConversationPage({ params }: ConversationPageProps) {
  const { channel, conversation_id } = use(params);
  const router = useRouter();
  const [searchFilter, setSearchFilter] = useState('');
  // Móvil: bottom sheet con sidebar info contacto (Diseño 24-jun móvil)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);

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
      <div className="hidden w-[420px] shrink-0 overflow-auto border-r border-gray-200 bg-white md:block">
        <ConversationList channel={channel} selectedId={conversation_id} />
      </div>

      <div className="flex flex-1 flex-col bg-gray-50">
        <div className="md:hidden flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-1">
          <button
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => router.push('/messages')}
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
          />
        </div>

        <div className="flex-1 overflow-auto">
          <MessageList channel={channel} conversationId={conversation_id} searchFilter={searchFilter} />
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <MessageInput channel={channel} conversationId={conversation_id} />
        </div>
      </div>

      {/* Sidebar derecho 280px — FASE B v2.0 handoff Bandeja Diseño 24-jun.
          P9: render condicional según contexto:
            · linkedEventId presente → EventSidebar (RSVP + asignación + datos + notas)
            · linkedEventId vacío    → ConversationNotesSidebar (modo Soporte: solo notas)
          Solo desktop ≥1024px. */}
      <aside className="hidden w-[280px] shrink-0 overflow-hidden border-l border-gray-200 bg-white lg:flex lg:flex-col">
        {conv?.linkedEventId ? (
          <EventSidebar
            conversationId={conversation_id}
            contactName={conv.contact?.name}
            contactPhone={conv.contact?.phone}
            linkedContactId={conv.linkedContactId}
            linkedEventId={conv.linkedEventId}
            channel={conv.channel ?? channel}
            // FASE B v2.0 — api-mcp commit 7d52fec (25-jun) expone guestStatus
            // resolviendo invitado por teléfono internamente.
            rsvpStatus={conv.guestStatus ?? undefined}
            // assignedTo: api-mcp confirma user-asignación ya disponible
            // (team requiere entidad Teams, sprint aparte). Cableo en próximo commit.
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
