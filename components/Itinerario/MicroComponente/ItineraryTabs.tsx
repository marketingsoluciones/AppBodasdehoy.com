import { FC, LegacyRef, MouseEvent, useEffect, useRef, useState } from "react"
import { PlusIcon } from "../../icons"
import { Itinerary } from "../../../utils/Interfaces"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { ViewItinerary } from "../../../pages/invitados"
import { SelectModeView } from "../../Utils/SelectModeView"
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
    setModalDuplicate: any
}

export const ItineraryTabs: FC<props> = ({ setModalDuplicate, itinerario, setItinerario, setEditTitle, view, setView, handleDeleteItinerario, handleUpdateTitle, title, setTitle, editTitle }) => {
    const [isAllowed, ht] = useAllowed()
    const [isAllowedViewer] = useAllowedViewer()
    const { config, user } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();
    const [isClidked, setIsClicked] = useState<boolean>()
    const [itineraries, setItineraries] = useState<Itinerary[]>()
    const [itinerariesInTabs, setItinerariesInTabs] = useState<Itinerary[]>()
    const [positionInTabs, setPositionInTabs] = useState<number>(-1)
    const [showTabs, setShowTabs] = useState<boolean>(true)
    const [iniX, setIiniX] = useState<{ left: number, right: number, cursor: number }>()
    const refTabs: LegacyRef<HTMLDivElement> = useRef()
    const [reverse, setReverse] = useState<{ direction: string, position: number }[]>([])

    useEffect(() => {
        const itineraries = event?.itinerarios_array?.filter(elem => elem.tipo === window?.location?.pathname.slice(1))?.slice(0, 8)
        setItineraries([...itineraries])
    }, [event])


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


    const handleSelectItinerarioCapture = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        if (item?._id !== itinerario?._id) {
            setItinerario(item)
            setEditTitle(false)
        }
    }

    const handleSelectItinerario = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        setReverse([])
        const cursor = e.clientX - e.currentTarget.getBoundingClientRect().left
        const iniX = {
            left: e.currentTarget.getBoundingClientRect().left,
            right: e.currentTarget.clientWidth - cursor,
            cursor
        }
        setIiniX({ ...iniX })
        setIsClicked(true)
        const positionInTabs = e.currentTarget.getAttribute("itemID")
        setPositionInTabs(parseInt(positionInTabs))
        const itinerariesInTabs = itineraries.map((elem, index) => {
            return { ...elem, index }
        })
        setItinerariesInTabs([...itinerariesInTabs])
    }

    useEffect(() => {
        if (!showTabs) {
            setShowTabs(true)
        }
    }, [showTabs])

    const handleReleaseItinerarioCapture = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        setIsClicked(false)
    }

    const handleReleaseItinerario = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        if (parseInt(e.currentTarget.getAttribute("itemID")) !== positionInTabs) {
            itineraries.splice(parseInt(e.currentTarget.getAttribute("itemID")), 1)
            itineraries.splice(positionInTabs, 0, item)
            setItineraries([...itineraries])
            setShowTabs(false)
        } else {
            e.currentTarget.style.left = `${0}px`
        }
    }

    const handleMoveItinerario = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        if (isClidked) {
            const X = parseInt(e.currentTarget.getAttribute("cursor"))
            const direction = X > e.clientX ? "left" : "right"
            const elementColitionId = itinerariesInTabs.find(elem => elem.index === (
                reverse.length && reverse[reverse.length - 1].direction === direction ?
                    reverse[reverse.length - 1].position
                    : direction === "right"
                        ? positionInTabs + 1
                        : positionInTabs - 1)
            )?._id
            const elementColition = document.getElementById(elementColitionId)

            const colition = elementColition?.getBoundingClientRect()[`${direction === "right" ? "right" : "left"}`]
            if (direction === "right") {
                if (e.currentTarget.getBoundingClientRect().right > colition - 36) {
                    if (positionInTabs > -1 && positionInTabs < itinerariesInTabs.length - 1) {
                        const parentNode = e.currentTarget.parentNode as HTMLDivElement
                        const sixeX = parentNode.getBoundingClientRect().width
                        if (reverse.length && reverse[reverse.length - 1].direction === direction) {
                            elementColition.style.transform = `none`
                            reverse.splice(-1, 1)
                            const newPos = positionInTabs + 1
                            setPositionInTabs(newPos)

                        } else {
                            elementColition.style.transform = `none`
                            elementColition.style.transition = `transform 0.4s ease-in-out`
                            elementColition.style.transform = `translateX(-${sixeX}px)`
                            const newPos = positionInTabs + 1
                            setPositionInTabs(newPos)
                            reverse.push({ direction: direction === "right" ? "left" : "right", position: newPos })
                            setReverse([...reverse])
                        }
                    }
                }
            }
            if (direction === "left") {
                if (e.currentTarget.getBoundingClientRect().left < colition + 36) {
                    if (positionInTabs > -1 && positionInTabs < itinerariesInTabs.length + 1) {
                        const parentNode = e.currentTarget.parentNode as HTMLDivElement
                        const sixeX = parentNode.getBoundingClientRect().width
                        if (reverse.length && reverse[reverse.length - 1].direction === direction) {
                            elementColition.style.transform = `none`
                            reverse.splice(-1, 1)
                            const newPos = positionInTabs - 1
                            setPositionInTabs(newPos)

                        } else {
                            elementColition.style.transform = `none`
                            elementColition.style.transform = `translateX(${sixeX}px)`
                            const newPos = positionInTabs - 1
                            setPositionInTabs(newPos)
                            reverse.push({ direction: direction === "left" ? "right" : "left", position: newPos })
                            setReverse([...reverse])
                        }
                    }
                }
            }
            e.currentTarget.setAttribute("cursor", e.clientX.toString())
            const limitRight = refTabs.current.getBoundingClientRect().right - iniX.right
            const limitLeft = refTabs.current.getBoundingClientRect().left + iniX.cursor
            if (limitLeft < e.clientX && limitRight > e.clientX) {
                e.currentTarget.style.left = `${e.clientX - iniX.cursor - iniX.left}px`
            }
        }
    }
    const handleEnter = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        if (item?._id !== itinerario?._id && isClidked) {
            console.log("entre")
            setShowTabs(false)
        }
    }
    const handleLeave = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        if (item?._id === itinerario?._id && isClidked) {
            setIsClicked(false)
            if (parseInt(e.currentTarget.getAttribute("itemID")) === positionInTabs) {
                e.currentTarget.style.left = `${0}px`
            } else {
                itineraries.splice(parseInt(e.currentTarget.getAttribute("itemID")), 1)
                itineraries.splice(positionInTabs, 0, item)
                setItineraries([...itineraries])
                setShowTabs(false)
            }
        }
    }

    return (
        <div className="flex max-w-[100%] min-w-[100%] h-10 items-center justify-center border-b md:px-4 md:py-2">
            <div id="content" className="flex-1 h-full  flex justify-between">
                <div className="inline-flex max-w-full h-full items-center  mr-2">
                    {showTabs && <>
                        <div ref={refTabs} id="azul" className={` ${event?.usuario_id === user?.uid && "max-w-[calc(100%-32px)]"} inline-flex  h-full items-center select-none  mx-2`}>
                            {itineraries?.map((item, idx) => {
                                return (
                                    (isAllowedViewer(item.viewers) || window?.location?.pathname === "/itinerario") &&
                                    <div key={idx} className="relative">
                                        <div id={item?._id} itemID={idx.toString()}
                                            className={`justify-start items-center cursor-pointer h-full ${itinerario?._id === item?._id ? `flex ${isClidked && "absolute py-20 z-20"}` : "inline-flex"} text-sm space-x-1 relative md:mr-2`}
                                            onMouseDownCapture={(e) => handleSelectItinerarioCapture(e, item)}
                                            onMouseDown={(e) => handleSelectItinerario(e, item)}
                                            onMouseUpCapture={(e) => handleReleaseItinerarioCapture(e, item)}
                                            onMouseUp={(e) => handleReleaseItinerario(e, item)}
                                            onMouseMove={(e) => handleMoveItinerario(e, item)}
                                            onMouseEnter={(e) => { handleEnter(e, item) }}
                                            onMouseLeave={(e) => { handleLeave(e, item) }}
                                        >
                                            {<div className={`${"inline-flex"} items-center`} >
                                                <div className={`bg-white ${itinerario?._id === item?._id ? `border-primary text-primary w-full` : "text-gray-600"} border-b-2 flex-1 `}>
                                                    {!!item?.icon && <div className="flex w-5 h-5 mr-1 items-center justify-center">
                                                        {item?.icon}
                                                    </div>}
                                                    <div className={`${itinerario?._id !== item?._id && "break-all"} line-clamp-1 flex-1`}>
                                                        {item?.title}
                                                    </div>
                                                    {(editTitle && itinerario?._id === item?._id && window?.location?.pathname !== "/itinerario") &&
                                                        <div onMouseDown={(e) => e.stopPropagation()} className="fixed md:absolute w-full h-16 z-20 translate-y-6 flex left-0 items-center justify-center">
                                                            <div className="h-full bg-white space-x-2 rounded-md flex px-6 items-center justify-center shadow-md border-[1px]">
                                                                <input type="text" onChange={(e) => setTitle(e.target.value)} value={title} className={` font-display text-sm text-gray-500 border-[1px] border-primary focus:border-gray-400 w-min py-1 px-2 rounded-xl focus:ring-0 focus:outline-none transition`} />
                                                                <button type="button" onClick={() => handleUpdateTitle()} className="border-primary border font-display focus:outline-none text-primary hover:text-white text-xs bg-white hover:bg-primary px-3 py-1 rounded-lg transition">
                                                                    <FaCheck />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                                <ItineraryTabsMenu item={item} itinerario={itinerario} handleDeleteItinerario={handleDeleteItinerario} setEditTitle={setEditTitle} setTitle={setTitle} setModalDuplicate={setModalDuplicate} />
                                            </div>}
                                        </div>
                                    </div>

                                )
                            })}
                        </div>
                        {isAllowed() && <div id="plusIcon" onClick={() => handleCreateItinerario()} className="flex w-8 items-center justify-start bg-white">
                            <PlusIcon className="w-4 h-4 text-primary cursor-pointer" />
                        </div>}
                    </>}
                </div>
                {isAllowed() && <SelectModeView value={view} setValue={setView} />}
            </div>
        </div>
    )
}