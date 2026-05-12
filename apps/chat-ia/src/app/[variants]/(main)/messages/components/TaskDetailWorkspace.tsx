'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { TaskCard } from '@bodasdehoy/shared/components';
import { completeTask } from '@/services/mcpApi/tasks';
import { useChatStore } from '@/store/chat';
import { useEventData } from '../hooks/useEventData';
import type { Tarea, Itinerario } from '../hooks/useEventData';

// ─── helpers ──────────────────────────────────────────────────────────────────

function findTask(
  data: any,
  taskId: string,
): { itinerario: Itinerario, itinerarioId: string; itinerarioTitle: string; tarea: Tarea; } | null {
  if (!data?.itinerarios_array) return null;
  for (const it of data.itinerarios_array) {
    for (const t of it.tasks ?? []) {
      if (t._id === taskId) {
        return {
          itinerario: it,
          itinerarioId: it._id ?? '',
          itinerarioTitle: it.title ?? 'Itinerario',
          tarea: t,
        };
      }
    }
  }
  return null;
}

function formatDueDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / 86_400_000);

  const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  if (diffDays < 0) return `Vencida (${formatted})`;
  if (diffDays === 0) return `Hoy (${formatted})`;
  if (diffDays === 1) return `Mañana (${formatted})`;
  if (diffDays <= 7) return `En ${diffDays} días (${formatted})`;
  return formatted;
}

function getDueDateColor(dateStr: string | undefined): string {
  if (!dateStr) return 'text-zinc-500';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return 'text-red-400';
  if (diff < 86_400_000) return 'text-orange-400';
  if (diff < 3 * 86_400_000) return 'text-yellow-400';
  return 'text-zinc-400';
}

// ─── inline input (stays here — chat-ia specific) ─────────────────────────────

function TaskInput({ tarea, itinerarioTitle }: { itinerarioTitle: string, tarea: Tarea; }) {
  const [text, setText] = useState('');
  const router = useRouter();
  const sendMessage = useChatStore((s) => s.sendMessage);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    const contextPrefix = `[Tarea: "${tarea.descripcion}" · ${itinerarioTitle}]\n\n`;
    await sendMessage({ message: contextPrefix + trimmed });
    router.push('/chat');
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Escribe un comentario o pregunta sobre esta tarea..."
        rows={1}
        value={text}
      />
      <button
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
        disabled={!text.trim()}
        onClick={handleSend}
        type="button"
      >
        ↑
      </button>
    </div>
  );
}

// ─── progress bar ──────────────────────────────────────────────────────────────

function ItineraryProgress({ itinerario }: { itinerario: Itinerario }) {
  const tasks = itinerario.tasks ?? [];
  if (tasks.length === 0) return null;

  const completed = tasks.filter(
    (t) => !!t.completada || t.estatus === true || t.estatus === 'true',
  ).length;
  const pct = Math.round((completed / tasks.length) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 rounded-full bg-zinc-800">
        <div
          className="h-1.5 rounded-full bg-violet-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500">
        {completed}/{tasks.length} ({pct}%)
      </span>
    </div>
  );
}

// ─── related tasks ──────────────────────────────────────────────────────────────

