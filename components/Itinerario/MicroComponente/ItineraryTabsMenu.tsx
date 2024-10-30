import { FC, useEffect, useRef, useState } from "react"
import { DotsOpcionesIcon, PlusIcon } from "../../icons"
import { Itinerary } from "../../../utils/Interfaces"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { ViewItinerary } from "../../../pages/invitados"
import { SelectModeView } from "../../Utils/SelectModeView"
import ClickAwayListener from "react-click-away-listener"
import { useAllowed } from "../../../hooks/useAllowed"
import { useTranslation } from "react-i18next"
import { useToast } from "../../../hooks/useToast"
import { getStorage } from "firebase/storage"

interface props {
    itinerario: Itinerary
    item: Itinerary
    handleDeleteItinerario: any
    handleUpdateTitle: any
    editTitle: boolean
    setEditTitle: any
}
export const ItineraryTabsMenu: FC<props> = ({ itinerario, item, handleDeleteItinerario, handleUpdateTitle, setEditTitle, editTitle }) => {
    const [showMenu, setShowMenu] = useState<boolean>()
    const [value, setValue] = useState<string>()
    const { t } = useTranslation();
    const { config, geoInfo } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const [isAllowed, ht] = useAllowed()
    const disable = !isAllowed("itinerario")
    const toast = useToast()
    const storage = getStorage()

    const optionsSelect = [
        {
            label: "Renombrar",
            value: "rename",
            onClick: () => {

            }
        },
        {
            label: "Compartir",
            value: "share",
            onClick: () => {

            }
        },
        {
            label: "Borrar",
            value: "delete",
            onClick: () => { handleDeleteItinerario() }
        }
    ]




    return (
        <ClickAwayListener onClickAway={() => { setShowMenu(false) }}>
            {(!["/itinerario"].includes(window?.location?.pathname) && itinerario?._id === item?._id)
                ? <div onClick={() => setShowMenu(!showMenu)} className={`w-6 h-6 rounded-full bg-gray-100 flex justify-center items-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 ${showMenu && "bg-gray-200 text-gray-900"} relative`}>
                    <DotsOpcionesIcon className={""} />
                    {showMenu && <div className={`absolute right-6 top-3 bg-white z-50 rounded-md shadow-md`}>
                        {optionsSelect?.map((elem, idx) =>
                            <div key={idx}
                                onClick={() => {
                                    setValue(elem.value)
                                    setShowMenu(false)
                                    elem?.onClick()
                                }}
                                className={`${elem.value === "edit" ? "flex md:hidden" : "flex"} p-2 text-gray-700 text-sm items-center gap-2 capitalize cursor-pointer hover:bg-gray-100`}
                            >
                                {elem.label}
                            </div>
                        )}
                    </div>}
                </div>
                : <></>}
        </ClickAwayListener>
    )
}