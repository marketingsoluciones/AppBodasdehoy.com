'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { BandejaTabs, useActiveBandejaTab } from './components/BandejaTabs';
import { ChannelSidebar } from './components/ChannelSidebar';
import { InboxFilters, type ChannelFilter, type RsvpFilter } from './components/InboxFilters';
import { ScopeSelector, type ScopeId } from './components/ScopeSelector';
import { UnifiedFeedView } from './components/UnifiedFeedView';
import { type FeedItem, useUnifiedFeed } from './hooks/useUnifiedFeed';

export default function MessagesPage() {
  const router = useRouter();
  const activeTab = useActiveBandejaTab();
  const { items, loading, markNotificationRead, markAllNotificationsRead } = useUnifiedFeed();

  // FASE B v2.0: scope selector. 'support' = bandeja del equipo;
  // un eventId = bandeja de ese evento. Al cambiar, el caller debe
  // (futuro) recargar lista filtrada por linkedEvents=eventId.
  const [activeScope, setActiveScope] = useState<ScopeId>('support');

  // FASE B v2.0 (Diseño 24-jun): items filtrados según tab activa.
  //   inbox   → conversaciones (kind === 'conversation')
  //   history → notificaciones (kind === 'notification')
  // BUG-06 QA #13 (25-jun): además filtrar por scope evento — si activeScope es
  // un eventId (no 'support'), conservar solo conversaciones cuyo linkedEventId
  // coincide. Las notificaciones (kind='notification') no llevan linkedEventId
  // y se mantienen como están en tab history.
  const filteredItems = useMemo(() => {
    let arr = items;
    if (activeTab === 'history') arr = arr.filter((i) => i.kind === 'notification');
    else if (activeTab === 'inbox') arr = arr.filter((i) => i.kind === 'conversation');
    if (activeScope !== 'support') {
      arr = arr.filter(
        (i) => i.kind !== 'conversation' || i.linkedEventId === activeScope,
      );
    }
    return arr;
  }, [items, activeTab, activeScope]);

  const notifUnreadCount = useMemo(
    () => items.filter((i) => i.kind === 'notification' && !i.isRead).length,
    [items],
  );
  const convUnreadCount = useMemo(
    () => items.filter((i) => i.kind === 'conversation' && i.unreadCount > 0).length,
    [items],
  );
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  // FASE B v2.0 (Diseño 25-jun): cola Pendientes IA. Visible solo cuando
  // iaLevel='copilot'. Por ahora iaLevel se gestiona por conversación en el
  // header — cuando se persista por workspace, leemos de ahí. Mientras
  // mostramos el filtro si HAY borradores pendientes (count > 0).
  const [pendingIaActive, setPendingIaActive] = useState(false);
  const pendingIaCount = 0; // TODO: contar items con draftState='pending' cuando api-ia exponga

  // Al cambiar de scope: resetear filtros (regla state management Diseño).
  const handleScopeChange = useCallback((s: ScopeId) => {
    setActiveScope(s);
    setRsvpFilter('all');
    setChannelFilter('all');
  }, []);

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

      {/* Desktop: tabs Conversaciones / Bandeja / Historial + feed por tab */}
      <div className="hidden flex-1 flex-col overflow-hidden md:flex">
        {/* Tabs FASE B v2.0 Diseño 24-jun */}
        <BandejaTabs
          active={activeTab}
          counts={{ history: notifUnreadCount, inbox: convUnreadCount }}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-[420px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white">
            {/* ScopeSelector + filtros solo visibles en tab 'inbox'. En 'history'
                el feed es plano (notificaciones) sin scope ni filtros canal/RSVP. */}
            {activeTab === 'inbox' && (
              <>
                <div className="border-b border-gray-100 px-3 py-2">
                  <ScopeSelector activeScope={activeScope} onChange={handleScopeChange} />
                </div>
                <InboxFilters
                  hideRsvp={activeScope === 'support'}
                  rsvp={rsvpFilter}
                  channel={channelFilter}
                  onRsvpChange={setRsvpFilter}
                  onChannelChange={setChannelFilter}
                  iaCopilotActive={true}
                  pendingIaCount={pendingIaCount}
                  pendingIaActive={pendingIaActive}
                  onPendingIaToggle={() => setPendingIaActive((v) => !v)}
                />
              </>
            )}
            {/* Tab Historial — barra "marcar todas leídas" cuando hay unread */}
            {activeTab === 'history' && notifUnreadCount > 0 && (
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                <span className="text-[11px] text-gray-500">
                  {notifUnreadCount} sin leer
                </span>
                <button
                  className="rounded-md px-2 py-1 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50"
                  onClick={() => void markAllNotificationsRead()}
                  type="button"
                >
                  Marcar todas leídas
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-hidden">
              <UnifiedFeedView
                items={filteredItems}
                loading={loading}
                onItemClick={handleItemClick}
              />
            </div>
          </div>
          {/* Panel principal — empty state según tab */}
          <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 text-center">
            <div className="max-w-md">
              {activeTab === 'history' ? (
                <>
                  <div className="text-4xl">🕒</div>
                  <div className="mt-3 text-sm font-semibold text-gray-800">Historial</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Selecciona una notificación para ver el detalle. Las acciones se
                    enlazan al hilo de la conversación o entidad correspondiente.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl">💬</div>
                  <div className="mt-3 text-sm font-semibold text-gray-800">
                    Bandeja unificada
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Mensajes y notificaciones en un solo sitio. Selecciona una conversación
                    para ver el detalle.
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
