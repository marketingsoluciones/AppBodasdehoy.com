import { createContext, useState, useContext, useEffect, Dispatch, SetStateAction } from "react";
import { EditDefaultState, Event, filterGuest, planSpace } from "../utils/Interfaces";
import { EventsGroupContextProvider } from "./EventsGroupContext";
import { getAllFilterGuest } from "../utils/Funciones";
import { SocketContextProvider } from "./SocketContext";
import { AuthContextProvider } from "./AuthContext";

interface idxGroupEvent {
  idx: number
  isActiveStateSwiper: number
  event_id: string | null
}

interface filterGuests {
  sentados: filterGuest[]
  noSentados: filterGuest[]
  update: number
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
  allFilterGuests: filterGuests[]
  setAllFilterGuests: Dispatch<SetStateAction<filterGuests[]>>
  editDefault: EditDefaultTableAndElement | null
  setEditDefault: Dispatch<SetStateAction<EditDefaultTableAndElement>>
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
  allFilterGuests: [{ sentados: [], noSentados: [], update: 0 }],
  setAllFilterGuests: () => { },
  editDefault: null,
  setEditDefault: () => { }
})

const EventProvider = ({ children }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [invitadoCero, setInvitadoCero] = useState<string | null>(null);
  const [valir, setValir] = useState<boolean | null>(false);
  const [idxGroupEvent, setIdxGroupEvent] = useState<idxGroupEvent | null>({ idx: 0, isActiveStateSwiper: 0, event_id: null });
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider()
  const [planSpaceActive, setPlanSpaceActive] = useState<planSpace | null>(null);
  const [filterGuests, setFilterGuests] = useState<filterGuests>({ sentados: [], noSentados: [], update: 0 })
  const [allFilterGuests, setAllFilterGuests] = useState<filterGuests[]>([{ sentados: [], noSentados: [], update: 0 }])
  const [editDefault, setEditDefault] = useState<EditDefaultTableAndElement>()
  const { user } = AuthContextProvider()

  // Capturar eventos del cumulo y seleccionar uno
  useEffect(() => {
    if (eventsGroup && eventsGroup.length === 0) {
      //console.log(1012101)
      setEvent(null);
    }
    if (eventsGroup?.length > 0) {
      //console.log("seteando evento", 10001)
      if (!valir) {
        //console.log("seteando evento", 10002)
        if (eventsGroup?.length > 1) {
          //console.log("seteando evento", 10003)
          const eventsPendientes = eventsGroup.filter(item => item.estatus === "pendiente")
          const eventsGroupSort = eventsPendientes?.sort((a: any, b: any) => { return b.fecha_creacion - a.fecha_creacion })
          setEvent(eventsGroupSort?.find(elem => elem._id === user?.eventSelected));
        } else {
          //console.log("seteando evento", 10004, eventsGroup)
          setEvent(eventsGroup[0])
        }
        //console.log("seteando evento", 10005, eventsGroup)
        eventsGroup[0] && setValir(true)
      }
    }
  }, [eventsGroup, valir]);

  useEffect(() => {
    if (event?.planSpaceSelect) {
      //console.log("seteando planSpaceSelect")
      setPlanSpaceActive(event?.planSpace?.find(elem => elem?._id === event?.planSpaceSelect))
    }
  }, [event?.planSpaceSelect])

  useEffect(() => {
    //console.log("seteado PlanSpaceActive________________")
    //console.log("seteado PlanSpaceActive", planSpaceActive)
    //console.log("---------------------------------------")
  }, [planSpaceActive])

  useEffect(() => {
    if (event) {
      //console.log("seteado event _________________________")
      console.log("seteado event", event)
      const f1 = eventsGroup.findIndex(elem => elem?._id === event?._id)
      eventsGroup.splice(f1, 1, event)
      //console.log("SEUDO seteado eventsGroup", { ...eventsGroup })
      setEventsGroup({ type: "INITIAL_STATE", payload: [...eventsGroup] })
      setAllFilterGuests({ ...getAllFilterGuest(event), update: new Date().getTime() })
      //console.log("---------------------------------------")
    }
  }, [event])

  useEffect(() => {
    //console.log("seteado event.planSpaceSelect__________")
    //console.log("seteado event.planSpaceSelect", event?.planSpaceSelect)
    //console.log("---------------------------------------")
  }, [event?.planSpaceSelect])

  useEffect(() => {
    //console.log("seteado eventsGroup____________________")
    //console.log("seteado eventsGroup", eventsGroup)
    //console.log("---------------------------------------")
  }, [eventsGroup])

  return (
    <EventContext.Provider value={{ event, setEvent, invitadoCero, setInvitadoCero, idxGroupEvent, setIdxGroupEvent, planSpaceActive, setPlanSpaceActive, filterGuests, setFilterGuests, allFilterGuests, setAllFilterGuests, editDefault, setEditDefault }}>
      {children}
    </EventContext.Provider>
  );
};

const EventContextProvider = () => useContext(EventContext)
export { EventContextProvider, EventProvider };