function RelatedTasks({
  tasks,
  currentTaskId,
  eventId,
  itinerarioId,
}: {
  currentTaskId: string;
  eventId: string;
  itinerarioId: string;
  tasks: Tarea[];
}) {
  const router = useRouter();
  const others = tasks.filter((t) => t._id !== currentTaskId).slice(0, 5);
  if (others.length === 0) return null;

  return (
    <div className="rounded-xl bg-zinc-900 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Otras tareas del itinerario
      </p>
      <div className="space-y-1">
        {others.map((t) => {
          const done = !!t.completada || t.estatus === true || t.estatus === 'true';
          return (
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800"
              key={t._id}
              onClick={() => router.push(`/messages/ev-${eventId}-task/${t._id}`)}
              type="button"
            >
              <span className={`text-xs ${done ? 'text-green-400' : 'text-zinc-500'}`}>
                {done ? '✅' : '○'}
              </span>
              <span className={`flex-1 truncate ${done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                {t.descripcion}
              </span>
              {t.fecha && (
                <span className={`text-[10px] ${getDueDateColor(t.fecha)}`}>
                  {new Date(t.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

interface TaskDetailWorkspaceProps {
  eventId: string;
  taskId: string;
}

export function TaskDetailWorkspace({ eventId, taskId }: TaskDetailWorkspaceProps) {
  const { data, loading, refetch } = useEventData(eventId);
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const found = useMemo(() => findTask(data, taskId), [data, taskId]);

  const handleComplete = async () => {
    if (!found || completing) return;
    setCompleting(true);
    try {
      await completeTask(eventId, found.itinerarioId, taskId);
      // Notify appEventos to refresh
      window.parent?.postMessage({ source: 'chat-ia', type: 'REFRESH_EVENTS' }, '*');
      refetch?.();
    } catch (err) {
      console.error('[TaskDetailWorkspace] completeTask error:', err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent mx-auto" />
          <p className="mt-2 text-sm text-zinc-500">Cargando tarea...</p>
        </div>
      </div>
    );
  }

  if (!found) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-2 text-3xl">📋</div>
          <p className="text-sm text-zinc-500">Tarea no encontrada</p>
          <button
            className="mt-3 rounded-lg bg-zinc-800 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700"
            onClick={() => router.push('/messages')}
            type="button"
          >
            ← Volver a bandeja
          </button>
        </div>
      </div>
    );
  }

  const { tarea, itinerarioTitle, itinerario } = found;
  const isCompleted = !!tarea.completada || tarea.estatus === true || tarea.estatus === 'true';
  const dueLabel = formatDueDate(tarea.fecha);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-5 py-3">
        {/* Mobile back */}
        <button
          className="mr-1 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 md:hidden"
          onClick={() => router.push('/messages')}
          type="button"
        >
          ←
        </button>

        <span className="text-xl">{tarea.icon ?? '📋'}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-zinc-100">{tarea.descripcion}</h2>
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500">{itinerarioTitle}</p>
            {dueLabel && (
              <>
                <span className="text-zinc-700">·</span>
                <span className={`text-xs ${getDueDateColor(tarea.fecha)}`}>
                  {dueLabel}
                </span>
              </>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isCompleted
              ? 'bg-green-900/40 text-green-400'
              : 'bg-orange-900/40 text-orange-400'
          }`}
        >
          {isCompleted ? 'Completada' : 'Pendiente'}
        </span>
      </div>

      {/* Itinerario progress */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-5 py-2">
        <ItineraryProgress itinerario={itinerario} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {/* Tags */}
        {tarea.tags && tarea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tarea.tags.map((tag) => (
              <span
                className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Assignees */}
        {tarea.responsable && tarea.responsable.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Responsables:</span>
            <div className="flex flex-wrap gap-1">
              {tarea.responsable.map((r) => (
                <span
                  className="rounded-full bg-violet-900/30 px-2.5 py-0.5 text-xs text-violet-300"
                  key={r}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <TaskCard
          itinerarioTitle={itinerarioTitle}
          onComplete={isCompleted ? undefined : handleComplete}
          onOpenInApp={() => {
            const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
            const isDev = hostname.includes('-dev.');
            const isTest = hostname.includes('-test.');
            const appBase = isDev
              ? 'https://app-dev.bodasdehoy.com'
              : isTest
                ? 'https://app-test.bodasdehoy.com'
                : 'https://app.bodasdehoy.com';
            window.open(
              `${appBase}/itinerario?event=${eventId}&itinerary=${found.itinerarioId}&task=${taskId}`,
              '_blank',
            );
          }}
          task={{ ...tarea, completada: isCompleted, estatus: tarea.estatus === true || tarea.estatus === 'true' }}
          theme="dark"
        />

        {/* IA suggestion bubble */}
        <div className="flex items-start gap-3 rounded-xl bg-zinc-900 p-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
            A
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-violet-400 mb-1">Asistente IA</p>
            <p className="text-sm text-zinc-300">
              {isCompleted
                ? 'Esta tarea está completada. ¿Necesitas ajustar algo o revisar el resultado?'
                : dueLabel?.startsWith('Vencida')
                  ? 'Esta tarea está vencida. ¿Quieres que te ayude a completarla o contactar al responsable?'
                  : '¿Quieres que te ayude con esta tarea o que contacte a alguien relacionado?'
              }
            </p>
          </div>
        </div>

        {/* Related tasks */}
        <RelatedTasks
          currentTaskId={taskId}
          eventId={eventId}
          itinerarioId={found.itinerarioId}
          tasks={itinerario.tasks ?? []}
        />
      </div>

      {/* Input bar */}
      <div className="border-t border-zinc-800 bg-zinc-900 p-4">
        <TaskInput itinerarioTitle={itinerarioTitle} tarea={tarea} />
      </div>
    </div>
  );
}
