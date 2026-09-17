'use client';

import type { FeedItem } from '../hooks/useUnifiedFeed';
import { previewText } from '../utils/preview';
import { IA_MODES } from './RowIndicators';

/**
 * InboxOverview — el panel central de la bandeja cuando no hay conversación abierta.
 *
 * Antes decía «Bandeja unificada · Mensajes y notificaciones en un solo sitio» sobre tres
 * botones, uno de ellos "Conectar WhatsApp" con WhatsApp ya conectado y noventa
 * conversaciones al lado. Owner 17-09: «la pantalla central no se entiende, no aporta valor,
 * debemos ser más ingeniosos». Es la mitad de la pantalla explicando el nombre del producto.
 *
 * El color de marca va en clases (`bg-brand`, `text-brand`), no con el hook: los tokens de
 * tailwind.css ya derivan del color del tenant, se leen en el markup y no obligan a montar un
 * hook para pintar un botón. Acuerdo con el otro frente, 17-09.
 *
 * Lo que sí hace falta ahí es la respuesta a "¿por dónde empiezo?": cuántas esperan, cuáles
 * son las más antiguas sin contestar —lo más antiguo sin responder es lo que más quema— y un
 * atajo para abrirlas. Todo sale de lo que la lista ya tiene en memoria: cero peticiones.
 */

const horas = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

function haceCuanto(iso: string): string {
  const h = horas(iso);
  if (h < 1) return `hace ${Math.max(1, Math.round(h * 60))} min`;
  if (h < 24) return `hace ${Math.round(h)} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

interface InboxOverviewProps {
  canManage: boolean;
  items: FeedItem[];
  onConnectOther: () => void;
  onConnectWhatsApp: () => void;
  onItemClick: (item: FeedItem) => void;
  onNewMessage: () => void;
}

export function InboxOverview({
  canManage,
  items,
  onConnectOther,
  onConnectWhatsApp,
  onItemClick,
  onNewMessage,
}: InboxOverviewProps) {
  const conversaciones = items.filter((i) => i.kind === 'conversation');
  const esperan = conversaciones
    .filter((i) => (i.unreadCount ?? 0) > 0 || !i.isRead)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const masAntigua = esperan[0] ? horas(esperan[0].timestamp) : 0;
  const lista = (esperan.length > 0 ? esperan : conversaciones).slice(0, 4);

  // Sin nada conectado: aquí sí toca invitar a conectar, que es lo único que se puede hacer.
  if (conversaciones.length === 0) {
    return (
      <div className="max-w-md">
        <div className="text-4xl">💬</div>
        <div className="mt-3 text-sm font-semibold text-gray-800">Aún no hay conversaciones</div>
        <div className="mt-1 text-xs text-gray-500">
          Conecta un canal y los mensajes de tus clientes llegarán aquí, todos juntos.
        </div>
        {canManage ? (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
              onClick={onConnectWhatsApp}
              type="button"
            >
              Conectar WhatsApp
            </button>
            <button
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold"
              onClick={onConnectOther}
              // A4 (QA 6-ago): color inline evita texto invisible en tema oscuro.
              style={{ color: '#374151' }}
              title="Instagram, Facebook, Telegram, correo o chat web"
              type="button"
            >
              Conectar otro canal
            </button>
          </div>
        ) : (
          <div className="mt-4 text-xs text-gray-400">
            Contacta con soporte para activar la mensajería de tu evento.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md text-left">
      <div className="text-center">
        {esperan.length > 0 ? (
          <>
            <div className="text-[32px] font-bold leading-none text-brand">
              {esperan.length}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-800">
              {esperan.length === 1 ? 'conversación espera respuesta' : 'conversaciones esperan respuesta'}
            </div>
            {masAntigua >= 24 && (
              <div className="mt-1 text-xs" style={{ color: '#B45309' }}>
                La más antigua lleva {haceCuanto(esperan[0].timestamp).replace('hace ', '')} sin contestar
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-4xl">✅</div>
            <div className="mt-2 text-sm font-semibold text-gray-800">Todo contestado</div>
            <div className="mt-1 text-xs text-gray-500">
              No queda ningún mensaje sin responder.
            </div>
          </>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {esperan.length > 0 ? 'Empieza por aquí' : 'Últimas conversaciones'}
        </div>
        {lista.map((it) => (
          <button
            className="flex w-full items-center gap-2 border-b border-gray-50 px-3 py-2 text-left last:border-0 hover:bg-gray-50"
            key={it.id}
            onClick={() => onItemClick(it)}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-gray-800">
                {it.name}
              </span>
              <span className="block truncate text-[11px] text-gray-500">
                {previewText(it.preview)}
              </span>
            </span>
            <span className="flex-none text-[11px] text-gray-400">{haceCuanto(it.timestamp)}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
          onClick={onNewMessage}
          type="button"
        >
          ✍️ Nuevo mensaje
        </button>
      </div>

      {/* Qué significan los iconos de la lista. Van aquí porque es el sitio donde sobra
          espacio, y porque un icono que hay que adivinar no sirve de nada. */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
        <span>En la lista:</span>
        <span title="Con cuánta gente del equipo está compartida">👥 acceso</span>
        {(Object.keys(IA_MODES) as Array<keyof typeof IA_MODES>).map((k) => (
          <span key={k} title={IA_MODES[k].que}>
            {IA_MODES[k].icono} {IA_MODES[k].nombre.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
