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

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { useSwitchSession } from '@/hooks/useSwitchSession';
import { useAgentStore } from '@/store/agent';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { LobeSessionType, type LobeAgentSession } from '@/types/session';

import { buildHeaders, getUserContext } from '../bandeja/utils/auth';
import { useAgentActivity } from './useAgentActivity';

// Colores canal (mismos que ConversationItem — coherencia con Fase A)
const CHANNEL_DOT: Record<string, string> = {
  email: '#84848F',
  facebook: '#1877F2',
  instagram: '#E1306C',
  telegram: '#2AABEE',
  web: '#6B4EFF',
  whatsapp: '#25D366',
};
const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  facebook: 'Facebook',
  instagram: 'Instagram',
  telegram: 'Telegram',
  web: 'Web chat',
  whatsapp: 'WhatsApp',
};

// Puente Agente→Bandeja (17-ago): canal del agente → código de filtro de la Bandeja.
// (email no tiene filtro en la Bandeja todavía → cae a bandeja sin filtro.)
const AGENT_CHANNEL_TO_BANDEJA: Record<string, string> = {
  facebook: 'fb',
  instagram: 'ig',
  telegram: 'tg',
  web: 'web',
  whatsapp: 'wa',
};

interface AgentActivity {
  description: string;
  id: string;
  timestamp: string;
  type: 'reply' | 'handoff' | 'config_change' | 'suggestion';
}

// Estado local persistido en localStorage — sólo los 4 mocks pendientes
// de backend (disabled + channels). Métricas/actividad viven en memoria
// mientras no lleguen del server (no tiene sentido cachearlos vacíos).
interface LocalAgentState {
  channels?: string[];
  disabled?: boolean;
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

// ISSUE-003 (informe dogfood 20-ago): muchos agentes NO tienen meta.title REAL —
// LobeChat les persiste el título por DEFECTO ("Asistente predeterminado" / "Sesión
// predeterminada" / la variante que toque) → /agentes mostraba N agentes idénticos
// ("imposible saber cuál hizo qué"). QA 2ª ronda confirmó que seguían colapsando: mi
// 1er intento solo derivaba cuando el título estaba VACÍO, pero aquí el título es el
// PLACEHOLDER por defecto (no vacío). Tratamos esos placeholders como "sin título".
const PLACEHOLDER_AGENT_TITLES = new Set(
  [
    'nueva conversación',
    'nueva conversacion',
    'new conversation',
    'asistente predeterminado',
    'sesión predeterminada',
    'sesion predeterminada',
    'default agent',
    'default session',
    'asistente personalizado',
    'default topic',
    '自定义助手',
    '默认话题',
    '默认对话',
  ].map((s) => s.toLowerCase()),
);

function isRealTitle(title: string | undefined): title is string {
  const t = title?.trim();
  return !!t && !PLACEHOLDER_AGENT_TITLES.has(t.toLowerCase());
}

// Derivamos un nombre estable y distinguible: título REAL → descripción → 1ª frase de
// la instrucción (systemRole) → "Agente {id corto}". Los agentes CON título real siguen
// coherentes con /asistente; los que solo tienen el placeholder ganan identidad operativa.
function agentDisplayName(agent: LobeAgentSession): string {
  const title = agent.meta?.title?.trim();
  if (isRealTitle(title)) return title;
  const desc = agent.meta?.description?.trim();
  if (desc) return desc.length > 42 ? `${desc.slice(0, 42)}…` : desc;
  const role = agent.config?.systemRole?.trim();
  if (role) {
    const firstLine = role.split(/[\n.]/)[0]?.trim() ?? '';
    if (firstLine) return firstLine.length > 42 ? `${firstLine.slice(0, 42)}…` : firstLine;
  }
  // QA 3ª ronda (build jIsPcFdK): "Agente 6a7416" se repetía. Causa: los ids son ObjectIds
  // de Mongo cuyo PREFIJO es el timestamp de creación → todas las sesiones creadas en la
  // misma ventana comparten los primeros hex. La COLA del id (contador incremental + random)
  // sí distingue. Usamos slice(-6) → agentes sin título/desc/instrucción quedan únicos.
  return `Agente ${agent.id.slice(-6)}`;
}

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

