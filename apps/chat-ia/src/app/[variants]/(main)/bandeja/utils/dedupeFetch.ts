/**
 * dedupeFetch — coalesce IN-FLIGHT identical GETs (H2, QA 5-ago).
 *
 * La Bandeja monta varias listas a la vez (feed `useRecentConversations` + detalle
 * `useConversations`, y a veces `ConversationListWithFallback`→`ConversationListInner`),
 * que piden EL MISMO recurso (`/whatsapp/conversations/{dev}`, `/conversations`) de forma
 * simultánea → 2-3 GET idénticos por apertura ("Cargando mensajes…" lento).
 *
 * Este helper NO cachea en el tiempo: solo comparte la promesa mientras una petición
 * idéntica está EN VUELO. En cuanto resuelve, se descarta del mapa → la siguiente petición
 * (p.ej. el refetch del SSE) vuelve a la red y NO sirve datos viejos. Cada consumidor recibe
 * un `clone()` de la Response, así puede leer status + body de forma independiente.
 */
const inflight = new Map<string, Promise<Response>>();

type FetchInit = Parameters<typeof fetch>[1];

export function dedupeFetch(url: string, init?: FetchInit): Promise<Response> {
  // Solo deduplicamos GET (las escrituras nunca se coalescen).
  const method = (init?.method || 'GET').toUpperCase();
  if (method !== 'GET') return fetch(url, init);

  const key = `${method} ${url}`;
  let pending = inflight.get(key);
  if (!pending) {
    pending = fetch(url, init).finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, pending);
  }
  // clone(): la Response original nunca se lee directamente; cada llamante lee su copia.
  return pending.then((res) => res.clone());
}
