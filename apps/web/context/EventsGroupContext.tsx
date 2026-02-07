import { createContext, useState, useContext, useEffect, SetStateAction, Dispatch, useReducer, Reducer } from 'react';
import { AuthContextProvider } from "../context";
import { fetchApiBodas, fetchApiEventos, queries } from "../utils/Fetching";
import { Event, detalle_compartidos_array } from '../utils/Interfaces';
import { useRouter, usePathname } from 'next/navigation';

type Context = {
  eventsGroup: Event[],
  setEventsGroup: Dispatch<SetStateAction<any>>
  psTemplates: any,
  setPsTemplates: Dispatch<SetStateAction<any>>
  eventsGroupDone: boolean,
}
const EventsGroupContext = createContext<Context>({
  eventsGroup: null,
  setEventsGroup: () => { },
  psTemplates: [],
  setPsTemplates: () => { },
  eventsGroupDone: false,
});

enum actions {
  EDIT_EVENT,
  INITIAL_STATE,
  ADD_EVENT,
  DELETE_EVENT,
  UPDATE_A_EVENT
}

type action = {
  type: keyof typeof actions;
  payload: any;
};

const reducerAction: Reducer<Event[], action> = (state: Event[], action: action) => {
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

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    if (!["servicios", "credic-card", "public-card"].includes(pathname.split("/")[1]) || (user?.displayName !== "anonymous" && user?.displayName !== "guest")) {
      if (verificationDone) {
        if (user) {
          // BYPASS: Verificar si hay eventos del bypass en sessionStorage
          const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
          const isTestEnv = hostname.includes('chat-test') || hostname.includes('app-test') || hostname.includes('test.') || hostname.includes('localhost') || hostname.includes('127.0.0.1')
          const devBypass = typeof window !== 'undefined' && sessionStorage.getItem('dev_bypass') === 'true'
          const bypassEventos = typeof window !== 'undefined' ? sessionStorage.getItem('dev_bypass_eventos') : null

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
          const userIdToUse = user?.uid || (sessionStorage.getItem('dev_bypass') === 'true' ? sessionStorage.getItem('dev_bypass_uid') : null)
          
          if (!userIdToUse) {
            console.warn("[EventsGroup] No hay user.uid disponible para buscar eventos")
            return
          }

          console.log("[EventsGroup] Buscando eventos para usuario_id:", userIdToUse)

          fetchApiEventos({
            query: queries.getEventsByID,
            variables: { variable: "usuario_id", valor: userIdToUse, development: config?.development },
          })
            .then((events: Event[]) => {
              if (!["RelacionesPublicas", "facturacion", "event", "public-card", "public-itinerary"].includes(pathname.split("/")[1])) {
                setTimeout(() => {
                  if (events.length === 0) router.push("/")
                }, 100);
              }
              Promise.all(
                events.map(async (event) => {
                  if (event?.compartido_array?.length) {
                    const fMyUid = event?.compartido_array?.findIndex(elem => elem === user?.uid)
                    if (fMyUid > -1) {
                      event.permissions = [...event.detalles_compartidos_array[fMyUid].permissions]
                      event.compartido_array.splice(fMyUid, 1)
                      event.detalles_compartidos_array?.splice(fMyUid, 1)
                    }
                    const results = await fetchApiBodas({
                      query: queries?.getUsers,
                      variables: { uids: user?.uid === event?.usuario_id ? event?.compartido_array : [...event?.compartido_array, event?.usuario_id] },
                      development: config?.development
                    });
                    (Array.isArray(results) ? results : []).forEach((result: detalle_compartidos_array) => {
                      const f1 = event.detalles_compartidos_array?.findIndex(elem => elem.uid === result.uid);
                      if (f1 > -1) {
                        event.detalles_compartidos_array?.splice(f1, 1, { ...event.detalles_compartidos_array[f1], ...result });
                      }
                      if (result.uid === event?.usuario_id) {
                        event.detalles_usuario_id = result
                      }
                    })
                  }
                  return event
                })
              ).then((values) => {
                setEventsGroup({ type: "INITIAL_STATE", payload: values })
                setEventsGroupDone(true)
              })
            })
            .catch((error) => console.log(error));
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
  }, [user]);

  return (
    <EventsGroupContext.Provider value={{ eventsGroup, setEventsGroup, psTemplates, setPsTemplates, eventsGroupDone }}>
      {children}
    </EventsGroupContext.Provider>
  );
};

const EventsGroupContextProvider = () => useContext(EventsGroupContext);
export { EventsGroupContextProvider, EventsGroupProvider };
