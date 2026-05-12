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
        router.push(
          `/messages/${encodeURIComponent(item.channelParam)}/${encodeURIComponent(item.conversationId)}`,
        );
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
      <div className="hidden flex-1 overflow-hidden md:flex">
        <div className="w-[420px] shrink-0 overflow-hidden border-r border-gray-200 bg-white">
          <UnifiedFeedView items={items} loading={loading} onItemClick={handleItemClick} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 text-center">
          <div className="max-w-md">
            <div className="text-4xl">💬</div>
            <div className="mt-3 text-sm font-semibold text-gray-800">Bandeja unificada</div>
            <div className="mt-1 text-xs text-gray-500">
              Mensajes y notificaciones en un solo sitio. Selecciona una conversación para ver el detalle.
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                className="rounded-lg bg-pink-500 px-3 py-2 text-xs font-semibold text-white hover:bg-pink-600"
                onClick={() => router.push('/messages/whatsapp')}
                type="button"
              >
                Conectar WhatsApp
              </button>
              <button
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => router.push('/settings/integrations')}
                type="button"
              >
                Conectar canal
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
