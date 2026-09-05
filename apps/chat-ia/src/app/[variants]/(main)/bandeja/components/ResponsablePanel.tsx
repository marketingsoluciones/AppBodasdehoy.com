'use client';

/**
 * "Responsable" — quién atiende esta conversación, desde cuándo y por qué.
 *
 * POR QUÉ EXISTE
 * Antes de dar más autonomía a la IA hay que poder auditarla. Hoy se puede asignar un agente,
 * pero no se ve en ningún sitio *cómo* llegó a estarlo: si alguien lo asignó a mano, si un
 * humano se lo quitó a la IA, o si lo cogió solo por una regla de canal.
 *
 * Para el dueño del negocio esa es la pregunta que decide si activa la automatización: "¿qué
 * está haciendo esto en mi nombre?". Sin respuesta visible, no la activa — y la función no
 * existe comercialmente aunque esté construida.
 *
 * NO INVENTA DATO NINGUNO. Los cuatro campos ya viajan en cada conversación desde api-ia
 * (assignedAgentId / assignedAgentName / assignedAt / assignmentSource, verificado en
 * messages_with_whitelabel_storage.py:79). Simplemente no se pintaban en ninguna parte.
 */

interface Props {
  /** ISO de cuándo se asignó. */
  assignedAt?: string | null;
  /** Nombre legible del responsable, si el backend lo resolvió. */
  assignedAgentName?: string | null;
  /** MANUAL (alguien lo asignó) · HANDOFF (traspaso desde la IA) · AUTO (regla de canal). */
  assignmentSource?: string | null;
}

/** Cómo llegó a ser responsable, en lenguaje de persona y no de sistema. */
const ORIGEN: Record<string, { detalle: string; etiqueta: string; tono: string }> = {
  AUTO: {
    detalle: 'Lo cogió automáticamente por una regla del canal.',
    etiqueta: 'Automático',
    tono: 'bg-blue-50 text-blue-700',
  },
  HANDOFF: {
    detalle: 'Pasó de la IA a una persona.',
    etiqueta: 'Traspaso',
    tono: 'bg-amber-50 text-amber-700',
  },
  MANUAL: {
    detalle: 'Alguien lo asignó a mano.',
    etiqueta: 'Asignado a mano',
    tono: 'bg-gray-100 text-gray-700',
  },
};

function desdeCuando(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.round(h / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}

export function ResponsablePanel({ assignedAgentName, assignedAt, assignmentSource }: Props) {
  // Sin responsable no hay nada que auditar. Y decir "sin asignar" aquí sería ruido: eso
  // ya lo dice el selector de la cabecera.
  if (!assignedAgentName && !assignmentSource) return null;

  const origen = assignmentSource ? ORIGEN[assignmentSource.toUpperCase()] : null;
  const cuando = desdeCuando(assignedAt);

  return (
    <div className="border-b border-gray-100 px-4 py-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
        Responsable
      </h3>

      <p className="text-sm text-gray-800">{assignedAgentName || 'Sin nombre'}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {origen && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${origen.tono}`}>
            {origen.etiqueta}
          </span>
        )}
        {cuando && <span className="text-xs text-gray-400">{cuando}</span>}
      </div>

      {origen && <p className="mt-1.5 text-xs text-gray-500">{origen.detalle}</p>}

      {/* Origen desconocido: se dice, no se disimula. Si api-ia empieza a mandar un valor
          nuevo, es mejor verlo aquí que fingir que no existe. */}
      {assignmentSource && !origen && (
        <p className="mt-1.5 text-xs text-gray-500">Origen: {assignmentSource}</p>
      )}
    </div>
  );
}
