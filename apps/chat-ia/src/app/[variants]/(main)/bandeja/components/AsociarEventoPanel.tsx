'use client';

import { useEffect, useState } from 'react';

import { getEventosByUsuario, type Evento } from '@/services/mcpApi/eventos';
import { linkConversationToEvent } from '@/services/mcpApi/whatsapp';
import { useUserStore } from '@/store/user';

/**
 * "Asociar a un evento" — el eslabón que hacía falta.
 *
 * POR QUÉ EXISTE
 * Los paneles Próximo / Agendar / Responsable solo aparecen cuando la conversación tiene
 * un evento vinculado, y medido el 30-ago NINGUNA de las 100 conversaciones lo tenía. El
 * backend sabe vincular (linkConversationToEvent) pero el front no lo pedía desde ningún
 * sitio. Sin este botón, todo el "puesto de trabajo" queda invisible.
 *
 * NO se impone automáticamente: un lead pidiendo información aún no es una boda. Vincular
 * es una decisión del usuario. Y un contacto puede tener varias bodas, así que se elige
 * cuál — no se adivina.
 *
 * Se muestra SOLO cuando la conversación no tiene evento. Si ya lo tiene, aparecen los
 * paneles del evento en su lugar.
 */

interface Props {
  conversationId: string;
  development: string;
  /** Se llama tras vincular con éxito, para que la conversación recargue con su evento. */
  onLinked?: () => void;
}

export function AsociarEventoPanel({ conversationId, development, onLinked }: Props) {
  // usuario_id en api-mcp = email del usuario (mismo identificador que acepta getEventosByUsuario).
  const userId = useUserStore((s) => s.user?.email ?? null);
  const [abierto, setAbierto] = useState(false);
  const [eventos, setEventos] = useState<Evento[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [vinculando, setVinculando] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    if (!abierto || eventos !== null || !userId) return;
    setCargando(true);
    getEventosByUsuario(development, String(userId), { limit: 100 })
      .then((evs) => setEventos(evs))
      .catch(() => setFallo('No se pudieron cargar tus eventos.'))
      .finally(() => setCargando(false));
  }, [abierto, eventos, userId, development]);

  const asociar = async (eventId: string) => {
    setVinculando(eventId);
    setFallo(null);
    const ok = await linkConversationToEvent(conversationId, eventId).catch(() => false);
    setVinculando(null);
    if (!ok) {
      // El fallo se dice: si la interfaz da por asociado algo que no lo está, el usuario
      // buscaría el contexto de esta boda y no lo encontraría.
      setFallo('No se pudo asociar. Vuelve a intentarlo.');
      return;
    }
    setAbierto(false);
    onLinked?.();
  };

  const lista = (eventos ?? []).filter((e) =>
    (e.nombre ?? '').toLowerCase().includes(filtro.trim().toLowerCase()),
  );

  return (
    <div className="border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Evento</h3>
        <button
          className="text-xs font-medium text-blue-600 hover:underline"
          onClick={() => {
            setAbierto((v) => !v);
            setFallo(null);
          }}
          type="button"
        >
          {abierto ? 'Cerrar' : '+ Asociar a un evento'}
        </button>
      </div>

      {!abierto && (
        <p className="mt-1 text-xs text-gray-400">
          Sin boda asociada. Asóciala para ver su itinerario y agendar aquí.
        </p>
      )}

      {abierto && (
        <div className="mt-2 space-y-2">
          <input
            aria-label="Buscar evento"
            className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar boda…"
            value={filtro}
          />
          {fallo && <p className="text-xs text-red-600">{fallo}</p>}
          {cargando && <p className="text-xs text-gray-400">Cargando tus eventos…</p>}
          {eventos !== null && lista.length === 0 && !cargando && (
            <p className="text-xs text-gray-400">
              {eventos.length === 0 ? 'No tienes eventos.' : 'Ninguno coincide.'}
            </p>
          )}
          <ul className="max-h-52 space-y-1 overflow-auto">
            {lista.map((e) => (
              <li key={e._id}>
                <button
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                  disabled={vinculando !== null}
                  onClick={() => asociar(e._id)}
                  type="button"
                >
                  <span className="min-w-0 flex-1 truncate">{e.nombre || 'Sin nombre'}</span>
                  {vinculando === e._id ? (
                    <span className="ml-2 text-xs text-gray-400">Asociando…</span>
                  ) : (
                    e.fecha && (
                      <span className="ml-2 flex-none text-xs text-gray-400">
                        {String(e.fecha).slice(0, 10)}
                      </span>
                    )
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
