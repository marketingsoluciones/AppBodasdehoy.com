'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getConversationIaLevel,
  getIaLevel,
  saveConversationIaLevel,
  type IaLevel,
  type IaLevelSource,
} from '../data/iaConfig';
import { describeVisibility, type SharedPrincipal } from '../utils/visibility';

/**
 * RowIndicators — lo que hay que saber de una conversación ANTES de abrirla, en iconos.
 *
 * Owner 17-09, sobre el rediseño anterior: «dentro del recuadro ocupa mucho espacio, aporta
 * poco valor y si cambia el tamaño no se adapta […] no se ve un icono o algo que transmita
 * que es auto, o si es manual o copiloto». Tenía razón en las tres: un `<select>` de 90px
 * por fila, con el texto "Bandeja (Copiloto)", posicionado en absoluto (de ahí que al
 * estrechar la lista se montara encima del mensaje).
 *
 * Aquí son dos pastillas de 18px que caben en la línea del mensaje y no se rompen al
 * estrechar: quién tiene acceso (👥 con el número) y en qué modo trabaja la IA (⚡ sola,
 * 🤖 propone, ✋ ninguno). Ambas son accionables: la primera lleva a dar/quitar permiso, la
 * segunda abre el menú de modo. El texto sigue en el `title`, que es donde no ocupa.
 *
 * El modo que se pinta es el de la bandeja (una sola petición para toda la lista, no una por
 * fila) y se marca como heredado —apagado, sin fondo— hasta que se abre el menú, que es
 * cuando se consulta el de esa conversación. Mientras api-ia no devuelva `ia_level` dentro
 * del listado de conversaciones (petición P11), pintar el modo exacto de cada fila costaría
 * noventa llamadas al abrir la bandeja.
 */

export const IA_MODES: Record<IaLevel, { color: string; fondo: string; icono: string; nombre: string; que: string }> = {
  autopilot: {
    color: '#047857',
    fondo: '#ECFDF5',
    icono: '⚡',
    nombre: 'Automático',
    que: 'La IA responde sola cuando tiene confianza suficiente',
  },
  copilot: {
    color: '#4F46E5',
    fondo: '#EEF2FF',
    icono: '🤖',
    nombre: 'Copiloto',
    que: 'La IA propone la respuesta y tú la apruebas',
  },
  manual: {
    color: '#6B6B76',
    fondo: '#F4F4F6',
    icono: '✋',
    nombre: 'Manual',
    que: 'La IA no interviene: escribes tú',
  },
};

/** Nivel de la bandeja, una vez por marca y no por fila. */
const cacheMarca = new Map<string, Promise<IaLevel | null>>();
function nivelDeLaBandeja(development: string): Promise<IaLevel | null> {
  let p = cacheMarca.get(development);
  if (!p) {
    p = getIaLevel(development);
    cacheMarca.set(development, p);
  }
  return p;
}

const PASTILLA =
  'pointer-events-auto inline-flex h-[18px] flex-none items-center gap-0.5 rounded-full px-1 text-[10px] font-semibold leading-none transition-colors';

export function SharedBadge({
  onManage,
  sharedWith,
}: {
  onManage?: () => void;
  sharedWith: SharedPrincipal[] | null | undefined;
}) {
  const visibilidad = describeVisibility(sharedWith);
  const total = Array.isArray(sharedWith) ? sharedWith.length : 0;

  // Compartida: se ve siempre, con cuánta gente. Sin compartir: el icono aparece al pasar el
  // ratón (o al tabular). Pintarlo encendido en las noventa filas sería el ruido que se
  // quitó, pero no pintarlo nunca dejaba sin puerta para DAR acceso desde la lista. Y
  // "privada" no se dice porque sería falso: la bandeja es de equipo.
  return (
    <button
      aria-label={visibilidad ? visibilidad.title : 'Dar acceso a alguien del equipo'}
      className={`${PASTILLA} ${visibilidad ? '' : 'opacity-0 focus:opacity-100 group-hover:opacity-60'}`}
      onClick={(e) => {
        e.stopPropagation();
        onManage?.();
      }}
      style={
        visibilidad
          ? { backgroundColor: '#EEF2FF', color: '#4F46E5' }
          : { color: '#9A9AA6' }
      }
      title={
        visibilidad
          ? `${visibilidad.title}. Pulsa para gestionar el acceso.`
          : 'Nadie más del equipo la tiene asignada. Pulsa para dar acceso.'
      }
      type="button"
    >
      <span aria-hidden="true">👥</span>
      {visibilidad && <span>{total}</span>}
    </button>
  );
}

