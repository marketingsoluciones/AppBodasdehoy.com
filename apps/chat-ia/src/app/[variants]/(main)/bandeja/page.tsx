'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BandejaTabs, useActiveBandejaTab } from './components/BandejaTabs';
import { GlobalSummaryCard } from './components/GlobalSummaryCard';
import { InboxFilters, type ChannelFilter, type RsvpFilter } from './components/InboxFilters';
import { ScopeSelector, type ScopeId } from './components/ScopeSelector';
import { UnifiedFeedView } from './components/UnifiedFeedView';
import { type FeedItem, useUnifiedFeed } from './hooks/useUnifiedFeed';

// RESTAURA la categorización de la antigua /pendientes (auditoría 20-ago: se perdió al
// fusionarla en "Esperan respuesta" como lista plana). Replica exacta de su
// SECTION_META + classifyNotification, aplicada como agrupación de la vista ?view=esperan.
const PENDING_GROUPS: { color: string; icon: string; key: string; label: string }[] = [
  { color: '#22C55E', icon: '💬', key: 'conversation_externa', label: 'Mensajería' },
  { color: '#A855F7', icon: '🤖', key: 'chat_ia', label: 'Asistente' },
  { color: '#F59E0B', icon: '📋', key: 'service_comment', label: 'Servicios' },
  { color: '#3B82F6', icon: '📅', key: 'itinerary_comment', label: 'Itinerario' },
  { color: '#6B7280', icon: '🔔', key: 'notification_otra', label: 'Otras' },
];
function classifyPendingItem(item: FeedItem): string {
  if (item.kind === 'conversation') return 'conversation_externa';
  const type = item.notifType;
  if (!type) return 'notification_otra';
  if (type === 'whatsapp_message') return 'conversation_externa';
  if (type.startsWith('service_') || type === 'task_reminder') return 'service_comment';
  if (type.startsWith('itinerary_')) return 'itinerary_comment';
  if (type.startsWith('chat_ia') || type === 'agent_completed') return 'chat_ia';
  return 'notification_otra';
}

