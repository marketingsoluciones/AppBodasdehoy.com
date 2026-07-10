import { createContext, useState, useContext, useEffect, SetStateAction, Dispatch, useReducer, Reducer, useCallback, useRef } from 'react';
import { AuthContextProvider } from "../context";
import { fetchApiBodas, fetchApiEventos, queries, getApiErrorMessage } from "../utils/Fetching";
import { Event, detalle_compartidos_array } from '../utils/Interfaces';
import { readCache, writeCache } from '../utils/Funciones';
import { useRouter, usePathname } from 'next/navigation';
import { getDevelopmentNameFromHostname } from '@bodasdehoy/shared/types';

/** Estado de filtro activo enviado por el Copilot via postMessage FILTER_VIEW */
export interface CopilotFilter {
  /** Tipo de entidad filtrada: 'events' | 'guests' | 'tables' | ... */
  entity: string;
  /** IDs de los resultados (opcional) */
  ids?: string[];
  /** Texto de búsqueda original, para mostrar al usuario */
  query?: string;
}

type Context = {
  eventsGroup: Event[],
  setEventsGroup: Dispatch<SetStateAction<any>>
  psTemplates: any,
  setPsTemplates: Dispatch<SetStateAction<any>>
  eventsGroupDone: boolean,
  eventsGroupError: boolean,
  /** Mensaje amigable cuando falla la carga (502, etc.). Si null, error genérico. */
  eventsGroupErrorMessage: string | null,
  /** true cuando la API devuelve 401/403 — sesión expirada, no error de servidor */
  eventsGroupSessionExpired: boolean,
  copilotFilter: CopilotFilter | null,
  setCopilotFilter: (filter: CopilotFilter | null) => void,
  clearCopilotFilter: () => void,
  refreshEventsGroup: () => void,
}
const EventsGroupContext = createContext<Context>({
  eventsGroup: null,
  setEventsGroup: () => { },
  psTemplates: [],
  setPsTemplates: () => { },
  eventsGroupDone: false,
  eventsGroupError: false,
  eventsGroupErrorMessage: null,
  eventsGroupSessionExpired: false,
  copilotFilter: null,
  setCopilotFilter: () => { },
  clearCopilotFilter: () => { },
  refreshEventsGroup: () => { },
});

enum actions {
  EDIT_EVENT,
  INITIAL_STATE,
  ADD_EVENT,
  DELETE_EVENT,
  UPDATE_A_EVENT
}

/** Límite por consulta getEventsByID (GraphQL HTTP). Alineado con tolerancia a API lenta / red móvil (servidor SSR usa 15s en fetchApiEventosServer). */
const GET_EVENTS_BY_ID_TIMEOUT_MS = 20_000;

/** queryenEvento puede devolver array u objeto envoltorio según versión del backend. */
function coerceQueryenEventoList(value: unknown): Event[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as Event[];
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (Array.isArray(o.eventos)) return o.eventos as Event[];
    if (Array.isArray(o.events)) return o.events as Event[];
    if (Array.isArray(o.data)) return o.data as Event[];
    if (Array.isArray(o.results)) return o.results as Event[];
    if (typeof o._id === 'string') return [value as Event];
  }
  return [];
}

type action = {
  type: keyof typeof actions;
  payload: any;
};

const reducerAction: Reducer<Event[], action> = (state: Event[], action: action) => {
  if (!action || typeof (action as action).type !== "string") {
    console.warn("[EventsGroup] dispatch ignorado: acción inválida (esperado { type, payload })", action);
    return state;
  }
  switch (action.type) {
    case "EDIT_EVENT":
      return state.reduce((acc: Event[], item: Event) => {
        if (item._id === action.payload._id) {
          item = { ...item, ...action.payload }
        }
        acc.push(item)
        return acc
      }, [])
      break;
    case "INITIAL_STATE":
      return action.payload
      break
    case "ADD_EVENT":
      return [...state, action.payload]
      break
    case "DELETE_EVENT":
      return state.filter(event => event._id !== action.payload)
      break
    default:
      return state
      break;
  }
}

const EventsGroupProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [eventsGroup, setEventsGroup] = useReducer(reducerAction, []);
  const [psTemplates, setPsTemplates] = useState<any>([]);
  const { user, config, verificationDone, storage_id } = AuthContextProvider();
  const [isMounted, setIsMounted] = useState(false)
  const [eventsGroupDone, setEventsGroupDone] = useState(false)
  const [eventsGroupError, setEventsGroupError] = useState(false)
  const [eventsGroupErrorMessage, setEventsGroupErrorMessage] = useState<string | null>(null)
  const [eventsGroupSessionExpired, setEventsGroupSessionExpired] = useState(false)
  const [copilotFilter, setCopilotFilterState] = useState<CopilotFilter | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const setCopilotFilter = useCallback((filter: CopilotFilter | null) => setCopilotFilterState(filter), [])
  const clearCopilotFilter = useCallback(() => setCopilotFilterState(null), [])
  const refreshEventsGroup = useCallback(() => setRefreshTrigger(t => t + 1), [])
  // Auto-recuperación: reintentos acotados si el fetch de eventos falla de forma transitoria
  // (token aún no refrescado tras un refresh, 502/timeout). Evita que "Mis eventos" quede
  // congelado en vacío hasta hacer logout/login. Se resetea al primer fetch con éxito.
  const eventsRetryRef = useRef(0)
  const MAX_EVENTS_RETRIES = 4
  const withTimeout = useCallback(<T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms)
    })
    return Promise.race([
      promise.finally(() => {
        if (timer !== undefined) clearTimeout(timer)
      }),
      timeoutPromise,
    ])
  }, [])

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    // public-itinerary: igual que public-card — no vaciar eventsGroup para guest (EventContext haría setEvent(null) y la vista pública pasaría a 404 tras el timeout de auth ~5s)
    if (!["servicios", "credic-card", "public-card", "public-itinerary"].includes(pathname.split("/")[1]) || (user?.displayName !== "anonymous" && user?.displayName !== "guest")) {
      if (verificationDone) {
        if (user) {
          // Usuario guest: restaurar eventos de localStorage (no hay API para guests)
          if (user.displayName === 'guest' || user.displayName === 'anonymous') {
            // Limpiar siempre primero — evita que queden eventos del usuario anterior
            setEventsGroup({ type: "INITIAL_STATE", payload: [] })
            setEventsGroupError(false)
            setEventsGroupErrorMessage(null)
            setEventsGroupSessionExpired(false)
            try {
              const key = `guest_events_${user.uid}`
              const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
              if (stored) {
                const events = JSON.parse(stored)
                if (Array.isArray(events) && events.length > 0) {
                  setEventsGroup({ type: "INITIAL_STATE", payload: events })
                }
              }
            } catch { /* si no hay localStorage, ignorar */ }
            setEventsGroupDone(true)
            return
          }
          // `development` en GraphQL (String!): usar config si ya existe; si no, hostname (evita bloqueo eterno en carrera de effects).
          const development =
            config?.development ||
            (typeof window !== 'undefined' ? getDevelopmentNameFromHostname(window.location.hostname) : 'bodasdehoy');
          const userIdToUse = user?.uid
          
          if (!userIdToUse) {
            console.warn("[EventsGroup] No hay user.uid disponible para buscar eventos")
            setEventsGroupDone(true)
            return
          }

          // BUG-10 cache offline (informe QA 21-jun): cache de eventos con TTL.
          // Refactorizado al helper de utils/Funciones.ts (readCache/writeCache).
          // TTL 24h — los eventos cambian poco; si el usuario los modifica desde la app
          // invalidamos manualmente vía writeCachedEvents. Al recargar la página el usuario
          // ve sus eventos instantáneo (stale) y el fetch refresca en background.
          const cacheKey = `events_${development}_${userIdToUse}`
          const CACHE_TTL_MS = 24 * 60 * 60 * 1000
          const readCachedEvents = (): any[] | null => {
            const cached = readCache<any[]>(cacheKey, CACHE_TTL_MS)
            return Array.isArray(cached) ? cached : null
          }
          const writeCachedEvents = (events: any[]) => {
            writeCache(cacheKey, events)
          }

          console.log("[EventsGroup] Buscando eventos para usuario_id:", userIdToUse)
          setEventsGroupError(false)
          setEventsGroupErrorMessage(null)
          setEventsGroupSessionExpired(false)
          // BUG-10 cache offline: si hay cache válido (TTL 24h) pintamos inmediato
          // mientras el fetch refresca en background. Mejor UX y resistente a red lenta.
          const cachedAtStart = readCachedEvents()
          if (cachedAtStart && cachedAtStart.length > 0) {
            setEventsGroup({ type: "INITIAL_STATE", payload: cachedAtStart })
            setEventsGroupDone(true)
          } else {
            setEventsGroupDone(false)  // Reset para que EventLoadingOrError muestre skeleton durante re-fetch
          }
          const startTime = performance.now()
          let detailsStartTime = startTime

          // Migración apiapp→api-mcp 2026-05-27: getEventosByUsuario(usuario_id) devuelve
          // owned + shared en 1 sola call (securityFilter $or [usuario_id, compartido_array]).
          // Reemplaza las 2 llamadas queryenEvento (apiapp legacy) → fetchApiBodas (api-mcp).
          // No usar .catch(() => []): un 500/timeout debe propagar error a UI, no "lista vacía".
          const requests: Promise<unknown>[] = [
            withTimeout(
              fetchApiBodas({
                query: queries.getEventosByUsuario,
                variables: { uid: userIdToUse, pag: { page: 1, limit: 1000 }, dev: development },
                development,
              }),
              GET_EVENTS_BY_ID_TIMEOUT_MS,
              "getEventosByUsuario",
            ),
          ]

          if (storage_id && storage_id !== userIdToUse) {
            requests.push(
              withTimeout(
                fetchApiBodas({
                  query: queries.getEventosByUsuario,
                  variables: { uid: storage_id, pag: { page: 1, limit: 1000 }, dev: development },
                  development,
                }),
                GET_EVENTS_BY_ID_TIMEOUT_MS,
                "getEventosByUsuario(storage_id)",
              ),
            )
          }

          Promise.allSettled(requests).then((results) => {
            let hadFulfilled = false
            let firstError: unknown = null
            const list: Event[] = []

            for (const settled of results) {
              // fetchApiBodas devuelve null en errores GraphQL (token caducado/auth) SIN lanzar.
              // Tratar ese null como FALLO, no como "0 eventos": si no, un refresh con token
              // stale pinta lista vacía engañosa (y obligaba a logout/login para recuperar).
              if (settled.status === "fulfilled" && settled.value !== null) {
                hadFulfilled = true
                list.push(...coerceQueryenEventoList(settled.value))
              } else if (!firstError) {
                firstError = settled.status === "rejected"
                  ? settled.reason
                  : new Error("getEventosByUsuario devolvió null (posible error GraphQL/token caducado)")
              }
            }

            if (!hadFulfilled) {
              console.error(
                "[EventsGroup] getEventosByUsuario falló. development=",
                development,
                "uid(prefix)=",
                String(userIdToUse).slice(0, 10),
                firstError,
              )
              throw firstError
            }

            const seen = new Set<string>();
            const events: Event[] = [];
            for (const e of list) {
              if (e?._id && !seen.has(e._id)) { seen.add(e._id); events.push(e); }
            }
            return events;
          }).then((events: Event[]) => {
              const fetchTime = performance.now() - startTime
              console.log(`[EventsGroup] ✅ Eventos obtenidos en ${fetchTime.toFixed(0)}ms, total: ${events?.length || 0}`)
              const noRedirectPaths = ["RelacionesPublicas", "facturacion", "event", "public-card", "public-itinerary", "login", "confirmar-asistencia", "info-app", ""];
              if (!noRedirectPaths.includes(pathname.split("/")[1])) {
                setTimeout(() => {
                  if (events.length === 0) router.push("/")
                }, 100);
              }
              console.log(`[EventsGroup] Cargando detalles de usuarios para ${events.length} eventos...`)
              detailsStartTime = performance.now()

              const normalizedEvents = events.map((event, index) => {
                if (event?.compartido_array?.length) {
                  console.log(`[EventsGroup] Procesando evento ${index + 1}/${events.length}: ${event.nombre || event._id}`)
                  const fMyUid = event?.compartido_array?.findIndex(elem => elem === user?.uid)
                  if (fMyUid > -1) {
                    event.permissions = [...event.detalles_compartidos_array[fMyUid].permissions]
                    event.compartido_array.splice(fMyUid, 1)
                    event.detalles_compartidos_array?.splice(fMyUid, 1)
                  }
                }
                return event
              })

              const allUidsSet = new Set<string>()
              normalizedEvents.forEach((event) => {
                if (Array.isArray(event?.compartido_array)) {
                  event.compartido_array.forEach((uid) => uid && allUidsSet.add(uid))
                }
                if (event?.usuario_id && user?.uid !== event?.usuario_id) {
                  allUidsSet.add(event.usuario_id)
                }
              })
              const allUids = Array.from(allUidsSet)

              if (allUids.length === 0) {
                return normalizedEvents
              }

              // Backend legacy/proxy puede exponer un esquema getUsers incompatible.
              // Para no bloquear flujo principal (seleccionar evento / invitados),
              // degradamos en modo resiliente y omitimos enriquecimiento de usuarios.
              return normalizedEvents

            }).then((values) => {
                const totalTime = performance.now() - startTime
                const detailsTime = performance.now() - detailsStartTime
                console.log(`[EventsGroup] ✅ Detalles cargados en ${detailsTime.toFixed(0)}ms`)
                console.log(`[EventsGroup] ✅ TOTAL tiempo de carga: ${totalTime.toFixed(0)}ms (${(totalTime/1000).toFixed(1)}s)`)
                // No cachear vacío: evita que un fetch fallido/vacío pise un cache bueno.
                if (Array.isArray(values) && values.length > 0) writeCachedEvents(values)
                setEventsGroup({ type: "INITIAL_STATE", payload: values })
                setEventsGroupDone(true)
                eventsRetryRef.current = 0 // fetch OK → resetear contador de reintentos
              })
            .catch((error) => {
              const errorTime = performance.now() - startTime
              const status = error?.response?.status
              console.error(`[EventsGroup] ❌ Error después de ${errorTime.toFixed(0)}ms (status ${status}):`, error)
              // Reintento automático acotado (backoff 1s/2s/4s/8s) para fallos transitorios:
              // token aún no refrescado tras un refresh, 502/503, timeout o null por GraphQL.
              // Así la lista se auto-recupera sin logout/login. NO se reintenta en 401/403.
              const scheduleEventsRetry = () => {
                if (eventsRetryRef.current < MAX_EVENTS_RETRIES) {
                  eventsRetryRef.current += 1
                  const delay = Math.min(1000 * 2 ** (eventsRetryRef.current - 1), 8000)
                  console.warn(`[EventsGroup] reintento automático ${eventsRetryRef.current}/${MAX_EVENTS_RETRIES} en ${delay}ms`)
                  setTimeout(() => setRefreshTrigger((t) => t + 1), delay)
                }
              }
              if (status === 401 || status === 403) {
                console.warn('[EventsGroup] 401/403: sesión expirada o no autorizada')
                setEventsGroup({ type: "INITIAL_STATE", payload: [] })
                setEventsGroupSessionExpired(true)
                setEventsGroupError(true)
                setEventsGroupDone(true)
                return
              }
              const friendlyMessage = getApiErrorMessage(error)
              const cached = readCachedEvents()
              // Cualquier error transitorio (502/503, timeout, o null por token caducado): si hay
              // cache válido, mostrar los eventos guardados en vez de una lista vacía engañosa.
              // Así un refresh con token stale NO borra la vista (antes obligaba a logout/login).
              if (cached && cached.length > 0) {
                setEventsGroup({ type: "INITIAL_STATE", payload: cached })
                setEventsGroupErrorMessage(`${friendlyMessage || 'No se pudieron actualizar los eventos ahora.'} Mostrando datos guardados.`)
                setEventsGroupSessionExpired(false)
                setEventsGroupError(true)
                setEventsGroupDone(true)
                scheduleEventsRetry() // refresca a datos frescos en background
                return
              }
              setEventsGroup({ type: "INITIAL_STATE", payload: [] })
              setEventsGroupErrorMessage(friendlyMessage || null)
              setEventsGroupSessionExpired(false)
              setEventsGroupError(true)
              setEventsGroupDone(true)
              scheduleEventsRetry() // caso "vacío engañoso": auto-recuperar sin logout/login
            });
          // NOTE 2026-05-15: backend schema cambió — getPsTemplate ahora requiere
          // `evento_id: ID!` que este contexto NO tiene (se carga antes de seleccionar
          // evento). Llamada deshabilitada para evitar spam GraphQL validation errors
          // que saturan webpack dev (vía /api/dev/browser-log). Los componentes que
          // necesiten plantillas (BlockPlantillas en Mesas) las cargan demand-driven
          // cuando ya hay event._id en scope.
          setPsTemplates([])
        } else {
          setEventsGroupDone(true)
        }
      }
    }
  }, [user, config?.development, refreshTrigger, verificationDone, pathname]);

  return (
    <EventsGroupContext.Provider value={{ eventsGroup, setEventsGroup, psTemplates, setPsTemplates, eventsGroupDone, eventsGroupError, eventsGroupErrorMessage, eventsGroupSessionExpired, copilotFilter, setCopilotFilter, clearCopilotFilter, refreshEventsGroup }}>
      {children}
    </EventsGroupContext.Provider>
  );
};

const EventsGroupContextProvider = () => useContext(EventsGroupContext);
export { EventsGroupContextProvider, EventsGroupProvider };
