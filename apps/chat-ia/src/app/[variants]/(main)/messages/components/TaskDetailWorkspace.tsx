'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { TaskCard } from '@bodasdehoy/shared/components';
import { completeTask } from '@/services/api2/tasks';
import { useChatStore } from '@/store/chat';
import { useEventData } from '../hooks/useEventData';
import type { Tarea } from '../hooks/useEventData';

// ─── helpers ──────────────────────────────────────────────────────────────────

function findTask(
  data: any,
  taskId: string,
): { tarea: Tarea; itinerarioTitle: string; itinerarioId: string } | null {
  if (!data?.itinerarios_array) return null;
  for (const it of data.itinerarios_array) {
    for (const t of it.tasks ?? []) {
      if (t._id === taskId) {
        return {
          tarea: t,
          itinerarioTitle: it.title ?? 'Itinerario',
          itinerarioId: it._id ?? '',
        };
      }
    }
  }
  return null;
}

// ─── inline input (stays here — chat-ia specific) ─────────────────────────────

function TaskInput({ tarea, itinerarioTitle }: { tarea: Tarea; itinerarioTitle: string }) {
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
      window.parent?.postMessage({ type: 'REFRESH_EVENTS', source: 'chat-ia' }, '*');
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
        <p className="text-sm text-zinc-500">Cargando tarea...</p>
      </div>
    );
  }

  if (!found) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Tarea no encontrada</p>
      </div>
    );
  }

  const { tarea, itinerarioTitle } = found;
  const isCompleted = !!tarea.completada || tarea.estatus === true || tarea.estatus === 'true';

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-5 py-3">
        <span className="text-xl">{tarea.icon ?? '📋'}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-zinc-100">{tarea.descripcion}</h2>
          <p className="text-xs text-zinc-500">{itinerarioTitle}</p>
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

      {/* Scrollable content — task card as inline message */}
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <TaskCard
          itinerarioTitle={itinerarioTitle}
          onComplete={isCompleted ? undefined : handleComplete}
          onOpenInApp={() => {
              const appBase =
                typeof window !== 'undefined' && window.location.hostname.includes('-test.')
                  ? 'https://app-test.bodasdehoy.com'
                  : 'https://app.bodasdehoy.com';
              window.open(
                `${appBase}/itinerario?event=${eventId}&itinerary=${found.itinerarioId}&task=${taskId}`,
                '_blank',
              );
            }}
          task={{ ...tarea, completada: isCompleted }}
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
              ¿Quieres que te ayude con esta tarea o que contacte a alguien relacionado?
            </p>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-zinc-800 bg-zinc-900 p-4">
        <TaskInput itinerarioTitle={itinerarioTitle} tarea={tarea} />
      </div>
    </div>
  );
}
