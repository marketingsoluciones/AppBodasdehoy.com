import { AuthContextProvider } from "../../../context/AuthContext"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"


export const SubHeader = ({ title, date, setButton, button }) => {
 

    
    return (
        <div className="w-full px-4 md:px-10 py-4 space-y-2" >
            <div className="flex w-full justify-between">
                <div className="w-1/2 flex flex-col md:block text-xs md:text-[14px] text-azulCorporativo">
                    <span className="text-[14px]">Fecha boda: </span>
                    <span className="text-primary">{date}</span>
                </div>
                <div className="flex w-1/2 text-xs md:text-[14px] justify-end items-center">
                    <span
                        className="text-primary text-right cursor-pointer hover:text-pink-500"
                        onClick={() => setButton(!button)}
                    >
                        Restablecer todo el itinerario
                    </span>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center">
                <span className="text-3xl md:text-[40px] font-title text-primary">{title}</span>
                <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
            </div>
        </div >
    )
}