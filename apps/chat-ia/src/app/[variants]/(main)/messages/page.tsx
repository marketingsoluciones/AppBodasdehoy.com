'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { ChannelSidebar } from './components/ChannelSidebar';
import { UnifiedFeedView } from './components/UnifiedFeedView';
import { type FeedItem, useUnifiedFeed } from './hooks/useUnifiedFeed';

export default function MessagesPage() {
  const router = useRouter();
  const { items, loading, markNotificationRead } = useUnifiedFeed();

  const handleItemClick = useCallback(
    (item: FeedItem) => {
      if (item.kind === 'notification' && item.notificationId) {
        markNotificationRead(item.notificationId);
        if (item.navigationUrl) router.push(item.navigationUrl);
        return;
      }
      if (item.channelParam && item.conversationId) {
        router.push(`/messages/${item.channelParam}/${item.conversationId}`);
      }
    },
    [router, markNotificationRead],
  );

  return (
    <>
      {/* Mobile: ChannelSidebar ocupa todo el ancho (el layout lo oculta en desktop) */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <ChannelSidebar />
      </div>

      {/* Desktop: feed unificado de todos los mensajes y notificaciones */}
      <div className="hidden flex-1 flex-col overflow-hidden md:flex">
        <UnifiedFeedView items={items} loading={loading} onItemClick={handleItemClick} />
      </div>
    </>
  );
}
