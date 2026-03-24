'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { ConversationList } from '../components/ConversationList';
import { InternalChannelView } from '../components/InternalChannelView';
import { WhatsAppSetup } from '../components/WhatsAppSetup';
import { InstagramSetup } from '../components/InstagramSetup';
import { TelegramSetup } from '../components/TelegramSetup';
import { EmailSetup } from '../components/EmailSetup';
import { WebChatSetup } from '../components/WebChatSetup';
import { FacebookSetup } from '../components/FacebookSetup';

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

// Channels that show a full-width setup/config screen
const SETUP_CHANNELS: Record<string, React.ComponentType<{ development: string }>> = {
  email: EmailSetup,
  facebook: FacebookSetup,
  instagram: InstagramSetup,
  telegram: TelegramSetup,
  web: WebChatSetup,
  whatsapp: WhatsAppSetup,
};

// Botón de vuelta para móvil
function MobileBackButton() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-1 md:hidden">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        onClick={() => router.push('/messages')}
        type="button"
      >
        ←
      </button>
      <span className="text-sm font-medium text-gray-700">Mensajes</span>
    </div>
  );
}

function SelectTaskEmpty() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 text-5xl">📋</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-700">Selecciona una tarea</h3>
        <p className="text-sm text-gray-500">
          Elige una tarea pendiente de la bandeja para ver los detalles
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

  // ── Canales de setup (WhatsApp, Instagram, etc.)
  if (channel in SETUP_CHANNELS) {
    const SetupComponent = SETUP_CHANNELS[channel]!;
    return (
      <>
        {/* Mobile: setup a pantalla completa con back button */}
        <div className="flex flex-1 flex-col overflow-hidden md:hidden">
          <MobileBackButton />
          <div className="flex-1 overflow-auto">
            <SetupComponent development={dev} />
          </div>
        </div>
        {/* Desktop: setup en panel derecho (BandejaView en el layout) */}
        <div className="hidden flex-1 overflow-hidden bg-gray-50 md:flex">
          <SetupComponent development={dev} />
        </div>
      </>
    );
  }

  // ── Canal de tareas sin tarea seleccionada
  if (isTaskChannel(channel)) {
    return (
      <>
        <div className="md:hidden flex flex-1 flex-col overflow-hidden">
          <MobileBackButton />
          <SelectTaskEmpty />
        </div>
        <div className="hidden md:flex flex-1">
          <SelectTaskEmpty />
        </div>
      </>
    );
  }

  // ── Canal interno (itinerario, servicios, invitados…)
  if (isInternalChannel(channel)) {
    return (
      <>
        <div className="flex flex-1 flex-col overflow-hidden md:hidden">
          <MobileBackButton />
          <div className="flex-1 overflow-hidden">
            <InternalChannelView channelId={channel} />
          </div>
        </div>
        <div className="hidden flex-1 overflow-hidden md:flex">
          <InternalChannelView channelId={channel} />
        </div>
      </>
    );
  }

  // ── Canal externo (wa-{id}, instagram, telegram…): lista de conversaciones
  return (
    <>
      {/* Mobile: lista de conversaciones a pantalla completa */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <MobileBackButton />
        <div className="flex-1 overflow-auto">
          <ConversationList channel={channel} />
        </div>
      </div>

      {/* Desktop: lista de conversaciones del canal + empty right */}
      <div className="hidden flex-1 overflow-hidden md:flex">
        <div className="w-80 shrink-0 overflow-auto border-r border-gray-200 bg-gray-50">
          <ConversationList channel={channel} />
        </div>
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
      </div>
    </>
  );
}
