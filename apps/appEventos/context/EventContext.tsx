import { createContext, useState, useContext, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { EditDefaultState, Event, filterGuest, planSpace } from "../utils/Interfaces";
import { EventsGroupContextProvider } from "./EventsGroupContext";
import { getAllFilterGuest, readCache, writeCache } from "../utils/Funciones";
import { AuthContextProvider } from "./AuthContext";
import { fetchApiEventos, fetchApiBodas, queries } from "../utils/Fetching";

interface idxGroupEvent {
  idx: number
  isActiveStateSwiper: number
  event_id: string | null
}

interface filterGuests {
  sentados?: filterGuest[]
  noSentados?: filterGuest[]
  update?: number
}

interface clicked {
  _id: string
  state: boolean
}
interface EditDefaultTableAndElement extends EditDefaultState {
  active?: boolean
  activeButtons?: boolean
  clicked?: {}
}

type Context = {
  event: Event
  setEvent: Dispatch<SetStateAction<Event>>
  invitadoCero: string | null
  setInvitadoCero: Dispatch<SetStateAction<string>>
  idxGroupEvent: idxGroupEvent
  setIdxGroupEvent: Dispatch<SetStateAction<idxGroupEvent | null>>
  planSpaceActive: planSpace | null
  setPlanSpaceActive: Dispatch<SetStateAction<planSpace>>
  filterGuests: filterGuests
  setFilterGuests: Dispatch<SetStateAction<filterGuests>>
  allFilterGuests: filterGuests
  setAllFilterGuests: Dispatch<SetStateAction<filterGuests>>
  editDefault: EditDefaultTableAndElement | null
  setEditDefault: Dispatch<SetStateAction<EditDefaultTableAndElement>>
  planSpaceSelect: string
  setPlanSpaceSelect: Dispatch<SetStateAction<string>>
}

const EventContext = createContext<Context>({
  event: null,
  setEvent: (event: Event): void => null,
  invitadoCero: null,
  setInvitadoCero: () => { },
  idxGroupEvent: null,
  setIdxGroupEvent: () => { },
  planSpaceActive: null,
  setPlanSpaceActive: () => { },
  filterGuests: { sentados: [], noSentados: [], update: 0 },
  setFilterGuests: () => { },
  allFilterGuests: { sentados: [], noSentados: [], update: 0 },
  setAllFilterGuests: () => { },
  editDefault: null,
  setEditDefault: () => { },
  planSpaceSelect: "",
  setPlanSpaceSelect: () => { }
})

export let GlobalCurrency = ""


const EventProvider = ({ children }: { children: React.ReactNode }) => {
  const [event, setEventRaw] = useState<Event | null>(null);

  // BUG-12 (informe QA 21-jun): handlers como handleClickCard llamaban setEvent(data)
  // directamente y NO persistían appEventos_activeEventId → al navegar a /mesas, /presupuesto
  // o cualquier módulo que lo lee del localStorage, seguían viendo el evento ANTERIOR.
  // Wrapper: cualquier setEvent actualiza el localStorage en una sola fuente de verdad.
  const setEvent: typeof setEventRaw = (updater) => {
    setEventRaw((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Event | null) => Event)(prev) : (updater as Event)
      try {
        if (typeof window !== 'undefined') {
          const prevId = prev?._id
          if (next?._id) {
            localStorage.setItem('appEventos_activeEventId', next._id)
          } else {
            localStorage.removeItem('appEventos_activeEventId')
          }
          // BUG-H-03/H-05 (informe QA 22-jun): notificar a otros provider/componentes
          // (Notifications, Copilot, etc.) que el evento activo cambió. Esto permite
          // que el sync useEffect de arriba reaccione inmediato sin esperar a
          // re-render del contexto.
          if (prevId !== next?._id) {
            window.dispatchEvent(new CustomEvent('appEventos:activeEventChanged', {
              detail: { eventId: next?._id, prevEventId: prevId }
            }))
          }
        }
      } catch { /* localStorage may throw in private mode */ }
      return next
    })
  }
  const [invitadoCero, setInvitadoCero] = useState<string | null>(null);
  const [valir, setValir] = useState<boolean | null>(false);
  const [idxGroupEvent, setIdxGroupEvent] = useState<idxGroupEvent | null>({ idx: 0, isActiveStateSwiper: 0, event_id: null });
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider()
  const [planSpaceActive, setPlanSpaceActive] = useState<planSpace | null>(null);
  const [filterGuests, setFilterGuests] = useState<filterGuests>({ sentados: [], noSentados: [], update: 0 })
  const [allFilterGuests, setAllFilterGuests] = useState<filterGuests>({ sentados: [], noSentados: [], update: 0 })
  const [editDefault, setEditDefault] = useState<EditDefaultTableAndElement | null>(null)
  const { user, setUser } = AuthContextProvider()
  const [planSpaceSelect, setPlanSpaceSelect] = useState<string>("")
  const { config } = AuthContextProvider()

  // BUG-H-03/H-05 + BUG-12 (informe QA 22-jun): el evento actual se quedaba con
  // el último cacheado aunque appEventos_activeEventId hubiese cambiado (Home →
  // /invitados → notificaciones mostraban evento incorrecto). Escuchamos cambios
  // del localStorage (storage event entre pestañas + custom event mismo tab) y
  // re-seleccionamos el evento si discrepa.
  //
  // BUG-CW-01 (informe QA 22-jun noche): la versión anterior tenía [event?._id,
  // eventsGroup] en deps → cada setEvent re-montaba el listener → re-ejecutaba
  // sync() → loop infinito (RangeError "Maximum call stack size exceeded").
  // Fix: leer event/eventsGroup vía ref (no recompilar el listener) +
  // dependencias VACÍAS para que el listener se monte UNA SOLA VEZ.
  const eventRef = useRef(event)
  const eventsGroupRef = useRef(eventsGroup)
  useEffect(() => { eventRef.current = event }, [event])
  useEffect(() => { eventsGroupRef.current = eventsGroup }, [eventsGroup])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => {
      const stored = localStorage.getItem('appEventos_activeEventId')
      if (!stored) return
      const currentEvent = eventRef.current
      const currentGroup = eventsGroupRef.current
      if (currentEvent?._id === stored) return
      if (!currentGroup?.length) return
      const found = currentGroup.find(e => e._id === stored)
      if (found && found._id !== currentEvent?._id) {
        setEventRaw(found)
      }
    }
    window.addEventListener('storage', sync)
    window.addEventListener('appEventos:activeEventChanged', sync as EventListener)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('appEventos:activeEventChanged', sync as EventListener)
    }
  }, [])

  // Capturar eventos del cumulo y seleccionar uno
  useEffect(() => {
    if (eventsGroup && eventsGroup.length === 0) {
      setEvent(null);
      setValir(false); // Permitir re-selección cuando eventsGroup vuelva a cargar
    }
    if (eventsGroup?.length > 0) {
      if (!valir) {
        if (eventsGroup?.length > 1) {
          const eventsPendientes = eventsGroup.filter(item => item.estatus === "pendiente")
          const eventsGroupSort = [...eventsPendientes].sort((a: any, b: any) => {
            return b.fecha_creacion - a.fecha_creacion
          })
          // Prioridad: localStorage (selección más reciente) > user.eventSelected (BD, puede estar desactualizado)
          const savedEventId = typeof window !== 'undefined' ? localStorage.getItem('appEventos_activeEventId') : null
          let eventSelected = savedEventId ? eventsGroup.find(elem => elem._id === savedEventId) : null
          if (!eventSelected && user?.eventSelected) {
            eventSelected = eventsGroupSort?.find(elem => elem._id === user?.eventSelected)
          }
          if (!eventSelected && user?.eventSelected) {
            eventSelected = eventsGroup.find(elem => elem._id === user?.eventSelected)
          }
          if (!eventSelected && eventsGroupSort?.length) {
            eventSelected = eventsGroupSort[0]
          }
          if (!eventSelected) {
            eventSelected = eventsGroup[0]
          }
          if (eventSelected) {
            if (!eventSelected?.timeZone) {
              const defaultTimeZone = config?.timeZone || "UTC";
              eventSelected.timeZone = defaultTimeZone;
              fetchApiBodas({
                query: queries.eventUpdate,
                variables: { idEvento: eventSelected?._id, input: { timeZone: defaultTimeZone } },
                token: null
              }).catch(() => {})
            }
            setEvent({ ...eventSelected });
            if (typeof window !== 'undefined') localStorage.setItem('appEventos_activeEventId', eventSelected._id)
          }
        } else {
          let eventSelected = eventsGroup[0]
          if (!eventSelected?.timeZone) {
            const defaultTimeZone = config?.timeZone || "UTC";
            eventSelected.timeZone = defaultTimeZone;
            fetchApiBodas({
              query: queries.eventUpdate,
              variables: { idEvento: eventSelected?._id, input: { timeZone: defaultTimeZone } },
              token: null
            }).catch(() => {})
          }
          setEvent({ ...eventSelected });
          if (typeof window !== 'undefined') localStorage.setItem('appEventos_activeEventId', eventSelected._id)
        }
        eventsGroup[0] && setValir(true)
      } else if (user?.eventSelected && (!event?._id || user.eventSelected !== event?._id)) {
        // user.eventSelected llegó tarde (API async) o cambió en otra pestaña → re-seleccionar
        setValir(false);
      }
    }
  }, [eventsGroup, valir, user?.eventSelected]);

  useEffect(() => {
    const found = event?.planSpace?.find(elem => elem?._id === planSpaceSelect)
    setPlanSpaceActive(found)
    // Robustez: si el id seleccionado no corresponde a ningún plano (id vacío o plano
    // borrado) pero SÍ existen planos, auto-seleccionar el primero para no dejar el lienzo
    // en blanco. Si no hay planos, no hace nada (se muestra el mensaje "No hay plano cargado").
    if (!found && (event?.planSpace?.length ?? 0) > 0 && planSpaceSelect !== event.planSpace[0]?._id) {
      setPlanSpaceSelect(event.planSpace[0]._id)
    }
  }, [event?.planSpace, planSpaceSelect])

  useEffect(() => {
    // Solo ejecutar cuando hay un event._id válido
    if (!event?._id) return;

    // Cache TTL 5 min: getPlanSpaceSelect devuelve el id del plan space
    // activo. Cambia poco, se llama en cada cambio de evento.
    const cacheKey = `planSpaceSelect_${event._id}`
    const cached = readCache<string>(cacheKey, 5 * 60 * 1000)
    if (cached !== null) {
      setPlanSpaceSelect(cached || event?.planSpace?.[0]?._id || '')
      return
    }

    fetchApiEventos({
      query: queries.getPlanSpaceSelect,
      variables: {
        evento_id: event._id,
      },
    }).then(res => {
      const id = res ? (res as string) : (event?.planSpace?.[0]?._id || '')
      setPlanSpaceSelect(id)
      if (typeof id === 'string') writeCache(cacheKey, id)
    }).catch(err => {
      console.log("[EventContext] Error getting planSpaceSelect:", err)
    })
  }, [event?._id])

  useEffect(() => {
    if (event) {
      GlobalCurrency = event?.presupuesto_objeto?.currency
      console.log("seteado event", event)
      const f1 = eventsGroup?.findIndex(elem => elem?._id === event?._id)
      if (f1 > -1) {
        eventsGroup.splice(f1, 1, event)
        setEventsGroup({ type: "INITIAL_STATE", payload: [...eventsGroup] })
        setAllFilterGuests({ ...getAllFilterGuest(event), update: new Date().getTime() })
      }
    }
  }, [event])

  return (
    <EventContext.Provider value={{ event, setEvent, invitadoCero, setInvitadoCero, idxGroupEvent, setIdxGroupEvent, planSpaceActive, setPlanSpaceActive, filterGuests, setFilterGuests, allFilterGuests, setAllFilterGuests, editDefault, setEditDefault, planSpaceSelect, setPlanSpaceSelect }}>
      {children}
    </EventContext.Provider>
  );
};

const EventContextProvider = () => useContext(EventContext)

export default EventContext;
export { EventContextProvider, EventProvider };
