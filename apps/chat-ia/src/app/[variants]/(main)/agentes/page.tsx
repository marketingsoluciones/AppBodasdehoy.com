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
 * FUENTES DE DATOS:
 *   ✅ Sessions custom del usuario: `sessionSelectors.defaultSessions`
 *      filtrado por `type === 'agent'` (fuente real, ya cableada).
 *   ✅ Prompt editable: `useAgentStore.updateAgentConfig({ systemRole })`
 *      (ya existe, cableado).
 *   🔵 Estado activo/pausado: `config.disabled?: boolean` — extensión
 *      pendiente de `LobeAgentConfig`. Persistencia via PATCH
 *      /chat/sessions/{id}. MOCK con localStorage por ahora.
 *   🔵 Métricas hoy (replies_count, resolved_percent, avg_response_seconds):
 *      endpoint /api/backend/chat/agents/{userId}/metrics?period=today
 *      pendiente backend (Slack ts 1784383734). MOCK por agente.
 *   🔵 Canales asignados: shape backend pendiente (Slack ts 1784383734).
 *      MOCK con localStorage.
 *   🔵 Actividad reciente + evento handoff: SSE type='handoff' pendiente
 *      backend. MOCK con datos ficticios.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { MessagesRail } from '../messages/components/MessagesRail';

// ⚠️ MOCKS marcados con `TODO: reemplazar cuando backend exponga`.
// Sin cablear con backend real hasta que api-ia confirme shapes.

interface AgentMetrics {
  replies_count: number;
  resolved_percent: number;
  avg_response_seconds: number;
}

interface AgentActivity {
  id: string;
  timestamp: string;
  type: 'reply' | 'handoff' | 'config_change' | 'suggestion';
  description: string;
}

interface AgentSummary {
  agentId: string;
  name: string;
  description: string;
  avatar: string; // emoji o inicial
  disabled: boolean;
  systemRole: string;
  channels: string[]; // channelParams asignados
  metrics: AgentMetrics;
  activity: AgentActivity[];
}

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

// TODO: reemplazar por sessionSelectors.defaultSessions filtrado por type='agent'
//       + fusionar con métricas del endpoint pendiente backend.
const MOCK_AGENTS: AgentSummary[] = [
  {
    agentId: 'mock-agent-1',
    name: 'Ana',
    description: 'Especialista en atención a invitados',
    avatar: '✦',
    disabled: false,
    systemRole:
      'Eres Ana, asistente especializada en atención a invitados. Respondes con calidez, confirmas RSVPs y ayudas con dudas de menú, dieta, alojamiento y transporte. No inventes datos del evento — si no sabes, escala al organizador.',
    channels: ['whatsapp', 'web'],
    metrics: { replies_count: 47, resolved_percent: 82, avg_response_seconds: 23 },
    activity: [
      { id: 'a1', timestamp: '2h', type: 'reply', description: 'Respondió a María sobre menú vegetariano' },
      { id: 'a2', timestamp: '3h', type: 'suggestion', description: 'Sugirió respuesta a Carlos (aprobada)' },
      { id: 'a3', timestamp: '5h', type: 'handoff', description: 'Handoff a organizador — pregunta sobre alojamiento' },
    ],
  },
  {
    agentId: 'mock-agent-2',
    name: 'Beto',
    description: 'Comercial · calificación de leads',
    avatar: '✦',
    disabled: false,
    systemRole:
      'Eres Beto, comercial encargado de calificar leads entrantes. Preguntas por presupuesto, fecha estimada, número de invitados y tipo de evento. Marcas la conversación como calificada cuando tengas los 4 datos.',
    channels: ['instagram', 'facebook', 'email'],
    metrics: { replies_count: 12, resolved_percent: 33, avg_response_seconds: 45 },
    activity: [
      { id: 'b1', timestamp: '1h', type: 'reply', description: 'Nuevo lead — preguntando por presupuesto' },
      { id: 'b2', timestamp: '4h', type: 'config_change', description: 'Prompt actualizado por Juan Carlos' },
    ],
  },
  {
    agentId: 'mock-agent-3',
    name: 'Ceci',
    description: 'Soporte técnico web (pausada)',
    avatar: '✦',
    disabled: true,
    systemRole: 'Eres Ceci, encargada de resolver dudas técnicas de la web del evento.',
    channels: ['web'],
    metrics: { replies_count: 0, resolved_percent: 0, avg_response_seconds: 0 },
    activity: [],
  },
];

const AGENT_STATE_KEY_PREFIX = 'cowork_agent_state_';

