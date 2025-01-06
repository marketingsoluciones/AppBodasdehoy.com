import { FC } from "react"
import { PlusIcon } from "../../icons"
import { Itinerary } from "../../../utils/Interfaces"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { ViewItinerary } from "../../../pages/invitados"
import { SelectModeView } from "../../Utils/SelectModeView"
import ClickAwayListener from "react-click-away-listener"
import { ItineraryTabsMenu } from "./ItineraryTabsMenu"
import { FaCheck } from "react-icons/fa"
import { useAllowed, useAllowedViewer } from "../../../hooks/useAllowed"
import { useTranslation } from "react-i18next"

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
    const [isAllowed, ht] = useAllowed()
    const [isAllowedViewer] = useAllowedViewer()
    const { config, user } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();


    const handleCreateItinerario = async () => {
        const f = new Date(parseInt(event?.fecha))
        const y = f.getUTCFullYear()
        const m = f.getUTCMonth()
        const d = f.getUTCDate()
        const result = await fetchApiEventos({
            query: queries.createItinerario,
            variables: {
                eventID: event._id,
                title: t("unnamed"),
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

                <div className="inline-flex max-w-full h-full items-center bg-yellow-400* mr-2">
                    <div id="azul" className={`bg-blue-500* ${event?.usuario_id === user?.uid && "max-w-[calc(100%-32px)]"} inline-flex  h-full items-center select-none bg-blue-600* mx-2`}>
                        {event?.itinerarios_array?.filter(elem => elem.tipo === window?.location?.pathname.slice(1))?.slice(0, 8).map((item, idx) => {
                            return (
                                (isAllowedViewer(item.viewers) || window?.location?.pathname === "/itinerario") && <div id={item?._id} key={idx}
                                    className={`justify-start items-center cursor-pointer h-full ${itinerario?._id === item?._id ? "bg-green* flex" : "inline-flex"} text-sm space-x-1 relative md:mr-2`}
                                    onClick={() => {
                                        if (item?._id !== itinerario?._id) {
                                            setItinerario(item)
                                            setEditTitle(false)
                                        }
                                    }}
                                >
                                    {<div className={`inline-flex items-center`} >
                                        <div className={`${itinerario?._id === item?._id ? "border-primary text-primary w-full" : "text-gray-600"} border-b-2 flex-1 `}>
                                            {!!item?.icon && <div className="flex w-5 h-5 mr-1 items-center justify-center">
                                                {item?.icon}
                                            </div>}
                                            <div className={`${itinerario?._id !== item?._id && "break-all"} line-clamp-1 flex-1`}>
                                                {item?.title}
                                            </div>
                                            {(editTitle && itinerario?._id === item?._id && window?.location?.pathname !== "/itinerario") &&
                                                /* <ClickAwayListener onClickAway={() => { setEditTitle(false) }}> */
                                                    <div className="fixed md:absolute w-full h-16 z-20 translate-y-6 flex left-0 items-center justify-center">
                                                        <div className="h-full bg-white space-x-2 rounded-md flex px-6 items-center justify-center shadow-md border-[1px]">
                                                            <input type="text" onChange={(e) => setTitle(e.target.value)} value={title} className={` font-display text-sm text-gray-500 border-[1px] border-primary focus:border-gray-400 w-min py-1 px-2 rounded-xl focus:ring-0 focus:outline-none transition`} />
                                                            <button type="button" onClick={() => handleUpdateTitle()} className="border-primary border font-display focus:outline-none text-primary hover:text-white text-xs bg-white hover:bg-primary px-3 py-1 rounded-lg transition">
                                                                <FaCheck />
                                                            </button>
                                                        </div>
                                                    </div>
                                                 /* </ClickAwayListener>  */
                                            }
                                        </div>
                                        <ItineraryTabsMenu item={item} itinerario={itinerario} handleDeleteItinerario={handleDeleteItinerario} setEditTitle={setEditTitle} setTitle={setTitle} />
                                    </div>}
                                </div>

                            )
                        })}
                    </div>
                    {isAllowed() && <div id="plusIcon" onClick={() => handleCreateItinerario()} className="flex w-8 items-center justify-start bg-white">
                        <PlusIcon className="w-4 h-4 text-primary cursor-pointer" />
                    </div>}
                </div>
                {isAllowed() && <SelectModeView value={view} setValue={setView} />}
            </div>
        </div>
    )
}