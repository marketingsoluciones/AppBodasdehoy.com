import { useEffect, useState } from "react"
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "./MicroComponente/ItineraryPanel"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { Event, Itinerary } from "../../utils/Interfaces"
import { ViewItinerary } from "../../pages/invitados";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../Utils/Modal";
import { DeleteConfirmation } from "./MicroComponente/DeleteConfirmation";
import { useTranslation } from "react-i18next";
import { useAllowed, useAllowedViewer } from "../../hooks/useAllowed";
import { useRouter } from "next/router";
import { LiaUserClockSolid } from "react-icons/lia";
import { t } from "i18next";
import { HiArrowSmallRight } from "react-icons/hi2";
import Select from 'react-select';

interface Modal {
    state: boolean
    title?: string
    handle?: () => void
    subTitle?: string | JSX.Element
}

export const BoddyIter = () => {
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [itinerario, setItinerario] = useState<Itinerary>()
    const [editTitle, setEditTitle] = useState<boolean>(false)
    const [isAllowedViewer] = useAllowedViewer()
    const [isAllowed] = useAllowed()
    const [view, setView] = useState<ViewItinerary>()
    const [modal, setModal] = useState<Modal>({ state: false, title: null, subTitle: null, handle: () => { } })
    const toast = useToast()
    const { t } = useTranslation();
    const [title, setTitle] = useState<string>()
    const router = useRouter()
    const [modalDuplicate, setModalDuplicate] = useState({ state: false, data: null })

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
        console.log(100091)
        return await fetchApiEventos({
            query: queries.eventUpdate,
            variables: {
                idEvento: event._id,
                variable: "listIdentifiers",
                value: JSON.stringify(event.listIdentifiers)
            }
        })
    }

    useEffect(() => {
        setView(window.innerWidth > window.innerHeight && isAllowed() ? "cards" : "cards")
    }, [])

    useEffect(() => {
        setTitle(itinerario?.title)
    }, [itinerario])

    const handleDeleteItinerario = async () => {
        setModal({
            state: true,
            title: itinerario.title,
            subTitle: <span className="flex flex-col">
                <strong>{itinerario.title}</strong>
                <strong>{t("warningdelete1")}</strong>
                <p className=" text-xs"> {t("textwarningdelete1")} <span className="font-semibold">{itinerario.title.replace(/\s+/g, '').toLocaleLowerCase()}</span> {t("textwarningdelete2")} </p>
            </span>,
            handle: async () => {
                try {
                    await fetchApiEventos({
                        query: queries.deleteItinerario,
                        variables: {
                            eventID: event._id,
                            itinerarioID: itinerario?._id,
                        },
                        domain: config.domain
                    })

                    const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
                    const lastListIdentifiers = event.listIdentifiers[fListIdentifiers]

                    // console.log(lastListIdentifiers.start_Id, itinerario.next_id)
                    if (lastListIdentifiers.start_Id === itinerario._id) {
                        console.log("Borrando extremo izquierdo")
                        if (event.itinerarios_array?.filter(elem => elem.tipo === window?.location?.pathname.slice(1)).length > 1) {
                            console.log("NO es el último")
                            lastListIdentifiers.start_Id = itinerario.next_id
                        } else {
                            console.log("es es el último")
                            lastListIdentifiers.start_Id = null
                            lastListIdentifiers.end_Id = null
                        }
                        updatedListIdentifiers(event)
                    } else {
                        if (lastListIdentifiers.end_Id === itinerario._id) {
                            console.log("Borrando extremo derecho")
                            const f1next_id = event.itinerarios_array?.findIndex(elem => elem.next_id === itinerario._id)
                            lastListIdentifiers.end_Id = event.itinerarios_array[f1next_id]._id
                            updatedListIdentifiers(event)
                            //                        event.listIdentifiers[fListIdentifiers] = lastListIdentifiers
                        }
                        const f1next_id = event.itinerarios_array?.findIndex(elem => elem.next_id === itinerario._id)
                        event.itinerarios_array[f1next_id].next_id = itinerario?.next_id ?? null
                        updatedNextId(event.itinerarios_array[f1next_id])
                    }
                    const f1 = event.itinerarios_array?.findIndex(elem => elem._id === itinerario._id)
                    event.itinerarios_array?.splice(f1, 1)
                    setEvent({ ...event })
                    toast("success", t("El itinerario fue eliminado"));
                    setModal({ state: false })
                } catch (error) {
                    console.log(error)
                }
            }
        })
    }

    const handleUpdateTitle = async () => {

        await fetchApiEventos({
            query: queries.editItinerario,
            variables: {
                eventID: event._id,
                itinerarioID: itinerario?._id,
                variable: "title",
                valor: title
            },
            domain: config.domain
        })
        const f1 = event.itinerarios_array?.findIndex(elem => elem._id === itinerario._id)
        event.itinerarios_array[f1].title = title
        setEvent({ ...event })
        setEditTitle(false)
    }

    useEffect(() => {
        const itinerarios = event?.itinerarios_array.filter(elem => elem?.tipo === window?.location?.pathname.slice(1))
        if (itinerarios.length) {
            const f1 = itinerarios.findIndex(elem =>
                !!router.query?.itinerary
                    ? elem?._id === router.query?.itinerary
                    : elem?._id === itinerario?._id)
            if (f1 < 0) {
                setItinerario(itinerarios[0])
            } else {
                setItinerario(itinerarios[f1])
            }
        } else {
            setItinerario(null)
        }
    }, [event, router])

    return (
        <div className="w-full h-[calc(100vh-234px)] flex flex-col items-center bg-white rounded-lg mt-3 relative">
            {modal.state && <Modal set={setModal} classe={"w-[95%] md:w-[450px] h-[250px]"}>
                <DeleteConfirmation setModal={setModal} modal={modal} />
            </Modal>}
            {
                modalDuplicate.state &&
                <div className={"absolute top-0 left-0 w-full h-full. z-50 flex justify-center"}>
                    <ModalDupliucate setModalDuplicate={setModalDuplicate} modalDuplicate={modalDuplicate} />
                </div>
            }
            <ItineraryTabs
                itinerario={itinerario}
                setItinerario={setItinerario}
                setEditTitle={setEditTitle}
                title={title}
                setTitle={setTitle}
                view={view}
                setView={setView}
                handleDeleteItinerario={handleDeleteItinerario}
                handleUpdateTitle={handleUpdateTitle}
                editTitle={editTitle}
                setModalDuplicate={setModalDuplicate}
            />
            {(isAllowedViewer(itinerario?.viewers ?? []) || window?.location?.pathname === "/itinerario")
                ? <ItineraryPanel itinerario={itinerario} editTitle={editTitle} setEditTitle={setEditTitle} title={title} setTitle={setTitle} view={view} handleDeleteItinerario={handleDeleteItinerario} handleUpdateTitle={handleUpdateTitle} />
                : <div className="h-full">
                    <ViewWihtoutData />
                </div>
            }
        </div>
    )
}


