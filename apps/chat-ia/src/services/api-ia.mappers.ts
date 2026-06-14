/**
 * 🚧 Mapeadores api-ia → tipos del store de LobeChat (Opción A, lectura vía api-ia gateway).
 *
 * api-ia devuelve shapes PLANOS ({ data: [...] }); el store del chat espera tipos ricos
 * (ChatSessionList { sessions, sessionGroups }, ChatMessage[]). Estos mapeadores hacen la
 * traducción en UN solo sitio, de forma defensiva (campos opcionales con fallback), para que:
 *   1. Activar el flag USE_API_IA_ENDPOINTS sea un cambio mínimo y seguro.
 *   2. Si api-ia añade/renombra campos, solo se toca aquí (no 4 call-sites del store).
 *
 * ⚠️ El shape EXACTO de api-ia está pendiente de confirmar por BACKEND (solicitado 2026-06-03).
 * Mientras tanto, estos mapeadores son tolerantes: aceptan id|_id|sessionId, title|name|meta.title,
 * etc. NO se activan hasta que el flag esté en true y se haya verificado en E2E conjunto.
 */
import { UIChatMessage } from '@lobechat/types';

import { ChatSessionList, LobeAgentSession, LobeSessionType } from '@/types/session';

/** Una sesión "cruda" tal como podría llegar de api-ia (campos tolerantes). */
interface RawApiIaSession {
  _id?: string;
  config?: any;
  createdAt?: number | string;
  id?: string;
  meta?: { avatar?: string; description?: string; title?: string };
  model?: string;
  name?: string;
  pinned?: boolean;
  sessionId?: string;
  title?: string;
  updatedAt?: number | string;
}

const toDate = (v: number | string | undefined): Date =>
  v === undefined ? new Date(0) : new Date(v);

const toEpoch = (v: number | string | undefined): number => {
  if (v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Date.parse(v);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * Mapea una sesión cruda de api-ia → LobeAgentSession (lo mínimo que el store/UI necesita
 * para listar y abrir una conversación). Defensivo con los nombres de campo.
 */
export function mapApiIaSession(raw: RawApiIaSession): LobeAgentSession {
  const id = raw.id ?? raw._id ?? raw.sessionId ?? '';
  const title = raw.title ?? raw.name ?? raw.meta?.title ?? '';

  return {
    config: raw.config ?? ({} as any),
    createdAt: toDate(raw.createdAt),
    group: 'default',
    id,
    meta: {
      avatar: raw.meta?.avatar,
      description: raw.meta?.description,
      title,
    },
    model: raw.model,
    pinned: raw.pinned ?? false,
    type: LobeSessionType.Agent,
    updatedAt: toDate(raw.updatedAt),
  } as LobeAgentSession;
}

/**
 * Mapea el array plano de api-ia (getChatSessions) → ChatSessionList que espera useFetchSessions.
 * Agrupa todo en el grupo por defecto (api-ia aún no expone sessionGroups; cuando lo haga,
 * extender aquí). Filtra entradas sin id para no romper el render.
 */
export function mapApiIaSessionsToList(rawList: RawApiIaSession[] | undefined): ChatSessionList {
  // Defensa: api-ia puede devolver data NO-array cuando la query falla (success:false → data:0).
  // Sin este guard, (0).map() lanzaba y, con SWR suspense:true, dejaba la lista lateral en
  // ESQUELETO INFINITO (informe 14-jun: "lista lateral no carga"). data no-array = lista vacía.
  const safeList = Array.isArray(rawList) ? rawList : [];
  const sessions = safeList.map(mapApiIaSession).filter((s) => !!s.id);
  return {
    sessionGroups: [],
    sessions,
  };
}

/** Un mensaje "crudo" tal como podría llegar de api-ia (campos tolerantes). */
interface RawApiIaMessage {
  _id?: string;
  content?: string;
  createdAt?: number | string;
  id?: string;
  meta?: any;
  role?: string;
  sessionId?: string;
  text?: string;
  topicId?: string;
  updatedAt?: number | string;
}

/**
 * Mapea un mensaje crudo de api-ia → UIChatMessage (campos REQUERIDOS: content, createdAt,
 * id, meta, role, updatedAt). Defensivo con id|_id, content|text y normaliza role a minúsculas
 * (el store usa 'user'|'assistant'|'system'|'tool'). Campos ricos opcionales (fileList,
 * imageList, plugin...) se preservan si vienen; si no, el render los trata como undefined.
 */
export function mapApiIaMessage(raw: RawApiIaMessage): UIChatMessage {
  const createdAt = toEpoch(raw.createdAt);
  return {
    content: raw.content ?? raw.text ?? '',
    createdAt,
    id: raw.id ?? raw._id ?? '',
    meta: raw.meta ?? {},
    role: (raw.role ?? 'assistant').toLowerCase() as UIChatMessage['role'],
    sessionId: raw.sessionId,
    topicId: raw.topicId,
    updatedAt: toEpoch(raw.updatedAt) || createdAt,
  } as UIChatMessage;
}

/** Mapea el array plano de api-ia (getChatMessages) → UIChatMessage[], filtrando sin id. */
export function mapApiIaMessages(rawList: RawApiIaMessage[] | undefined): UIChatMessage[] {
  // Defensa: igual que las sesiones, api-ia puede dar data no-array (success:false). No lanzar.
  const safeList = Array.isArray(rawList) ? rawList : [];
  return safeList.map(mapApiIaMessage).filter((m) => !!m.id);
}
