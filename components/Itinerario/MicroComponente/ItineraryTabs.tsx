import { FC, useEffect, useRef, useState } from "react"
import { DotsOpcionesIcon, PlusIcon } from "../../icons"
import { Itinerary } from "../../../utils/Interfaces"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { ViewItinerary } from "../../../pages/invitados"
import { SelectModeView } from "../../Utils/SelectModeView"
import ClickAwayListener from "react-click-away-listener"
import { ItineraryTabsMenu } from "./ItineraryTabsMenu"
import { FaCheck } from "react-icons/fa"

interface props {
    itinerario: Itinerary
    setItinerario: any
    editTitle: boolean
    setEditTitle: any
    view: ViewItinerary
    setView: any
    handleDeleteItinerario: any
    handleUpdateTitle: any
    title: string
    setTitle: any
}
export const ItineraryTabs: FC<props> = ({ itinerario, setItinerario, setEditTitle, view, setView, handleDeleteItinerario, handleUpdateTitle, title, setTitle, editTitle }) => {
    //const [sizes, setSizes] = useState(null)
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()

    const handleCreateItinerario = async () => {
        console.log(window?.location?.pathname.slice(1))
        const f = new Date(parseInt(event?.fecha))
        const y = f.getUTCFullYear()
        const m = f.getUTCMonth()
        const d = f.getUTCDate()
        const result = await fetchApiEventos({
            query: queries.createItinerario,
            variables: {
                eventID: event._id,
                title: "sin nombre",
                dateTime: new Date(y, m, d, 8, 0),
                tipo: window?.location?.pathname.slice(1)
            },
            domain: config.domain
        })
        event.itinerarios_array.push(result as Itinerary)
        setItinerario({ ...result as Itinerary })
        setEvent({ ...event })
        setEditTitle(true)
    }

    return (
        <div className="flex max-w-[100%] min-w-[100%] h-10 items-center justify-center border-b md:px-4 md:py-2">
            <div id="content" className="flex-1 h-full bg-violet-400* flex justify-between">

                <div className="inline-flex max-w-full h-full items-center bg-yellow-400*">
                    <div id="azul" className="bg-blue-500* inline-flex max-w-[calc(100%-32px)] h-full items-center select-none bg-blue-600*">
                        {event?.itinerarios_array.filter(elem => elem.tipo === window?.location?.pathname.slice(1))?.slice(0, 5).map((item, idx) => {
                            return (
                                <div id={item?._id} key={idx}
                                    className={`justify-start items-center cursor-pointer h-full ${itinerario?._id === item?._id ? "bg-green* flex" : "inline-flex flex-1"} text-sm px-2 space-x-1 relative`}
                                    onClick={() => {
                                        if (item?._id !== itinerario?._id) {
                                            // adjustSize()
                                            setItinerario(item)
                                            setEditTitle(false)
                                        }
                                    }}
                                //style={itinerario?._id === item?._id ? {} : { width: sizes }}
                                >
                                    {<div className={`inline-flex items-center`} >
                                        <div className={`${itinerario?._id === item?._id ? "border-primary text-primary w-full" : "text-gray-600"} border-b-2 flex-1 `}>
                                            {!!item?.icon && <div className="flex w-5 h-5 mr-1 items-center justify-center">
                                                {item?.icon}
                                            </div>}
                                            {(editTitle && itinerario?._id === item?._id && window?.location?.pathname !== "/itinerario") &&
                                                <div className="fixed w-full h-16 z-20 translate-y-6 flex left-0 items-center justify-center">
                                                    <div className="h-full bg-white space-x-2 rounded-md flex px-6 items-center justify-center shadow-md border-[1px]">
                                                        <input type="text" onChange={(e) => setTitle(e.target.value)} value={title} className={` font-display text-sm text-gray-500 border-[1px] border-primary focus:border-gray-400 w-min py-1 px-2 rounded-xl focus:ring-0 focus:outline-none transition`} />
                                                        <button type="button" onClick={() => handleUpdateTitle()} className="border-primary border font-display focus:outline-none text-primary hover:text-white text-xs bg-white hover:bg-primary px-3 py-1 rounded-lg transition">
                                                            <FaCheck />
                                                        </button>
                                                    </div>
                                                </div>}
                                            <div className={`${itinerario?._id !== item?._id && "break-all"} line-clamp-1 flex-1`}>
                                                {item?.title}
                                            </div>
                                        </div>
                                        <ItineraryTabsMenu item={item} itinerario={itinerario} handleDeleteItinerario={handleDeleteItinerario} handleUpdateTitle={handleUpdateTitle} setEditTitle={setEditTitle} editTitle={editTitle} title={title} setTitle={setTitle} />
                                    </div>}
                                </div>
                            )
                        })}
                    </div>
                    <div id="plusIcon" onClick={() => handleCreateItinerario()} className="flex w-8 items-center justify-start bg-white">
                        <PlusIcon className="w-4 h-4 text-primary cursor-pointer" />
                    </div>
                </div>
                <SelectModeView value={view} setValue={setView} />
            </div>
        </div>
    )
}