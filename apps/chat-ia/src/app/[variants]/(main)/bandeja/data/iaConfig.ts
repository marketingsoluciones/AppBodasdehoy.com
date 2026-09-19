/**
 * data/iaConfig — nivel de IA del workspace (manual · copilot · autopilot).
 *
 * M1 (16-09). Esta configuración se pedía y se guardaba con dos `fetch` sueltos dentro de
 * ConversationHeader, sin credenciales. Cuando el proxy empezó a exigir token, el GET pasó a
 * devolver 401 y el nivel real del workspace se perdía en silencio (siempre 'copilot'), y el
 * POST fallaba sin que nadie se enterara porque un 401 no lanza excepción. Aquí las
 * credenciales las pone la capa y el error se devuelve, no se traga.
 */

import { buildHeaders } from '../utils/auth';
import { dedupeFetch } from '../utils/dedupeFetch';

export type IaLevel = 'autopilot' | 'copilot' | 'manual';

const isIaLevel = (v: unknown): v is IaLevel =>
  v === 'manual' || v === 'copilot' || v === 'autopilot';

const url = (development: string) =>
  `/api/messages/workspace/${encodeURIComponent(development)}/ia-config`;

/** Nivel guardado, o null si no se puede determinar (quien llama decide el defecto). */
export async function getIaLevel(development: string): Promise<IaLevel | null> {
  // dedupeFetch: la cabecera se monta dos veces al abrir una conversación.
  const res = await dedupeFetch(url(development), { headers: buildHeaders() });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const level = json?.config?.ia_level;
  return isIaLevel(level) ? level : null;
}

/** Guarda el nivel. Devuelve false si el backend lo rechaza, para que la UI no mienta. */
export async function saveIaLevel(development: string, level: IaLevel): Promise<boolean> {
  const res = await fetch(url(development), {
    body: JSON.stringify({ ia_level: level }),
    headers: buildHeaders(),
    method: 'POST',
  });
  return res.ok;
}

/** De dónde sale el modo que se está aplicando a una conversación. */
export type IaLevelSource = 'conversation' | 'default' | 'workspace';

export interface ConversationIaLevel {
  level: IaLevel;
  /** `conversation` = tiene su propio modo · `workspace` = hereda el de la bandeja. */
  source: IaLevelSource;
}

const convUrl = (conversationId: string, development: string) =>
  `/api/messages/conversations/${encodeURIComponent(conversationId)}/ia-level?development=${encodeURIComponent(development)}`;

/**
 * Modo de IA de UNA conversación.
 *
 * api-ia lo resuelve en cascada: si la conversación tiene override lo devuelve con
 * `source: 'conversation'`; si no, hereda el de la marca (`source: 'workspace'`). Por eso la
 * interfaz puede distinguir "esta conversación está en automático" de "toda la bandeja lo
 * está", que para quien atiende no es lo mismo.
 */
export async function getConversationIaLevel(
  conversationId: string,
  development: string,
): Promise<ConversationIaLevel | null> {
  const res = await dedupeFetch(convUrl(conversationId, development), { headers: buildHeaders() });

  // 404 `conversation_not_found`: api-ia resuelve esta ruta contra su Redis, y las
  // conversaciones de WhatsApp viven en api-mcp, así que ahí no están. No es que no tengan
  // modo: es que no pueden tener uno propio todavía. Se enseña el de la marca, que es el que
  // de verdad se les aplica, marcado como heredado. Dejar la fila en blanco escondería que
  // esa conversación puede estar respondiendo sola.
  if (res.status === 404) {
    const heredado = await getIaLevel(development);
    return heredado ? { level: heredado, source: 'workspace' } : null;
  }
  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  return isIaLevel(json?.level)
    ? { level: json.level, source: (json?.source as IaLevelSource) ?? 'workspace' }
    : null;
}

/**
 * Cambia el modo de esa conversación. `null` borra el override y vuelve a heredar el de la
 * bandeja, que es justo lo que hace falta para poder deshacer sin adivinar el valor global.
 */
export async function saveConversationIaLevel(
  conversationId: string,
  development: string,
  level: IaLevel | null,
): Promise<boolean> {
  const res = await fetch(convUrl(conversationId, development), {
    body: JSON.stringify({ level }),
    headers: buildHeaders(),
    method: 'PUT',
  });
  return res.ok;
}
