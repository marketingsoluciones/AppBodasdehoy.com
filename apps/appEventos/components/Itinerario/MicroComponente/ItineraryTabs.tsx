import { Dispatch, FC, LegacyRef, MouseEvent, SetStateAction, useEffect, useRef, useState } from "react"
import { Event, Itinerary, SelectModeSortType, Task } from "../../../utils/Interfaces"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { ViewItinerary } from "../../../pages/invitados"
import { ItineraryTabsMenu } from "./ItineraryTabsMenu"
import { FaCheck, FaChevronDown, FaPlus } from "react-icons/fa"
import { useAllowed, useAllowedViewer } from "../../../hooks/useAllowed"
import { useTranslation } from "react-i18next"
import { useToast } from "../../../hooks/useToast"
import { SelectModeSort } from "../../Utils/SelectModeSort"
import { PermissionSelectModeView } from '../../Servicios/Utils/PermissionSelectModeView';
import { PermissionAddButton } from "../../Servicios/Utils/PermissionAddButton"
import { TimeZone } from "../../icons"
import { getTimeZoneCity } from "../../../utils/FormatTime"

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
    selectTask: string
    setSelectTask: any
    orderAndDirection: SelectModeSortType
    setOrderAndDirection: Dispatch<SetStateAction<SelectModeSortType>>
}

