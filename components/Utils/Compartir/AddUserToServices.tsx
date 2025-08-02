import ClickAwayListener from "react-click-away-listener"
import { FC } from "react"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useToast } from "../../../hooks/useToast"
import { AuthContextProvider, EventContextProvider, } from "../../../context"
import { useTranslation } from "react-i18next"
import { GoEye, GoEyeClosed } from "react-icons/go"
import { detalle_compartidos_array, Itinerary } from "../../../utils/Interfaces"

interface props {
    openModal: boolean
    setOpenModal: any
    itinerario: Itinerary
}

export const AddUserToServices: FC<props> = ({ openModal, setOpenModal, itinerario }) => {
    const { t } = useTranslation()
    const toast = useToast();
    const { event, setEvent } = EventContextProvider()
    const { config } = AuthContextProvider()

    const handleAddUser = (values: detalle_compartidos_array) => {
        try {
            const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id)
            const f2 = event.itinerarios_array[f1].viewers.findIndex(elem => elem === values.uid)
            if (f2 > -1) {
                event.itinerarios_array[f1].viewers.splice(f2, 1)
            } else {
                event.itinerarios_array[f1].viewers.push(values.uid)
            }
            setEvent({ ...event })
            fetchApiEventos({
                query: queries.editItinerario,
                variables: {
                    eventID: event._id,
                    itinerarioID: itinerario?._id,
                    variable: "viewers",
                    valor: JSON.stringify(event.itinerarios_array[f1].viewers)
                },
                domain: config.domain
            })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div onMouseDown={(e) => e.stopPropagation()} >
            <div className="z-50 fixed top-0 left-0 w-screen h-screen" />
            <div className="backdrop-blur backdrop-filter bg-black opacity-40 z-50 fixed top-0 left-0 w-screen h-screen" />
            <div className={`w-[320px] md:w-[382px] h-[80%] md:h-[90%] bg-white shadow-lg fixed m-auto inset-0 z-50 rounded-xl`}>
                <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)} >
                    <div className="h-full py-5 flex flex-col">
                        <div className="flex justify-between border-b pb-1 text-[20px] mx-4">
                            <div className="cursor-default font-semibold text-primary capitalize"> {t("compartir servicios")}</div>
                            <div className="cursor-pointer font-semibold text-gray-600 -translate-y-3" onClick={() => setOpenModal(!openModal)}>x</div>
                        </div>
                        <div className="flex flex-col relative space-y-4 pt-3 flex-1 overflow-auto px-2 md:px-8">
                            <div className="flex flex-col flex-1">
                                <div className="flex flex-col space-y-1 mb-5 md:mb-0 flex-1">
                                    <p className="text-primary">{t("personwithaccess")}</p>
                                    <div className="border border-gray-300 rounded-xl section overflow-y-auto flex-1 py-1">
                                        {event?.detalles_compartidos_array?.map((item, idx) => {
                                            return (
                                                <div key={idx}>
                                                    <div className={`${itinerario?.viewers?.includes(item.uid) && "bg-gray-100"} w-full flex items-start py-1 px-2 space-x-2 text-xs text-gray-700`}>
                                                        <div className="flex-none w-8 md:w-10 h-8 md:h-10">
                                                            <img
                                                                src={item?.photoURL != null ? item?.photoURL : "/placeholder/user.png"}
                                                                className="object-cover w-8 md:w-10 h-8 md:h-10 rounded-full"
                                                                alt={""}
                                                            />
                                                        </div>
                                                        <div className="flex-1 flex flex-col">
                                                            <div className="flex flex-col  cursor-default">
                                                                <div className="break-all line-clamp-1">{item?.displayName}</div>
                                                                <div className="break-all line-clamp-1">{item?.email}</div>
                                                            </div>
                                                            <div className="*break-all *line-clamp-1 text-[11px] space-x-1">
                                                                <span className="capitalize">{t("permisos")}:</span>
                                                                {item.permissions.find(el => el.title === "servicios").value === "none"
                                                                    ? <span>{t("Esta persona no tiene permisos")}</span>
                                                                    : item.permissions.find(el => el.title === "servicios").value === "view"
                                                                        ? itinerario?.viewers?.includes(item.uid)
                                                                            ? <span>{t("ver")}</span>
                                                                            : <span>{t("click en el ojo para ver")}</span>
                                                                        : <span>{t("ver y editar")}</span>}
                                                            </div>
                                                        </div>
                                                        <div className={`bg-gray-200* w-9 h-9 rounded-full* flex items-center justify-center ${item?.permissions?.find(el => el.title === "servicios").value !== "view" && "hidden cursor-not-allowed"}`}
                                                            onClick={() => { item.permissions.find(el => el.title === "servicios").value === "view" && handleAddUser(item) }} >
                                                            {itinerario?.viewers?.includes(item.uid) || item?.permissions?.find(el => el.title === "servicios").value === "edit"
                                                                ? <GoEye className={`w-5 h-5 ${item?.permissions?.find(el => el.title === "servicios").value === "edit" ? "text-gray-400" : "text-gray-600"}`} />
                                                                : <GoEyeClosed className="w-5 h-5 text-gray-400" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex">
                                    <div className="flex-1" />
                                    <button onClick={() => setOpenModal(!openModal)} className={`bg-primary text-white rounded-lg px-5 py-2 h-10 capitalize`}>{t("done")}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ClickAwayListener>
            </div>
        </div>
    )
}
