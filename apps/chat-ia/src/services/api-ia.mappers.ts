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
  const sessions = (rawList ?? []).map(mapApiIaSession).filter((s) => !!s.id);
  return {
    sessionGroups: [],
    sessions,
  };
}
