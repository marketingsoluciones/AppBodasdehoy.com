import { GoChecklist } from "react-icons/go";
import { useRouter } from "next/router";
import { useAllowed } from "../../hooks/useAllowed";

export const BlockItinerario = () => {
   
    const router = useRouter()
    return (
        <div onClick={()=> router.push("/itinerario")} className="bg-acento space-x-3 rounded-lg text-white flex  items-center justify-center py-1.5 px-5 shadow-lg font-display text-xl cursor-pointer ">
            <GoChecklist className=" w-6 h-6 scale-x-90" />
            <span>ver mi <span>Itinerario</span></span>
        </div>
    )
}