import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react"
import { DotsOpcionesIcon, PencilEdit, PlusIcon } from "../../icons"
import { Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { ViewItinerary } from "../../../pages/invitados"
import { SelectModeView } from "../../Utils/SelectModeView"
import ClickAwayListener from "react-click-away-listener"
import { useAllowed } from "../../../hooks/useAllowed"
import { useTranslation } from "react-i18next"
import { useToast } from "../../../hooks/useToast"
import { getStorage } from "firebase/storage"
import { IoShareSocial } from "react-icons/io5"
import { MdOutlineDeleteOutline } from "react-icons/md"
import { CgInfo } from "react-icons/cg"
import { AddUserToServices } from "../../Utils/Compartir/AddUserToServices"

interface props {
    itinerario: Itinerary
    item: Itinerary
    handleDeleteItinerario: any
    setTitle: Dispatch<SetStateAction<string>>
    setEditTitle: any
}

export const ItineraryTabsMenu: FC<props> = ({ itinerario, item, handleDeleteItinerario, setEditTitle, setTitle }) => {
    const [showMenu, setShowMenu] = useState<boolean>()
    const [showAddUsertoServices, setShowAddUsertoServices] = useState<boolean>()
    const [value, setValue] = useState<string>()
    const { t } = useTranslation();
    const [isAllowed, ht] = useAllowed()
    const toast = useToast()

    const optionsSelect: OptionsSelect[] = [
        {
            title: t("rename"),
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
                {(!["/itinerario"].includes(window?.location?.pathname) && itinerario?._id === item?._id)
                    ? <div onClick={() => setShowMenu(!showMenu)} className={`w-6 h-6 rounded-full bg-gray-100 flex justify-center items-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 ${showMenu && "bg-gray-200 text-gray-900"} relative`}>
                        <DotsOpcionesIcon className={""} />
                        {showMenu && <div className={`absolute right-6 top-[22px] bg-white z-50 rounded-md shadow-md truncate`}>
                            {optionsSelect?.map((elem, idx) =>
                                (isAllowed() || elem.value === "details") && <div key={idx}
                                    onClick={() => {
                                        setValue(elem.value)
                                        setShowMenu(false)
                                        elem?.onClick()
                                    }}
                                    className={`${elem.value === "edit" ? "flex md:hidden" : "flex"} p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100`}
                                >
                                    {elem?.icon}
                                    {elem.title}
                                </div>
                            )}
                        </div>}
                    </div>
                    : <></>}
            </ClickAwayListener>
        </>
    )
}