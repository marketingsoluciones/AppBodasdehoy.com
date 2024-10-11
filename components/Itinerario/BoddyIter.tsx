import { useState } from "react"
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "./MicroComponente/ItineraryPanel"
import { EventContextProvider } from "../../context";
import { Itinerary } from "../../utils/Interfaces"


export const BoddyIter = () => {

    const { event } = EventContextProvider()
    const [optionSelect, setOptionSelect] = useState<Itinerary>(event.itinerarios_array.length && event.itinerarios_array[0])

    return (
        <div className="w-full min-h-[calc(100vh-234px)] flex flex-col items-center bg-white rounded-lg mt-3">
            <ItineraryTabs DataOptionsArry={event.itinerarios_array.filter(elem => !!elem?.title)} optionSelect={optionSelect} setOptionSelect={setOptionSelect} />
            <ItineraryPanel itinerario={optionSelect} />
        </div>
    )
}