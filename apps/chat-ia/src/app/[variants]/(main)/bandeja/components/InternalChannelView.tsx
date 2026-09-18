'use client';

import type { CategoriaPresupuesto, Invitado, Itinerario, Tarea } from '../hooks/useEventData';
import { useEventData } from '../hooks/useEventData';

// Parses channel IDs like: ev-[eventId]-itinerary | ev-[eventId]-services | etc.
function parseInternalChannel(channelId: string) {
  const match = channelId.match(/^ev-(.+)-(itinerary|services|guests|tasks)$/);
  if (!match) return null;
  return { eventId: match[1], type: match[2] as 'itinerary' | 'services' | 'guests' | 'tasks' };
}

const CHANNEL_CONFIG = {
  guests: { color: 'text-green-600', icon: '👥', label: 'Invitados' },
  itinerary: { color: 'text-blue-600', icon: '📅', label: 'Itinerario' },
  services: { color: 'text-purple-600', icon: '🏢', label: 'Servicios' },
  tasks: { color: 'text-amber-600', icon: '✅', label: 'Tareas' },
};

// ─── Tasks view ───────────────────────────────────────────────────────────────

function TasksView({ eventId }: { eventId: string }) {
  const { data, error, loading } = useEventData(eventId);

  if (loading) return <LoadingState label="Cargando tareas..." />;
  if (error) return <ErrorState message={error} />;

  const itinerarios = data?.itinerarios_array ?? [];
  const allTasks: Array<{ itinerarioTitle: string; tarea: Tarea }> = [];

  for (const it of itinerarios) {
    for (const t of it.tasks ?? []) {
      allTasks.push({ itinerarioTitle: it.title ?? 'Sin título', tarea: t });
    }
  }

  const isDone = (t: Tarea) => t.completada || t.estatus === true || t.estatus === 'true';
  const pendientes = allTasks.filter((t) => !isDone(t.tarea));
  const completadas = allTasks.filter((t) => isDone(t.tarea));

  if (allTasks.length === 0) {
    return (
      <EmptyState
        description="No hay tareas en los itinerarios de este evento."
        icon="✅"
        title="Sin tareas"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--b-surface-2)]">
      <div className="flex-1 overflow-auto p-4">
        {pendientes.length > 0 && (
          <section className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--b-text-3)]">
              Pendientes ({pendientes.length})
            </h3>
            <div className="space-y-2">
              {pendientes.map(({ itinerarioTitle, tarea }) => (
                <TaskListRow itinerarioTitle={itinerarioTitle} key={tarea._id} tarea={tarea} />
              ))}
            </div>
          </section>
        )}

        {completadas.length > 0 && (
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--b-text-3)]">
              Completadas ({completadas.length})
            </h3>
            <div className="space-y-2 opacity-60">
              {completadas.map(({ itinerarioTitle, tarea }) => (
                <TaskListRow
                  done
                  itinerarioTitle={itinerarioTitle}
                  key={tarea._id}
                  tarea={tarea}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function TaskListRow({
  done,
  itinerarioTitle,
  tarea,
}: {
  done?: boolean;
  itinerarioTitle: string;
  tarea: Tarea;
}) {
  const fecha = tarea.fecha ? new Date(tarea.fecha).toLocaleDateString('es-ES') : null;

  return (
    <div className="rounded-lg border border-[var(--b-border)] bg-[var(--b-surface)] p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">{tarea.icon ?? (done ? '✅' : '⬜')}</span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${done ? 'text-[var(--b-text-3)] line-through' : 'text-[var(--b-text-1)]'}`}
          >
            {tarea.descripcion}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--b-text-3)]">
            <span>{itinerarioTitle}</span>
            {fecha && <span>📅 {fecha}</span>}
            {tarea.responsable && tarea.responsable.length > 0 && (
              <span>👤 {tarea.responsable.join(', ')}</span>
            )}
          </div>
          {tarea.tags && tarea.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {tarea.tags.map((tag) => (
                <span
                  className="rounded bg-[var(--b-surface-2)] px-1.5 py-0.5 text-xs text-[var(--b-text-2)]"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Itinerary view ───────────────────────────────────────────────────────────

function ItineraryView({ eventId }: { eventId: string }) {
  const { data, error, loading } = useEventData(eventId);

  if (loading) return <LoadingState label="Cargando itinerario..." />;
  if (error) return <ErrorState message={error} />;

  const itinerarios = data?.itinerarios_array ?? [];

  if (itinerarios.length === 0) {
    return (
      <EmptyState
        description="No hay momentos en el itinerario de este evento."
        icon="📅"
        title="Sin itinerario"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--b-surface-2)]">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {itinerarios.map((it: Itinerario) => (
            <ItinerarioCard itinerario={it} key={it._id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ItinerarioCard({ itinerario }: { itinerario: Itinerario }) {
  const tasks = itinerario.tasks ?? [];
  const isTaskDone = (t: Tarea) => t.completada || t.estatus === true || t.estatus === 'true';
  const done = tasks.filter(isTaskDone).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : null;

  return (
    <div className="rounded-lg border border-[var(--b-border)] bg-[var(--b-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-[var(--b-text-1)]">{itinerario.title ?? 'Sin título'}</h3>
          {itinerario.tipo && <p className="text-xs text-[var(--b-text-3)]">{itinerario.tipo}</p>}
        </div>
        {pct !== null && (
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
            {pct}%
          </span>
        )}
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-1.5">
          {tasks.slice(0, 5).map((t) => (
            <div className="flex items-center gap-2" key={t._id}>
              <span className="text-sm">{isTaskDone(t) ? '✅' : '⬜'}</span>
              <span
                className={`text-sm ${isTaskDone(t) ? 'text-[var(--b-text-3)] line-through' : 'text-[var(--b-text-2)]'}`}
              >
                {t.descripcion}
              </span>
            </div>
          ))}
          {tasks.length > 5 && (
            <p className="text-xs text-[var(--b-text-3)]">+{tasks.length - 5} tareas más</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--b-text-3)]">Sin tareas</p>
      )}
    </div>
  );
}

// ─── Services (presupuesto) view ──────────────────────────────────────────────

function ServicesView({ eventId }: { eventId: string }) {
  const { data, error, loading } = useEventData(eventId);

  if (loading) return <LoadingState label="Cargando servicios..." />;
  if (error) return <ErrorState message={error} />;

  const categorias = data?.presupuesto_objeto?.categorias_array ?? [];
  const presupuesto = data?.presupuesto_objeto;

  if (categorias.length === 0) {
    return (
      <EmptyState
        description="No hay partidas de presupuesto registradas para este evento."
        icon="🏢"
        title="Sin servicios"
      />
    );
  }

  const total = presupuesto?.coste_final ?? presupuesto?.coste_estimado ?? 0;
  const pagado = presupuesto?.pagado ?? 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--b-surface-2)]">
      {total > 0 && (
        <div className="border-b border-[var(--b-border)] bg-[var(--b-surface)] border border-[var(--b-border)] px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--b-text-3)]">Total presupuesto</span>
            <span className="font-semibold text-[var(--b-text-1)]">
              {total.toLocaleString('es-ES', { currency: 'EUR', style: 'currency' })}
            </span>
          </div>
          {pagado > 0 && (
            <div className="mt-1 flex items-center justify-between text-xs text-[var(--b-text-3)]">
              <span>Pagado</span>
              <span className="text-green-400">
                {pagado.toLocaleString('es-ES', { currency: 'EUR', style: 'currency' })}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {categorias.map((cat: CategoriaPresupuesto) => (
            <CategoriaCard cat={cat} key={cat._id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoriaCard({ cat }: { cat: CategoriaPresupuesto }) {
  const gastos = cat.gastos_array ?? [];
  const coste = cat.coste_final ?? cat.coste_estimado ?? 0;

  return (
    <div className="rounded-lg border border-[var(--b-border)] bg-[var(--b-surface)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-[var(--b-text-1)]">{cat.nombre}</h3>
        {coste > 0 && (
          <span className="text-sm font-semibold text-purple-400">
            {coste.toLocaleString('es-ES', { currency: 'EUR', style: 'currency' })}
          </span>
        )}
      </div>

      {gastos.length > 0 && (
        <div className="space-y-1">
          {gastos.map((g) => (
            <div className="flex items-center justify-between text-xs" key={g._id}>
              <span className="text-[var(--b-text-3)]">{g.nombre}</span>
              {(g.coste_final ?? g.coste_estimado) ? (
                <span className="text-[var(--b-text-3)]">
                  {(g.coste_final ?? g.coste_estimado ?? 0).toLocaleString('es-ES', {
                    currency: 'EUR',
                    style: 'currency',
                  })}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Guests view ──────────────────────────────────────────────────────────────

function GuestsView({ eventId }: { eventId: string }) {
  const { data, error, loading } = useEventData(eventId);

  if (loading) return <LoadingState label="Cargando invitados..." />;
  if (error) return <ErrorState message={error} />;

  const guests: Invitado[] = data?.invitados_array ?? [];

  if (guests.length === 0) {
    return (
      <EmptyState
        description="No hay invitados registrados para este evento."
        icon="👥"
        title="Sin invitados"
      />
    );
  }

  const confirmed = guests.filter((g) => g.asistencia === 'confirmado' || g.asistencia === 'si');
  const declined = guests.filter((g) => g.asistencia === 'no');
  const pending = guests.filter((g) => !g.asistencia || g.asistencia === 'pendiente');

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--b-surface-2)]">
      {/* Stats bar */}
      <div className="border-b border-[var(--b-border)] bg-[var(--b-surface)] px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium text-[var(--b-text-2)]">{confirmed.length}</span>
            <span className="text-[var(--b-text-3)]">confirmados</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="font-medium text-[var(--b-text-2)]">{pending.length}</span>
            <span className="text-[var(--b-text-3)]">pendientes</span>
          </div>
          {declined.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="font-medium text-[var(--b-text-2)]">{declined.length}</span>
              <span className="text-[var(--b-text-3)]">no asisten</span>
            </div>
          )}
          <span className="ml-auto text-xs text-[var(--b-text-3)]">{guests.length} total</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-1">
          {guests.map((g) => {
            const isConfirmed = g.asistencia === 'confirmado' || g.asistencia === 'si';
            const isDeclined = g.asistencia === 'no';
            const mesa = g.tableNameRecepcion?.title || g.nombre_mesa;
            return (
              <div
                className="flex items-center gap-3 rounded-lg border border-[var(--b-border)] bg-[var(--b-surface)] px-3 py-2"
                key={g._id}
              >
                <span className="shrink-0 text-lg">
                  {isConfirmed ? '✅' : isDeclined ? '❌' : '⏳'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--b-text-1)]">{g.nombre}</p>
                  {(g.grupo_relacion || g.nombre_menu || mesa) && (
                    <p className="truncate text-xs text-[var(--b-text-3)]">
                      {[g.grupo_relacion, g.nombre_menu ? `menú: ${g.nombre_menu}` : null, mesa ? `mesa: ${mesa}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--b-surface-2)]">
      <div className="text-center">
        <div className="mb-2 text-3xl">⏳</div>
        <p className="text-sm text-[var(--b-text-3)]">{label}</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--b-surface-2)] p-4">
      <div className="text-center">
        <div className="mb-2 text-3xl">❌</div>
        <p className="text-sm text-red-400">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: string;
  title: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--b-surface-2)] p-4">
      <div className="text-center">
        <div className="mb-3 text-5xl">{icon}</div>
        <p className="font-medium text-[var(--b-text-2)]">{title}</p>
        <p className="mt-1 text-sm text-[var(--b-text-3)]">{description}</p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface InternalChannelViewProps {
  channelId: string;
}

export function InternalChannelView({ channelId }: InternalChannelViewProps) {
  const parsed = parseInternalChannel(channelId);

  if (!parsed) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[var(--b-surface-2)]">
        <p className="text-[var(--b-text-3)]">Canal no reconocido</p>
      </div>
    );
  }

  const config = CHANNEL_CONFIG[parsed.type];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--b-border)] bg-[var(--b-surface)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h2 className={`text-lg font-bold ${config.color}`}>{config.label}</h2>
            <p className="font-mono text-xs text-[var(--b-text-3)]">evento: {parsed.eventId}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {parsed.type === 'tasks' && <TasksView eventId={parsed.eventId} />}
      {parsed.type === 'itinerary' && <ItineraryView eventId={parsed.eventId} />}
      {parsed.type === 'services' && <ServicesView eventId={parsed.eventId} />}
      {parsed.type === 'guests' && <GuestsView eventId={parsed.eventId} />}
    </div>
  );
}
