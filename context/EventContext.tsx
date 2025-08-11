import { createContext, useState, useContext, useEffect, Dispatch, SetStateAction } from "react";
import { EditDefaultState, Event, filterGuest, planSpace } from "../utils/Interfaces";
import { EventsGroupContextProvider } from "./EventsGroupContext";
import { getAllFilterGuest } from "../utils/Funciones";
import { AuthContextProvider } from "./AuthContext";
import { fetchApiEventos, queries } from "../utils/Fetching";

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


const EventProvider = ({ children }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [invitadoCero, setInvitadoCero] = useState<string | null>(null);
  const [valir, setValir] = useState<boolean | null>(false);
  const [idxGroupEvent, setIdxGroupEvent] = useState<idxGroupEvent | null>({ idx: 0, isActiveStateSwiper: 0, event_id: null });
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider()
  const [planSpaceActive, setPlanSpaceActive] = useState<planSpace | null>(null);
  const [filterGuests, setFilterGuests] = useState<filterGuests>({ sentados: [], noSentados: [], update: 0 })
  const [allFilterGuests, setAllFilterGuests] = useState<filterGuests>({ sentados: [], noSentados: [], update: 0 })
  const [editDefault, setEditDefault] = useState<EditDefaultTableAndElement>()
  const { user, setUser } = AuthContextProvider()
  const [planSpaceSelect, setPlanSpaceSelect] = useState<string>("")

  // Capturar eventos del cumulo y seleccionar uno
  useEffect(() => {
    if (eventsGroup && eventsGroup.length === 0) {
      setEvent(null);
    }
    if (eventsGroup?.length > 0) {
      if (!valir) {
        if (eventsGroup?.length > 1) {
          const eventsPendientes = eventsGroup.filter(item => item.estatus === "pendiente")
          const eventsGroupSort = eventsPendientes?.sort((a: any, b: any) => { return b.fecha_creacion - a.fecha_creacion })
          setEvent(eventsGroupSort?.find(elem => elem._id === user?.eventSelected));
        } else {
          setEvent(eventsGroup[0])
        }
        eventsGroup[0] && setValir(true)
      }
    }
  }, [eventsGroup, valir]);

  useEffect(() => {
    setPlanSpaceActive(event?.planSpace?.find(elem => elem?._id === planSpaceSelect))
    console.log("seteado planSpaceActive")
  }, [event?.planSpace, planSpaceSelect])

  useEffect(() => {
    fetchApiEventos({
      query: queries.getPlanSpaceSelect,
      variables: {
        evento_id: event?._id,
        isOwner: user?.uid === event?.usuario_id
      },
    }).then(res => {
      setPlanSpaceSelect(res ? res as string : event?.planSpace[0]?._id)
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
export { EventContextProvider, EventProvider };
