import { EventsTable } from "../components/Home/EventsTable";
import { InvitadosPDF } from "../components/Invitados/InvitadosPDF";
import { EventsGroupContextProvider } from "../context";

const Prueba = () => {

  const { eventsGroup } = EventsGroupContextProvider();

  console.log("eventgroups",eventsGroup)


  return (
    <>
    {
     
     <EventsTable/>
    }
    </>
  );

}

export default Prueba