export function IaModeBadge({
  conversationId,
  development,
}: {
  conversationId: string;
  development: string;
}) {
  const [nivel, setNivel] = useState<IaLevel | null>(null);
  const [origen, setOrigen] = useState<IaLevelSource>('workspace');
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const caja = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelado = false;
    void nivelDeLaBandeja(development).then((l) => {
      if (!cancelado && l) setNivel(l);
    });
    return () => {
      cancelado = true;
    };
  }, [development]);

  // Al abrir el menú sí se consulta esta conversación: es el único momento en que la
  // diferencia entre "hereda" y "tiene el suyo" cambia lo que el usuario va a pulsar.
  const abrir = useCallback(() => {
    setAbierto(true);
    void getConversationIaLevel(conversationId, development).then((r) => {
      if (!r) return;
      setNivel(r.level);
      setOrigen(r.source);
    });
  }, [conversationId, development]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  // Mientras no se sepa el modo no se pinta: inventar "Manual" haría creer que la IA está
  // apagada en conversaciones donde está respondiendo sola.
  if (!nivel) return null;

  const modo = IA_MODES[nivel];
  const propio = origen === 'conversation';

  const cambiar = async (valor: IaLevel | null) => {
    const anterior = { nivel, origen };
    if (valor) {
      setNivel(valor);
      setOrigen('conversation');
    }
    setAbierto(false);
    const ok = await saveConversationIaLevel(conversationId, development, valor);
    if (!ok) {
      setNivel(anterior.nivel);
      setOrigen(anterior.origen);
      // Las conversaciones de WhatsApp viven en api-mcp y api-ia resuelve esta ruta contra su
      // Redis: hoy devuelven 404. Se dice, en vez de dejar que parezca que se guardó.
      setAviso('Esta conversación usa el modo de la bandeja');
      setTimeout(() => setAviso(null), 5000);
    } else if (!valor) {
      const r = await getConversationIaLevel(conversationId, development);
      if (r) {
        setNivel(r.level);
        setOrigen(r.source);
      }
    }
  };

  return (
    <div className="pointer-events-auto relative flex-none" ref={caja}>
      <button
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`IA en modo ${modo.nombre}${propio ? ' en esta conversación' : ' (heredado de la bandeja)'}`}
        className={PASTILLA}
        onClick={(e) => {
          e.stopPropagation();
          if (abierto) setAbierto(false);
          else abrir();
        }}
        style={{
          // Con modo propio va marcado; heredado, en gris y a media tinta, para que destaque
          // la fila que tiene algo distinto y no noventa iconos idénticos con el mismo peso.
          // El `color` no basta: un emoji se pinta con sus propios colores, de ahí el filtro.
          backgroundColor: propio ? modo.fondo : 'transparent',
          color: propio ? modo.color : '#9A9AA6',
          filter: propio ? undefined : 'grayscale(1)',
          opacity: propio ? 1 : 0.55,
        }}
        title={
          propio
            ? `${modo.nombre} solo en esta conversación. ${modo.que}. Pulsa para cambiarlo.`
            : `${modo.nombre}, heredado de la bandeja. ${modo.que}. Pulsa para cambiarlo.`
        }
        type="button"
      >
        <span aria-hidden="true">{modo.icono}</span>
      </button>

      {aviso && (
        <span
          className="absolute right-0 top-[20px] z-20 whitespace-nowrap rounded bg-amber-50 px-1.5 py-0.5 text-[10px]"
          style={{ color: '#B45309' }}
        >
          {aviso}
        </span>
      )}

      {abierto && (
        <div
          className="absolute right-0 top-[22px] z-30 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
          {(Object.keys(IA_MODES) as IaLevel[]).map((k) => {
            const m = IA_MODES[k];
            const activo = propio && nivel === k;
            return (
              <button
                className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left hover:bg-gray-50"
                key={k}
                onClick={() => void cambiar(k)}
                role="menuitem"
                type="button"
              >
                <span aria-hidden="true">{m.icono}</span>
                <span className="min-w-0">
                  <span
                    className="block text-[12px] font-semibold"
                    style={{ color: activo ? m.color : '#1C1C22' }}
                  >
                    {m.nombre}
                    {activo && ' ·'}
                  </span>
                  <span className="block text-[10px] leading-tight text-gray-500">{m.que}</span>
                </span>
              </button>
            );
          })}
          {propio && (
            <button
              className="mt-0.5 block w-full border-t border-gray-100 px-2.5 py-1.5 text-left text-[11px] text-gray-500 hover:bg-gray-50"
              onClick={() => void cambiar(null)}
              role="menuitem"
              type="button"
            >
              Usar el modo de la bandeja
            </button>
          )}
        </div>
      )}
    </div>
  );
}
