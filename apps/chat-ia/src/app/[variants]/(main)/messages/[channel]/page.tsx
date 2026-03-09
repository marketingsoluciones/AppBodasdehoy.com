'use client';

import { use } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { InboxSidebar } from '../components/InboxSidebar';
import { ConversationList } from '../components/ConversationList';
import { InternalChannelView } from '../components/InternalChannelView';
import { WhatsAppSetup } from '../components/WhatsAppSetup';

interface ChannelPageProps {
  params: Promise<{ channel: string }>;
}

// ev-{eventId}-{type} (itinerary|services|guests|tasks) — internal app views
function isInternalChannel(channel: string) {
  return channel.startsWith('ev-') && !channel.endsWith('-task');
}

// ev-{eventId}-task without a taskId → empty task selection state
function isTaskChannel(channel: string) {
  return /^ev-.+-task$/.test(channel);
}

// 'whatsapp' = placeholder (no channel configured) → full-width setup screen
function isWhatsAppPlaceholder(channel: string) {
  return channel === 'whatsapp';
}

function WhatsAppSetupPage({ development }: { development: string }) {
  return (
    <>
      <InboxSidebar />
      <div className="flex flex-1 overflow-hidden bg-gray-50">
        <WhatsAppSetup development={development} />
      </div>
    </>
  );
}

function SelectTaskEmpty() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 text-5xl">📋</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-700">Selecciona una tarea</h3>
        <p className="text-sm text-gray-500">
          Elige una tarea pendiente de la barra lateral para ver los detalles
        </p>
      </div>
    </div>
  );
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const { channel } = use(params);
  const { checkAuth } = useAuthCheck();
  const { development } = checkAuth();
  const dev = development || 'bodasdehoy';

  if (isWhatsAppPlaceholder(channel)) {
    return <WhatsAppSetupPage development={dev} />;
  }

  return (
    <>
      <InboxSidebar />

      {isTaskChannel(channel) ? (
        <SelectTaskEmpty />
      ) : isInternalChannel(channel) ? (
        <InternalChannelView channelId={channel} />
      ) : (
        <>
          {/* Lista de conversaciones del canal externo */}
          <div className="w-80 shrink-0 overflow-auto border-r border-gray-200 bg-gray-50">
            <ConversationList channel={channel} />
          </div>

          {/* Empty state */}
          <div className="flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="mb-4 text-5xl">💬</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-700">
                Selecciona una conversación
              </h3>
              <p className="text-sm text-gray-500">
                Elige una conversación de la lista para empezar
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
