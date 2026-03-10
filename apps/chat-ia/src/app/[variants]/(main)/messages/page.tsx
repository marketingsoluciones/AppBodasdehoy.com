'use client';

import { useMemo, useState } from 'react';

import { InboxSidebar } from './components/InboxSidebar';
import { ConversationList } from './components/ConversationList';
import { ChannelFilter } from './components/ChannelFilter';
import { useConversations } from './hooks/useConversations';

export default function MessagesPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const { conversations } = useConversations(null);

  // Compute unread counts per channel
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const conv of conversations) {
      if (conv.unreadCount > 0) {
        counts[conv.channel] = (counts[conv.channel] || 0) + conv.unreadCount;
      }
    }
    return counts;
  }, [conversations]);

  return (
    <>
      {/* InboxSidebar — hidden on mobile */}
      <div className="hidden md:block">
        <InboxSidebar />
      </div>

      {/* Lista de conversaciones — full width on mobile */}
      <div className="flex w-full flex-col overflow-auto border-r border-gray-200 bg-white md:w-72 md:shrink-0">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-3">
          <ChannelFilter
            onChannelChange={setSelectedChannel}
            selectedChannel={selectedChannel}
            unreadCounts={unreadCounts}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <ConversationList channel={selectedChannel} />
        </div>
      </div>

      {/* Empty state — hidden on mobile (conv list fills) */}
      <div className="hidden flex-1 items-center justify-center bg-gray-50 md:flex">
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
