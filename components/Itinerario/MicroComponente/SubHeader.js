import { AuthContextProvider } from "../../../context/AuthContext"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"


export const SubHeader = ({ title, date, setButton, button }) => {
 

    
    return (
        <div className="w-full px-4 md:px-10 py-4 space-y-2" >
            <div className="flex w-full justify-between">
                <div className="w-1/2 flex flex-col md:block text-xs md:text-[14px]">
                    <span className="text-[14px]">Fecha boda: </span>
                    <span className="text-rosa">{date}</span>
                </div>
                <div className="flex w-1/2 text-xs md:text-[14px] justify-end items-center">
                    <span
                        className="text-rosa text-right cursor-pointer hover:text-pink-500"
                        onClick={() => setButton(!button)}
                    >
                        Restablecer todo el itinerario
                    </span>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center">
                <span className="text-3xl md:text-[40px] font-title text-rosa">{title}</span>
                <div className="w-[70px] bg-rosa h-1 rounded-md" />
            </div>
        </div >
    )
}