// El guard de auth vive en el layout hermano (messages/layout.tsx): valida
// con ventana de gracia y hace router.replace('/login?redirect=/bandeja').
// Cualquier código que llegue a este page.tsx ya pasó ese filtro, por eso
// aquí no hace falta un segundo gate — sería inalcanzable.
export default function MessagesPage() {
  const router = useRouter();
  const activeTab = useActiveBandejaTab();
  const searchParams = useSearchParams();
  // FASE B (14-ago): vista "Esperan respuesta" — absorbe la antigua /pendientes.
  // Se activa con ?view=esperan (el rail y el redirect de /pendientes apuntan aquí).
  // Muestra lo NO leído de AMBOS tipos (conversaciones con unreadCount>0 +
  // notificaciones sin leer) en una sola lista, en vez de una segunda "bandeja"
  // con su propio store (lo que se percibía como bandejas duplicadas — informe
  // rediseño mensajería 13-ago). useUnifiedFeed ya trae ambos tipos: 0 fuente nueva.
  const esperanOnly = searchParams?.get('view') === 'esperan';
  const { items, loading, markNotificationRead } = useUnifiedFeed();

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
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  // Puente Agente→Bandeja (17-ago): la ficha de un agente enlaza a /bandeja?channel=<wa|ig|tg|fb|web>
  // para "ver las conversaciones de sus canales". Se aplica UNA sola vez al montar (ref) para
  // no pelear con los cambios manuales de filtro del usuario. SSR/1er render = 'all' (sin
  // mismatch); el efecto post-mount aplica el canal. v1 filtra por CANAL (no por agente aún:
  // la asignación conversación→agente es backend pendiente).
  const appliedChannelRef = useRef(false);
  useEffect(() => {
    if (appliedChannelRef.current) return;
    const c = searchParams?.get('channel');
    if (c && ['fb', 'ig', 'sms', 'tg', 'wa', 'web'].includes(c)) {
      setChannelFilter(c as ChannelFilter);
      appliedChannelRef.current = true;
    }
  }, [searchParams]);
  // FASE 2 Agentes (17-ago) — ESQUELETO DORMIDO hasta backend. Cuando exista el campo
  // `assignedAgentId` en la conversación (ticket abierto), la ficha del agente enlazará a
  // /bandeja?agent=<id> y aquí filtraremos por agente EXACTO (no por canal). Se siembra
  // una vez (ref) y SOLO se aplica si hay datos de agente en la lista (agentDataAvailable),
  // así que hoy es un no-op: nada enlaza a ?agent= y ningún item trae assignedAgentId.
  // 0 dead code, 0 fallback — se auto-activa el día que backend expone el dato.
  const appliedAgentRef = useRef(false);
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  useEffect(() => {
    if (appliedAgentRef.current) return;
    const a = searchParams?.get('agent');
    if (a) {
      setAgentFilter(a);
      appliedAgentRef.current = true;
    }
  }, [searchParams]);
  // FASE B v2.0 (Diseño 25-jun): cola Pendientes IA. Visible solo cuando
  // iaLevel='copilot'. Por ahora iaLevel se gestiona por conversación en el
  // header — cuando se persista por workspace, leemos de ahí. Mientras
  // mostramos el filtro si HAY borradores pendientes (count > 0).
  const [pendingIaActive, setPendingIaActive] = useState(false);
  // Cablead 22-jul: cuenta real de conversaciones con borrador IA pendiente.
  // Los items de useUnifiedFeed ya traen draftState (api-ia); antes era 0 fijo.
  const pendingIaCount = items.filter(
    (i) => i.kind === 'conversation' && (i as any).draftState === 'pending',
  ).length;

  // MOB-21 (15-jul): toggle "ver spam" para newsletters/broadcasts. Persistido en
  // localStorage para que sobreviva recargas. Default OFF (filtrado activo) —
  // conserva el comportamiento actual que oculta el ruido. El usuario que quiera
  // ver newsletters/broadcasts (raro para organizadores, más útil para admins)
  // activa el toggle y su estado queda memorizado.
  const [showSpam, setShowSpam] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('inbox_show_spam');
      if (raw === '1') setShowSpam(true);
    } catch {
      /* ignore */
    }
  }, []);
  const toggleShowSpam = useCallback(() => {
    setShowSpam((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('inbox_show_spam', next ? '1' : '0');
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // BUG-INBOX-03 fix QA #34 (29-jun): los chips de canal/RSVP/Pendientes IA
  // del componente InboxFilters cambiaban el state pero filteredItems NO
  // aplicaba ningún filtro de canal/rsvp/pendingIa → "filtros muertos".
  // Aquí aplico los filtros que faltan + mapeo channel codes (wa→whatsapp,
  // ig→instagram, tg→telegram, fb→facebook) al campo channelParam del item.
  const CHANNEL_MAP: Record<ChannelFilter, string | null> = {
    all: null,
    fb: 'facebook',
    ig: 'instagram',
    sms: 'sms',
    tg: 'telegram',
    wa: 'whatsapp',
    web: 'web',
  };
  // FASE 2 Agentes (dormido): ¿hay datos de agente en la lista? Solo entonces se activan
  // el filtro ?agent= y el banner. Hoy false (backend no expone assignedAgentId todavía).
  const agentDataAvailable = useMemo(
    () => items.some((i) => i.kind === 'conversation' && !!i.assignedAgentId),
    [items],
  );
  const agentFilterName = useMemo(() => {
    if (!agentFilter) return null;
    const hit = items.find(
      (i) => i.kind === 'conversation' && i.assignedAgentId === agentFilter,
    );
    return hit?.assignedAgentName ?? null;
  }, [items, agentFilter]);
  const filteredItems = useMemo(() => {
    let arr = items;
    if (esperanOnly) {
      // Vista "Esperan respuesta": no leídos de AMBOS tipos (reemplaza el filtro
      // por-tab). Conserva scope/spam/canal/RSVP debajo (por defecto no-op).
      arr = arr.filter(
        (i) =>
          (i.kind === 'conversation' && i.unreadCount > 0) ||
          (i.kind === 'notification' && !i.isRead),
      );
    } else if (activeTab === 'history') arr = arr.filter((i) => i.kind === 'notification');
    else if (activeTab === 'inbox') arr = arr.filter((i) => i.kind === 'conversation');
    if (activeScope !== 'support') {
      arr = arr.filter(
        (i) => i.kind !== 'conversation' || i.linkedEventId === activeScope,
      );
    }
    // MOB-21 QA #34 (29-jun): inbox WA tenía 270+ msgs spam de newsletters
    // y status broadcasts ahogando el inbox real del organizador.
    // Filtro auto: ocultar conversaciones cuyo jidType sea 'newsletter' o
    // 'broadcast' por default. Toggle "ver spam" (15-jul) lo desactiva
    // temporalmente para admins que quieran auditar.
    if (!showSpam) {
      arr = arr.filter((i) => {
        if (i.kind !== 'conversation') return true;
        const jid = (i as any).jidType;
        return jid !== 'newsletter' && jid !== 'broadcast';
      });
    }
    // BUG-INBOX-03 v2 (QA 30-jun): WA items tienen channelParam='wa-{id}' (no
    // 'whatsapp'), por lo que includes('whatsapp') vaciaba la bandeja cuando
    // se filtraba por WA con canales configurados. Comparar por channelKind
    // del item (que SÍ es 'whatsapp'|'instagram'|...).
    const targetChannel = CHANNEL_MAP[channelFilter];
    if (targetChannel) {
      arr = arr.filter(
        (i) => i.kind !== 'conversation' || i.channelKind === targetChannel,
      );
    }
    // BUG-INBOX-03: filtro RSVP
    if (rsvpFilter !== 'all') {
      arr = arr.filter(
        (i) => i.kind !== 'conversation' || (i as any).rsvpStatus === rsvpFilter,
      );
    }
    // BUG-INBOX-03: filtro Pendientes IA (draftState='pending')
    if (pendingIaActive) {
      arr = arr.filter(
        (i) => i.kind !== 'conversation' || (i as any).draftState === 'pending',
      );
    }
    // FASE 2 Agentes (dormido hasta backend): filtro por AGENTE EXACTO. Solo se aplica si
    // agentDataAvailable (algún item con assignedAgentId). Hasta entonces es no-op → la
    // Bandeja se comporta igual que hoy. Cuando backend exponga el campo, ?agent=<id>
    // filtra las conversaciones de ese agente sin importar el canal.
    if (agentFilter && agentDataAvailable) {
      arr = arr.filter(
        (i) => i.kind !== 'conversation' || i.assignedAgentId === agentFilter,
      );
    }
    return arr;
  }, [items, esperanOnly, activeTab, activeScope, channelFilter, rsvpFilter, pendingIaActive, showSpam, agentFilter, agentDataAvailable]);

  const notifUnreadCount = useMemo(
    () => items.filter((i) => i.kind === 'notification' && !i.isRead).length,
    [items],
  );
  const convUnreadCount = useMemo(
    () => items.filter((i) => i.kind === 'conversation' && i.unreadCount > 0).length,
    [items],
  );
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
          `/bandeja/${encodeURIComponent(item.channelParam)}/${encodeURIComponent(item.conversationId)}`,
        );
      }
    },
    [router, markNotificationRead],
  );

  return (
    <>
      {/* Unificación bandeja (owner 20-ago, opción B): UNA sola bandeja (tabs + filtros +
          UnifiedFeedView) en TODOS los tamaños. Antes el móvil usaba ChannelSidebar (otra
          implementación distinta) → "dos bandejas según viewport" (hallazgo QA). El
          ScopeSelector da scope por evento OPCIONAL (default "Soporte" = sin evento
          seleccionado) → cumple: se puede usar sin seleccionar evento/proyecto. La lista es
          full-width en móvil; el panel de detalle (empty state) se oculta en móvil (al tocar
          una conversación se navega a su ruta de detalle a pantalla completa). */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tabs FASE B v2.0 Diseño 24-jun */}
        <BandejaTabs
          active={activeTab}
          counts={{ history: notifUnreadCount, inbox: convUnreadCount }}
        />
        <div className="flex flex-1 overflow-hidden">
          <div
            className="flex w-full shrink-0 flex-col overflow-hidden md:w-[300px]"
            style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #EDEDF0' }}
          >
            {/* FASE B (14-ago): cabecera de la vista "Esperan respuesta" (?view=esperan,
                antes /pendientes). Deja claro que es un filtro de "no leídos" y permite
                volver a la bandeja completa sin perderse. */}
            {esperanOnly && (
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-amber-50 px-3 py-2">
                <span className="text-[12px] font-semibold" style={{ color: '#92400e' }}>
                  🔴 Esperan respuesta
                </span>
                <button
                  className="text-[11px] font-medium underline"
                  onClick={() => router.push('/bandeja')}
                  // Color inline: el repo no usa variantes dark:, evita texto invisible.
                  style={{ color: '#4b5563' }}
                  type="button"
                >
                  Ver toda la bandeja
                </button>
              </div>
            )}
            {/* FASE 2 Agentes (17-ago) — banner del filtro por agente. Solo aparece cuando
                agentDataAvailable (backend expone assignedAgentId) Y hay ?agent= activo.
                Hoy dormido: nada enlaza a ?agent= y no hay datos de agente. */}
            {agentFilter && agentDataAvailable && (
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-violet-50 px-3 py-2">
                <span className="truncate text-[12px] font-semibold" style={{ color: '#6B4EFF' }}>
                  🤖 Conversaciones de {agentFilterName ?? 'este agente'}
                </span>
                <button
                  className="shrink-0 text-[11px] font-medium underline"
                  onClick={() => {
                    setAgentFilter(null);
                    router.push('/bandeja');
                  }}
                  style={{ color: '#4b5563' }}
                  type="button"
                >
                  Ver toda la bandeja
                </button>
              </div>
            )}
            {/* ScopeSelector + filtros solo visibles en tab 'inbox'. En 'history'
                el feed es plano (notificaciones) sin scope ni filtros canal/RSVP. */}
            {activeTab === 'inbox' && (
              <>
                <div className="border-b border-gray-100 px-3 py-2">
                  <ScopeSelector activeScope={activeScope} onChange={handleScopeChange} />
                </div>
                {/* G2 (auditoría 22-ago): resumen del dueño en modo Global (sin evento
                    seleccionado). Datos agregados en front (eventos + no-leídos ya en memoria). */}
                {activeScope === 'support' && !esperanOnly && !agentFilter && (
                  <GlobalSummaryCard convUnread={convUnreadCount} />
                )}
                <InboxFilters
                  channel={channelFilter}
                  hideRsvp={activeScope === 'support'}
                  iaCopilotActive={true}
                  onChannelChange={setChannelFilter}
                  onPendingIaToggle={() => setPendingIaActive((v) => !v)}
                  onRsvpChange={setRsvpFilter}
                  pendingIaActive={pendingIaActive}
                  pendingIaCount={pendingIaCount}
                  rsvp={rsvpFilter}
                />
                {/* MOB-21 toggle "ver spam" (15-jul) — chip discreto que revierte
                    el filtro auto de newsletter/broadcast si el usuario lo pide. */}
                <div className="flex justify-end border-b border-gray-100 px-3 py-1">
                  <button
                    aria-pressed={showSpam}
                    className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
                    onClick={toggleShowSpam}
                    // A4 (QA 6-ago): color inline gana al override global del tema oscuro
                    // (el repo no usa variantes dark:), evitando texto invisible sobre el bg blanco.
                    style={{ color: '#4b5563' }}
                    type="button"
                  >
                    {showSpam ? '📢 Ocultar newsletters/estados' : '👁 Ver newsletters/estados'}
                  </button>
                </div>
              </>
            )}
            <div className="min-h-0 flex-1 overflow-hidden">
              <UnifiedFeedView
                groupBy={esperanOnly ? classifyPendingItem : undefined}
                groups={esperanOnly ? PENDING_GROUPS : undefined}
                items={filteredItems}
                loading={loading}
                onItemClick={handleItemClick}
              />
            </div>
          </div>
          {/* Panel principal — empty state según tab. Oculto en móvil (la lista va full-width;
              al tocar una conversación se navega a su ruta de detalle a pantalla completa). */}
          <div className="hidden flex-1 flex-col items-center justify-center bg-gray-50 px-6 text-center md:flex">
            <div className="max-w-md">
              {activeTab === 'history' ? (
                <>
                  <div className="text-4xl">🔔</div>
                  <div className="mt-3 text-sm font-semibold text-gray-800">Notificaciones</div>
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
                      onClick={() => router.push('/bandeja/whatsapp')}
                      type="button"
                    >
                      Conectar WhatsApp
                    </button>
                    <button
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                      onClick={() => router.push('/settings/integrations')}
                      // A4 (QA 6-ago): color inline evita texto invisible en tema oscuro.
                      style={{ color: '#374151' }}
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
