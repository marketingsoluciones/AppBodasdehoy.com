'use client';

import { useState } from 'react';
import { InboxSidebar } from './components/InboxSidebar';
import { ConversationList } from './components/ConversationList';

export default function MessagesPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  return (
    <>
      {/* Sidebar con canales */}
      <InboxSidebar
        onChannelSelect={setSelectedChannel}
        selectedChannel={selectedChannel}
      />

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-auto border-r border-gray-200">
        <ConversationList channel={selectedChannel} />
      </div>

      {/* Empty state cuando no hay conversación seleccionada */}
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">💬</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-700">
            Selecciona una conversación
          </h3>
          <p className="text-gray-500">
            Elige una conversación de la izquierda para empezar a chatear
          </p>
        </div>
      </div>
    </>
  );
}

