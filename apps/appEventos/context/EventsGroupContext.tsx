import { createContext, useState, useContext, useEffect, SetStateAction, Dispatch, useReducer, Reducer, useCallback } from 'react';
import { AuthContextProvider } from "../context";
import { fetchApiBodas, fetchApiEventos, queries, getApiErrorMessage } from "../utils/Fetching";
import { Event, detalle_compartidos_array } from '../utils/Interfaces';
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
  const { user, config, verificationDone } = AuthContextProvider();
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
          // BYPASS: Verificar si hay eventos del bypass en sessionStorage
          const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
          const isTestEnv = hostname.includes('chat-test') || hostname.includes('app-test') || hostname.includes('test.') || hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('app-dev')
          const devBypass = typeof window !== 'undefined' && (localStorage.getItem('dev_bypass') === 'true' || sessionStorage.getItem('dev_bypass') === 'true')
          const bypassEventos = typeof window !== 'undefined' ? (localStorage.getItem('dev_bypass_eventos') || sessionStorage.getItem('dev_bypass_eventos')) : null

          if (isTestEnv && devBypass) {
            console.log("[EventsGroup] 🔓 Bypass activo, bypassEventos:", bypassEventos ? 'presente' : 'vacío')
            if (bypassEventos) {
              try {
                const eventos = JSON.parse(bypassEventos)
                console.log("[EventsGroup] 🔓 Usando eventos del bypass:", eventos.length)
                if (eventos && eventos.length > 0) {
                  setEventsGroup({ type: "INITIAL_STATE", payload: eventos })
                  setEventsGroupDone(true)
                  return // Saltar fetch normal
                }
              } catch (e) {
                console.error("[EventsGroup] Error parseando eventos del bypass:", e)
              }
            }
            // Si no hay eventos en bypass, intentar con el fetch normal
            console.log("[EventsGroup] Continuando con fetch normal...")
          }

          // Si estamos en bypass, usar el usuario_id del bypass
          const userIdToUse = user?.uid || ((localStorage.getItem('dev_bypass') === 'true' || sessionStorage.getItem('dev_bypass') === 'true') ? (localStorage.getItem('dev_bypass_uid') || sessionStorage.getItem('dev_bypass_uid')) : null)
          
          if (!userIdToUse) {
            console.warn("[EventsGroup] No hay user.uid disponible para buscar eventos")
            setEventsGroupDone(true)
            return
          }

          console.log("[EventsGroup] Buscando eventos para usuario_id:", userIdToUse)
          setEventsGroupError(false)
          setEventsGroupErrorMessage(null)
          setEventsGroupSessionExpired(false)
          setEventsGroupDone(false)  // Reset para que EventLoadingOrError muestre skeleton durante re-fetch
          const startTime = performance.now()
          let detailsStartTime = startTime

          // BUG-013: Buscar eventos propios Y compartidos en paralelo.
          // No usar .catch(() => []) por petición: un 500/timeout quedaba como "lista vacía" sin error en UI.
          Promise.allSettled([
            withTimeout(fetchApiEventos({
              query: queries.getEventsByID,
              variables: { variable: "usuario_id", valor: userIdToUse, development },
            }), GET_EVENTS_BY_ID_TIMEOUT_MS, "getEventsByID(usuario_id)"),
            withTimeout(fetchApiEventos({
              query: queries.getEventsByID,
              variables: { variable: "compartido_array", valor: userIdToUse, development },
            }), GET_EVENTS_BY_ID_TIMEOUT_MS, "getEventsByID(compartido_array)"),
          ]).then((results) => {
            const [ownedSettled, sharedSettled] = results;

            if (ownedSettled.status === "rejected" && sharedSettled.status === "rejected") {
              console.error(
                "[EventsGroup] queryenEvento: fallaron ambas consultas (usuario_id y compartido_array). development=",
                development,
                "uid(prefix)=",
                String(userIdToUse).slice(0, 10),
                ownedSettled.reason,
                sharedSettled.reason
              );
              throw ownedSettled.reason;
            }

            const owned: Event[] =
              ownedSettled.status === "fulfilled" ? coerceQueryenEventoList(ownedSettled.value) : [];
            const shared: Event[] =
              sharedSettled.status === "fulfilled" ? coerceQueryenEventoList(sharedSettled.value) : [];

            if (ownedSettled.status === "rejected") {
              console.warn("[EventsGroup] getEventsByID(usuario_id) falló:", ownedSettled.reason);
            }
            if (sharedSettled.status === "rejected") {
              console.warn("[EventsGroup] getEventsByID(compartido_array) falló:", sharedSettled.reason);
            }

            const seen = new Set<string>();
            const events: Event[] = [];
            for (const e of [...owned, ...shared]) {
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
                    // Eliminar TODAS las ocurrencias del usuario actual (fix duplicados)
                    event.compartido_array = event.compartido_array.filter(uid => uid !== user?.uid)
                    event.detalles_compartidos_array = event.detalles_compartidos_array?.filter(d => d.uid !== user?.uid) ?? []
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
                setEventsGroup({ type: "INITIAL_STATE", payload: values })
                setEventsGroupDone(true)
              })
            .catch((error) => {
              const errorTime = performance.now() - startTime
              const status = error?.response?.status
              console.error(`[EventsGroup] ❌ Error después de ${errorTime.toFixed(0)}ms (status ${status}):`, error)
              setEventsGroup({ type: "INITIAL_STATE", payload: [] })
              if (status === 401 || status === 403) {
                console.warn('[EventsGroup] 401/403: sesión expirada o no autorizada')
                setEventsGroupSessionExpired(true)
                setEventsGroupError(true)
                setEventsGroupDone(true)
                return
              }
              const friendlyMessage = getApiErrorMessage(error)
              setEventsGroupErrorMessage(friendlyMessage || null)
              setEventsGroupSessionExpired(false)
              setEventsGroupError(true)
              setEventsGroupDone(true)
            });
          fetchApiEventos({
            query: queries.getPsTemplate,
            variables: { uid: user.uid }
          })
            .then((templates: any) => {
              setPsTemplates(templates)
            })
            .catch((error) => console.log(error));
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
