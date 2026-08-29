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
import { LuCopy } from "react-icons/lu";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { isStudioPathname } from "../../../utils/studioPaths";


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
    const [isAllowed, ht] = useAllowed()
    const { user } = AuthContextProvider()
    const { event } = EventContextProvider()
    const isOwner = user?.uid && event?.usuario_id && user.uid === event.usuario_id

    const isStudio = typeof window !== "undefined"
        && isStudioPathname(window.location.pathname)
        && new URLSearchParams(window.location.search).get("studio") !== "legacy"

    // Enlace público de la lista — mismo formato que usa SubHeader.
    const copiarEnlace = () => {
        try {
            const link = `${window.location.origin}/public-itinerary/itinerary-${event?._id}-${item?._id}`
            navigator.clipboard?.writeText(link)
        } catch (e) { /* portapapeles no disponible */ }
    }

    const optionsSelect: OptionsSelect[] = [
        {
            title: isStudio ? t("Renombrar", { defaultValue: "Renombrar" }) : t("rename"),
            value: "rename",
            onClick: () => {
                setTitle(item.title)
                setEditTitle(true)
            },
            icon: <PencilEdit className="w-5 h-5" />
        },
        {
            title: t("share"),
            value: "share",
            onClick: () => {
                setShowAddUsertoServices(true)
            },
            icon: <IoShareSocial className="w-5 h-5" />
        },
        ...(isOwner ? [{
            title: isStudio ? t("Duplicar lista", { defaultValue: "Duplicar lista" }) : t("duplicar"),
            value: "duplicar",
            onClick: () => {
                setModalDuplicate({ state: true, data: item })
            },
            icon: <LuCopy className="w-5 h-5" />
        }] : []),
        {
            title: isStudio ? t("Eliminar lista", { defaultValue: "Eliminar lista" }) : t("Borrar"),
            value: "delete",
            onClick: () => { handleDeleteItinerario() },
            icon: <MdOutlineDeleteOutline className="w-5 h-5" />
        },
        // "Copiar enlace" del diseño: enlace público de la lista al portapapeles.
        ...(isStudio ? [{
            title: t("Copiar enlace", { defaultValue: "Copiar enlace" }),
            value: "copylink",
            onClick: copiarEnlace,
            icon: <LuCopy className="w-5 h-5" />
        }] : []),
        // "details" no hacía nada (onClick vacío): fuera del menú rediseñado.
        ...(isStudio ? [] : [{
            title: t("details"),
            value: "details",
            onClick: () => { },
            icon: <CgInfo className="w-5 h-5" />
        }])
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
                            style={isStudio ? { width: 32, height: 32, borderRadius: 9, border: "1.5px solid #E7E7EA", background: "#fff", color: "#8a8a90", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" } : undefined}
                            className={isStudio ? "" : `w-6 h-6 rounded-full bg-gray-100 flex justify-center items-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 ${showMenu && "bg-gray-200 text-gray-900"}`}>
                            <DotsOpcionesIcon className={""} />
                        </div>
                        : <></>
                    }
                    {showMenu && <div
                        style={isStudio ? { position: "absolute", left: 0, top: 38, zIndex: 50, background: "#fff", borderRadius: 14, border: "1px solid #f0f0f2", boxShadow: "0 14px 40px rgba(0,0,0,.14)", padding: 6, minWidth: 196 } : undefined}
                        className={isStudio ? "" : `absolute md:-right-6 right-4 top-[28px] bg-white z-50 rounded-md shadow-md truncate ${className}`}>
                        {optionsSelect?.map((elem, idx) =>
                            (isAllowed() || elem.value === "details") && <div key={idx}
                                onClick={() => {
                                    setValue(elem.value)
                                    setShowMenu(false)
                                    elem?.onClick()
                                }}
                                style={isStudio ? { display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", borderRadius: 9, font: "500 13px Poppins", color: elem.value === "delete" ? "#D83E7C" : "#3A3A42", cursor: "pointer", whiteSpace: "nowrap" } : undefined}
                                onMouseEnter={(e) => { if (isStudio) e.currentTarget.style.background = "#FCE7F0" }}
                                onMouseLeave={(e) => { if (isStudio) e.currentTarget.style.background = "transparent" }}
                                className={isStudio ? "" : `${elem.value === "edit" ? "flex md:hidden" : "flex"} p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100`}
                            >
                                {elem?.icon}
                                {elem.title}
                            </div>
                        )}
                    </div>}
                </div>
            </ClickAwayListener>
        </>
    )
}