const ViewWihtoutData = () => {
    return (
        <div className=" capitalize w-full h-full flex flex-col justify-center items-center bg-white rounded-lg mt-3 text-gray-500">
            <div>
                {t("noData2")}
            </div>
            <div>
                {t("waitOwner2")}
            </div>
            <div>
                <LiaUserClockSolid className="h-12 w-auto" />
            </div>
        </div>
    )
}

const ModalDupliucate = ({ setModalDuplicate, modalDuplicate }) => {
    const router = useRouter()
    const cleanedPath = router.asPath.replace(/\//g, '');
    const { event, setEvent } = EventContextProvider()
    const { eventsGroup, setEventsGroup } = EventsGroupContextProvider();
    const { config, user } = AuthContextProvider()
    const [filteredEventsGroup, setFilteredEventsGroup] = useState([])
    const [selectedOption, setSelectedOption] = useState('');

    const toast = useToast();


    useEffect(() => {
        setFilteredEventsGroup(eventsGroup?.filter(elem =>
            elem.usuario_id === user.uid ||
            (elem.usuario_id !== user.uid && elem.permissions?.some(permission => permission.title === "servicios" && permission.value === "edit"))
        ))
    }, [eventsGroup])

    const handleDuplicateItinerario = async () => {
        try {
            const eventDestination = eventsGroup.find(elem => elem.nombre === selectedOption)
            if (eventDestination.itinerarios_array.filter(elem => elem.tipo === window?.location?.pathname.slice(1)).length > 9) {
                toast("warning", t("maxLimitedItineraries"));
                return
            }

            const itinerary: Itinerary = modalDuplicate.data
            console.log(eventDestination.nombre)
            const result = await fetchApiEventos({
                query: queries.duplicateItinerario,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerary._id,
                    eventDestinationID: eventDestination._id,
                },
                domain: config.domain
            }) as Itinerary
            if (eventDestination._id === event._id) {
                const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerary._id)
                event.itinerarios_array[f1].next_id = result._id
                event.itinerarios_array.push(result)
                fetchApiEventos({
                    query: queries.editItinerario,
                    variables: {
                        eventID: event._id,
                        itinerarioID: itinerary._id,
                        variable: "next_id",
                        valor: result._id
                    },
                    domain: config.domain
                })
                const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
                if (event.listIdentifiers[fListIdentifiers].end_Id === itinerary._id) {
                    event.listIdentifiers[fListIdentifiers].end_Id = result._id
                    fetchApiEventos({
                        query: queries.eventUpdate,
                        variables: {
                            idEvento: event._id,
                            variable: "listIdentifiers",
                            value: JSON.stringify(event.listIdentifiers)
                        }
                    })
                }
                setEvent({ ...event })
            }
            if (eventDestination._id !== event._id) {
                const event = eventDestination
                const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
                if (!event.itinerarios_array.length) {
                    // pueder ser el primero, 
                    console.log("es el primero")
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
                } else {
                    console.log("NO es el primero")
                    // sino es el primero siempre sera el ultimo
                    fetchApiEventos({
                        query: queries.editItinerario,
                        variables: {
                            eventID: event._id,
                            itinerarioID: event.listIdentifiers[fListIdentifiers].end_Id,
                            variable: "next_id",
                            valor: result._id
                        },
                        domain: config.domain
                    })
                    event.listIdentifiers[fListIdentifiers].end_Id = result._id
                    fetchApiEventos({
                        query: queries.eventUpdate,
                        variables: {
                            idEvento: event._id,
                            variable: "listIdentifiers",
                            value: JSON.stringify(event.listIdentifiers)
                        }
                    })
                }
                const f1 = eventsGroup.findIndex(elem => elem._id === event._id)
                eventsGroup[f1].itinerarios_array.push(result)
                setEventsGroup([...eventsGroup])
            }
            setModalDuplicate({ state: false })
            toast("success", t("successful"));
        } catch (error) {
            console.log(error)
        }
    }

    const options = filteredEventsGroup?.map((elem) => ({
        value: elem.nombre,
        label: elem.nombre,
    }));

    const handleSelectChangee = (selectedOption) => {
        setSelectedOption(selectedOption.value);
    };

    useEffect(() => {
        console.log(500042, selectedOption)
    }, [selectedOption])


    return (
        <div className="w-[650px] bg-white rounded-xl shadow-md">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 p-4">
                <h2 className="text-lg font-semibold capitalize text-gray-700">{t("duplicar")} {cleanedPath}</h2>
                <button className="text-gray-500" onClick={() => { setModalDuplicate({ state: false }) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 3.293a1 1 0 0 1 1.414 0L10 8.586l5.293-5.293a1 1 0 1 1 1.414 1.414L11.414 10l5.293 5.293a1 1 0 1 1-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L8.586 10 3.293 4.707a1 1 0 0 1 0-1.414z" />
                    </svg>
                </button>
            </div>
            <div className="grid grid-cols-11 gap-4 px-3 py-6">
                <div className="col-span-5">
                    <label className="text-sm text-gray-500 capitalize">{cleanedPath} {t("aDuplicar")}</label>
                    <div className="w-full border border-gray-300 cursor-default rounded-md p-[6.5px] text-azulCorporativo capitalize">
                        {modalDuplicate.data?.title}
                    </div>
                </div>
                <div className="col-span-1 flex items-center justify-center mt-5">
                    <HiArrowSmallRight className="w-5 h-5" />
                </div>
                <div className="col-span-5">
                    <label className="text-sm text-gray-500 capitalize">{t("duplicateIn")}</label>
                    <Select
                        options={options}
                        onChange={handleSelectChangee}
                        classNamePrefix="react-select"
                        placeholder={t("seleccionaOpcion") + "..."}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-4 border-t border-gray-300 px-4 pb-4 bg-gray-100">
                <button onClick={() => { setModalDuplicate({ state: false }) }} className="bg-gray-400 text-white rounded-md py-2 px-4 mt-4">{t("cancel")}</button>
                <button onClick={() => handleDuplicateItinerario()} disabled={!selectedOption} className={`${!selectedOption ? "bg-gray-300" : "bg-primary"} text-white rounded-md py-2 px-4 mt-4 capitalize`}>{t("duplicar")}</button>
            </div>
        </div>
    )
}