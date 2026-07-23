'use client';

/**
 * /agentes — Cowork de Agentes (Pantalla 2 del rediseño 18-jul).
 *
 * Vista NUEVA: no existía en el código previo. `grep cowork = 0 hits`
 * confirmado en inventario baseline. Lo más cercano era `group_chat`
 * supervisor pero es 1 humano ↔ N agentes IA (no este panel).
 *
 * Layout 3 columnas:
 *   rail 56px  ·  lista agentes 260px  ·  ficha agente flex-1
 *
 * FUENTES DE DATOS (actualizado 19-jul — commit "MOCK_AGENTS→sessions reales"):
 *   ✅ Lista agentes: `sessionSelectors.defaultSessions` filtrado por
 *      type='agent'. Real, persistido por backend (getSessionsService).
 *   ✅ Prompt editable (systemRole): cableado con `useAgentStore.updateAgentConfig`
 *      → internal_updateAgentConfig → sessionService.updateSessionConfig →
 *      PATCH /chat/sessions/{id}. Persiste entre dispositivos.
 *   ✅ Avatar / título / descripción: de `session.meta.{avatar,title,description}`.
 *   ✅ Estado activo/pausado (cablead 23-jul): PATCH /chat/sessions/{id}
 *      config.disabled (per-agente). localStorage solo como fallback offline.
 *   ✅ Métricas hoy (cablead 23-jul, decisión A per-agente): GET
 *      /api/backend/chat/agents/{userId}/metrics?period=today&agentId=X →
 *      replies_count / resolved_percent / avg_response_seconds.
 *   ✅ Canales asignados (cablead 23-jul, decisión A): GET (lista de todas
 *      las asignaciones) + POST {agentId, channels} per-agente en api-ia.
 *      localStorage solo como fallback offline; backend = fuente de verdad.
 *   🔵 Actividad reciente + evento handoff: SSE type='handoff' pendiente
 *      backend. Vacía por defecto — sin mocks inventados.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAgentStore } from '@/store/agent';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { LobeSessionType, type LobeAgentSession } from '@/types/session';

import { MessagesRail } from '../bandeja/components/MessagesRail';
import { buildHeaders, getUserContext } from '../bandeja/utils/auth';

// Colores canal (mismos que ConversationItem — coherencia con Fase A)
const CHANNEL_DOT: Record<string, string> = {
  whatsapp: '#25D366',
  instagram: '#E1306C',
  facebook: '#1877F2',
  telegram: '#2AABEE',
  web: '#6B4EFF',
  email: '#84848F',
};
const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  telegram: 'Telegram',
  web: 'Web chat',
  email: 'Email',
};

interface AgentActivity {
  id: string;
  timestamp: string;
  type: 'reply' | 'handoff' | 'config_change' | 'suggestion';
  description: string;
}

// Estado local persistido en localStorage — sólo los 4 mocks pendientes
// de backend (disabled + channels). Métricas/actividad viven en memoria
// mientras no lleguen del server (no tiene sentido cachearlos vacíos).
interface LocalAgentState {
  disabled?: boolean;
  channels?: string[];
}

const AGENT_STATE_KEY_PREFIX = 'cowork_agent_state_';

function loadLocalAgentState(agentId: string): LocalAgentState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${AGENT_STATE_KEY_PREFIX}${agentId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAgentState(agentId: string, patch: LocalAgentState): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadLocalAgentState(agentId);
    localStorage.setItem(
      `${AGENT_STATE_KEY_PREFIX}${agentId}`,
      JSON.stringify({ ...current, ...patch }),
    );
  } catch {
    /* ignore */
  }
}

// Extrae inicial del meta.title para el avatar cuando no hay meta.avatar.
function agentInitial(title: string | undefined): string {
  if (!title) return '✦';
  const trimmed = title.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : '✦';
}

