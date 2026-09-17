'use client';

import { useEffect, useState } from 'react';

import {
  getConversationIaLevel,
  saveConversationIaLevel,
  type IaLevel,
  type IaLevelSource,
} from '../data/iaConfig';

/**
 * IaModeControl — en qué modo trabaja la IA en ESTA conversación, y cambiarlo sin entrar.
 *
 * api-ia resuelve el modo en cascada: la conversación puede tener el suyo propio
 * (`source: 'conversation'`) o heredar el de la marca (`source: 'workspace'`). La diferencia
 * importa para quien atiende: no es lo mismo "esta conversación responde sola" que "toda la
 * bandeja responde sola", y hasta ahora la interfaz no distinguía ninguna de las dos.
 *
 * "Hereda" no es un modo más: es borrar el override y volver al de la bandeja. Está en la
 * lista porque sin él no habría forma de deshacer un cambio sin adivinar cuál es el global.
 */

const OPCIONES: Array<{ etiqueta: string; titulo: string; valor: IaLevel | 'inherit' }> = [
  { etiqueta: 'Manual', titulo: 'La IA no interviene: escribes tú', valor: 'manual' },
  { etiqueta: 'Copiloto', titulo: 'La IA propone respuesta y tú apruebas', valor: 'copilot' },
  { etiqueta: 'Automático', titulo: 'La IA responde sola si tiene confianza suficiente', valor: 'autopilot' },
  { etiqueta: 'Hereda', titulo: 'Usa el modo de la bandeja', valor: 'inherit' },
];

const CORTO: Record<IaLevel, string> = {
  autopilot: 'Auto',
  copilot: 'Copiloto',
  manual: 'Manual',
};

interface IaModeControlProps {
  conversationId: string;
  development: string;
}

export function IaModeControl({ conversationId, development }: IaModeControlProps) {
  const [level, setLevel] = useState<IaLevel | null>(null);
  const [source, setSource] = useState<IaLevelSource>('workspace');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    void getConversationIaLevel(conversationId, development).then((r) => {
      if (cancelado || !r) return;
      setLevel(r.level);
      setSource(r.source);
    });
    return () => {
      cancelado = true;
    };
  }, [conversationId, development]);

  // Mientras no se sepa el modo, no se pinta nada: inventar "Manual" por defecto haría creer
  // que la IA está apagada en conversaciones donde está respondiendo sola.
  if (!level) return null;

  const cambiar = async (valor: string) => {
    const anterior = { level, source };
    const nuevo = valor === 'inherit' ? null : (valor as IaLevel);
    setGuardando(true);
    if (nuevo) {
      setLevel(nuevo);
      setSource('conversation');
    }
    const ok = await saveConversationIaLevel(conversationId, development, nuevo);
    if (!ok) {
      setLevel(anterior.level);
      setSource(anterior.source);
      // Las conversaciones de WhatsApp viven en api-mcp y api-ia resuelve esta ruta contra su
      // Redis: hoy devuelven 404 y no admiten modo propio. Se dice, en vez de dejar que
      // parezca que se guardó.
      setAviso('Esta conversación todavía no admite un modo propio: usa el de la bandeja.');
      setTimeout(() => setAviso(null), 6000);
    } else if (!nuevo) {
      const r = await getConversationIaLevel(conversationId, development);
      if (r) {
        setLevel(r.level);
        setSource(r.source);
      }
    }
    setGuardando(false);
  };

  const propio = source === 'conversation';

  return (
    <>
      {aviso && (
        <span className="mr-1 text-[10px]" style={{ color: '#B45309' }} title={aviso}>
          no admite modo propio
        </span>
      )}
    <select
      aria-label="Modo de la IA en esta conversación"
      className="rounded-full border-0 px-1.5 py-0.5 text-[10px] font-medium"
      disabled={guardando}
      onChange={(e) => void cambiar(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      style={{
        // Con modo propio se marca; heredado va apagado para no dar a entender que
        // alguien lo configuró a mano en esta conversación.
        backgroundColor: propio ? '#ECFDF5' : 'transparent',
        color: propio ? '#047857' : '#9A9AA6',
        cursor: 'pointer',
      }}
      title={
        propio
          ? `IA en modo ${CORTO[level]} solo en esta conversación`
          : `Hereda el modo ${CORTO[level]} de la bandeja`
      }
      value={propio ? level : 'inherit'}
    >
      {OPCIONES.map((o) => (
        <option key={o.valor} title={o.titulo} value={o.valor}>
          {o.valor === 'inherit' ? `Bandeja (${CORTO[level]})` : o.etiqueta}
        </option>
      ))}
    </select>
    </>
  );
}
