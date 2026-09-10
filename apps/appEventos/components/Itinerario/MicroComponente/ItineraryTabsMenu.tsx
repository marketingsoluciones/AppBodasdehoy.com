import { Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import { DotsOpcionesIcon, PencilEdit } from "../../icons"
import { Itinerary, OptionsSelect } from "../../../utils/Interfaces"
import ClickAwayListener from "react-click-away-listener"
import { useAllowed } from "../../../hooks/useAllowed"
import { useTranslation } from "react-i18next"
import { IoShareSocial } from "react-icons/io5"
import { MdOutlineDeleteOutline } from "react-icons/md"
import { CgInfo } from "react-icons/cg"
import { AddUserToServices } from "../../Utils/Compartir/AddUserToServices"
import { LuCopy, LuLink } from "react-icons/lu";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { isStudioPathname } from "../../../utils/studioPaths";
import { useToast } from "../../../hooks/useToast";


interface props {
    itinerario: Itinerary
    item: Itinerary
    handleDeleteItinerario: any
    setTitle: Dispatch<SetStateAction<string>>
    setEditTitle: any
    setModalDuplicate: any
    selectTask: string
    setSelectTask: any
    className?: string
}

export const ItineraryTabsMenu: FC<props> = ({ setModalDuplicate, itinerario, item, handleDeleteItinerario, setEditTitle, setTitle, className }) => {
    const [showMenu, setShowMenu] = useState<boolean>()
    const [valirShowMenu, setValirShowMenu] = useState<boolean>(false)
    const [showAddUsertoServices, setShowAddUsertoServices] = useState<boolean>()
    const [value, setValue] = useState<string>()
    const { t } = useTranslation();
    const toast = useToast();
    const [isAllowed, ht] = useAllowed()
    const { user, config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const isOwner = user?.uid && event?.usuario_id && user.uid === event.usuario_id

    // Duplicar la lista DIRECTO en el mismo evento (sin el modal de elegir destino).
    // Réplica de la rama "mismo evento" de ModalDuplicate.handleDuplicateItinerario.
    const duplicarLista = async () => {
        try {
            const path = window?.location?.pathname.slice(1)
            const rawResult: any = await fetchApiEventos({
                query: queries.duplicateItinerario,
                variables: { evento_id: event._id, itinerario_id: item._id },
                domain: config.domain,
            })
            const result: any = rawResult?.itinerario || rawResult
            if (!result?._id) { toast("error", t("Error al duplicar", { defaultValue: "No se pudo duplicar la lista" })); return }
            const f1 = event.itinerarios_array.findIndex((elem: any) => elem._id === item._id)
            fetchApiEventos({
                query: queries.editItinerario,
                variables: { eventID: event._id, itinerarioID: item._id, variable: "next_id", valor: result._id },
                domain: config.domain,
            }).catch(() => {/* noop */})
            const fListId = event?.listIdentifiers?.findIndex((elem: any) => elem.table === path)
            const needsListIdUpdate = fListId >= 0 && event.listIdentifiers[fListId]?.end_Id === item._id
            if (needsListIdUpdate) {
                const newListIdentifiers = event.listIdentifiers.map((li: any, i: number) => (i !== fListId ? li : { ...li, end_Id: result._id }))
                fetchApiEventos({ query: queries.eventUpdate, variables: { idEvento: event._id, variable: "listIdentifiers", value: JSON.stringify(newListIdentifiers) } }).catch(() => {/* noop */})
            }
            setEvent((prev: any) => ({
                ...prev,
                itinerarios_array: [
                    ...prev.itinerarios_array.map((it: any, i: number) => (i !== f1 ? it : { ...it, next_id: result._id })),
                    result,
                ],
                listIdentifiers: needsListIdUpdate
                    ? prev.listIdentifiers.map((li: any, i: number) => (i !== fListId ? li : { ...li, end_Id: result._id }))
                    : prev.listIdentifiers,
            }))
            toast("success", t("¡Lista duplicada!", { defaultValue: "¡Lista duplicada!" }))
        } catch (error: any) {
            console.warn("[ItineraryTabsMenu] duplicarLista error:", error?.message ?? error)
            toast("error", t("Error al duplicar", { defaultValue: "No se pudo duplicar la lista" }))
        }
    }

    const isStudio = typeof window !== "undefined"
        && isStudioPathname(window.location.pathname)
        && new URLSearchParams(window.location.search).get("studio") !== "legacy"

    // Enlace público de la lista — mismo formato que usa SubHeader.
    const copiarEnlace = () => {
        try {
            const link = `${window.location.origin}/public-itinerary/itinerary-${event?._id}-${item?._id}`
            navigator.clipboard?.writeText(link)
            toast("success", t("¡Enlace copiado!", { defaultValue: "¡Enlace copiado!" }))
        } catch (e) { /* portapapeles no disponible */ }
    }

    // Iconos inline 14px fieles a listamenuopciones.html.
    const icRename = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4z" /></svg>
    const icDup = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
    const icLink = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
    const icTrash = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>

    // Menú STUDIO fiel al diseño: Renombrar · Duplicar lista · Copiar enlace · Eliminar lista.
    // (Sin "Compartir": el enlace público de la lista sale por "Copiar enlace".)
    const optionsSelect: OptionsSelect[] = isStudio ? [
        {
            title: t("Renombrar", { defaultValue: "Renombrar" }),
            value: "rename",
            onClick: () => { setTitle(item.title); setEditTitle(true) },
            icon: icRename
        },
        ...(isOwner ? [{
            title: t("Duplicar lista", { defaultValue: "Duplicar lista" }),
            value: "duplicar",
            onClick: duplicarLista,
            icon: icDup
        }] : []),
        {
            title: t("Copiar enlace", { defaultValue: "Copiar enlace" }),
            value: "copylink",
            onClick: copiarEnlace,
            icon: icLink
        },
        {
            title: t("Eliminar lista", { defaultValue: "Eliminar lista" }),
            value: "delete",
            onClick: () => { handleDeleteItinerario() },
            icon: icTrash
        },
    ] : [
        {
            title: t("rename"),
            value: "rename",
            onClick: () => { setTitle(item.title); setEditTitle(true) },
            icon: <PencilEdit className="w-5 h-5" />
        },
        {
            title: t("share"),
            value: "share",
            onClick: () => { setShowAddUsertoServices(true) },
            icon: <IoShareSocial className="w-5 h-5" />
        },
        ...(isOwner ? [{
            title: t("duplicar"),
            value: "duplicar",
            onClick: () => { setModalDuplicate({ state: true, data: item }) },
            icon: <LuCopy className="w-5 h-5" />
        }] : []),
        {
            title: t("Borrar"),
            value: "delete",
            onClick: () => { handleDeleteItinerario() },
            icon: <MdOutlineDeleteOutline className="w-5 h-5" />
        },
        {
            title: t("details"),
            value: "details",
            onClick: () => { },
            icon: <CgInfo className="w-5 h-5" />
        }
    ]

    return (
        <>
            {showAddUsertoServices && <AddUserToServices openModal={showAddUsertoServices} setOpenModal={setShowAddUsertoServices} itinerario={itinerario} />}
            <ClickAwayListener onClickAway={() => { setShowMenu(false) }}>
                <div className="relative">
                    {(!["/itinerario"].includes(window?.location?.pathname) && itinerario?._id === item?._id)
                        ? <div
                            onMouseDown={(e) => {
                                e.stopPropagation()
                                if (!valirShowMenu) {
                                    setShowMenu(true)
                                }
                                setValirShowMenu(!valirShowMenu)
                            }}
                            onMouseEnter={() => {
                                if (showMenu) {
                                    setValirShowMenu(true)
                                }
                            }}
                            onMouseLeave={() => {
                                if (showMenu) {
                                    setValirShowMenu(false)
                                }
                            }}
                            onMouseUp={() => {
                                if (!valirShowMenu) {
                                    setShowMenu(false)
                                }
                            }}
                            style={isStudio ? { width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${showMenu ? "#F3B6CE" : "#E7E7EA"}`, background: showMenu ? "#FCE7F0" : "#fff", color: showMenu ? "#EF5B94" : "#8a8a90", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none", transition: "background .15s,border-color .15s,color .15s" } : undefined}
                            className={isStudio ? "" : `w-6 h-6 rounded-full bg-gray-100 flex justify-center items-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 ${showMenu && "bg-gray-200 text-gray-900"}`}>
                            {isStudio
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>
                                : <DotsOpcionesIcon className={""} />}
                        </div>
                        : <></>
                    }
                    {showMenu && <div
                        style={isStudio ? { position: "absolute", left: 0, top: 38, zIndex: 50, background: "#fff", borderRadius: 12, boxShadow: "0 14px 40px rgba(0,0,0,.14)", padding: 6, minWidth: 180 } : undefined}
                        className={isStudio ? "" : `absolute md:-right-6 right-4 top-[28px] bg-white z-50 rounded-md shadow-md truncate ${className}`}>
                        {optionsSelect?.map((elem, idx) =>
                            (isAllowed() || elem.value === "details") && <div key={idx}>
                                {/* Divisor antes de "Eliminar lista" (fiel al diseño) */}
                                {isStudio && elem.value === "delete" && <div style={{ height: 1, background: "#f0f0f2", margin: "5px 8px" }} />}
                                <div
                                    onClick={() => {
                                        setValue(elem.value)
                                        setShowMenu(false)
                                        elem?.onClick()
                                    }}
                                    style={isStudio ? { display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, font: "600 12.5px Poppins", color: elem.value === "delete" ? "#D83E7C" : "#3A3A42", cursor: "pointer", whiteSpace: "nowrap" } : undefined}
                                    onMouseEnter={(e) => { if (isStudio) e.currentTarget.style.background = elem.value === "delete" ? "#FBE3ED" : "#FCE7F0" }}
                                    onMouseLeave={(e) => { if (isStudio) e.currentTarget.style.background = "transparent" }}
                                    className={isStudio ? "" : `${elem.value === "edit" ? "flex md:hidden" : "flex"} p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100`}
                                >
                                    {elem?.icon}
                                    {elem.title}
                                </div>
                            </div>
                        )}
                    </div>}
                </div>
            </ClickAwayListener>
        </>
    )
}