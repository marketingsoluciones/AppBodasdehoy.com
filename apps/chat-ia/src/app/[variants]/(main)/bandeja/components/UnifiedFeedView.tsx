'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { FeedItem } from '../hooks/useUnifiedFeed';
import { useBandejaBrand } from '../utils/brand';
import { useCanManageMessaging } from '@/hooks/useCanManageMessaging';

import { getUserContext } from '../utils/auth';
import { formatPhone } from '../utils/jid';
import { FilaConversacion } from './FilaConversacion';
import { previewText } from '../utils/preview';

// ─── Config ──────────────────────────────────────────────────────────────────

// Colores de CANAL AJENO, no de la marca: el rosa de Instagram es de Instagram, el verde de
// WhatsApp es de WhatsApp. No entran en la campaña de whitelabel; cambiarlos por el color de
// la marca haría que los canales dejaran de distinguirse de un vistazo. Todo lo demás en esta
// carpeta sí debe salir de `useBandejaBrand`.
/** Color del punto de canal, el mismo que usa la lista por canal. */
const CHANNEL_DOT_FEED: Record<string, string> = {
  email: '#84848F',
  facebook: '#1877F2',
  instagram: '#E1306C',
  sms: '#84848F',
  telegram: '#2AABEE',
  web: '#6B4EFF',
  whatsapp: '#25D366',
};

const FEED_CHANNEL_CONFIG: Record<string, { bg: string; icon: string; label: string }> = {
  email: { bg: 'bg-gray-500', icon: '📧', label: '@' },
  facebook: { bg: 'bg-blue-600', icon: '📘', label: 'FB' },
  instagram: { bg: 'bg-pink-500', icon: '📷', label: 'IG' },
  notification: { bg: 'bg-gray-300', icon: '🔔', label: '🔔' },
  telegram: { bg: 'bg-blue-400', icon: '✈️', label: 'TG' },
  web: { bg: 'bg-orange-500', icon: '🌐', label: 'Web' },
  whatsapp: { bg: 'bg-green-500', icon: '📱', label: 'W' },
};

