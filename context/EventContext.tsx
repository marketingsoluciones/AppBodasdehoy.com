import { createContext, useState, useContext, useEffect, Dispatch, SetStateAction} from "react";
import { Event } from "../utils/Interfaces";
import { EventsGroupContextProvider } from "./EventsGroupContext";

type Context = {
  event : Event,
  setEvent: Dispatch<SetStateAction<Event>>
}

const EventContext = createContext<Context>({
  event: null,
  setEvent: (event: Event) : void => null,
});

const EventProvider = ({ children }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const { eventsGroup } = EventsGroupContextProvider()

  // Capturar eventos del cumulo y seleccionar uno
    useEffect(() => {
      if (eventsGroup && eventsGroup.length > 0) {
        setEvent(eventsGroup[0]);
      }
    }, [eventsGroup]);
    
  return (
    <EventContext.Provider value={{ event, setEvent }}>
      {children}
    </EventContext.Provider>
  );
};

const EventContextProvider = () => useContext(EventContext)
export { EventContextProvider, EventProvider };
