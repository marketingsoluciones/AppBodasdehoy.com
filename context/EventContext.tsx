import { createContext, useState, useContext, useEffect, Dispatch, SetStateAction } from "react";
import { Event, planSpace } from "../utils/Interfaces";
import { EventsGroupContextProvider } from "./EventsGroupContext";

interface idxGroupEvent {
  idx: number
  isActiveStateSwiper: number
  event_id: string | null
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
}

const EventContext = createContext<Context>({
  event: null,
  setEvent: (event: Event): void => null,
  invitadoCero: null,
  setInvitadoCero: () => { },
  idxGroupEvent: null,
  setIdxGroupEvent: () => { },
  planSpaceActive: null,
  setPlanSpaceActive: () => { }
});

const EventProvider = ({ children }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [invitadoCero, setInvitadoCero] = useState<string | null>(null);
  const [valir, setValir] = useState<boolean | null>(false);
  const [idxGroupEvent, setIdxGroupEvent] = useState<idxGroupEvent | null>({ idx: 0, isActiveStateSwiper: 0, event_id: null });
  const { eventsGroup } = EventsGroupContextProvider()
  const [planSpaceActive, setPlanSpaceActive] = useState<planSpace | null>(null);


  // Capturar eventos del cumulo y seleccionar uno
  useEffect(() => {
    if (eventsGroup && eventsGroup.length === 0) {
      setEvent(null);
    }
    if (eventsGroup && eventsGroup.length > 0) {
      if (!valir) {
        console.log("seteando evento")
        const eventsPendientes = eventsGroup.filter(item => item.estatus === "pendiente" && parseInt(item.fecha) >= Math.trunc(new Date().getTime() / 100000) * 100000)
        const eventsGroupSort = eventsPendientes?.sort((a: any, b: any) => { return b.fecha_creacion - a.fecha_creacion })
        setEvent(eventsGroupSort[0]);
        setValir(true)
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
    console.log("seteado PlanSpaceActive")
  }, [planSpaceActive])

  useEffect(() => {
    console.log("seteado event")
  }, [event])

  useEffect(() => {
    console.log("seteado event.planSpaceSelect")
  }, [event?.planSpaceSelect])

  useEffect(() => {
    console.log("seteado eventsGroup")
  }, [eventsGroup])

  return (
    <EventContext.Provider value={{ event, setEvent, invitadoCero, setInvitadoCero, idxGroupEvent, setIdxGroupEvent, planSpaceActive, setPlanSpaceActive }}>
      {children}
    </EventContext.Provider>
  );
};

const EventContextProvider = () => useContext(EventContext)
export { EventContextProvider, EventProvider };
