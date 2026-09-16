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