export const ItineraryTabs: FC<props> = ({ setModalDuplicate, itinerario, setItinerario, setEditTitle, view, setView, handleDeleteItinerario, handleUpdateTitle, title, setTitle, editTitle, selectTask, setSelectTask, orderAndDirection, setOrderAndDirection }) => {
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
    const refTabs: LegacyRef<HTMLDivElement> = useRef(null)
    const [reverse, setReverse] = useState<{ direction: string, position: number }[]>([])
    const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState<boolean>(false)
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const toast = useToast()

    const addTask = async () => {
        try {
            if (!itinerario) {
                // Estado vacío: si NO existe ningún itinerario de este tipo, crear el PRIMERO
                // directamente. Antes bloqueaba con "Selecciona un itinerario primero", que no
                // tiene sentido cuando no hay ninguno creado (contradicción UX del estado vacío).
                // Si SÍ existen itinerarios pero ninguno está seleccionado, sí pedimos seleccionar.
                const tipo = window?.location?.pathname.slice(1)
                const existentes = Array.isArray(event?.itinerarios_array)
                    ? event.itinerarios_array.filter(el => el?.tipo === tipo)
                    : []
                if (existentes.length === 0) {
                    await handleCreateItinerario();
                    return;
                }
                toast("warning", t("Selecciona un itinerario primero"));
                return;
            }
            // BUG-IT-01 (informe QA 22-jun): si event.fecha es null/undefined/no-number,
            // new Date(parseInt(undefined)) = Invalid Date → API 400 → toast error sin contexto.
            // Guard: usar fecha del evento si es válida, si no fallback a hoy.
            const fechaParsed = event?.fecha ? parseInt(String(event.fecha)) : NaN
            const f = !isNaN(fechaParsed) && fechaParsed > 0
                ? new Date(fechaParsed)
                : new Date()
            const baseDate = isNaN(f.getTime()) ? new Date() : f
            const fy = baseDate.getUTCFullYear()
            const fm = baseDate.getUTCMonth()
            const fd = baseDate.getUTCDate()
            let newEpoch = new Date(fy, fm + 1, fd).getTime() + 7 * 60 * 60 * 1000
            const tasks = itinerario.tasks || [];
            if (tasks.length) {
                const item = tasks[tasks.length - 1]
                const epoch = item?.fecha ? new Date(item.fecha).getTime() : NaN
                if (!isNaN(epoch)) {
                    newEpoch = epoch + (item.duracion || 0) * 60 * 1000
                }
            }
            const fecha = new Date(newEpoch)
            await fetchApiEventos({
                query: queries.createTask,
                variables: {
                    evento_id: event._id,
                    development: config.development || "bodasdehoy",
                    task: {
                        itinerario_id: itinerario._id,
                        descripcion: itinerario.tipo === "itinerario" ? "Tarea nueva" : "Servicio nuevo",
                        ...(itinerario.tipo === "itinerario" && { fecha: fecha }),
                        ...(itinerario.tipo === "itinerario" && { duracion: 30 }),
                        ...(itinerario.tipo === "itinerario" && { spectatorView: true })
                    }
                },
                domain: config.domain
            }).then((result: any) => {
                // BUG-IT-01: si el API devuelve null/sin _id, no podemos seguir.
                const addNewTask = result?.task || result
                if (!addNewTask || !addNewTask._id) {
                    console.warn('[ItineraryTabs] createTask devolvió result null/sin _id', result)
                    toast("error", t("Error al añadir"));
                    return
                }
                fetchApiEventos({
                    query: queries.editTask,
                    variables: {
                        evento_id: event._id,
                        itinerario_id: itinerario._id,
                        task_id: addNewTask._id,
                        development: config.development || "bodasdehoy",
                        updates: { estatus: true }
                    }
                }).catch((e) => console.warn('[ItineraryTabs] editTask estatus falló:', e?.message ?? e))
                const task = { ...(addNewTask as any), spectatorView: false, estatus: "true" } as Task
                const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
                setEvent((prev) => ({
                    ...prev,
                    itinerarios_array: prev.itinerarios_array.map((it, i) =>
                        i !== f1 ? it : { ...it, tasks: [...it.tasks, task] }
                    ),
                }))
                setSelectTask(task._id)
                toast("success", t(itinerario.tipo === "itinerario" ? "Actividad añadida" : "Servicio añadido"));
            })
        } catch (error: any) {
            console.warn('[ItineraryTabs] handleAddNewItem error:', error?.message ?? error)
            toast("error", t("Error al añadir"));
        }
    }

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkIsMobile()
        window.addEventListener('resize', checkIsMobile)

        return () => window.removeEventListener('resize', checkIsMobile)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (isMobileDropdownOpen && !(event.target as Element).closest('.mobile-dropdown')) {
                setIsMobileDropdownOpen(false)
            }
        }

        if (isMobileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isMobileDropdownOpen])

    useEffect(() => {
        // BUG-CW-02 PERSISTE (informe QA 23-jun): el crash original
        // "Cannot read properties of null (reading 'undefined')" venía de:
        //   event?.listIdentifiers[fListIdentifiers]
        // Si event.listIdentifiers es NULL (no undefined; el optional chaining
        // `?.findIndex` retorna undefined pero el `[undefined]` después da el
        // crash exacto del reporte). Guards completos:
        if (typeof window === 'undefined') return
        const pathSlice = window?.location?.pathname.slice(1)
        const itineraries = Array.isArray(event?.itinerarios_array)
            ? event.itinerarios_array.filter(elem => elem?.tipo === pathSlice)
            : []
        if (!itineraries.length) {
            setItineraries([])
        }

        if (itineraries.length) {
            // Guard listIdentifiers null/undefined → array vacío para procesarlo igual.
            const safeListIdentifiers = Array.isArray(event?.listIdentifiers) ? event.listIdentifiers : []
            const fListIdentifiers = safeListIdentifiers.findIndex(elem => elem?.table === pathSlice)
            const listIdentifiers = fListIdentifiers >= 0 ? safeListIdentifiers[fListIdentifiers] : null
            if (!listIdentifiers?.start_Id) {
                const listIdentifier = {
                    table: pathSlice,
                    start_Id: itineraries[0]?._id,
                    end_Id: itineraries[itineraries.length - 1]?._id
                }
                // Sustituir entrada existente (p. ej. start_Id null) o añadir.
                // Antes siempre hacía push + setEvent({...prev}) sin meter listIdentifiers
                // → el guard seguía true → bucle infinito de setEvent + hydrate socket.
                const newListIdentifiers = fListIdentifiers >= 0
                    ? safeListIdentifiers.map((el, i) => i === fListIdentifiers ? listIdentifier : el)
                    : [...safeListIdentifiers, listIdentifier]
                const nextById = new Map<string, string | null>()
                if (itineraries.length > 1) {
                    for (let idx = 0; idx < itineraries.length - 1; idx++) {
                        const cur = itineraries[idx]
                        if (cur?._id) nextById.set(cur._id, itineraries[idx + 1]?._id ?? null)
                    }
                }
                const baseItinerarios = Array.isArray(event?.itinerarios_array) ? event.itinerarios_array : []
                const nextItinerarios = nextById.size
                    ? baseItinerarios.map((it) =>
                        nextById.has(it._id) ? { ...it, next_id: nextById.get(it._id) } : it
                    )
                    : baseItinerarios
                const orderedForTabs = nextById.size
                    ? itineraries.map((it) =>
                        nextById.has(it._id) ? { ...it, next_id: nextById.get(it._id) } : it
                    )
                    : [...itineraries]
                if (!event?._id) return
                // EventoUpdateInput.listIdentifiers es [String!] en api-v2 (bug vs Event: JSON).
                // Enviar objetos → 400 "String cannot represent a non string value".
                // Solo estado local; la persistencia real de orden/tabs sigue por flujos
                // que API2 alinee el SDL (JSON) o por editItinerario de next_id.
                setEvent((prev) => ({
                    ...prev,
                    listIdentifiers: newListIdentifiers,
                    itinerarios_array: nextItinerarios,
                }))
                setItineraries(orderedForTabs)
            } else {
                let newItineraries: any[] = []
                const itinerariesCopy = [...itineraries] // Copia para no modificar el original mientras iteramos
                const pushNextElem = ({ _id }: { _id: any }) => {
                    if (!_id) return
                    const f1 = itinerariesCopy.findIndex(elem => elem?._id === _id)
                    if (f1 > -1) {
                        const itinerary = { ...itinerariesCopy[f1] }
                        newItineraries.push(itinerary)
                        itinerariesCopy.splice(f1, 1)
                        if (itinerary?.next_id) {
                            pushNextElem({ _id: itinerary.next_id })
                        }
                    }
                }
                // BUG-CW-02 PERSISTE: listIdentifiers ya está garantizado != null arriba
                // por el guard inicial, pero re-validar por defensa.
                const startId = listIdentifiers?.start_Id
                const firsItinerary = startId ? itinerariesCopy.find(elem => elem?._id === startId) : undefined
                if (firsItinerary) {
                    newItineraries.push(firsItinerary)
                    const index = itinerariesCopy.findIndex(elem => elem?._id === startId)
                    if (index > -1) {
                        itinerariesCopy.splice(index, 1)
                    }
                    if (firsItinerary?.next_id) {
                        pushNextElem({ _id: firsItinerary.next_id })
                    }
                    if (itinerariesCopy.length > 0) {
                        newItineraries.push(...itinerariesCopy)
                    }
                } else {
                    newItineraries = [...itineraries]
                }

                setItineraries([...newItineraries])
            }
        }
    }, [event, setEvent])
    const handleCreateItinerario = async () => {
        const safeItins = Array.isArray(event?.itinerarios_array) ? event.itinerarios_array : []
        if (safeItins.filter(elem => elem?.tipo === window?.location?.pathname.slice(1)).length > 15) {
            toast("warning", t("maxLimitedItineraries"));
            return
        }
        // BUG-IT-01 (informe QA 22-jun): si event.fecha es null/undefined o no
        // parseable, new Date(parseInt(undefined)) = Invalid Date → API 400.
        // Usar la fecha del evento si es válida, si no fallback a "hoy".
        const fechaParsed = event?.fecha ? parseInt(String(event.fecha)) : NaN
        const f = !isNaN(fechaParsed) && fechaParsed > 0
            ? new Date(fechaParsed)
            : new Date()
        const baseDate = isNaN(f.getTime()) ? new Date() : f
        const y = baseDate.getUTCFullYear()
        const m = baseDate.getUTCMonth()
        const d = baseDate.getUTCDate()
        fetchApiEventos({
            query: queries.createItinerario,
            variables: {
                evento_id: event._id,
                itinerario: {
                    title: t("unnamed"),
                    dateTime: new Date(y, m, d, 8, 0),
                    tipo: window?.location?.pathname.slice(1)
                }
            },
            domain: config.domain
        }).then((r: any) => {
            const result: Itinerary = r?.itinerario || r
            // BUG-IT-01: si el API devuelve null/error, abortar sin romper
            // (antes intentaba result._id → crash "Cannot read properties of null").
            if (!result || !result._id) {
                toast("error", t("Error al crear itinerario"))
                console.warn("[ItineraryTabs] createItinerario devolvió result null/sin _id", r)
                return
            }
            const pathSlice = window?.location?.pathname.slice(1)
            const safeList = Array.isArray(event?.listIdentifiers) ? [...event.listIdentifiers] : []
            const fListIdentifiers = safeList.findIndex(elem => elem?.table === pathSlice)
            const sameTipo = Array.isArray(event?.itinerarios_array)
                ? event.itinerarios_array.filter(elem => elem?.tipo === pathSlice)
                : []

            let nextList = safeList
            let nextItinerarios = Array.isArray(event?.itinerarios_array) ? [...event.itinerarios_array] : []

            if (sameTipo.length) {
                const lastListIdentifiers = fListIdentifiers >= 0 ? { ...safeList[fListIdentifiers] } : null
                const f1 = lastListIdentifiers?.end_Id
                    ? nextItinerarios.findIndex(elem => elem._id === lastListIdentifiers.end_Id)
                    : -1
                if (f1 > -1 && lastListIdentifiers) {
                    nextItinerarios[f1] = { ...nextItinerarios[f1], next_id: result._id }
                    updatedNextId(nextItinerarios[f1])
                    nextList = safeList.map((li, i) =>
                        i === fListIdentifiers ? { ...li, end_Id: result._id } : li
                    )
                    updatedListIdentifiers({ ...event, listIdentifiers: nextList })
                } else {
                    nextList = [...safeList, {
                        end_Id: result._id,
                        start_Id: result._id,
                        table: pathSlice,
                    }]
                }
            } else if (fListIdentifiers < 0) {
                nextList = [...safeList, {
                    start_Id: result._id,
                    end_Id: result._id,
                    table: pathSlice,
                }]
            } else {
                nextList = safeList.map((li, i) =>
                    i === fListIdentifiers ? { ...li, start_Id: result._id, end_Id: result._id } : li
                )
            }

            const newItinerario = { ...result, tasks: result.tasks ?? [], viewers: result.viewers ?? [] }
            nextItinerarios = [...nextItinerarios, newItinerario]
            setEvent((prev) => ({
                ...prev,
                listIdentifiers: nextList,
                itinerarios_array: nextItinerarios,
            }))
            setItinerario({ ...newItinerario })
            /*  setEditTitle(true) */
        })
    }
    const handleSelectItinerario = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
        localStorage.setItem(`E_${event._id}_${window?.location?.pathname.slice(1)}`, item._id)
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
                variable: "listIdentifiers",
                value: JSON.stringify(event.listIdentifiers)
            }
        })
    }
    const releaseAndLeave = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, item: Itinerary) => {
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
        const itinerariosNew = event.itinerarios_array.map((elem, index) => {
            const newElem = itineraries.find(el => el._id === elem._id)
            return newElem ? newElem : elem
        })
        setEvent({ ...event, itinerarios_array: [...itinerariosNew] })
        setShowTabs(false)
    }
    const handleMobileSelectItinerario = (item: Itinerary) => {
        localStorage.setItem(`E_${event._id}_${window?.location?.pathname.slice(1)}`, item._id)
        setItinerario(item)
        setEditTitle(false)
        setIsMobileDropdownOpen(false)
    }
    const toggleMobileDropdown = () => {
        setIsMobileDropdownOpen(!isMobileDropdownOpen)
    }

    return (
        <div className="flex w-full max-w-[1050px] h-10 items-center justify-center border-primary border-b md:px-4 md:py-2 shadow-md">
            <div id="content" className="flex-1 h-full flex justify-between">
                {/* Vista Desktop */}
                {!isMobile && (
                    <div className="inline-flex max-w-full h-full items-center mr-2">
                        {showTabs && <>
                            <div ref={refTabs} id="azul" className={` ${event?.usuario_id === user?.uid && "max-w-[calc(100%-32px)]"} inline-flex h-full items-center select-none mx-2`}>
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
                                                        <div className={`${itinerario?._id !== item?._id && "break-all"} line-clamp-1 flex-1 `}>
                                                            {item?.title}
                                                        </div>
                                                        {(editTitle && itinerario?._id === item?._id && window?.location?.pathname !== "/itinerario") &&
                                                            <div onMouseDown={(e) => e.stopPropagation()} className="fixed md:absolute w-full h-16 z-50 translate-y-6 flex left-16 items-center justify-center">
                                                                <div className="h-full bg-white space-x-2 rounded-md flex px-2 items-center justify-center shadow-md border-[1px]">
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
                                                        <ItineraryTabsMenu item={item} itinerario={itinerario} handleDeleteItinerario={handleDeleteItinerario} setEditTitle={setEditTitle} setTitle={setTitle} setModalDuplicate={setModalDuplicate} selectTask={selectTask} setSelectTask={setSelectTask} />
                                                    </div>
                                                </div>}
                                            </div>
                                        </div>


                                    )
                                })}
                            </div>
                            <PermissionAddButton
                                onClick={handleCreateItinerario}
                                className="flex w-8 items-center justify-start bg-white"
                                iconClassName="w-4 h-4 text-primary cursor-pointer"
                            />
                        </>}
                    </div>

                )}

                {/* Vista Móvil - Menú Desplegable */}
                {isMobile && (
                    <div className="flex-1 relative mobile-dropdown">
                        <button
                            onClick={toggleMobileDropdown}
                            className="w-full flex items-center px-3 py-1 mt-1.5 bg-white text-sm text-gray-700 focus:outline-none focus:ring-0 focus:border-0 "
                        >
                            <div className="flex items-center space-x-2">
                                {!!itinerario?.icon && (
                                    <div className="flex w-4 h-4 items-center justify-center">
                                        {itinerario.icon}
                                    </div>
                                )}
                                <span className="truncate w-[100px]">
                                    {itinerario?.title || t("Seleccionar itinerario")}
                                </span>
                            </div>
                            <FaChevronDown className={`w-3 h-3  ml-1 transition-transform ${isMobileDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {(editTitle && window?.location?.pathname !== "/itinerario") &&
                            <div onMouseDown={(e) => e.stopPropagation()} className="fixed w-full h-16 z-50 -translate-y-20 -translate-x-2 flex items-center justify-center">
                                <div className="h-full bg-white space-x-2 rounded-md flex px-2 items-center justify-center shadow-md border-[1px]">
                                    <input type="text" onChange={(e) => setTitle(e.target.value)} value={title} className={` font-display text-sm text-gray-500 border-[1px] border-primary focus:border-gray-400 w-min py-1 px-2 rounded-xl focus:ring-0 focus:outline-none transition`} />
                                    <button type="button" onClick={() => handleUpdateTitle()} className="border-primary border font-display focus:outline-none text-primary hover:text-white text-xs bg-white hover:bg-primary px-3 py-1 rounded-lg transition">
                                        <FaCheck />
                                    </button>
                                </div>
                            </div>
                        }

                        {isMobileDropdownOpen && (
                            <div className="absolute z-40 w-[300px] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {itineraries?.map((item, idx) => {
                                    return (
                                        (isAllowedViewer(item?.viewers) || window?.location?.pathname === "/itinerario") && (
                                            <div key={idx} className="relative">
                                                <div className={`flex items-center justify-between p-3 ${itinerario?._id === item?._id ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-gray-50'}`}>
                                                    <button
                                                        onClick={() => handleMobileSelectItinerario(item)}
                                                        className="flex-1 flex items-center space-x-2 text-left"
                                                    >
                                                        {!!item?.icon && (
                                                            <div className={`flex w-4 h-4 items-center justify-center ${itinerario?._id === item?._id ? 'text-primary' : ''}`}>
                                                                {item.icon}
                                                            </div>
                                                        )}
                                                        <span className={`text-sm break-words whitespace-normal ${itinerario?._id === item?._id ? 'text-primary font-medium' : 'text-gray-700'}`}>
                                                            {item?.title}
                                                        </span>
                                                    </button>
                                                    <div onClick={(e) => e.stopPropagation()} >
                                                        <ItineraryTabsMenu
                                                            className={`${idx >= itineraries.length - 3 ? '-top-[100px] right-10' : ''}`}
                                                            item={item}
                                                            itinerario={itinerario}
                                                            handleDeleteItinerario={handleDeleteItinerario}
                                                            setEditTitle={setEditTitle}
                                                            setTitle={setTitle}
                                                            setModalDuplicate={setModalDuplicate}
                                                            selectTask={selectTask}
                                                            setSelectTask={setSelectTask}
                                                        />
                                                    </div>
                                                </div>

                                            </div>
                                        )
                                    )
                                })}

                                <div className="p-3 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            handleCreateItinerario()
                                            setIsMobileDropdownOpen(false)
                                        }}
                                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <FaPlus className="w-4 h-4" />
                                        <span>{t("Crear nuevo")}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isAllowed() && <div className="inline-flex space-x-2">
                    <div className="flex items-center justify-end pl-2 pr-2  ">
                        <div className="text-gray-600 flex flex-col justify-center items-center">
                            <div className="flex justify-center space-x-0.5 w-full">
                                <TimeZone />
                                <span className="text-[10px] hidden md:block">{t("timeZone")}</span>
                            </div>
                            <span className="text-[10px]">{getTimeZoneCity(event?.timeZone)}</span>
                        </div>
                    </div>
                    {["cards", "table"].includes(view) && (
                        <div className="flex items-center space-x-2">
                            <PermissionAddButton
                                onClick={addTask}
                                text={itinerario?.tipo === "itinerario" ? "" : ""}
                                showText={true}
                            />
                            <SelectModeSort value={orderAndDirection} setValue={setOrderAndDirection} />
                        </div>
                    )}
                    <PermissionSelectModeView view={view} setView={setView} className="" />
                </div>
                }
            </div>
        </div>
    )
}