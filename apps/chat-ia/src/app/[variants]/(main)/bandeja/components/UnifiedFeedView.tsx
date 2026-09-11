'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { FeedItem } from '../hooks/useUnifiedFeed';
import { useBandejaBrand } from '../utils/brand';

// ─── Config ──────────────────────────────────────────────────────────────────

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
const WA_TYPE_LABEL: Record<string, string> = {
  WAB: 'Meta API',
  WEB_QR: 'QR',
};

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
  const channelKey = item.channelKind as string;
  const cfg = FEED_CHANNEL_CONFIG[channelKey] ?? FEED_CHANNEL_CONFIG.web;
  const hasUnread = item.unreadCount > 0 || !item.isRead;
  // ISSUE-002 (dogfood 20-ago): items newsletter/broadcast (status de WhatsApp, canales
  // informativos) NO admiten respuesta — al abrirlos el composer solo deja "nota interna".
  // Antes parecían conversaciones WA normales en la lista → el operador abría a ciegas.
  // Tag "Informativo" en la fila para saberlo ANTES de abrir. (Solo se ven si el usuario
  // activa "Ver newsletters/estados"; por defecto están filtrados.)
  const isOneWay = item.jidType === 'newsletter' || item.jidType === 'broadcast';
  // Etiqueta de línea WhatsApp (QR / Meta API) — solo en WhatsApp y solo si el dato llega.
  const waType =
    item.channelKind === 'whatsapp' && item.channelType
      ? (WA_TYPE_LABEL[item.channelType] ?? item.channelType)
      : null;
  // #8: últimos dígitos de la LÍNEA receptora (distinguir 910 vs Meta por hilo).
  const waLine =
    item.channelKind === 'whatsapp' && item.lineLabel
      ? String(item.lineLabel).replace(/\D/g, '').slice(-4) || String(item.lineLabel)
      : '';

  let rowBg = 'bg-white hover:bg-gray-50';
  if (!item.isRead && item.kind === 'notification') rowBg = 'bg-pink-50/60 hover:bg-pink-50';
  else if (item.unreadCount > 0) rowBg = 'bg-green-50/50 hover:bg-green-50';

  const avatarBg =
    item.kind === 'notification' ? 'bg-gray-100' : 'bg-gray-200';

  return (
    <button
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${rowBg} border-b border-gray-100 last:border-0`}
      onClick={onClick}
      type="button"
    >
      {/* Avatar 38x38 con badge canal (bottom-LEFT) + RSVP (bottom-RIGHT)
          según FASE B v2.0 P-handoff Bandeja Diseño 24-jun. */}
      <div className="relative shrink-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${avatarBg} text-sm font-medium text-gray-600`}
        >
          {item.kind === 'notification' ? (
            <span className="text-base">{cfg.icon}</span>
          ) : (
            <span>{initials(item.name)}</span>
          )}
        </div>
        {/* Badge canal — bottom-LEFT, cuadrado 16x16 radius 4px */}
        {item.kind !== 'notification' && (
          <span
            aria-label={`Canal ${cfg.label}`}
            className={`absolute -bottom-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[9px] font-bold text-white ${cfg.bg}`}
          >
            {item.channelLabel ?? cfg.label}
          </span>
        )}
        {/* Badge RSVP — bottom-RIGHT, círculo 15x15. Solo cuando hay valor
            (rsvpStatus llega de api-mcp en modo Evento; undefined si no aplica). */}
        {item.rsvpStatus && (
          <span
            aria-label={`RSVP ${item.rsvpStatus}`}
            className="absolute -bottom-0.5 -right-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{
              backgroundColor:
                item.rsvpStatus === 'confirmed' ? '#22C55E' :
                item.rsvpStatus === 'pending' ? '#F59E0B' : '#F43F5E',
            }}
            title={
              item.rsvpStatus === 'confirmed' ? 'Confirmado' :
              item.rsvpStatus === 'pending' ? 'Pendiente' : 'Declinado'
            }
          >
            {item.rsvpStatus === 'confirmed' ? '✓' :
              item.rsvpStatus === 'pending' ? '⏳' : '✕'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${hasUnread ? 'font-semibold text-gray-900' : 'font-normal text-gray-700'}`}
          >
            {item.name}
          </span>
          {waType && (
            <span
              className="shrink-0 rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-semibold text-green-700"
              title={`WhatsApp · ${waType === 'QR' ? 'número vinculado por QR' : 'Meta Business API'}${item.lineLabel ? ` · línea ${item.lineLabel}` : ''}`}
            >
              {waType}{waLine ? ` ·${waLine}` : ''}
            </span>
          )}
          {isOneWay && (
            <span
              className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500"
              title="Canal informativo (newsletter/estado): no admite respuesta"
            >
              Informativo
            </span>
          )}
          <span className="shrink-0 text-xs text-gray-400">{timeAgo(item.timestamp)}</span>
        </div>
        <p className="truncate text-xs text-gray-500">{item.preview}</p>
        {/* FASE 2 Agentes (17-ago) — badge "responsable": qué AGENTE IA atiende esta
            conversación. Solo se pinta cuando backend expone assignedAgentName (null-safe,
            mismo patrón que el badge RSVP). Hoy queda dormido: 0 dead code, 0 fallback. */}
        {item.kind === 'conversation' && item.assignedAgentName && (
          <span
            aria-label={`Responsable: ${item.assignedAgentName}`}
            className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600"
          >
            <span aria-hidden="true">🤖</span>
            <span className="truncate">{item.assignedAgentName}</span>
          </span>
        )}
      </div>

      {/* Unread indicator */}
      {hasUnread && (
        <div className="shrink-0">
          {item.kind === 'notification' ? (
            <span className="block h-2 w-2 rounded-full bg-pink-500" />
          ) : (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </span>
          )}
        </div>
      )}
    </button>
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
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
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
  items: FeedItem[];
  loading: boolean;
  onItemClick: (item: FeedItem) => void;
  /** Vista "Esperan respuesta" (restaura la categorización de la antigua /pendientes,
   *  auditoría 20-ago): si se pasan groupBy+groups, renderiza secciones con cabecera por
   *  dominio (Mensajería/Servicios/Itinerario/Asistente/Otras) en vez de lista plana. */
  groupBy?: (item: FeedItem) => string;
  groups?: FeedGroup[];
}

// ─── Main component ──────────────────────────────────────────────────────────

export function UnifiedFeedView({ items, loading, onItemClick, groupBy, groups }: UnifiedFeedViewProps) {
  const brand = useBandejaBrand();
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
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header — SIN título "Bandeja" (la pestaña de arriba ya lo dice; evita el
          "dos bandejas" que reportó el owner 19-ago). Solo buscador + filtro sin-leer. */}
      <div className="border-b border-gray-100 px-4 py-2">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            type="text"
            value={search}
          />
        </div>
        {availableFilters.length > 0 && (
          <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
            {availableFilters.map((t) => (
              <button
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  filter === t.key ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <FeedSkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="text-5xl">💬</span>
            <div>
              <p className="font-medium text-gray-700">Sin resultados</p>
              <p className="mt-1 text-sm text-gray-400">Prueba otro filtro o cambia la búsqueda</p>
            </div>
            <button
              className="mt-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
              onClick={() => router.push('/settings/integrations')}
              type="button"
            >
              Conectar canal
            </button>
            {/* QA 31-ago: el CTA no decía QUÉ se puede conectar → contexto en una línea. */}
            <p className="text-xs text-gray-400">
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
                    className="sticky top-0 z-[1] flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: g.color }}
                  >
                    <span aria-hidden="true">{g.icon}</span>
                    <span>{g.label}</span>
                    <span className="text-gray-400">{groupItems.length}</span>
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