export default function AgentesPage() {
  // Sessions reales del store (persistidas por backend).
  const agentSessions = useSessionStore((s) => {
    const all = sessionSelectors.defaultSessions(s);
    return all.filter(
      (session): session is LobeAgentSession => session.type === LobeSessionType.Agent,
    );
  });
  const switchSession = useSessionStore((s) => s.switchSession);
  const activeId = useSessionStore((s) => s.activeId);
  const isSessionListInit = useSessionStore(sessionSelectors.isSessionListInit);

  // Prompt editable → escritura vía useAgentStore.updateAgentConfig
  // (persiste PATCH /chat/sessions/{id}). Actúa sobre `activeId`, por eso
  // la selección de la lista hace switchSession(id) antes de editar.
  const updateAgentConfig = useAgentStore((s) => s.updateAgentConfig);

  // Selección visual local (no cambia el activo hasta que el usuario
  // interactúa con la ficha → evita side-effect al montar).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && agentSessions.length > 0) {
      setSelectedId(agentSessions[0].id);
    }
  }, [selectedId, agentSessions]);

  // Estado local (disabled + channels) por agente — memoria hasta backend.
  const [localStates, setLocalStates] = useState<Record<string, LocalAgentState>>({});
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const map: Record<string, LocalAgentState> = {};
    agentSessions.forEach((a) => {
      const local = loadLocalAgentState(a.id);
      // disabled: fuente de verdad = backend (session.config.disabled), cablead
      // 23-jul. Si el backend aún no lo trae, cae al valor local. (channels sigue
      // local hasta que api-ia keyee por agente — decisión A, pendiente).
      const backendDisabled = (a.config as any)?.disabled;
      map[a.id] = {
        ...local,
        disabled: typeof backendDisabled === 'boolean' ? backendDisabled : local.disabled,
      };
    });
    setLocalStates(map);
  }, [agentSessions]);

  // ── Cablead 23-jul (Cowork decisión A, per-agente) ─────────────────────────
  // GET sin agentId devuelve TODAS las asignaciones del user → pisa el estado
  // local con el backend (fuente de verdad). POST persiste por agente.
  useEffect(() => {
    const { userId } = getUserContext();
    if (!userId || agentSessions.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/backend/chat/agents/${encodeURIComponent(userId)}/channel-assignments`,
          { credentials: 'include', headers: buildHeaders() },
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const assignments: Array<{ agentId?: string; agent_id?: string; channels?: string[] }> =
          data?.assignments ?? (data?.agentId || data?.agent_id ? [data] : []);
        if (assignments.length === 0) return;
        setLocalStates((prev) => {
          const next = { ...prev };
          for (const a of assignments) {
            const id = a.agent_id ?? a.agentId;
            if (!id) continue;
            next[id] = { ...(next[id] ?? {}), channels: a.channels ?? [] };
          }
          return next;
        });
      } catch {
        /* backend caído → se mantiene el estado local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentSessions.length]);

  // Métricas reales per-agente (replies_count / resolved_percent / avg_response_seconds).
  const [agentMetrics, setAgentMetrics] = useState<{
    avg_response_seconds?: number;
    replies_count?: number;
    resolved_percent?: number;
  } | null>(null);
  useEffect(() => {
    const { userId } = getUserContext();
    if (!userId || !selectedId) {
      setAgentMetrics(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/backend/chat/agents/${encodeURIComponent(userId)}/metrics?period=today&agentId=${encodeURIComponent(selectedId)}`,
          { credentials: 'include', headers: buildHeaders() },
        );
        if (!res.ok || cancelled) return;
        const m = await res.json();
        if (!cancelled) setAgentMetrics(m);
      } catch {
        if (!cancelled) setAgentMetrics(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selected = useMemo(
    () => agentSessions.find((a) => a.id === selectedId) ?? null,
    [agentSessions, selectedId],
  );

  const selectedLocal = selected ? (localStates[selected.id] ?? {}) : {};
  const selectedDisabled = !!selectedLocal.disabled;
  const selectedChannels = selectedLocal.channels ?? [];

  // Estado del prompt en edición — controlled input con debounce a backend.
  // Al cambiar de agente se re-hidrata desde session.config.systemRole.
  const [promptDraft, setPromptDraft] = useState<string>('');
  useEffect(() => {
    setPromptDraft(selected?.config.systemRole ?? '');
  }, [selected?.id, selected?.config.systemRole]);

  const persistPrompt = useCallback(
    async (systemRole: string) => {
      if (!selected) return;
      // updateAgentConfig actúa sobre activeId — cambiarlo primero si no coincide.
      if (activeId !== selected.id) {
        switchSession(selected.id);
        // switchSession es sync, pero updateAgentConfig lee activeId en el instante
        // siguiente. useEffect en el store actualiza. Pequeño retardo para asegurar.
        await new Promise((r) => setTimeout(r, 0));
      }
      await updateAgentConfig({ systemRole });
    },
    [selected, activeId, switchSession, updateAgentConfig],
  );

  // Debounce 800ms — al parar de escribir persiste. Coherente con el patrón
  // de otros settings del propio LobeChat (AgentSetting).
  useEffect(() => {
    if (!selected) return;
    if (promptDraft === (selected.config.systemRole ?? '')) return;
    const t = setTimeout(() => {
      void persistPrompt(promptDraft);
    }, 800);
    return () => clearTimeout(t);
  }, [promptDraft, selected, persistPrompt]);

  const toggleAgentDisabled = useCallback(
    async (agentId: string) => {
      const nextDisabled = !(localStates[agentId]?.disabled);
      // Optimista local (respuesta inmediata en la UI).
      setLocalStates((prev) => ({
        ...prev,
        [agentId]: { ...(prev[agentId] ?? {}), disabled: nextDisabled },
      }));
      saveLocalAgentState(agentId, { disabled: nextDisabled });
      // Cablead 23-jul (Cowork per-agente): persistir en backend vía
      // PATCH /chat/sessions/{id} (config.disabled). api-ia lo acepta ya.
      // updateAgentConfig actúa sobre activeId → switchSession primero.
      try {
        if (activeId !== agentId) {
          switchSession(agentId);
          await new Promise((r) => setTimeout(r, 0));
        }
        await updateAgentConfig({ disabled: nextDisabled } as any);
      } catch {
        /* el estado local ya está aplicado; se reintenta al reabrir la ficha */
      }
    },
    [localStates, activeId, switchSession, updateAgentConfig],
  );

  const toggleChannelAssignment = useCallback((agentId: string, channel: string) => {
    setLocalStates((prev) => {
      const current = prev[agentId] ?? {};
      const has = (current.channels ?? []).includes(channel);
      const nextChannels = has
        ? (current.channels ?? []).filter((c) => c !== channel)
        : [...(current.channels ?? []), channel];
      const next: LocalAgentState = { ...current, channels: nextChannels };
      saveLocalAgentState(agentId, { channels: nextChannels });
      // Cablead 23-jul (decisión A): persistir per-agente en api-ia. Optimista
      // local primero; si el POST falla, el estado local se mantiene y el GET
      // del próximo montaje reconcilia.
      const { userId } = getUserContext();
      if (userId) {
        void fetch(
          `/api/backend/chat/agents/${encodeURIComponent(userId)}/channel-assignments`,
          {
            body: JSON.stringify({ agentId, channels: nextChannels }),
            credentials: 'include',
            headers: buildHeaders(),
            method: 'POST',
          },
        ).catch(() => {
          /* local ya aplicado */
        });
      }
      return { ...prev, [agentId]: next };
    });
  }, []);

  // === Empty states =========================================================

  // Sessions aún no hidratadas — Redirect.tsx ya evita el fullscreen loader
  // en /agentes (ROUTES_TO_SKIP). Aquí ponemos placeholder discreto para
  // evitar mostrar "no tienes agentes" mientras cargan.
  if (!isSessionListInit) {
    return (
      <div className="flex h-full" style={{ backgroundColor: '#FFFFFF' }}>
        <MessagesRail />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm" style={{ color: '#84848F' }}>
            Cargando tus agentes…
          </p>
        </div>
      </div>
    );
  }

  if (agentSessions.length === 0) {
    return (
      <div className="flex h-full" style={{ backgroundColor: '#FFFFFF' }}>
        <MessagesRail />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-semibold"
              style={{ backgroundColor: '#EDE9FE', color: '#6B4EFF' }}
            >
              ✦
            </div>
            <p className="text-lg font-semibold" style={{ color: '#1C1C22' }}>
              Aún no tienes agentes creados
            </p>
            <p className="mt-2 text-sm" style={{ color: '#84848F' }}>
              Crea tu primer agente en Copilot para atender conversaciones por WhatsApp,
              Instagram, Facebook y otros canales de forma automática.
            </p>
            <a
              className="mt-4 inline-block rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
              href="/asistente"
              style={{ backgroundColor: '#1C1C22' }}
            >
              Ir a Copilot
            </a>
          </div>
        </div>
      </div>
    );
  }

  // === Vista principal ======================================================

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Rail 56px — misma navegación que /messages (coherencia rediseño) */}
      <MessagesRail />

      {/* Lista agentes 260px */}
      <aside
        className="flex w-[260px] shrink-0 flex-col overflow-hidden"
        style={{ borderRight: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
      >
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EDEDF0' }}
        >
          <h1 className="text-base font-semibold" style={{ color: '#1C1C22' }}>
            Tu equipo
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: '#84848F' }}>
            {agentSessions.filter((a) => !localStates[a.id]?.disabled).length} activos ·{' '}
            {agentSessions.length} {agentSessions.length === 1 ? 'agente' : 'agentes'}
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          {agentSessions.map((agent) => {
            const isSelected = agent.id === selectedId;
            const disabled = !!localStates[agent.id]?.disabled;
            const title = agent.meta.title ?? 'Sin nombre';
            const description = agent.meta.description ?? '';
            const avatar = agent.meta.avatar || agentInitial(agent.meta.title);
            return (
              <button
                key={agent.id}
                aria-current={isSelected}
                className="w-full text-left transition-colors"
                onClick={() => setSelectedId(agent.id)}
                style={{
                  backgroundColor: isSelected ? '#F2F1F6' : 'transparent',
                  borderBottom: '1px solid #EDEDF0',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#FCFCFD';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                type="button"
              >
                <div className="flex items-start gap-3 px-3 py-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: disabled ? '#F2F1F6' : '#EDE9FE',
                        color: disabled ? '#84848F' : '#6B4EFF',
                      }}
                    >
                      {avatar.startsWith('http') || avatar.startsWith('data:') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="h-full w-full object-cover" src={avatar} />
                      ) : (
                        avatar
                      )}
                    </div>
                    <span
                      aria-label={disabled ? 'Pausado' : 'Activo'}
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: disabled ? '#D4D4D8' : '#22C55E',
                        boxShadow: '0 0 0 2px #FFFFFF',
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" style={{ color: '#1C1C22' }}>
                      {title}
                    </div>
                    {description && (
                      <div className="mt-0.5 truncate text-xs" style={{ color: '#84848F' }}>
                        {description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ borderTop: '1px solid #EDEDF0' }}>
          <a
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
            href="/asistente"
            style={{ color: '#6B4EFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F1F6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Crear agente en Copilot
          </a>
        </div>
      </aside>

      {/* Ficha del agente flex-1 */}
      {selected && (
        <section className="flex flex-1 flex-col overflow-auto">
          {/* Cabecera ficha */}
          <div
            className="sticky top-0 z-10 px-6 py-4"
            style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EDEDF0' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-lg font-semibold"
                  style={{
                    backgroundColor: selectedDisabled ? '#F2F1F6' : '#EDE9FE',
                    color: selectedDisabled ? '#84848F' : '#6B4EFF',
                  }}
                >
                  {(() => {
                    const av = selected.meta.avatar || agentInitial(selected.meta.title);
                    return av.startsWith('http') || av.startsWith('data:') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="h-full w-full object-cover" src={av} />
                    ) : (
                      av
                    );
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold" style={{ color: '#1C1C22' }}>
                      {selected.meta.title ?? 'Sin nombre'}
                    </h2>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: selectedDisabled ? '#F2F1F6' : '#DCFCE7',
                        color: selectedDisabled ? '#84848F' : '#166534',
                      }}
                    >
                      {selectedDisabled ? 'Pausado' : 'Activo'}
                    </span>
                  </div>
                  {selected.meta.description && (
                    <p className="mt-0.5 text-xs" style={{ color: '#84848F' }}>
                      {selected.meta.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                aria-pressed={!selectedDisabled}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                onClick={() => toggleAgentDisabled(selected.id)}
                style={{
                  backgroundColor: selectedDisabled ? '#F2F1F6' : '#1C1C22',
                  color: selectedDisabled ? '#1C1C22' : '#FFFFFF',
                }}
                type="button"
              >
                {selectedDisabled ? 'Reanudar' : 'Pausar'}
              </button>
            </div>
          </div>

          {/* Contenido ficha */}
          <div className="flex-1 overflow-auto px-6 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Rendimiento hoy — cablead 23-jul: métricas reales per-agente (api-ia) */}
              <div
                className="rounded-lg p-4"
                style={{ border: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: '#1C1C22' }}>
                    Rendimiento hoy
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard
                    label="Respuestas"
                    value={agentMetrics ? String(agentMetrics.replies_count ?? 0) : '—'}
                  />
                  <MetricCard
                    label="Resueltas sola"
                    value={agentMetrics ? `${agentMetrics.resolved_percent ?? 0}%` : '—'}
                  />
                  <MetricCard
                    label="Tiempo medio"
                    value={agentMetrics ? `${agentMetrics.avg_response_seconds ?? 0}s` : '—'}
                  />
                </div>
              </div>

              {/* Canales asignados — beta local */}
              <div
                className="rounded-lg p-4"
                style={{ border: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: '#1C1C22' }}>
                    Canales asignados
                  </h3>
                </div>
                <p className="mb-3 text-xs" style={{ color: '#84848F' }}>
                  Cuando llegue un mensaje por uno de estos canales, este agente lo atenderá según su
                  configuración.
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CHANNEL_LABEL).map((ch) => {
                    const isActive = selectedChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        aria-pressed={isActive}
                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                        onClick={() => toggleChannelAssignment(selected.id, ch)}
                        style={{
                          backgroundColor: isActive ? '#EDE9FE' : '#FFFFFF',
                          border: `1px solid ${isActive ? '#EDE9FE' : '#EDEDF0'}`,
                          color: isActive ? '#6B4EFF' : '#84848F',
                        }}
                        type="button"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: CHANNEL_DOT[ch] ?? '#84848F' }}
                        />
                        {CHANNEL_LABEL[ch]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instrucciones del agente — cableado a updateAgentConfig */}
              <div
                className="rounded-lg p-4"
                style={{ border: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: '#1C1C22' }}>
                    Instrucciones del agente
                  </h3>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
                    title="Se guarda en el backend"
                  >
                    GUARDADO EN LA NUBE
                  </span>
                </div>
                <p className="mb-3 text-xs" style={{ color: '#84848F' }}>
                  Estas son las reglas que sigue el agente al responder. Los cambios se guardan
                  automáticamente y persisten entre dispositivos.
                </p>
                <textarea
                  className="w-full rounded-md p-3 text-sm focus:outline-none"
                  onChange={(e) => setPromptDraft(e.target.value)}
                  rows={8}
                  style={{
                    backgroundColor: '#F2F1F6',
                    border: '1px solid transparent',
                    color: '#1C1C22',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#6B4EFF';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = '#F2F1F6';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  value={promptDraft}
                />
              </div>

              {/* Actividad reciente — mock hasta SSE handoff */}
              <div
                className="rounded-lg p-4"
                style={{ border: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: '#1C1C22' }}>
                    Actividad reciente
                  </h3>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                    title="Feed de actividad pendiente en SSE"
                  >
                    PRÓXIMAMENTE
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#9A9AA6' }}>
                  Cuando el agente responda o se produzca un handoff aparecerá aquí. Feed en tiempo
                  real por SSE (pendiente backend).
                </p>
              </div>

              {/* Nota al pie */}
              <p className="text-center text-[11px] italic" style={{ color: '#9A9AA6' }}>
                Instrucciones y datos del agente ({selected.meta.title ?? 'agente'}) guardados en la
                nube. Rendimiento, asignación de canales y feed en tiempo real se activarán cuando
                backend confirme shapes (Slack ts 1784383734).
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Silenciar warning TS por reservar el type (útil para futuros expandir)
export type _AgentActivity = AgentActivity;

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md px-3 py-2" style={{ backgroundColor: '#F2F1F6' }}>
      <div className="text-xs" style={{ color: '#84848F' }}>
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold" style={{ color: '#1C1C22' }}>
        {value}
      </div>
    </div>
  );
}
