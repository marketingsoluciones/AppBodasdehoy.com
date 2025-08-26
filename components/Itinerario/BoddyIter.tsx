import { useEffect, useState } from "react"
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "./MicroComponente/ItineraryPanel"
import { AuthContextProvider, EventContextProvider } from "../../context";
import { Event, Itinerary, SelectModeSortType } from "../../utils/Interfaces"
import { ViewItinerary } from "../../pages/invitados";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../Utils/Modal";
import { DeleteConfirmation } from "../Utils/DeleteConfirmation";
import { useTranslation } from "react-i18next";
import { useAllowed, useAllowedViewer } from "../../hooks/useAllowed";
import { useRouter } from "next/router";
import { LiaUserClockSolid } from "react-icons/lia";
import { t } from "i18next";
import { deleteAllFiles, deleteRecursive } from "../Utils/storages";
import { getStorage } from "firebase/storage";
import { ModalDuplicate } from "../Servicios/Utils/ModalDuplicate";
import { PermissionWrapper } from "../Servicios/Utils/PermissionWrapper";

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
    const [loadingModal, setLoadingModal] = useState<boolean>(false)
    const storage = getStorage();
    const [selectTask, setSelectTask] = useState<string>()
    const [orderAndDirection, setOrderAndDirection] = useState<SelectModeSortType>()

    // Hidratar orderAndDirection desde localStorage al montar
    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                const saved = window.localStorage.getItem("OADitinerary")
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed?.order && parsed?.direction) {
                        setOrderAndDirection(parsed)
                    }
                }
            }
        } catch (error) {
            console.warn("No se pudo leer OADitinerary de localStorage", error)
        }
    }, [])

    // Persistir orderAndDirection en localStorage al cambiar
    useEffect(() => {
        try {
            if (typeof window !== "undefined" && orderAndDirection) {
                window.localStorage.setItem("OADitinerary", JSON.stringify(orderAndDirection))
            }
        } catch (error) {
            console.warn("No se pudo guardar OADitinerary en localStorage", error)
        }
    }, [orderAndDirection])

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
                <p className="text-xs gap-2 flex justify-center">
                    {t("textwarningdelete1")}
                    <span className="font-semibold">
                        {itinerario.title.replace(/\s+/g, '').toLocaleLowerCase()}
                    </span>
                    {t("textwarningdelete2")}
                </p>
            </span>,
            handle: async () => {
                try {
                    setLoadingModal(true)
                    const deletePromises = itinerario.tasks.map(async (task) => {
                        deleteAllFiles(storage, `${task._id}`)
                    })
                    Promise.all(deletePromises)
                        .then(() => {
                            deleteRecursive(storage, `event-${event?._id}//itinerary-${itinerario?._id}`)
                                .then(() => {
                                    fetchApiEventos({
                                        query: queries.deleteItinerario,
                                        variables: {
                                            eventID: event._id,
                                            itinerarioID: itinerario?._id,
                                        },
                                        domain: config.domain
                                    })
                                        .then(() => {
                                            const fListIdentifiers = event?.listIdentifiers?.findIndex(elem => elem.table === window?.location?.pathname.slice(1))
                                            const lastListIdentifiers = event.listIdentifiers[fListIdentifiers]
                                            if (lastListIdentifiers.start_Id === itinerario._id) {
                                                if (event.itinerarios_array?.filter(elem => elem.tipo === window?.location?.pathname.slice(1)).length > 1) {
                                                    lastListIdentifiers.start_Id = itinerario.next_id
                                                } else {
                                                    lastListIdentifiers.start_Id = null
                                                    lastListIdentifiers.end_Id = null
                                                }
                                                updatedListIdentifiers(event)
                                            } else {
                                                if (lastListIdentifiers.end_Id === itinerario._id) {
                                                    const f1next_id = event.itinerarios_array?.findIndex(elem => elem.next_id === itinerario._id)
                                                    lastListIdentifiers.end_Id = event.itinerarios_array[f1next_id]._id
                                                    updatedListIdentifiers(event)
                                                }
                                                const f1next_id = event.itinerarios_array?.findIndex(elem => elem.next_id === itinerario._id)
                                                event.itinerarios_array[f1next_id].next_id = itinerario?.next_id ?? null
                                                updatedNextId(event.itinerarios_array[f1next_id])
                                            }
                                            const f1 = event.itinerarios_array?.findIndex(elem => elem._id === itinerario._id)
                                            event.itinerarios_array?.splice(f1, 1)
                                            setEvent({ ...event })
                                            setModal({ state: false })
                                            setTimeout(() => {
                                                setLoadingModal(false)
                                                toast("success", t("El itinerario fue eliminado"));
                                            }, 1000);
                                        })
                                })
                        })
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
        const updatedItinerario = { ...event.itinerarios_array[f1], title }
        event.itinerarios_array[f1] = updatedItinerario
        setEvent({ ...event })
        setEditTitle(false)
    }

    useEffect(() => {
        const itinerarios = event?.itinerarios_array.filter(elem => elem?.tipo === window?.location?.pathname.slice(1))
        if (itinerarios.length) {
            let nuevoItinerario = itinerario;
            
            // Solo cambiar el itinerario si realmente es necesario
            if (router?.query?.itinerary) {
                nuevoItinerario = itinerarios.find(elem => elem?._id === router.query?.itinerary)
            } else if (!itinerario || !itinerarios.some(elem => elem._id === itinerario._id)) {
                nuevoItinerario = itinerarios[0]
            }
            
            // Solo actualizar si es un itinerario diferente o si no hay itinerario actual
            if (!itinerario || nuevoItinerario._id !== itinerario._id) {
                if (view !== "schema") {
                    const statusOrder: Record<string, number> = {
                        pending: 0,
                        in_progress: 1,
                        completed: 2,
                        blocked: 3
                    }
                    const prioridadOrder: Record<string, number> = {
                        baja: 0,
                        media: 1,
                        alta: 2
                    }
                    
                    orderAndDirection?.order === "descripcion" && nuevoItinerario.tasks.sort((a, b) => {
                        const comparison = a?.descripcion?.localeCompare(b?.descripcion)
                        return orderAndDirection?.direction === "desc" ? -comparison : comparison
                    })
                    orderAndDirection?.order === "fecha" && nuevoItinerario.tasks.sort((a, b) => {
                        const comparison = new Date(a?.fecha)?.getTime() - new Date(b?.fecha)?.getTime()
                        return orderAndDirection?.direction === "desc" ? -comparison : comparison
                    })
                    orderAndDirection?.order === "estado" &&
                        nuevoItinerario.tasks.sort((a: any, b: any) => {
                            const aIdx = a?.estado ? (statusOrder[a.estado] ?? 0) : 0
                            const bIdx = b?.estado ? (statusOrder[b.estado] ?? 0) : 0
                            const comparison = aIdx - bIdx
                            return orderAndDirection?.direction === "desc" ? -comparison : comparison
                        })
                    orderAndDirection?.order === "prioridad" && nuevoItinerario.tasks.sort((a, b) => {
                        const aIdx = a?.prioridad ? (prioridadOrder[a.prioridad] ?? 0) : 0
                        const bIdx = b?.prioridad ? (prioridadOrder[b.prioridad] ?? 0) : 0
                        const comparison = aIdx - bIdx
                        return orderAndDirection?.direction === "desc" ? -comparison : comparison
                    })
                    // orderAndDirection.order === "personalizada" && nuevoItinerario.tasks.sort((a, b) => a.personalizada.localeCompare(b.personalizada))
                    // orderAndDirection.order === "ninguna" && nuevoItinerario.tasks.sort((a, b) => a.title.localeCompare(b.title))
                }
                setItinerario({ ...nuevoItinerario })
            }
        } else {
            setItinerario(null)
        }
    }, [event, router, orderAndDirection, itinerario?._id, view])

    return (
        <PermissionWrapper>
            <div
                className={`bg-white ${view === "cards" ? "max-w-[1050px] mx-auto" : "w-auto"
                    } h-[calc(100vh-212px)] flex flex-col items-center rounded-t-lg mt-3 relative overflow-hidden`}
            >
                {
                    modal.state &&
                    <Modal set={setModal} classe={"w-[95%] md:w-[450px] h-[250px]"} loading={loadingModal} >
                        <DeleteConfirmation setModal={setModal} modal={modal} />
                    </Modal>
                }
                {
                    modalDuplicate.state &&
                    <div className={"absolute top-0 left-0 w-full h-full. z-50 flex justify-center"}>
                        <ModalDuplicate setModalDuplicate={setModalDuplicate} modalDuplicate={modalDuplicate} />
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
                    selectTask={selectTask}
                    setSelectTask={setSelectTask}
                    orderAndDirection={orderAndDirection}
                    setOrderAndDirection={setOrderAndDirection}
                />
                {
                    (isAllowedViewer(itinerario?.viewers ?? []) || window?.location?.pathname === "/itinerario" || isAllowed())
                        ? <ItineraryPanel
                            itinerario={itinerario}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            title={title}
                            setTitle={setTitle}
                            view={view}
                            handleDeleteItinerario={handleDeleteItinerario}
                            handleUpdateTitle={handleUpdateTitle}
                            selectTask={selectTask}
                            setSelectTask={setSelectTask}
                            orderAndDirection={orderAndDirection}
                        />
                        : <div className="h-full">
                            <ViewWihtoutData />
                        </div>
                }
            </div>
        </PermissionWrapper>
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

