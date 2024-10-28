import { useEffect, useState } from "react"
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "./MicroComponente/ItineraryPanel"
import { EventContextProvider } from "../../context";
import { Itinerary } from "../../utils/Interfaces"
import { ViewItinerary } from "../../pages/invitados";

export const BoddyIter = () => {

    const { event } = EventContextProvider()
    const [itinerario, setItinerario] = useState<Itinerary>()
    const [editTitle, setEditTitle] = useState<boolean>(false)
    const [view, setView] = useState<ViewItinerary>(window.innerWidth > window.innerHeight ? "table" : "cards")

    useEffect(() => {
        const itinerarios = event?.itinerarios_array.filter(elem => elem.tipo === window?.location?.pathname.slice(1))
        console.log(100045, itinerarios)
        if (itinerarios.length) {
            const f1 = itinerarios.findIndex(elem => elem?._id === itinerario?._id)
            if (f1 < 0) {
                setItinerario(itinerarios[0])
            } else {
                setItinerario(itinerarios[f1])
            }
        }
    }, [event])

    return (
        <div className="w-full h-[calc(100vh-234px)] flex flex-col items-center bg-white rounded-lg mt-3">
            <ItineraryTabs itinerario={itinerario} setItinerario={setItinerario} setEditTitle={setEditTitle} view={view} setView={setView} />
            <ItineraryPanel itinerario={itinerario} setItinerario={setItinerario} editTitle={editTitle} setEditTitle={setEditTitle} view={view} setView={setView} />
        </div>
    )
}