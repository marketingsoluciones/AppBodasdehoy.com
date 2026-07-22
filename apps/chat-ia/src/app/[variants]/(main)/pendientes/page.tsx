'use client';

/**
 * /pendientes — Vista unificada "Pendientes para mí".
 *
 * Agrupa los 4 sistemas de actividad del producto:
 *   1. Mensajería externa (WhatsApp/Telegram/IG/FB/Email/Web chat)
 *   2. Chat IA (menciones, errores, tasks completadas)
 *   3. Comentarios en Servicios (appEventos)
 *   4. Comentarios en Itinerario (appEventos)
 *
 * Hoy lee del useBandejaStore que ya unifica conversations + notifications.
 * Cuando api-mcp emita notifications type='service_comment' /
 * 'itinerary_comment' aparecerán aquí automáticamente.
 *
 * Diseño: lista plana ordenada por timestamp desc, badges por tipo,
 * click → navega al origen (conversación, tarea, ítem itinerario).
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useBandejaStore } from '@/store/bandeja';

import { buildHeaders } from '../bandeja/utils/auth';

const SECTION_META: Record<
  string,
  { color: string; icon: string; label: string }
> = {
  conversation_externa: {
    color: '#22C55E',
    icon: '💬',
    label: 'Mensajería',
  },
  chat_ia: { color: '#A855F7', icon: '🤖', label: 'Chat IA' },
  service_comment: { color: '#F59E0B', icon: '📋', label: 'Servicios' },
  itinerary_comment: { color: '#3B82F6', icon: '📅', label: 'Itinerario' },
  notification_otra: { color: '#6B7280', icon: '🔔', label: 'Otras' },
};

type SectionKey = keyof typeof SECTION_META;

interface PendingItem {
  id: string;
  section: SectionKey;
  title: string;
  preview: string;
  timestamp: string;
  unreadCount: number;
  url?: string;
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function classifyNotification(type: string | undefined): SectionKey {
  if (!type) return 'notification_otra';
  if (type === 'whatsapp_message') return 'conversation_externa';
  if (type.startsWith('service_') || type === 'task_reminder')
    return 'service_comment';
  if (type.startsWith('itinerary_')) return 'itinerary_comment';
  if (type.startsWith('chat_ia') || type === 'agent_completed') return 'chat_ia';
  return 'notification_otra';
}

export default function PendientesPage() {
  const router = useRouter();
  const conversations = useBandejaStore((s) => Object.values(s.conversations));
  const notifications = useBandejaStore((s) => s.notifications);
  const unreadCounts = useBandejaStore((s) => s.unreadCounts);
  const initBandeja = useBandejaStore((s) => s.initBandeja);
  const destroyBandeja = useBandejaStore((s) => s.destroyBandeja);

  // BUG QA 14-jul: /pendientes salía "en blanco" (empty state "¡Sin pendientes!")
  // porque el store bandeja solo se inicializa desde messages/layout.tsx, y esta
  // ruta no está bajo ese layout — nadie llamaba initBandeja, así que
  // conversations/notifications estaban vacías siempre. Inicializar aquí también
  // (idempotente: initBandeja se auto-cierra si ya hay SSE viva).
  const { checkAuth, isGuest } = useAuthCheck();
  useEffect(() => {
    if (isGuest) return;
    const { development } = checkAuth();
    const dev = development || 'bodasdehoy';
    void initBandeja(dev, () => buildHeaders());
    return () => {
      destroyBandeja();
    };
  }, [isGuest, checkAuth, initBandeja, destroyBandeja]);

  const items: PendingItem[] = useMemo(() => {
    const convItems: PendingItem[] = conversations
      .filter((c) => c.unreadCount > 0)
      .map((c) => ({
        id: `conv-${c.id}`,
        preview: c.lastMessage,
        section: 'conversation_externa',
        timestamp: c.lastMessageAt,
        title: c.name,
        unreadCount: c.unreadCount,
        url: c.channelParam
          ? `/bandeja/${encodeURIComponent(c.channelParam)}/${encodeURIComponent(c.conversationId)}`
          : '/bandeja',
      }));

    const notifItems: PendingItem[] = notifications
      .filter((n) => !n.read)
      .map((n) => ({
        id: `notif-${n.id}`,
        preview: n.message,
        section: classifyNotification(n.type),
        timestamp: n.createdAt,
        title: n.type ?? 'Notificación',
        unreadCount: 1,
        url: n.focused ? n.focused.split('?')[0] : undefined,
      }));

    return [...convItems, ...notifItems].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
  }, [conversations, notifications]);

  // Agrupar por sección para mostrar contadores
  const bySection: Record<SectionKey, PendingItem[]> = items.reduce(
    (acc, item) => {
      (acc[item.section] ??= []).push(item);
      return acc;
    },
    {} as Record<SectionKey, PendingItem[]>,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Pendientes para ti</h1>
        <p className="mt-1 text-xs text-gray-500">
          Todo lo que requiere tu atención — mensajería, comentarios en servicios y
          itinerario, y notificaciones del asistente.
        </p>
      </div>

      {/* Resumen por sección */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-100 px-6 py-3">
        {(Object.keys(SECTION_META) as SectionKey[]).map((key) => {
          const meta = SECTION_META[key];
          const count = bySection[key]?.length ?? 0;
          return (
            <div
              key={key}
              className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs"
              style={{ background: count > 0 ? `${meta.color}10` : '#fafafa' }}
            >
              <span style={{ fontSize: 16 }}>{meta.icon}</span>
              <span className="font-medium text-gray-700">{meta.label}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: count > 0 ? meta.color : '#d1d5db' }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Lista plana */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="text-5xl">✨</div>
            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              ¡Sin pendientes!
            </h2>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Cuando llegue un mensaje nuevo, alguien comente en un servicio o ítem
              de itinerario, o el asistente termine una tarea, aparecerá aquí.
            </p>
            <Link
              href="/chat"
              className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Ir al asistente
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => {
              const meta = SECTION_META[item.section];
              return (
                <li key={item.id}>
                  <button
                    className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-gray-50"
                    onClick={() => {
                      if (item.url) router.push(item.url);
                    }}
                    type="button"
                  >
                    {/* Icon section */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                      style={{ background: `${meta.color}15`, color: meta.color }}
                    >
                      {meta.icon}
                    </div>

                    {/* Contenido */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-400">
                          {timeAgo(item.timestamp)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-gray-500">{item.preview}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: `${meta.color}15`, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        {item.unreadCount > 1 && (
                          <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {item.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer hint */}
      {items.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-2 text-center text-[11px] text-gray-400">
          {unreadCounts.total} mensajes sin leer · {unreadCounts.notifications}{' '}
          notificaciones
        </div>
      )}
    </div>
  );
}
