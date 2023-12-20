import { createContext, useState, useContext, useEffect, SetStateAction, Dispatch, useReducer, Reducer } from 'react';
import { AuthContextProvider } from "../context";
import { fetchApiBodas, fetchApiEventos, queries } from "../utils/Fetching";
import { Event } from '../utils/Interfaces';
import { useRouter } from 'next/router';

type Context = {
  eventsGroup: Event[],
  setEventsGroup: Dispatch<SetStateAction<action>>
  psTemplates: any,
  setPsTemplates: Dispatch<SetStateAction<any>>
}
const EventsGroupContext = createContext<Context>({
  eventsGroup: null,
  setEventsGroup: (action: action) => null,
  psTemplates: [],
  setPsTemplates: () => { },
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

const reducer = (state: Event[], action: action) => {
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
  const [eventsGroup, setEventsGroup] = useReducer<Reducer<Event[], action>>(reducer, []);
  const [psTemplates, setPsTemplates] = useState<any>([]);
  const { user } = AuthContextProvider();

  useEffect(() => {
    if (user) {
      fetchApiEventos({
        query: queries.getEventsByID,
        variables: { userID: user?.uid },
      })
        .then((events: Event[]) => {
          if (events.length == 0) router.push("/")
          setEventsGroup({ type: "INITIAL_STATE", payload: events })

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
    }
  }, [user]);

  return (
    <EventsGroupContext.Provider value={{ eventsGroup, setEventsGroup, psTemplates, setPsTemplates }}>
      {children}
    </EventsGroupContext.Provider>
  );
};

const EventsGroupContextProvider = () => useContext(EventsGroupContext);
export { EventsGroupContextProvider, EventsGroupProvider };
