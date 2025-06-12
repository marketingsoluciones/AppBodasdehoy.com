import { FC } from "react"
import { Itinerary } from "../../../utils/Interfaces";

interface props {
    itinerario: Itinerary
}


export const SubHeaderServicios: FC<props> = ({ itinerario  }) => {
    return (
   
            <div className="flex  justify-center items-center py-5">
                <span className="text-2xl md:text-[40px] font-title. text-primary">{itinerario?.title}</span>
            </div>
 
    )
}