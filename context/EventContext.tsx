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
  const { eventsGroup } = EventsGroupContextProvider()

  // Capturar eventos del cumulo y seleccionar uno
  useEffect(() => {
    if (eventsGroup && eventsGroup.length === 0) {
      setEvent(null);
    }
    if (eventsGroup && eventsGroup.length > 0) {
      setEvent(eventsGroup?.sort((a: any, b: any) => { return b.fecha_creacion - a.fecha_creacion })[0]);
    }
  }, [eventsGroup]);

  return (
    <EventContext.Provider value={{ event, setEvent, invitadoCero, setInvitadoCero }}>
      {children}
    </EventContext.Provider>
  );
};

const EventContextProvider = () => useContext(EventContext)
export { EventContextProvider, EventProvider };
