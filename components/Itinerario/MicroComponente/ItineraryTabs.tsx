import { FC, useEffect, useRef, useState } from "react"
import { PlusIcon } from "../../icons"
import { Itinerary } from "../../../utils/Interfaces"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"

interface props {
    itinerario: Itinerary
    setItinerario: any
    setEditTitle: any
}
export const ItineraryTabs: FC<props> = ({ itinerario, setItinerario, setEditTitle }) => {
    const [sizes, setSizes] = useState(null)
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()

    const adjustSize = () => {
        const azul = document?.getElementById("azul")?.offsetWidth
        const content = document?.getElementById("content")?.offsetWidth
        if (azul >= content - (event?.itinerarios_array?.length - 1) * 4) {
            setSizes(0)
        }
    }

    useEffect(() => {
        adjustSize()
    }, [])

    useEffect(() => {
        if (sizes == 0) {
            setTimeout(() => {
                const content = document?.getElementById("content")?.offsetWidth
                const elem = document?.getElementById(itinerario?._id)?.offsetWidth
                const sizes = (content - elem) / (event?.itinerarios_array?.length - 1)
                setSizes(sizes - 4)
            }, 100);
        }
    }, [itinerario, sizes])

    const handleCreateItinerario = async () => {
        const f = new Date(parseInt(event?.fecha))
        const y = f.getUTCFullYear()
        const m = f.getUTCMonth()
        const d = f.getUTCDate()
        const result = await fetchApiEventos({
            query: queries.createItinerario,
            variables: {
                eventID: event._id,
                title: "sin nombre",
                dateTime: new Date(y, m, d, 8, 0)
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
            <div id="content" className="flex-1 h-full bg-violet-400*">
                <div className="inline-flex max-w-full h-full items-center bg-yellow-400*">
                    <div id="azul" className="inline-flex max-w-[calc(100%-32px)] h-full items-center select-none bg-blue-600*">
                        {event?.itinerarios_array?.map((item, idx) => {
                            return (
                                <div id={item?._id} key={idx}
                                    onClick={() => {
                                        if (item?._id !== itinerario?._id) {
                                            adjustSize()
                                            setItinerario(item)
                                        }
                                    }}
                                    style={itinerario?._id === item?._id ? {} : { width: sizes }}
                                    className={`flex justify-start items-center cursor-pointer h-full ${idx == 0 && "bg-yellow-300*"} ${idx == 1 && "bg-red*"} ${idx == 2 && "bg-green*"} text-blue-500 text-sm px-2 space-x-1`}
                                >

                                    {<div className={`${itinerario?._id === item?._id ? "border-primary text-primary" : "border-gray-600 text-gray-600"} border-b-2 inline-flex space-x-1 items-center`} >
                                        {!!item?.icon && <div className="flex w-5 h-5 items-center justify-center">
                                            {item?.icon}
                                        </div>}
                                        <div className="break-all line-clamp-1">
                                            {item?.title}
                                        </div>
                                    </div>}
                                </div>
                            )
                        })}
                    </div>
                    <div id="plusIcon" onClick={() => handleCreateItinerario()} className="flex w-8 items-center justify-start bg-white">
                        <PlusIcon className="w-4 h-4 text-primary cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    )
}