import type { FC } from 'react';
import type { TaskCardProps } from './types';

function formatDate(raw?: string | Date): string | null {
  if (!raw) return null;
  const d = typeof raw === 'string' ? new Date(raw) : raw;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function statusLabel(task: TaskCardProps['task']): { label: string; dark: string; light: string } {
  if (task.completada || task.estado === 'completed') {
    return { label: 'Completada', dark: 'bg-green-900/40 text-green-400', light: 'bg-green-100 text-green-700' };
  }
  if (task.estatus === false) {
    return { label: 'Bloqueada', dark: 'bg-red-900/40 text-red-400', light: 'bg-red-100 text-red-700' };
  }
  return { label: 'Pendiente', dark: 'bg-orange-900/40 text-orange-400', light: 'bg-amber-100 text-amber-700' };
}

function priorityBadge(prioridad?: string): { label: string; dark: string; light: string } | null {
  if (!prioridad) return null;
  const map: Record<string, { label: string; dark: string; light: string }> = {
    alta: { label: 'Alta', dark: 'bg-red-900/40 text-red-400', light: 'bg-red-100 text-red-700' },
    media: { label: 'Media', dark: 'bg-yellow-900/40 text-yellow-400', light: 'bg-yellow-100 text-yellow-700' },
    baja: { label: 'Baja', dark: 'bg-blue-900/40 text-blue-400', light: 'bg-blue-100 text-blue-700' },
  };
  return map[prioridad] ?? null;
}

/**
 * TaskCard — componente compartido (appEventos + chat-ia).
 *
 * Ficha de tarea puramente presentacional: sin contextos de auth/event,
 * sin lógica de API. Los callbacks de acción son opcionales.
 *
 * theme='light'  → estética appEventos (fondo blanco, borde rosa)
 * theme='dark'   → estética chat-ia LobeChat (zinc oscuro, borde púrpura)
 */
export const TaskCard: FC<TaskCardProps> = ({
  task,
  itinerarioTitle,
  theme = 'light',
  onComplete,
  onEdit,
  onOpenInApp,
}) => {
  const isDark = theme === 'dark';
  const dateLabel = formatDate(task.fecha);
  const status = statusLabel(task);
  const prio = priorityBadge(task.prioridad);

  const card = isDark
    ? 'relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700 border-l-4 border-l-violet-600'
    : 'relative overflow-hidden rounded-xl bg-white shadow-md ring-2 ring-pink-400';

  const titleColor = isDark ? 'text-zinc-100' : 'text-gray-900';
  const metaColor = isDark ? 'text-zinc-400' : 'text-gray-400';
  const divider = isDark ? 'bg-zinc-700' : 'bg-gray-100';
  const tagBg = isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600';
  const btnBase = isDark
    ? 'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors'
    : 'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors';
  const btnComplete = isDark
    ? `${btnBase} bg-violet-700/30 text-violet-300 hover:bg-violet-700/50`
    : `${btnBase} bg-green-50 text-green-700 hover:bg-green-100`;
  const btnEdit = isDark
    ? `${btnBase} bg-zinc-800 text-zinc-300 hover:bg-zinc-700`
    : `${btnBase} bg-gray-50 text-gray-600 hover:bg-gray-100`;
  const btnOpen = isDark
    ? `${btnBase} bg-zinc-800 text-zinc-400 hover:bg-zinc-700`
    : `${btnBase} bg-gray-50 text-gray-500 hover:bg-gray-100`;

  return (
    <div className={card}>
      <div className="px-5 py-4">
        {/* Title row */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-lg">{task.icon ?? '📋'}</span>
            <h3 className={`font-semibold leading-snug ${titleColor}`}>{task.descripcion}</h3>
          </div>
          {/* Status badge */}
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${isDark ? status.dark : status.light}`}>
            {status.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {dateLabel && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-pink-50 text-pink-700'}`}>
              🕐 {dateLabel}
            </span>
          )}
          {task.responsable && task.responsable.length > 0 && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-600'}`}>
              👤 {task.responsable.length === 1 ? '1 asignado' : `${task.responsable.length} asignados`}
            </span>
          )}
          {prio && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isDark ? prio.dark : prio.light}`}>
              ⚡ {prio.label}
            </span>
          )}
          {itinerarioTitle && (
            <span className={`text-xs ${metaColor}`}>{itinerarioTitle}</span>
          )}
        </div>

        {/* Divider */}
        <div className={`h-px mb-3 ${divider}`} />

        {/* Description */}
        {task.tips && (
          <p className={`mb-3 text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
            {task.tips}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span className={`rounded-full px-2 py-0.5 text-xs ${tagBg}`} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {(onComplete || onEdit || onOpenInApp) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {onComplete && (
              <button className={btnComplete} onClick={onComplete} type="button">
                ✓ Completar
              </button>
            )}
            {onEdit && (
              <button className={btnEdit} onClick={onEdit} type="button">
                ✎ Editar
              </button>
            )}
            {onOpenInApp && (
              <button className={btnOpen} onClick={onOpenInApp} type="button">
                ↗ Ver en app
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export type { TaskCardData, TaskCardProps } from './types';
