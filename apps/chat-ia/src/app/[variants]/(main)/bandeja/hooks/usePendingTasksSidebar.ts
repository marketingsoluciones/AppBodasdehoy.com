'use client';

import { useMemo } from 'react';

import { useChatStore } from '@/store/chat';

import { useEventData } from './useEventData';
import type { Tarea } from './useEventData';

export interface PendingTaskItem {
  eventId: string;
  eventName: string;
  itinerarioTitle: string;
  tarea: Tarea;
}

export function usePendingTasksSidebar(maxTasks = 6): {
  eventId: string | null;
  eventName: string;
  loading: boolean;
  tasks: PendingTaskItem[];
} {
  const userEvents = (useChatStore((s) => s.userEvents) as any[] | undefined) ?? [];
  const enabled = maxTasks > 0;

  const { eventId, eventName } = useMemo(() => {
    if (!enabled || userEvents.length === 0) return { eventId: null as string | null, eventName: '' };
    const now = Date.now();
    const sorted = [...userEvents].sort((a: any, b: any) => {
      const fa = a.fecha || a.date || '';
      const fb = b.fecha || b.date || '';
      const da = fa ? Math.abs(new Date(fa).getTime() - now) : Infinity;
      const db = fb ? Math.abs(new Date(fb).getTime() - now) : Infinity;
      return da - db;
    });
    const first = sorted[0];
    return {
      eventId: (first?.id || first?._id || null) as string | null,
      eventName: (first?.name || first?.nombre || 'Evento') as string,
    };
  }, [enabled, userEvents]);

  const { data, loading } = useEventData(eventId);

  const tasks = useMemo<PendingTaskItem[]>(() => {
    if (!enabled) return [];
    if (!data?.itinerarios_array || !eventId) return [];
    const result: PendingTaskItem[] = [];
    for (const it of data.itinerarios_array) {
      for (const t of it.tasks ?? []) {
        const isDone = t.completada || t.estatus === true || t.estatus === 'true';
        if (!isDone) {
          result.push({
            eventId,
            eventName,
            itinerarioTitle: it.title ?? 'Itinerario',
            tarea: t,
          });
        }
      }
    }
    return result.slice(0, maxTasks);
  }, [enabled, data, eventId, eventName, maxTasks]);

  return { eventId, eventName, loading, tasks };
}