// Tipo de línea WhatsApp (api-ia channelType). Unificamos TODO WhatsApp bajo el mismo verde
// (Meta+QR se ven igual, como pidió el owner 2-sep) y añadimos una etiqueta discreta para
// saber por qué línea entró. WEB_QR = número personal vinculado por QR (sin ventana 24h);
// WAB = Meta Business API (ventana 24h + plantillas).

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(timestamp: string): string {
  if (!timestamp) return '';
  const ts = new Date(timestamp).getTime();
  if (isNaN(ts)) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ─── FeedItemRow ─────────────────────────────────────────────────────────────

function FeedItemRow({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const router = useRouter();
  const { development, userId } = getUserContext();
  const cfg = FEED_CHANNEL_CONFIG[(item.channelKind as string)] ?? FEED_CHANNEL_CONFIG.web;

  // Las notificaciones no son conversaciones: no tienen canal, ni acceso, ni modo de IA.
  // Se quedan con su propia fila, mucho más simple.
  if (item.kind === 'notification') {
    const noLeida = !item.isRead;
    return (
      <button
        className={`flex w-full items-center gap-2.5 border-b border-[var(--b-border)] px-3 py-2 text-left last:border-0 ${
          noLeida ? 'bg-brand-light/60' : 'bg-[var(--b-surface)] hover:bg-[var(--b-surface-2)]'
        }`}
        onClick={onClick}
        type="button"
      >
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--b-surface-2)] text-base">
          {cfg.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`truncate text-sm ${noLeida ? 'font-semibold' : 'font-normal'}`}
              style={{ color: noLeida ? 'var(--b-text-1)' : 'var(--b-text-2)' }}
            >
              {item.name}
            </span>
            <span className="flex-none text-xs" style={{ color: 'var(--b-text-3)' }}>
              {timeAgo(item.timestamp)}
            </span>
          </div>
          <p className="truncate text-xs" style={{ color: 'var(--b-text-3)' }}>
            {previewText(item.preview)}
          </p>
        </div>
        {noLeida && <span className="block h-2 w-2 flex-none rounded-full bg-brand" />}
      </button>
    );
  }

  const waType =
    item.channelKind === 'whatsapp' && item.channelType ? item.channelType : null;

  return (
    <FilaConversacion
      datos={{
        agente: item.assignedAgentName,
        avatar: initials(item.name),
        canalColor: CHANNEL_DOT_FEED[item.channelKind as string] ?? '#84848F',
        canalNombre: [cfg.label, item.lineLabel ? `línea ${formatPhone(String(item.lineLabel))}` : null]
          .filter(Boolean)
          .join(' · '),
        compartidaCon: item.sharedWith,
        conexion: waType,
        hora: timeAgo(item.timestamp),
        id: item.id,
        informativo: item.jidType === 'newsletter' || item.jidType === 'broadcast',
        mensaje: item.preview ?? '',
        nombre: item.name,
        responsable: item.assignedToUserId,
        responsableSoyYo: !!userId && item.assignedToUserId === userId,
        rsvp: item.rsvpStatus,
        sinLeer: item.unreadCount ?? 0,
      }}
      development={development}
      fondo={item.unreadCount > 0 ? 'var(--b-surface-2)' : undefined}
      onAbrir={onClick}
      onCompartir={() => router.push(`/bandeja/conversacion/${item.id}?compartir=1`)}
    />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="flex items-center gap-3 px-4 py-3" key={i}>
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--b-surface-2)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface FeedGroup {
  color: string;
  icon: string;
  key: string;
  label: string;
}
interface UnifiedFeedViewProps {
  /** Vista "Esperan respuesta" (restaura la categorización de la antigua /pendientes,
   *  auditoría 20-ago): si se pasan groupBy+groups, renderiza secciones con cabecera por
   *  dominio (Mensajería/Servicios/Itinerario/Asistente/Otras) en vez de lista plana. */
  groupBy?: (item: FeedItem) => string;
  groups?: FeedGroup[];
  items: FeedItem[];
  loading: boolean;
  onItemClick: (item: FeedItem) => void;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function UnifiedFeedView({ items, loading, onItemClick, groupBy, groups }: UnifiedFeedViewProps) {
  const brand = useBandejaBrand();
  const canManage = useCanManageMessaging();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<
    'all' | 'unread' | 'notifications' | 'whatsapp' | 'instagram' | 'telegram' | 'email' | 'web' | 'facebook'
  >('all');

  const availableFilters = useMemo(() => {
    // B-FILTER-03 QA #34 (29-jun): este sub-filtro tenía chips de canal
    // (WA/IG/FB/TG/@/Web) DUPLICADOS de los chips del top (InboxFilters).
    // Si user activaba "WA" arriba y "Web" abajo, ambos filtros se aplicaban
    // en serie → intersección imposible → lista vacía sin razón aparente.
    // Fix: eliminar chips de canal duplicados. Sub-filtro mantiene solo
    // toggles ortogonales (Sin leer / Notifs) que NO se solapan con el top.
    const kinds = new Set<string>();
    for (const it of items) {
      if (it.kind === 'notification') kinds.add('notifications');
    }
    // SIN "Todo" (duplicaba el chip "Todo" de canales del top → confusión reportada
    // por owner 19-ago). Solo toggles ortogonales: "Sin leer" (y "Notifs" si hay).
    const base: { key: typeof filter; label: string }[] = [];
    if (items.some((it) => (it.unreadCount ?? 0) > 0 || !it.isRead)) base.push({ key: 'unread', label: 'Sin leer' });
    if (kinds.has('notifications')) base.push({ key: 'notifications', label: 'Notifs' });
    return base;
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (filter === 'unread') {
      list = list.filter((it) => (it.unreadCount ?? 0) > 0 || !it.isRead);
    } else if (filter === 'notifications') {
      list = list.filter((it) => it.kind === 'notification');
    } else if (filter !== 'all') {
      list = list.filter((it) => it.kind !== 'notification' && it.channelKind === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (it) => it.name.toLowerCase().includes(q) || (it.preview ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, items, search]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--b-surface)]">
      {/* Buscador y "Sin leer" en la MISMA fila (17-09). Eran dos, con el chip solo en la
          segunda, y entre la pestaña y la primera conversación se apilaban seis bloques con
          borde propio: 340px de cabecera para una lista de 64px por fila. */}
      <div className="flex items-center gap-1.5 border-b border-[var(--b-border)] px-3 py-1.5">
        <input
          className="min-w-0 flex-1 rounded-md border border-[var(--b-border)] bg-[var(--b-surface-2)] px-2.5 py-1.5 text-xs placeholder:text-[var(--b-text-3)] focus:border-blue-400 focus:bg-[var(--b-surface)] focus:outline-none"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          type="text"
          value={search}
        />
        {availableFilters.map((t) => (
          <button
            className={`flex-none rounded-full px-2 py-1 text-[10px] font-medium transition-colors ${
              filter === t.key ? 'text-white' : 'bg-[var(--b-surface-2)] text-[var(--b-text-3)] hover:bg-gray-200'
            }`}
            key={t.key}
            onClick={() => setFilter(filter === t.key ? 'all' : t.key)}
            style={filter === t.key ? { backgroundColor: brand.brand } : undefined}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <FeedSkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="text-5xl">💬</span>
            <div>
              <p className="font-medium text-[var(--b-text-2)]">Sin resultados</p>
              <p className="mt-1 text-sm text-[var(--b-text-3)]">Prueba otro filtro o cambia la búsqueda</p>
            </div>
            {/* Gate N29 (QA 14-09) */}
            {canManage && (
              <button
                className="mt-2 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                onClick={() => router.push('/settings/integrations')}
                type="button"
              >
                Conectar canal
              </button>
            )}
            {/* QA 31-ago: el CTA no decía QUÉ se puede conectar → contexto en una línea. */}
            <p className="text-xs text-[var(--b-text-3)]">
              WhatsApp, Instagram, Facebook, Telegram, correo o chat web
            </p>
          </div>
        ) : groupBy && groups ? (
          // Vista "Esperan respuesta" agrupada por dominio (no virtualizado: los no-leídos
          // son un nº acotado). Restaura la categorización de la antigua /pendientes.
          <div className="h-full overflow-auto">
            {groups.map((g) => {
              const groupItems = filteredItems.filter((it) => groupBy(it) === g.key);
              if (groupItems.length === 0) return null;
              return (
                <div key={g.key}>
                  <div
                    className="sticky top-0 z-[1] flex items-center gap-2 border-b border-[var(--b-border)] bg-[var(--b-surface-2)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: g.color }}
                  >
                    <span aria-hidden="true">{g.icon}</span>
                    <span>{g.label}</span>
                    <span className="text-[var(--b-text-3)]">{groupItems.length}</span>
                  </div>
                  {groupItems.map((it) => (
                    <FeedItemRow item={it} key={it.id} onClick={() => onItemClick(it)} />
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <Virtuoso
            computeItemKey={(_, item) => item.id}
            data={filteredItems}
            itemContent={(_, item) => (
              <FeedItemRow item={item} onClick={() => onItemClick(item)} />
            )}
            style={{ height: '100%' }}
          />
        )}
      </div>
    </div>
  );
}
