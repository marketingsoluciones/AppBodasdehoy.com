import { FC } from 'react';

import { useConversacionesDeEvento } from '../../hooks/useConversacionesDeEvento';

/**
 * "Conversaciones de esta boda" — la otra mitad del puente, en la ficha del evento.
 *
 * Muestra las conversaciones de WhatsApp/multicanal que se han asociado a este evento (con el
 * botón "Asociar a un evento" de la bandeja en chat-ia), y al pulsar una salta a chat-dev
 * abierta en ese hilo. Del cliente al mensaje; el reflejo del "del mensaje al cliente" que ya
 * existe dentro de la conversación.
 *
 * No reimplementa la bandeja: enlaza a ella.
 */

interface Props {
  development?: string;
  eventId: string | null | undefined;
}

// chat-dev/chat-prod según entorno. Se puede sobreescribir por env.
function chatBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CHAT_URL) {
    return String(process.env.NEXT_PUBLIC_CHAT_URL).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('-dev')) {
    return 'https://chat-dev.bodasdehoy.com';
  }
  return 'https://chat.bodasdehoy.com';
}

function cuando(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dias = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return d.toLocaleDateString();
}

export const ConversacionesEvento: FC<Props> = ({ eventId, development = 'bodasdehoy' }) => {
  const { conversaciones, error, loading } = useConversacionesDeEvento(eventId, development);

  if (!eventId) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Conversaciones de esta boda</h3>
        {conversaciones.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {conversaciones.length}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Cargando…</p>}

      {/* El error se dice; no se disfraza de "sin conversaciones". */}
      {error && !loading && (
        <p className="text-sm text-red-600">No se pudieron cargar las conversaciones.</p>
      )}

      {!loading && !error && conversaciones.length === 0 && (
        <p className="text-sm text-gray-400">
          Aún no hay conversaciones asociadas. Desde la bandeja, en una conversación con esta
          pareja, pulsa «Asociar a un evento» y aparecerá aquí.
        </p>
      )}

      <ul className="space-y-1.5">
        {conversaciones.map((c) => {
          const href = `${chatBaseUrl()}/bandeja/${encodeURIComponent(c.canalParam)}/${encodeURIComponent(c.id)}`;
          return (
            <li key={c.id}>
              <a
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
                href={href}
                rel="noreferrer"
                target="_blank"
              >
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-xs font-semibold text-white">
                  {(c.contactName || '?')
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-800">
                      {c.contactName}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="flex-none rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </span>

                </span>
                <span className="flex-none text-[11px] text-gray-400">
                  {cuando(c.lastMessageAt)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
