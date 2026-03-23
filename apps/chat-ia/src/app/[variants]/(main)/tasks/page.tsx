'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { message } from 'antd';

import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import { completeTask } from '@/services/api2/tasks';
import { useChatStore } from '@/store/chat';

interface PendingTask {
  _id: string;
  descripcion: string;
  fecha?: string;
  hora?: string;
  icon?: string;
  responsable?: string | string[];
  tags?: string[];
  tips?: string;
}

interface Service {
  id: string;
  pendingTasks: PendingTask[];
  title: string;
  totalTasks: number;
}

interface EventWithTasks {
  fecha?: string;
  id: string;
  nombre: string;
  services: Service[];
  tipo: string;
}

const TYPE_ICON: Record<string, string> = {
  bautizo: '👶',
  boda: '💍',
  comunion: '⛪',
  corporativo: '🏢',
  cumpleanos: '🎂',
  otro: '📅',
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function totalPending(events: EventWithTasks[]): number {
  return events.reduce((sum, e) => sum + e.services.reduce((s2, sv) => s2 + sv.pendingTasks.length, 0), 0);
}

function getAppUrl(path: string): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('-dev.')) {
      return `https://app-dev.bodasdehoy.com${path}`;
    }
    if (hostname.includes('-test.')) {
      return `https://app-test.bodasdehoy.com${path}`;
    }
  }
  return `https://app.bodasdehoy.com${path}`;
}

function formatResponsable(r?: string | string[]): string | null {
  if (!r) return null;
  if (Array.isArray(r)) return r.length > 0 ? r.join(', ') : null;
  return r || null;
}

export default function TasksPage() {
  const [events, setEvents] = useState<EventWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const lastUserId = useRef<string | null>(null);

  const currentUserId = useChatStore((s) => s.currentUserId);

  /** Lista solo pendientes: viene de `/api/events-tasks` (API2 filtra no completadas). */
  const loadEvents = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (
        !currentUserId ||
        currentUserId.startsWith('visitor_') ||
        currentUserId === 'guest' ||
        currentUserId.includes('@guest.')
      ) {
        if (!silent) setLoading(false);
        return;
      }
      if (!currentUserId.includes('@')) {
        if (!silent) setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const r = await fetch('/api/events-tasks', { headers: { 'X-User-ID': currentUserId } });
        const data = await r.json();
        if (data.error && !silent) setError(data.error);
        const nextEvents: EventWithTasks[] = data.events || [];
        setEvents(nextEvents);

        if (!silent) {
          const exp: Record<string, boolean> = {};
          nextEvents.forEach((e) => {
            exp[e.id] = true;
          });
          setExpanded(exp);
        }
      } catch (e: any) {
        if (!silent) setError(e?.message || 'Error al cargar');
        else message.error('No se pudo actualizar la lista de tareas');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    if (!currentUserId) {
      lastUserId.current = null;
      setLoading(false);
      setEvents([]);
      return;
    }
    if (currentUserId === lastUserId.current) return;
    if (
      currentUserId.startsWith('visitor_') ||
      currentUserId === 'guest' ||
      currentUserId.includes('@guest.')
    ) {
      lastUserId.current = currentUserId;
      setLoading(false);
      setEvents([]);
      return;
    }

    lastUserId.current = currentUserId;
    void loadEvents({ silent: false });
  }, [currentUserId, loadEvents]);

  const handleComplete = useCallback(
    async (eventId: string, serviceId: string, taskId: string) => {
      setCompleting((prev) => new Set(prev).add(taskId));
      try {
        await completeTask(eventId, serviceId, taskId);
        message.success('Tarea marcada como completada');
        window.parent?.postMessage({ source: 'chat-ia', type: 'REFRESH_EVENTS' }, '*');
        await loadEvents({ silent: true });
      } catch {
        message.error('No se pudo completar la tarea. Inténtalo de nuevo.');
      } finally {
        setCompleting((prev) => {
          const s = new Set(prev);
          s.delete(taskId);
          return s;
        });
      }
    },
    [loadEvents],
  );

  const pending = totalPending(events);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <EventosAutoAuth />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📋 Tareas pendientes</h1>
        {!loading && (
          <p className="mt-1 text-sm text-gray-500">
            {pending > 0
              ? `${pending} tarea${pending !== 1 ? 's' : ''} pendiente${pending !== 1 ? 's' : ''} en ${events.length} evento${events.length !== 1 ? 's' : ''}`
              : 'Todo al día — no hay tareas pendientes'}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          Error al cargar tareas: {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div className="rounded-xl border border-gray-200 bg-white p-5" key={i}>
              <div className="mb-3 h-5 w-48 animate-pulse rounded bg-gray-200" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div className="h-10 animate-pulse rounded-lg bg-gray-100" key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-3 text-6xl">✅</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-800">Todo al día</h3>
          <p className="text-sm text-gray-500">No tienes tareas pendientes en ningún evento.</p>
          <a
            className="mt-4 inline-block rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
            href={getAppUrl('/servicios')}
            rel="noreferrer"
            target="_blank"
          >
            Ver servicios en la app →
          </a>
        </div>
      )}

      {/* Events list */}
      <div className="space-y-4">
        {events.map((event) => {
          const isExpanded = expanded[event.id] !== false;
          const eventPending = event.services.reduce((s, sv) => s + sv.pendingTasks.length, 0);

          return (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm" key={event.id}>
              {/* Event header */}
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setExpanded((prev) => ({ ...prev, [event.id]: !isExpanded }))}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{TYPE_ICON[event.tipo] || '📅'}</span>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{event.nombre}</h2>
                    {event.fecha && (
                      <p className="text-xs text-gray-400">{formatDate(event.fecha)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-semibold text-pink-700">
                    {eventPending} pendiente{eventPending !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Services + tasks */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 pb-4 pt-3 space-y-4">
                  {event.services.map((service) => (
                    <div key={service.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">
                          {service.title && service.title !== 'sin nombre' ? service.title : 'Servicio'}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {service.pendingTasks.length} de {service.totalTasks} pendiente{service.pendingTasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {service.pendingTasks.map((task) => {
                          const isCompleting = completing.has(task._id);
                          return (
                            <div
                              className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5"
                              key={task._id}
                            >
                              <button
                                aria-label="Marcar como completada"
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                  isCompleting
                                    ? 'border-green-300 bg-green-100'
                                    : 'border-amber-300 hover:border-green-400 hover:bg-green-50'
                                }`}
                                disabled={isCompleting}
                                onClick={() => handleComplete(event.id, service.id, task._id)}
                                type="button"
                              >
                                {isCompleting && (
                                  <span className="h-2.5 w-2.5 animate-spin rounded-full border border-green-500 border-t-transparent" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-800 leading-snug">{task.icon ? `${task.icon} ` : ''}{task.descripcion}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                  {formatResponsable(task.responsable) && (
                                    <span>👤 {formatResponsable(task.responsable)}</span>
                                  )}
                                  {task.fecha && (
                                    <span>📅 {formatDate(task.fecha)}{task.hora ? ` ${task.hora}` : ''}</span>
                                  )}
                                  {task.tags?.length ? (
                                    <span className="text-blue-400">{task.tags.join(', ')}</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* CTA to appEventos — event-specific */}
                  <a
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    href={getAppUrl(`/servicios?event=${event.id}`)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Gestionar en la app →
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
