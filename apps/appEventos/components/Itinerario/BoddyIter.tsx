import React, { useEffect, useState } from "react"
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "./MicroComponente/ItineraryPanel"
import { ModuleErrorBoundary } from "../ErrorBoundary"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { Event, Itinerary, SelectModeSortType } from "../../utils/Interfaces"
import { ViewItinerary } from "../../pages/invitados";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../Utils/Modal";
import { DeleteConfirmation } from "../Utils/DeleteConfirmation";
import { useTranslation } from "react-i18next";
import { useServicePermissions } from "../../hooks/useServicePermissions";
import { useRouter, useSearchParams } from "next/navigation";
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
    subTitle?: string | React.ReactElement
}

export const BoddyIter = () => {
    const { config, user } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    // QA ITI-01 (04-jul): mensaje "espera al dueño" se mostraba al PROPIO
    // Propietario. Detectamos owner para render distinto en ViewWihtoutData.
    const isOwner = Boolean(user?.uid && event?.usuario_id && user.uid === event.usuario_id)
    const { copilotFilter } = EventsGroupContextProvider()
    const [itinerario, setItinerario] = useState<Itinerary>()
    const [editTitle, setEditTitle] = useState<boolean>(false)
    const { canAccessList } = useServicePermissions(itinerario?.viewers ?? [])
    const [view, setView] = useState<ViewItinerary>()
    const [modal, setModal] = useState<Modal>({ state: false, title: null, subTitle: null, handle: () => { } })
    const toast = useToast()
    const { t } = useTranslation();
    const [title, setTitle] = useState<string>()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [modalDuplicate, setModalDuplicate] = useState({ state: false, data: null })
    const [loadingModal, setLoadingModal] = useState<boolean>(false)
    const storage = getStorage();
    const [selectTask, setSelectTask] = useState<string>()
    const [orderAndDirection, setOrderAndDirection] = useState<SelectModeSortType>()

    // Query params usando useSearchParams (Next.js 15)
    const queryItinerary = searchParams.get("itinerary")

    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                const saved = window.localStorage.getItem(`OAD${window?.location?.pathname.slice(1)}`)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed?.order && parsed?.direction) {
                        setOrderAndDirection(parsed)
                    }
                }
            }
        } catch (error) {
            console.warn(`No se pudo leer OAD de localStorage`, error)
        }
    }, [])

    useEffect(() => {
        try {
            if (typeof window !== "undefined" && orderAndDirection && itinerario) {
                window.localStorage.setItem(`OAD${window?.location?.pathname.slice(1)}`, JSON.stringify(orderAndDirection))
            }
        } catch (error) {
            console.warn(`No se pudo guardar OAD en localStorage`, error)
        }
    }, [orderAndDirection])

    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                const saved = window.localStorage.getItem(`VIEW${window?.location?.pathname.slice(1)}`)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed?.view) {
                        setView(parsed.view)
                    } else {
                        setView("cards")
                    }
                } else {
                    setView("cards")
                }
            }
        } catch (error) {
            console.warn(`No se pudo leer VIEW de localStorage`, error)
            setView("cards")
        }
    }, [])

    // Forzar vista cards en móvil cuando la vista actual es de tabla
    useEffect(() => {
        if (typeof window === "undefined") return
        const TABLE_VIEWS = ["newTable", "extraTable", "table", "boardView"]
        const check = () => {
            if (window.innerWidth < 768) {
                setView(prev => prev && TABLE_VIEWS.includes(prev) ? "cards" : prev)
            }
        }
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    useEffect(() => {
        try {
            if (typeof window !== "undefined" && view && itinerario) {
                window.localStorage.setItem(`VIEW${window?.location?.pathname.slice(1)}`, JSON.stringify({ view: view }))
            }
        } catch (error) {
            console.warn(`No se pudo guardar VIEW en localStorage`, error)
        }
    }, [view])

    async function updatedNextId(itinerary: Itinerary) {
        return await fetchApiEventos({
            query: queries.editItinerario,
            variables: {
                evento_id: event._id,
                itinerario_id: itinerary._id,
                datos: { next_id: itinerary.next_id }
            },
            domain: config.domain
        })
    }

    async function updatedListIdentifiers(event: Event) {
        return await fetchApiEventos({
            query: queries.eventUpdate,
            variables: {
                idEvento: event._id,
                input: { listIdentifiers: event.listIdentifiers }
            }
        })
    }

    useEffect(() => {
        setTitle(itinerario?.title)
    }, [itinerario])

    const handleDeleteItinerario = async () => {
        setModal({
            state: true,
            title: itinerario.title,
            subTitle: <span className="flex flex-col">
                <strong>{t("warningdelete1")}</strong>
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
                                            evento_id: event._id,
                                            itinerario_id: itinerario?._id,
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
                                                    if (f1next_id > -1 && event.itinerarios_array[f1next_id]) {
                                                        lastListIdentifiers.end_Id = event.itinerarios_array[f1next_id]._id
                                                        updatedListIdentifiers(event)
                                                    }
                                                }
                                                const f1next_id = event.itinerarios_array?.findIndex(elem => elem.next_id === itinerario._id)
                                                if (f1next_id > -1 && event.itinerarios_array[f1next_id]) {
                                                    event.itinerarios_array[f1next_id].next_id = itinerario?.next_id ?? null
                                                    updatedNextId(event.itinerarios_array[f1next_id])
                                                }
                                            }
                                            // Inmutable: filtrar fuera del array en vez de splice.
                                            const deletedId = itinerario._id
                                            const pathSlice = typeof window !== "undefined"
                                                ? window.location.pathname.slice(1)
                                                : ""
                                            if (event?._id && pathSlice) {
                                                const lsKey = `E_${event._id}_${pathSlice}`
                                                if (localStorage.getItem(lsKey) === deletedId) {
                                                    localStorage.removeItem(lsKey)
                                                }
                                            }
                                            setEvent((prev: any) => {
                                                if (!Array.isArray(prev?.itinerarios_array)) return prev
                                                const nextArr = prev.itinerarios_array.filter(
                                                    (elem: any) => elem._id !== deletedId
                                                )
                                                const remaining = nextArr.filter(
                                                    (elem: any) => elem?.tipo === pathSlice
                                                )
                                                if (remaining.length && event?._id && pathSlice) {
                                                    localStorage.setItem(
                                                        `E_${event._id}_${pathSlice}`,
                                                        remaining[0]._id
                                                    )
                                                }
                                                return {
                                                    ...prev,
                                                    itinerarios_array: nextArr
                                                }
                                            })
                                            // Limpiar selección local; el useEffect reasigna al
                                            // siguiente itinerario o deja ViewWihtoutData.
                                            setItinerario(undefined)
                                            setSelectTask(undefined)
                                            setModal({ state: false })
                                            setTimeout(() => {
                                                setLoadingModal(false)
                                                toast("success", t("El itinerario fue eliminado"));
                                            }, 1000);
                                        })
                                })
                        })
                } catch (error) {
                }
            }
        })
    }

    const handleUpdateTitle = async () => {
        await fetchApiEventos({
            query: queries.editItinerario,
            variables: {
                evento_id: event._id,
                itinerario_id: itinerario?._id,
                datos: { title: title }
            },
            domain: config.domain
        })
        // Inmutable: actualizar el itinerario sin mutar el array.
        setEvent((prev: any) => {
            const arr = prev?.itinerarios_array
            if (!Array.isArray(arr)) return prev
            const idx = arr.findIndex((elem: any) => elem._id === itinerario._id)
            if (idx < 0) return prev
            const next = [...arr]
            next[idx] = { ...arr[idx], title }
            return { ...prev, itinerarios_array: next }
        })
        setEditTitle(false)
    }

    const sortTasks = (tasks: any[], orderAndDirection: SelectModeSortType | undefined) => {
        if (!orderAndDirection || !tasks || view === "schema") {
            return tasks;
        }
        const statusOrder: Record<string, number> = {
            pending: 0,
            in_progress: 1,
            completed: 2,
            blocked: 3
        };
        const prioridadOrder: Record<string, number> = {
            baja: 0,
            media: 1,
            alta: 2
        };
        const { order, direction } = orderAndDirection;
        const isDesc = direction === "desc";
        return [...tasks].sort((a, b) => {
            let comparison = 0;

            switch (order) {
                case "descripcion":
                    comparison = (a?.descripcion || "").localeCompare(b?.descripcion || "");
                    break;

                case "fecha":
                    const dateA = new Date(a?.fecha || 0).getTime();
                    const dateB = new Date(b?.fecha || 0).getTime();
                    comparison = dateA - dateB;
                    break;

                case "estado":
                    const aIdx = a?.estado ? (statusOrder[a.estado] ?? 0) : 0;
                    const bIdx = b?.estado ? (statusOrder[b.estado] ?? 0) : 0;
                    comparison = aIdx - bIdx;
                    break;

                case "prioridad":
                    const aPrioridad = a?.prioridad ? (prioridadOrder[a.prioridad] ?? 0) : 0;
                    const bPrioridad = b?.prioridad ? (prioridadOrder[b.prioridad] ?? 0) : 0;
                    comparison = aPrioridad - bPrioridad;
                    break;

                case "nombre":
                    comparison = (a?.title || "").localeCompare(b?.title || "");
                    break;

                case "personalizada":
                    comparison = (a?.personalizada || "").localeCompare(b?.personalizada || "");
                    break;

                case "ninguna":
                default:
                    // Sin ordenamiento específico, mantener orden original
                    return 0;
            }
            return isDesc ? -comparison : comparison;
        });
    };

    useEffect(() => {
        // BUG-CW-02 (informe QA 22-jun noche): crash "Cannot read properties of null"
        // por accesos a itinerario._id, nuevoItinerario.tasks sin guard cuando
        // itinerario era null/undefined o el find no encontraba nada.
        // Fix: guards exhaustivos + early returns.
        if (typeof window === 'undefined') return
        let arr = Array.isArray(event?.itinerarios_array) ? event.itinerarios_array : []
        if ((copilotFilter?.entity === 'moments' || copilotFilter?.entity === 'services') && copilotFilter.ids?.length) {
            arr = arr.filter((elem) => elem?._id && copilotFilter.ids!.includes(elem._id))
        }
        const pathSlice = window?.location?.pathname.slice(1)
        const itinerarios = arr.filter(elem => elem?.tipo === pathSlice)
        const itinerarioSeleccionado = event?._id ? localStorage.getItem(`E_${event._id}_${pathSlice}`) : null
        // No sombrear el state `itinerario`: hay que comparar el estado React
        // con el elegido (LS / query) para detectar borrados.
        const selectedFromStorage = arr.find(elem => elem?._id === itinerarioSeleccionado)
        if (itinerarios.length) {
            let nuevoItinerario = selectedFromStorage
            if (queryItinerary) {
                const found = itinerarios.find(elem => elem?._id === queryItinerary)
                if (found) nuevoItinerario = found
            } else if (!selectedFromStorage || !itinerarios.some(elem => elem?._id === selectedFromStorage._id)) {
                nuevoItinerario = itinerarios[0]
            }
            // Guard CRÍTICO: si después de todo no hay nuevoItinerario, no continuar.
            if (!nuevoItinerario || !nuevoItinerario._id) {
                return
            }
            if (event?._id && pathSlice && nuevoItinerario._id) {
                localStorage.setItem(`E_${event._id}_${pathSlice}`, nuevoItinerario._id)
            }
            if (!itinerario || nuevoItinerario._id !== itinerario._id) {
                const tasksOrdenadas = sortTasks(nuevoItinerario.tasks ?? [], orderAndDirection);
                setItinerario({ ...nuevoItinerario, tasks: tasksOrdenadas });
            } else if (orderAndDirection) {
                const tasksOrdenadas = sortTasks(nuevoItinerario.tasks ?? [], orderAndDirection);
                setItinerario({ ...nuevoItinerario, tasks: tasksOrdenadas });
            }
        } else {
            // No quedan itinerarios de este tipo: limpiar estado (antes se
            // re-seteaba el borrado y las tareas seguían visibles).
            if (event?._id && pathSlice) {
                localStorage.removeItem(`E_${event._id}_${pathSlice}`)
            }
            setItinerario(undefined)
            setSelectTask(undefined)
        }
    }, [event, queryItinerary, orderAndDirection, itinerario?._id, view, copilotFilter])

    return (
        <PermissionWrapper>
            <div
                className={`bg-white ${view === "cards" ? "max-w-[1050px] mx-auto" : "w-auto"
                    } md:h-[calc(100vh-244px)] flex flex-col items-center rounded-t-lg mt-3 relative overflow-hidden`}
            >
                {
                    modal.state &&
                    <Modal set={setModal} classe={"w-[380px] max-w-[95%] h-auto min-h-[220px] !top-1/2 !left-1/2 !right-auto !bottom-auto -translate-x-1/2 -translate-y-1/2"} loading={loadingModal} >
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
                    (canAccessList || window?.location?.pathname === "/itinerario")
                        ? <ModuleErrorBoundary label="Itinerario">
                            {/* BUG-CW-02 (informe QA 22-jun noche): si itinerario
                                es undefined (evento sin datos o array null),
                                ItineraryPanel crashea al hacer itinerario._id.
                                Render alternativo "sin datos" en ese caso. */}
                            {itinerario && itinerario._id ? <ItineraryPanel
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
                            /> : <ViewWihtoutData isOwner={isOwner} />}
                        </ModuleErrorBoundary>
                        : <div className="h-full">
                            <ViewWihtoutData isOwner={isOwner} />
                        </div>
                }
            </div>
        </PermissionWrapper>
    )
}


const ViewWihtoutData = ({ isOwner = false }: { isOwner?: boolean }) => {
    return (
        <div className=" capitalize w-full h-full flex flex-col justify-center items-center bg-white rounded-lg mt-3 text-gray-500">
            <div>
                {t("noData2")}
            </div>
            <div>
                {/* QA ITI-01 (04-jul): al propietario NO le decimos "espera al dueño"
                    (ese es él mismo). Se le sugiere crear su itinerario. */}
                {isOwner ? t("ownerCreateItinerary") : t("waitOwner2")}
            </div>
            <div>
                <LiaUserClockSolid className="h-12 w-auto" />
            </div>
        </div>
    )
}

