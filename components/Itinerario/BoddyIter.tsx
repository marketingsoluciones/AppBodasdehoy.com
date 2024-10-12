import { useEffect, useState } from "react"
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "./MicroComponente/ItineraryPanel"
import { EventContextProvider } from "../../context";
import { Itinerary } from "../../utils/Interfaces"

export const BoddyIter = () => {

    const { event } = EventContextProvider()
    const [itinerario, setItinerario] = useState<Itinerary>()
    const [editTitle, setEditTitle] = useState<boolean>(false)

    useEffect(() => {
        if (event.itinerarios_array.length) {
            const f1 = event?.itinerarios_array.findIndex(elem => elem._id === itinerario?._id)
            if (f1 < 0) {
                setItinerario(event?.itinerarios_array[0])
            } else {
                setItinerario(event?.itinerarios_array[f1])
            }
        }
    }, [event])

    return (
        <div className="w-full min-h-[calc(100vh-234px)] flex flex-col items-center bg-white rounded-lg mt-3">
            <ItineraryTabs itinerario={itinerario} setItinerario={setItinerario} setEditTitle={setEditTitle} />
            <ItineraryPanel itinerario={itinerario} setItinerario={setItinerario} editTitle={editTitle} setEditTitle={setEditTitle} />
        </div>
    )
}