'use client';

import { useState } from 'react';

import { InboxSidebar } from './components/InboxSidebar';
import { ConversationList } from './components/ConversationList';
import { ChannelFilter } from './components/ChannelFilter';

export default function MessagesPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  return (
    <>
      <InboxSidebar />

      {/* Lista de conversaciones */}
      <div className="w-72 shrink-0 overflow-auto border-r border-gray-200 bg-white">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-3">
          <ChannelFilter
            onChannelChange={setSelectedChannel}
            selectedChannel={selectedChannel}
          />
        </div>
        <ConversationList channel={selectedChannel} />
      </div>

      {/* Empty state */}
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">💬</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-700">
            Selecciona una conversación
          </h3>
          <p className="text-gray-400">
            Elige una conversación de la izquierda para empezar a chatear
          </p>
        </div>
      </div>
    </>
  );
}
