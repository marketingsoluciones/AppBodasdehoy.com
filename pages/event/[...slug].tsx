
import { FC } from "react";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { Event} from "../../utils/Interfaces";
import { ItinerarioPDF } from "../../components/Itinerario/MicroComponente/ItinerarioPDF";
import { InvitadosPDF } from "../../components/Invitados/InvitadosPDF";

interface props {
  evento: Event
  slug: any
}

const Slug: FC<props> = (props) => {
  const p = props?.slug[0]?.split("-")
  const recurse = p[0]
  console.log(recurse)

  if(recurse === "itinerary"){
    return (
      <ItinerarioPDF props={props} />
    )
  }

  if(recurse === "invitados"){
    return (
      <InvitadosPDF props={props} />
    )
  }
};

export default Slug;

export async function getServerSideProps({ params }) {
  try {
    const p = params?.slug[0]?.split("-")
    const recurse = p[0]
    if (recurse === "itinerary") {
      const evento_id = p[1]
      const itinerario_id = p[2]

      const evento = await fetchApiEventos({
        query: queries.getItinerario,
        variables: {
          evento_id,
          itinerario_id
        }
      })
      return {
        props: { ...params, evento },
      };
    }
    if (recurse === "invitado") {
      const p = params?.slug[0]?.split("-")
      const evento_id = p[1]
      const evento = await fetchApiEventos({
        query: queries.getPGuestEvent,
        variables: {
          evento_id,
        }
      })

      return {
        props: { ...params, evento },
      };
    }
  } catch (error) {
    return {
      props: params,
    };

  }
}
