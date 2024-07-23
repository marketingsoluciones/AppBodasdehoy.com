import { useEffect, useState } from "react"
import { AuthContextProvider } from "../../../context/AuthContext"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"


export const SubHeader = ({ title, date, setButton, button, disable, ht, setModalPlantilla, modalPlantilla }) => {
    const { event } = EventContextProvider()
    const { user } = AuthContextProvider()



    return (
        <div className="w-full px-4 md:px-10 py-4 space-y-2" >
            <div className="flex w-full justify-between">
                <div className="w-1/2 flex flex-col md:block text-xs md:text-[14px] text-azulCorporativo">
                    <div>
                        <span className="text-[14px]">Fecha boda: </span>
                        <span className="text-primary">{date}</span>
                    </div>
                    <div className={` ${event?.usuario_id === user?.uid && user?.displayName !== "guest" ? "hidden" : "block"} `}>
                        <span>Permisos: </span>
                        <span className="text-primary">{disable ? "Lectura" : "Edicion"}</span>
                    </div>
                </div>
                <div className="flex flex-col w-1/2 text-xs md:text-[14px] justify-end items-end space-y-1">
                    <span
                        className="text-primary text-right cursor-pointer hover:text-pink-500"
                        onClick={() => disable ? ht() : setButton(!button)}
                    >
                        Restablecer todo el itinerario
                    </span>
                    <span
                        className="text-primary text-right cursor-pointer hover:text-pink-500"
                        onClick={() => disable ? ht() : setModalPlantilla(!modalPlantilla)}
                    >
                        Cargar plantilla
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