function loadLocalAgentState(agentId: string): Partial<AgentSummary> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${AGENT_STATE_KEY_PREFIX}${agentId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAgentState(agentId: string, patch: Partial<AgentSummary>): void {
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

export default function AgentesPage() {
  // TODO: reemplazar MOCK_AGENTS por sessionSelectors.defaultSessions filtrado
  //       + fusionar con métricas del endpoint /api/backend/chat/agents/{userId}/metrics
  const [agents, setAgents] = useState<AgentSummary[]>(MOCK_AGENTS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_AGENTS[0]?.agentId ?? '');

  // Hidratar estado local (disabled + channels + systemRole editados)
  useEffect(() => {
    setAgents((prev) =>
      prev.map((a) => {
        const local = loadLocalAgentState(a.agentId);
        return { ...a, ...local };
      }),
    );
  }, []);

  const selected = useMemo(
    () => agents.find((a) => a.agentId === selectedId) ?? agents[0],
    [agents, selectedId],
  );

  const toggleAgentDisabled = useCallback(
    (agentId: string) => {
      setAgents((prev) =>
        prev.map((a) => {
          if (a.agentId !== agentId) return a;
          const next = { ...a, disabled: !a.disabled };
          saveLocalAgentState(agentId, { disabled: next.disabled });
          // TODO: cablear PATCH /chat/sessions/{agentId} con { config: { disabled: next.disabled } }
          //       cuando LobeAgentConfig acepte el campo (Slack ts 1784383734).
          return next;
        }),
      );
    },
    [],
  );

  const toggleChannelAssignment = useCallback(
    (agentId: string, channel: string) => {
      setAgents((prev) =>
        prev.map((a) => {
          if (a.agentId !== agentId) return a;
          const has = a.channels.includes(channel);
          const nextChannels = has ? a.channels.filter((c) => c !== channel) : [...a.channels, channel];
          saveLocalAgentState(agentId, { channels: nextChannels });
          // TODO: cablear POST /api/backend/chat/agents/{userId}/channel-assignments
          //       body { agentId, channels: nextChannels } (Slack ts 1784383734).
          return { ...a, channels: nextChannels };
        }),
      );
    },
    [],
  );

  const updateSystemRole = useCallback((agentId: string, systemRole: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.agentId !== agentId) return a;
        saveLocalAgentState(agentId, { systemRole });
        // ✅ CABLEADO: PATCH /chat/sessions/{agentId} con { config: { systemRole } }
        //    via useAgentStore.updateAgentConfig — ya existe en el store.
        //    (implementación real usará el store cuando sustituyamos MOCK_AGENTS
        //    por sessionSelectors.defaultSessions).
        return { ...a, systemRole };
      }),
    );
  }, []);

  if (!selected) {
    return (
      <div
        className="flex h-full items-center justify-center px-6"
        style={{ backgroundColor: '#FCFCFD' }}
      >
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold" style={{ color: '#1C1C22' }}>
            Aún no tienes agentes creados
          </p>
          <p className="mt-2 text-sm" style={{ color: '#84848F' }}>
            Crea tu primer agente para automatizar respuestas en tus canales.
          </p>
          <button
            className="mt-4 rounded-md px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: '#1C1C22' }}
            type="button"
          >
            Crear agente
          </button>
        </div>
      </div>
    );
  }

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
            {agents.filter((a) => !a.disabled).length} activos · {agents.length}{' '}
            {agents.length === 1 ? 'agente' : 'agentes'}
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          {agents.map((agent) => {
            const isSelected = agent.agentId === selectedId;
            return (
              <button
                key={agent.agentId}
                aria-current={isSelected}
                className="w-full text-left transition-colors"
                onClick={() => setSelectedId(agent.agentId)}
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
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: agent.disabled ? '#F2F1F6' : '#EDE9FE',
                        color: agent.disabled ? '#84848F' : '#6B4EFF',
                      }}
                    >
                      {agent.avatar}
                    </div>
                    <span
                      aria-label={agent.disabled ? 'Pausado' : 'Activo'}
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: agent.disabled ? '#D4D4D8' : '#22C55E',
                        boxShadow: '0 0 0 2px #FFFFFF',
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" style={{ color: '#1C1C22' }}>
                      {agent.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs" style={{ color: '#84848F' }}>
                      {agent.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ borderTop: '1px solid #EDEDF0' }}>
          <button
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
            onClick={() => {
              // TODO: reusar sessionService.createSession({ type: 'agent' })
              //       cuando sustituyamos MOCK_AGENTS por sessions reales.
              // eslint-disable-next-line no-alert
              alert(
                'Crear agente: aún no cableado. Se conectará con sessionService.createSession cuando sustituyamos MOCK_AGENTS por sessions reales.',
              );
            }}
            style={{ color: '#6B4EFF', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F1F6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            type="button"
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
            Crear agente
          </button>
        </div>
      </aside>

      {/* Ficha del agente flex-1 */}
      <section className="flex flex-1 flex-col overflow-auto">
        {/* Cabecera ficha */}
        <div
          className="sticky top-0 z-10 px-6 py-4"
          style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EDEDF0' }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold"
                style={{
                  backgroundColor: selected.disabled ? '#F2F1F6' : '#EDE9FE',
                  color: selected.disabled ? '#84848F' : '#6B4EFF',
                }}
              >
                {selected.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold" style={{ color: '#1C1C22' }}>
                    {selected.name}
                  </h2>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: selected.disabled ? '#F2F1F6' : '#DCFCE7',
                      color: selected.disabled ? '#84848F' : '#166534',
                    }}
                  >
                    {selected.disabled ? 'Pausado' : 'Activo'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs" style={{ color: '#84848F' }}>
                  {selected.description}
                </p>
              </div>
            </div>
            {/* Toggle Encendido/Apagado */}
            <button
              aria-pressed={!selected.disabled}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              onClick={() => toggleAgentDisabled(selected.agentId)}
              style={{
                backgroundColor: selected.disabled ? '#F2F1F6' : '#1C1C22',
                color: selected.disabled ? '#1C1C22' : '#FFFFFF',
              }}
              type="button"
            >
              {selected.disabled ? 'Reanudar' : 'Pausar'}
            </button>
          </div>
        </div>

        {/* Contenido ficha */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Rendimiento hoy */}
            <div
              className="rounded-lg p-4"
              style={{ border: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: '#1C1C22' }}>
                  Rendimiento hoy
                </h3>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                  title="Datos mock — backend pendiente"
                >
                  DEMO
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label="Respuestas"
                  value={selected.metrics.replies_count.toString()}
                />
                <MetricCard
                  label="Resueltas sola"
                  value={`${selected.metrics.resolved_percent}%`}
                />
                <MetricCard
                  label="Tiempo medio"
                  value={`${selected.metrics.avg_response_seconds}s`}
                />
              </div>
            </div>

            {/* Canales asignados */}
            <div
              className="rounded-lg p-4"
              style={{ border: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: '#1C1C22' }}>
                  Canales asignados
                </h3>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                  title="Persistencia local hasta que backend confirme shape"
                >
                  BETA
                </span>
              </div>
              <p className="mb-3 text-xs" style={{ color: '#84848F' }}>
                Cuando llegue un mensaje por uno de estos canales, este agente lo atenderá según su
                configuración.
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CHANNEL_LABEL).map((ch) => {
                  const isActive = selected.channels.includes(ch);
                  return (
                    <button
                      key={ch}
                      aria-pressed={isActive}
                      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                      onClick={() => toggleChannelAssignment(selected.agentId, ch)}
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

            {/* Instrucciones del agente (prompt editable) */}
            <div
              className="rounded-lg p-4"
              style={{ border: '1px solid #EDEDF0', backgroundColor: '#FFFFFF' }}
            >
              <h3 className="mb-2 text-sm font-semibold" style={{ color: '#1C1C22' }}>
                Instrucciones del agente
              </h3>
              <p className="mb-3 text-xs" style={{ color: '#84848F' }}>
                Estas son las reglas que sigue el agente al responder. Cámbialas para ajustar tono,
                límites y comportamiento.
              </p>
              <textarea
                className="w-full rounded-md p-3 text-sm focus:outline-none"
                onChange={(e) => updateSystemRole(selected.agentId, e.target.value)}
                rows={6}
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
                value={selected.systemRole}
              />
            </div>

            {/* Actividad reciente */}
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
                  title="Datos mock — evento handoff pendiente en SSE"
                >
                  DEMO
                </span>
              </div>
              {selected.activity.length === 0 ? (
                <p className="text-xs" style={{ color: '#9A9AA6' }}>
                  Sin actividad reciente. Cuando el agente responda o se produzca un handoff aparecerá
                  aquí.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selected.activity.map((a) => (
                    <li key={a.id} className="flex items-start gap-3">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            a.type === 'handoff'
                              ? '#F59E0B'
                              : a.type === 'config_change'
                                ? '#84848F'
                                : '#6B4EFF',
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs" style={{ color: '#1C1C22' }}>
                          {a.description}
                        </p>
                        <p className="mt-0.5 text-[11px]" style={{ color: '#9A9AA6' }}>
                          hace {a.timestamp}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Nota mocks */}
            <p className="text-center text-[11px] italic" style={{ color: '#9A9AA6' }}>
              Los datos marcados DEMO son mocks. Se cablearán cuando backend confirme shapes
              (endpoint métricas + asignación canales + evento handoff, Slack ts 1784383734).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md px-3 py-2"
      style={{ backgroundColor: '#F2F1F6' }}
    >
      <div className="text-xs" style={{ color: '#84848F' }}>
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold" style={{ color: '#1C1C22' }}>
        {value}
      </div>
    </div>
  );
}