  // "Abrir chat" = hilos propios del agente (tú↔agente). useSwitchSession
  // hace switchSession(id) + navega a /asistente?session=id → la conversación
  // del agente (sus topics). Es el gesto Claude/ChatGPT/Trae: click agente →
  // chatear con él. Complementa "Ver sus conversaciones de cliente" (Bandeja).
  const openAgentChat = useSwitchSession();

  // Feed en tiempo real de actividad/handoff del agente (SSE api-ia /api/messages/stream).
  const activityEvents = useAgentActivity(getUserContext().development ?? 'bodasdehoy');

  // Prompt editable → escritura vía useAgentStore.updateAgentConfig
  // (persiste PATCH /chat/sessions/{id}). Actúa sobre `activeId`, por eso
  // la selección de la lista hace switchSession(id) antes de editar.
  const updateAgentConfig = useAgentStore((s) => s.updateAgentConfig);

  // Selección visual local (no cambia el activo hasta que el usuario
  // interactúa con la ficha → evita side-effect al montar).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deep-link ?agent=<id> — round-trip desde el chat ("Gestionar agente" en /asistente
  // → /agentes?agent=id): preselecciona ESE agente para que las dos vistas se sientan
  // como un solo espacio (mismo agente a ambos lados). Si el id no existe, cae al 1º.
  const searchParams = useSearchParams();
  const requestedAgentId = searchParams?.get('agent') ?? null;

  useEffect(() => {
    if (selectedId || agentSessions.length === 0) return;
    if (requestedAgentId && agentSessions.some((a) => a.id === requestedAgentId)) {
      setSelectedId(requestedAgentId);
      return;
    }
    setSelectedId(agentSessions[0].id);
  }, [selectedId, agentSessions, requestedAgentId]);

  // Pestañas del espacio del agente (18-ago, modelo "espacio del agente con pestañas"):
  // Resumen (rendimiento + actividad) · Configuración (canales + instrucciones). Se
  // resetea a "resumen" al cambiar de agente. "Abrir chat" (hilos) y "Ver conversaciones
  // de cliente" siguen como acciones (cabecera/tarjeta), no como pestañas vacías.
  // FUSIÓN single-pane (owner 23-ago): el chat del agente es una PESTAÑA más ("Chat"),
  // primera y por defecto → una sola pantalla estilo Cloudflare/Trae. Resumen/Config intactos.
  const [fichaTab, setFichaTab] = useState<'chat' | 'resumen' | 'config'>('chat');
  useEffect(() => setFichaTab('chat'), [selectedId]);

  // Guard de hidratación (React #418, QA 4-ago): los selectores de Zustand pueden diferir
  // entre SSR (estado inicial) y el primer render del cliente (store ya hidratado) → mismatch.
  // Renderizamos el placeholder hasta `mounted` para garantizar HTML SSR == 1er render cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ISSUE-001 (informe dogfood 20-ago): a un invitado, /agentes le mostraba "Aún no
  // tienes agentes creados" (implica logueado-y-vacío) en vez de pedir login → confuso
  // ("¿está roto? ¿modo visitante?"). Distinguimos invitado de logueado-sin-agentes en
  // el estado vacío. NO redirigimos (useDomainGuestUser tiene ventana transitoria
  // post-mount → un redirect rebotaría a logueados a /login). Ver estado vacío abajo.
  const isGuest = useDomainGuestUser();

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
            next[id] = { ...next[id], channels: a.channels ?? [] };
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

