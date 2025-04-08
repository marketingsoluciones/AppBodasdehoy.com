import { EventsTable } from "../components/Home/EventsTable";
import { InvitadosPDF } from "../components/Invitados/InvitadosPDF";
import { ItineraryGeneralTable } from "../components/Itinerario/MicroComponente/ItinerarioGeneralTable";
import { EventsGroupContextProvider } from "../context";

const Prueba = () => {

  const cursors = [
    "cursor-auto",
    "cursor-default",
    "cursor-pointer",
    "cursor-wait",
    "cursor-text",
    "cursor-move",
    "cursor-help",
    "cursor-not-allowed",
    "cursor-none",
    "cursor-context-menu",
    "cursor-progress",
    "cursor-cell",
    "cursor-crosshair",
    "cursor-vertical-text",
    "cursor-alias",
    "cursor-copy",
    "cursor-no-drop",
    "cursor-grab",
    "cursor-grabbing",
    "cursor-all-scroll",
    "cursor-col-resize",
    "cursor-row-resize",
    "cursor-n-resize",
    "cursor-e-resize",
    "cursor-s-resize",
    "cursor-w-resize",
    "cursor-ne-resize",
    "cursor-nw-resize",
    "cursor-se-resize",
    "cursor-sw-resize",
    "cursor-ew-resize",
    "cursor-ns-resize",
    "cursor-nesw-resize",
    "cursor-nwse-resize",
    "cursor-zoom-in",
    "cursor-zoom-out",
  ]



  return (
    <div className="max-w-screen-lg grid grid-cols-8 mx-auto">
      {cursors.map(elem =>
        <div className={`bg-emerald-400 col-span-1 m-1 h-12 text-xs flex items-center justify-center text-center ${elem}`}>{elem}</div>
      )}
    </div>
  );

}

export default Prueba