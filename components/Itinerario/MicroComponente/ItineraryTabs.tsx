import { FC, LegacyRef, MouseEvent, useEffect, useRef, useState } from "react"
import { PlusIcon } from "../../icons"
import { Event, Itinerary } from "../../../utils/Interfaces"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { ViewItinerary } from "../../../pages/invitados"
import { SelectModeView } from "../../Utils/SelectModeView"
import { ItineraryTabsMenu } from "./ItineraryTabsMenu"
import { FaCheck } from "react-icons/fa"
import { useAllowed, useAllowedViewer } from "../../../hooks/useAllowed"
import { useTranslation } from "react-i18next"
import { useToast } from "../../../hooks/useToast"

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
    const [valirOnMouse, setValirOnMouse] = useState<boolean>(true)
    const [iniX, setIiniX] = useState<{ left: number, right: number, cursor: number }>()
    const refTabs: LegacyRef<HTMLDivElement> = useRef()
    const [reverse, setReverse] = useState<{ direction: string, position: number }[]>([])
    const toast = useToast()

    useEffect(() => {
        const itineraries = event?.itinerarios_array?.filter(elem => elem?.tipo === window?.location?.pathname.slice(1))?.slice(0, 8)
        if (!itineraries?.length) {
            setItineraries([])
        }

        if (itineraries?.length) {
            const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
            const listIdentifiers = event?.listIdentifiers[fListIdentifiers]
            if (!listIdentifiers?.start_Id) {
                const listIdentifier = {
                    table: window?.location?.pathname.slice(1),
                    start_Id: itineraries[0]?._id,
                    end_Id: itineraries[itineraries.length - 1]?._id
                }
                event?.listIdentifiers?.push(listIdentifier)
                fetchApiEventos({
                    query: queries.eventUpdate,
                    variables: {
                        idEvento: event._id,
                        variable: "listIdentifiers",
                        value: JSON.stringify(event.listIdentifiers)
                    }
                })
                if (itineraries.length > 1) {
                    const itinerariesSlice = itineraries.slice(0, itineraries.length - 1)
                    itinerariesSlice.map((elem, idx) => {
                        const variables = {
                            eventID: event._id,
                            itinerarioID: elem?._id,
                            variable: "next_id",
                            valor: itineraries[idx + 1]._id
                        }
                        elem.next_id = itineraries[idx + 1]._id
                    })
                }
                fetchApiEventos({
                    query: queries.eventUpdate,
                    variables: {
                        idEvento: event._id,
                        variable: "itinerarios_array",
                        value: JSON.stringify(event.itinerarios_array)
                    }
                })
                setEvent({ ...event })
            } else {
                let newItineraries = []
                const pushNextElem = ({ _id }) => {
                    const f1 = itineraries.findIndex(elem => elem._id === _id)
                    if (f1 > -1) {
                        const itinerary = { ...itineraries[f1] }
                        newItineraries.push(itinerary)
                        itineraries.splice(f1, 1)
                        if (!!itinerary?.next_id) {
                            pushNextElem({ _id: itinerary.next_id })
                        }
                    }
                }
                const firsItinerary = itineraries.find(elem => elem._id === listIdentifiers.start_Id)
                newItineraries.push(firsItinerary)
                if (firsItinerary?.next_id) {
                    pushNextElem({ _id: firsItinerary.next_id })
                }
                console.log(100031, newItineraries)
                const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
                const lastListIdentifiers = { ...event.listIdentifiers[fListIdentifiers] }
                console.log(100032, "lastListIdentifiers.end_Id", lastListIdentifiers.end_Id)
                setItineraries([...newItineraries])
            }
        }
    }, [event])

    const handleCreateItinerario = async () => {
        if (event.itinerarios_array.filter(elem => elem.tipo === window?.location?.pathname.slice(1)).length > 9) {
            toast("warning", t("maxLimitedItineraries"));
            return
        }
        const f = new Date(parseInt(event?.fecha))
        const y = f.getUTCFullYear()
        const m = f.getUTCMonth()
        const d = f.getUTCDate()
        fetchApiEventos({
            query: queries.createItinerario,
            variables: {
                eventID: event._id,
                title: t("unnamed"),
                dateTime: new Date(y, m, d, 8, 0),
                tipo: window?.location?.pathname.slice(1)
            },
            domain: config.domain
        }).then((result: Itinerary) => {
            const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
            if (event.itinerarios_array?.filter(elem => elem.tipo === window?.location?.pathname.slice(1)).length) {
                const lastListIdentifiers = { ...event.listIdentifiers[fListIdentifiers] }
                const f1 = event.itinerarios_array.findIndex(elem => elem._id === lastListIdentifiers.end_Id)
                if (f1 > -1) {
                    event.itinerarios_array[f1].next_id = result._id
                    updatedNextId(event.itinerarios_array[f1])
                    event.listIdentifiers[fListIdentifiers].end_Id = result._id
                    updatedListIdentifiers(event)
                } else {
                    event.listIdentifiers.push({
                        end_Id: result._id,
                        start_Id: result._id,
                        table: window?.location?.pathname.slice(1)
                    })
                    fetchApiEventos({
                        query: queries.eventUpdate,
                        variables: {
                            idEvento: event._id,
                            variable: "listIdentifiers",
                            value: JSON.stringify(event.listIdentifiers)
                        }
                    })
                }
            } else {
                if (fListIdentifiers === -1) {
                    event.listIdentifiers.push({
                        start_Id: result._id,
                        end_Id: result._id,
                        table: window?.location?.pathname.slice(1)
                    })
                } else {
                    event.listIdentifiers[fListIdentifiers].start_Id = result._id
                    event.listIdentifiers[fListIdentifiers].end_Id = result._id
                }
                fetchApiEventos({
                    query: queries.eventUpdate,
                    variables: {
                        idEvento: event._id,
                        variable: "listIdentifiers",
                        value: JSON.stringify(event.listIdentifiers)
                    }
                })
            }
            event.itinerarios_array.push(result)
            setEvent({ ...event })
            setItinerario({ ...result })
            setEditTitle(true)
        })
    }

    const handleSelectItinerario = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        if (item?._id !== itinerario?._id) {
            setItinerario(item)
            setEditTitle(false)
        }
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
            releaseAndLeave(e, item)
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
            setShowTabs(false)
        }
    }
    const handleLeave = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        if (item?._id === itinerario?._id && isClidked) {
            setIsClicked(false)
            if (parseInt(e.currentTarget.getAttribute("itemID")) === positionInTabs) {
                e.currentTarget.style.left = `${0}px`
            } else {
                releaseAndLeave(e, item)
            }
        }
    }

    async function updatedNextId(itinerary: Itinerary) {
        return await fetchApiEventos({
            query: queries.editItinerario,
            variables: {
                eventID: event._id,
                itinerarioID: itinerary._id,
                variable: "next_id",
                valor: itinerary.next_id
            },
            domain: config.domain
        })
    }
    async function updatedListIdentifiers(event: Event) {
        return await fetchApiEventos({
            query: queries.eventUpdate,
            variables: {
                idEvento: event._id,
                variable: "listIdentifiers",
                value: JSON.stringify(event.listIdentifiers)
            }
        })
    }

    const releaseAndLeave = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        console.log(100095, "releaseAndLeave")
        const itinerariesCopy = [...itineraries]
        if (itineraries.length === 1) {
            return
        }
        const direction = positionInTabs > parseInt(e.currentTarget.getAttribute("itemID")) ? "right" : "left"
        let ubi = {
            vecinoLast: parseInt(e.currentTarget.getAttribute("itemID")) - (direction === "right" ? 1 : 0),//ok
            vecinoNew: positionInTabs - 1,//ok
            movido: positionInTabs,
            vecinoLastNextId: null,
            vecinoNewNextId: null,
            movidoNextId: null,
        }
        console.log(1000310, ubi, itineraries.length)

        ///// moviemientos en el medio funciona /////

        ///// moviemientos del medio al extremo derecho funciona /////
        const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
        if (ubi.movido === itineraries.length - 1 && ubi.vecinoLast !== -1) {
            event.listIdentifiers[fListIdentifiers].end_Id = item._id
            item.next_id = null
            updatedNextId(item)
            updatedListIdentifiers(event)
        }

        ///// moviemientos del medio al extremo izquierdo funciona /////
        if (ubi.movido === 0) {
            event.listIdentifiers[fListIdentifiers].start_Id = item._id
            updatedListIdentifiers(event)
        }

        ///// moviemientos del extremo izquierdo al medio funciona /////
        if (ubi.vecinoLast === -1 && ubi.movido !== itineraries.length - 1) {
            event.listIdentifiers[fListIdentifiers].start_Id = item.next_id
            updatedListIdentifiers(event)
        }

        ///// moviemientos del extremo izquierdo al extremo derecho funciona /////
        if (ubi.vecinoLast === -1 && ubi.movido === itineraries.length - 1) {
            event.listIdentifiers[fListIdentifiers].start_Id = item.next_id
            event.listIdentifiers[fListIdentifiers].end_Id = item._id
            item.next_id = null
            updatedNextId(item)
            updatedListIdentifiers(event)
        }

        ///// moviemientos del extremo derecho al medio funciona /////
        if (ubi.vecinoLast === itineraries.length - 1 && ubi.movido !== 0) {
            const previous = itineraries.find(elem => elem.next_id === item._id)
            event.listIdentifiers[fListIdentifiers].end_Id = previous._id
            previous.next_id = null
            updatedNextId(previous)
            updatedListIdentifiers(event)
        }

        ///// moviemientos del extremo derecho al exttremo izquierdo funciona /////
        if (ubi.movido === 0 && ubi.vecinoLast === itineraries.length - 1) {
            const previous = itineraries.find(elem => elem.next_id === item._id)
            event.listIdentifiers[fListIdentifiers].start_Id = item._id
            event.listIdentifiers[fListIdentifiers].end_Id = previous._id
            previous.next_id = null
            updatedNextId(previous)
            updatedListIdentifiers(event)
        }


        itineraries.splice(parseInt(e.currentTarget.getAttribute("itemID")), 1)
        itineraries.splice(positionInTabs, 0, item)
        const vL = { ...itineraries[ubi.vecinoLast + 1] }
        const vN = { ...itineraries[ubi.vecinoNew + 1] }
        const mo = { ...itineraries[ubi.movido + 1] }


        ubi.vecinoLastNextId = ubi.vecinoLast > -1 && ubi.vecinoLast < itineraries.length - 1 ? vL._id : null
        ubi.vecinoNewNextId = ubi.vecinoNew > -1 && ubi.vecinoNew < itineraries.length - 1 ? vN._id : null
        ubi.movidoNextId = ubi.movido > -1 && ubi.movido < itineraries.length - 1 ? mo._id : null

        const vecinoLast_ = { ...itineraries[ubi.vecinoLast], next_id: ubi.vecinoLastNextId }
        const vecinoNew_ = { ...itineraries[ubi.vecinoNew], next_id: ubi.vecinoNewNextId }
        const movido_ = { ...itineraries[ubi.movido], next_id: ubi.movidoNextId }

        if (ubi.vecinoLastNextId) {
            itineraries.splice(ubi.vecinoLast, 1, { ...vecinoLast_ })
            updatedNextId(vecinoLast_)
        }
        if (ubi.vecinoNewNextId) {
            itineraries.splice(ubi.vecinoNew, 1, { ...vecinoNew_ })
            updatedNextId(vecinoNew_)
        }
        if (ubi.movidoNextId) {
            itineraries.splice(ubi.movido, 1, { ...movido_ })
            updatedNextId(movido_)
        }

        const eventNew = { ...event, itinerarios_array: [...itineraries] }
        setEvent({ ...eventNew })
        setShowTabs(false)
    }

    return (
        <div className="flex max-w-[100%] min-w-[100%] h-10 items-center justify-center border-b md:px-4 md:py-2">
            <div id="content" className="flex-1 h-full  flex justify-between">
                <div className="inline-flex max-w-full h-full items-center  mr-2">
                    {showTabs && <>
                        <div ref={refTabs} id="azul" className={` ${event?.usuario_id === user?.uid && "max-w-[calc(100%-32px)]"} inline-flex  h-full items-center select-none  mx-2`}>
                            {itineraries?.map((item, idx) => {
                                return (
                                    (isAllowedViewer(item?.viewers) || window?.location?.pathname === "/itinerario") &&
                                    <div key={idx} className="relative">
                                        <div id={item?._id} itemID={idx.toString()}
                                            className={`justify-start items-center cursor-pointer h-full ${itinerario?._id === item?._id ? `flex ${isClidked && "absolute py-20 z-20"}` : "inline-flex"} text-sm space-x-1 relative md:mr-2`}
                                            onMouseDown={(e) => valirOnMouse && handleSelectItinerario(e, item)}
                                            onMouseUpCapture={(e) => valirOnMouse && handleReleaseItinerarioCapture(e, item)}
                                            onMouseUp={(e) => {
                                                valirOnMouse
                                                    ? !editTitle && handleReleaseItinerario(e, item)
                                                    : setValirOnMouse(true)
                                            }}
                                            onMouseMove={(e) => valirOnMouse && handleMoveItinerario(e, item)}
                                            onMouseEnter={(e) => { valirOnMouse && handleEnter(e, item) }}
                                            onMouseLeave={(e) => {
                                                valirOnMouse
                                                    ? !editTitle && handleLeave(e, item)
                                                    : null
                                            }}
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
                                                <div onMouseDownCapture={() => {
                                                    setValirOnMouse(false)
                                                }} >
                                                    <ItineraryTabsMenu item={item} itinerario={itinerario} handleDeleteItinerario={handleDeleteItinerario} setEditTitle={setEditTitle} setTitle={setTitle} setModalDuplicate={setModalDuplicate} />
                                                </div>
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