  // Nombres GARANTIZADAMENTE únicos en la lista (QA 3ª ronda B3): agentDisplayName ya deriva
  // un nombre, pero dos agentes podrían derivar el MISMO (misma descripción/instrucción, o
  // ids con misma cola). Desambiguamos aquí con la cola del id SOLO cuando hay colisión, y
  // usamos este mapa en lista Y ficha → los nombres son distinguibles y coherentes entre ambas.
  const agentNameById = useMemo(() => {
    const base = new Map<string, string>();
    const counts = new Map<string, number>();
    for (const a of agentSessions) {
      const n = agentDisplayName(a);
      base.set(a.id, n);
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    const out = new Map<string, string>();
    for (const a of agentSessions) {
      const n = base.get(a.id) ?? 'Agente';
      out.set(a.id, (counts.get(n) ?? 0) > 1 ? `${n} · ${a.id.slice(-4)}` : n);
    }
    return out;
  }, [agentSessions]);
  const nameOf = useCallback(
    (a: LobeAgentSession) => agentNameById.get(a.id) ?? agentDisplayName(a),
    [agentNameById],
  );

  const selectedLocal = selected ? (localStates[selected.id] ?? {}) : {};
  const selectedDisabled = !!selectedLocal.disabled;
  const selectedChannels = selectedLocal.channels ?? [];
  // Puente a la Bandeja filtrada por el canal del agente (v1: por canal, no por agente).
  const bandejaChannelCode = selectedChannels
    .map((c) => AGENT_CHANNEL_TO_BANDEJA[c])
    .find(Boolean);
  // Puente a la Bandeja. HOY filtra por CANAL (Fase 1). Añadimos TAMBIÉN &agent=<id>
  // (FASE 2, dormido): la Bandeja ignora ?agent= hasta que backend exponga el campo
  // `assignedAgentId` en la conversación; ese día el MISMO enlace se convierte en filtro
  // por-agente EXACTO sin tocar nada aquí. Sin canal → solo ?agent= (hoy = bandeja completa,
  // igual que antes; mañana = las de este agente). 0 dead code, 0 fallback.
  // BUG QA (17-ago, FALLO 1 crítico): `selected` puede ser null en el render inicial
  // (antes de que el useEffect fije selectedId) → `selected.id` lanzaba
  // "Cannot read properties of null (reading 'id')" y tumbaba /agentes al error boundary.
  // Se computa a nivel de componente (fuera del guard {selected && …}), por eso hay que
  // hacerlo null-safe aquí (mismo patrón que selectedLocal arriba). bandejaClientsHref solo
  // se USA dentro del guard, pero la EXPRESIÓN se evalúa siempre → no puede tocar selected.id.
  const agentParam = selected ? `agent=${encodeURIComponent(selected.id)}` : '';
  const bandejaClientsHref = bandejaChannelCode
    ? `/bandeja?channel=${bandejaChannelCode}${agentParam ? `&${agentParam}` : ''}`
    : agentParam
      ? `/bandeja?${agentParam}`
      : '/bandeja';

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
        await new Promise<void>((r) => {
          setTimeout(r, 0);
        });
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
        [agentId]: { ...prev[agentId], disabled: nextDisabled },
      }));
      saveLocalAgentState(agentId, { disabled: nextDisabled });
      // Cablead 23-jul (Cowork per-agente): persistir en backend vía
      // PATCH /chat/sessions/{id} (config.disabled). api-ia lo acepta ya.
      // updateAgentConfig actúa sobre activeId → switchSession primero.
      try {
        if (activeId !== agentId) {
          switchSession(agentId);
          await new Promise<void>((r) => {
          setTimeout(r, 0);
        });
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
  if (!mounted || !isSessionListInit) {
    return (
      <div className="flex h-full" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm" style={{ color: '#84848F' }}>
            Cargando tus agentes…
          </p>
        </div>
      </div>
    );
  }

  if (agentSessions.length === 0) {
    // ISSUE-001: distinguir INVITADO (necesita login) de LOGUEADO-SIN-AGENTES. Antes ambos
    // veían "Aún no tienes agentes creados" → a un invitado le implicaba estar logueado y
    // vacío (confuso). Ahora el invitado ve un CTA de login contextual y claro.
    return (
      <div className="flex h-full" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-semibold"
              style={{ backgroundColor: '#EDE9FE', color: '#6B4EFF' }}
            >
              {isGuest ? '🔒' : '✦'}
            </div>
            <p className="text-lg font-semibold" style={{ color: '#1C1C22' }}>
              {isGuest ? 'Inicia sesión para ver tus agentes' : 'Aún no tienes agentes creados'}
            </p>
            <p className="mt-2 text-sm" style={{ color: '#84848F' }}>
              {isGuest
                ? 'Tus agentes atienden conversaciones por WhatsApp, Instagram, Facebook y otros canales. Inicia sesión para gestionarlos.'
                : 'Los agentes atienden conversaciones por WhatsApp, Instagram, Facebook y otros canales de forma automática. Se crean desde el Asistente: pídeselo con tus palabras (por ejemplo, «crea un agente que atienda WhatsApp») y te lo deja listo.'}
            </p>
            <a
              className="mt-4 inline-block rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
              href={isGuest ? '/login?redirect=/agentes' : '/asistente'}
              style={{ backgroundColor: '#1C1C22' }}
            >
              {isGuest ? 'Iniciar sesión' : 'Crear mi primer agente en el Asistente'}
            </a>
            {/* QA 31-ago: el salto Agentes→/asistente se percibía como "cambio de herramienta".
                Se anticipa a dónde va y qué hacer al llegar (continuación, no cambio). */}
            {!isGuest && (
              <p className="mt-2 text-xs" style={{ color: '#A8A3B5' }}>
                Se abrirá el Asistente (Copilot), el mismo chat de siempre.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === Vista principal ======================================================

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      {/* H3 (QA re-run 21-ago): MessagesRail RETIRADO — duplicaba el rail principal. */}
      {/* Lista agentes 260px */}
      <aside
        className="flex w-[260px] shrink-0 flex-col overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #EDEDF0' }}
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
            // Nombre distinguible (ISSUE-003): título real, o derivado de descripción/
            // instrucción/id corto → nunca 14× "Nueva conversación". Coherente con
            // /asistente para agentes con título.
            const title = nameOf(agent);
            // #5 QA (re-análisis 22-ago): un agente SIN descripción NI instrucción es un
            // agente vacío de test → mostrar "Sin configurar" para distinguirlo de uno con
            // propósito real ("no sé para qué es cada agente"). Si tiene instrucción, el
            // nombre ya la refleja (agentDisplayName deriva de systemRole).
            const description =
              agent.meta.description?.trim() ||
              (agent.config?.systemRole?.trim() ? '' : 'Sin configurar');
            const avatar = agent.meta.avatar || agentInitial(title);
            return (
              <button
                aria-current={isSelected}
                className="w-full text-left transition-colors"
                key={agent.id}
                onClick={() => setSelectedId(agent.id)}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#FCFCFD';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                style={{
                  backgroundColor: isSelected ? '#F2F1F6' : 'transparent',
                  borderBottom: '1px solid #EDEDF0',
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
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F1F6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            style={{ color: '#6B4EFF' }}
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
                    const av = selected.meta.avatar || agentInitial(nameOf(selected));
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
                      {nameOf(selected)}
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
              <div className="flex items-center gap-2">
                {/* Acción primaria: abrir el chat propio del agente (sus hilos
                    contigo). Modelo Claude/ChatGPT/Trae: click agente → chatear. */}
                <button
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-colors"
                  onClick={() => openAgentChat(selected.id)}
                  style={{ backgroundColor: '#1C1C22' }}
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Abrir chat
                </button>
                {/* Estado del agente (activo/pausado). Secundario. */}
                <button
                  aria-pressed={!selectedDisabled}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                  onClick={() => toggleAgentDisabled(selected.id)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EDEDF0',
                    color: '#1C1C22',
                  }}
                  type="button"
                >
                  {selectedDisabled ? 'Reanudar' : 'Pausar'}
                </button>
              </div>
            </div>
          </div>

          {/* Pestañas del espacio del agente (modelo 18-ago) */}
          <div className="flex gap-1 px-6 pt-3" style={{ borderBottom: '1px solid #EDEDF0' }}>
            {([['chat', 'Chat'], ['resumen', 'Resumen'], ['config', 'Configuración']] as const).map(([key, label]) => (
              <button
                aria-current={fichaTab === key}
                className="px-3 py-2 text-sm font-medium transition-colors"
                key={key}
                onClick={() => setFichaTab(key)}
                style={{
                  borderBottom: fichaTab === key ? '2px solid #6B4EFF' : '2px solid transparent',
                  color: fichaTab === key ? '#6B4EFF' : '#84848F',
                  marginBottom: '-1px',
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Contenido ficha */}
          {fichaTab === 'chat' ? (
            /* FUSIÓN single-pane: el chat del agente EMBEBIDO. El iframe activa el modo embed
               automáticamente (win.self!==win.top → resolveChatEmbedMode) → oculta rail/header/
               paneles → solo conversación+input. El motor del chat NO se toca (corre como
               /asistente dentro del iframe). REGLA 0: Resumen/Config/acciones siguen intactos. */
            <div className="flex-1" style={{ minHeight: 0 }}>
              <iframe
                key={selected.id}
                src={`/asistente?session=${encodeURIComponent(selected.id)}`}
                style={{ border: 0, height: '100%', width: '100%' }}
                title={`Chat de ${nameOf(selected)}`}
              />
            </div>
          ) : (
          <div className="flex-1 overflow-auto px-6 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Rendimiento hoy — cablead 23-jul: métricas reales per-agente (api-ia) */}
              {fichaTab === 'resumen' && (
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EDEDF0' }}
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
              )}

              {/* Canales asignados — beta local */}
              {fichaTab === 'config' && (
              <>
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EDEDF0' }}
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
                        aria-pressed={isActive}
                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                        key={ch}
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
                {/* Puente Agente→Bandeja (17-ago): "sus conversaciones de cliente" =
                    Bandeja filtrada por su canal. Responde a "¿dónde veo las conversaciones
                    del agente?". v1 filtra por canal; el filtro por-agente exacto es backend
                    pendiente (asignación conversación→agente). */}
                <Link
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold"
                  href={bandejaClientsHref}
                  style={{ color: '#6B4EFF' }}
                >
                  Ver sus conversaciones de cliente →
                </Link>
              </div>

              {/* Instrucciones del agente — cableado a updateAgentConfig */}
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EDEDF0' }}
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
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = '#F2F1F6';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onChange={(e) => setPromptDraft(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#6B4EFF';
                  }}
                  rows={8}
                  style={{
                    backgroundColor: '#F2F1F6',
                    border: '1px solid transparent',
                    color: '#1C1C22',
                    resize: 'vertical',
                  }}
                  value={promptDraft}
                />
              </div>
              </>
              )}

              {/* Actividad reciente — feed en vivo por SSE (api-ia /api/messages/stream). */}
              {fichaTab === 'resumen' && (
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EDEDF0' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: '#1C1C22' }}>
                    Actividad reciente
                  </h3>
                  <span
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
                    title="Feed de actividad en tiempo real (SSE)"
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: '#16A34A' }}
                    />
                    EN VIVO
                  </span>
                </div>
                {activityEvents.length === 0 ? (
                  <p className="text-xs" style={{ color: '#9A9AA6' }}>
                    Cuando el agente responda o se produzca un handoff aparecerá aquí en tiempo real.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {activityEvents.map((evt) => (
                      <li className="flex items-start gap-2" key={evt.id}>
                        <span
                          className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: evt.type === 'handoff' ? '#DC2626' : '#16A34A',
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs" style={{ color: '#1C1C22' }}>
                            {evt.text}
                          </p>
                          {evt.timestamp ? (
                            <p className="text-[10px]" style={{ color: '#9A9AA6' }}>
                              {evt.timestamp}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              )}

              {/* Nota al pie. ISSUE-004 (informe dogfood 20-ago): la nota anterior exponía
                  estado interno ("se activarán cuando backend confirme shapes") — ya obsoleto:
                  métricas y asignación de canales están cableadas (api-ia, 23-jul) y el
                  responsable por conversación desplegado (api-mcp). Nota neutra y de usuario. */}
              <p className="text-center text-[11px] italic" style={{ color: '#9A9AA6' }}>
                Las instrucciones y la configuración de {nameOf(selected)} se guardan en
                la nube y se aplican a todas sus conversaciones.
              </p>
            </div>
          </div>
          )}
        </section>
      )}
    </div>
  );
}

// Silenciar warning TS por reservar el type (útil para futuros expandir)
export type _AgentActivity = AgentActivity;
