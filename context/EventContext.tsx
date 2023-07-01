import { createContext, useState, useContext, useEffect, Dispatch, SetStateAction } from "react";
import { Event } from "../utils/Interfaces";
import { EventsGroupContextProvider } from "./EventsGroupContext";

type Context = {
  event: Event
  setEvent: Dispatch<SetStateAction<Event>>
  invitadoCero: string | null
  setInvitadoCero: Dispatch<SetStateAction<string>>
}

const EventContext = createContext<Context>({
  event: null,
  setEvent: (event: Event): void => null,
  invitadoCero: null,
  setInvitadoCero: () => { },
});

const EventProvider = ({ children }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [invitadoCero, setInvitadoCero] = useState<string | null>(null);
  const [valir, setValir] = useState<boolean | null>(false);
  const { eventsGroup } = EventsGroupContextProvider()


  // Capturar eventos del cumulo y seleccionar uno
  useEffect(() => {
    if (eventsGroup && eventsGroup.length === 0) {
      setEvent(null);
    }
    if (eventsGroup && eventsGroup.length > 0) {
      if (!valir) {
        const eventsPendientes = eventsGroup.filter(item => item.estatus === "pendiente" && parseInt(item.fecha) >= Math.trunc(new Date().getTime() / 100000) * 100000)
        const eventsGroupSort = eventsPendientes?.sort((a: any, b: any) => { return b.fecha_creacion - a.fecha_creacion })
        setEvent(eventsGroupSort[0]);
        setValir(true)
      }
    }
  }, [eventsGroup, valir]);

  return (
    <EventContext.Provider value={{ event, setEvent, invitadoCero, setInvitadoCero }}>
      {children}
    </EventContext.Provider>
  );
};

const EventContextProvider = () => useContext(EventContext)
export { EventContextProvider, EventProvider };
