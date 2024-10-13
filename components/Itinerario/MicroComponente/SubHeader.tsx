import { useEffect, useState, FC } from "react"
import { AuthContextProvider } from "../../../context/AuthContext"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useTranslation } from 'react-i18next';
import { PencilEdit } from "../../icons";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { SelectModeView } from "../../Utils/SelectModeView";
import { Itinerary } from "../../../utils/Interfaces";
import { Modal } from "../../Utils/Modal";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { useToast } from "../../../hooks/useToast";
import { FaCheck } from "react-icons/fa";

interface props {
    itinerario: Itinerary
    disable: any
    ht: any
    setModalPlantilla: any
    modalPlantilla: any
    view: any
    setView: any
    setOptionSelect: any
    editTitle: boolean
    setEditTitle: any
    setItinerario: any
}
interface Modal {
    state: boolean
    title?: string | JSX.Element
    handle?: () => void
}

export const SubHeader: FC<props> = ({ itinerario, disable, ht, setModalPlantilla, modalPlantilla, view, setView, setOptionSelect, editTitle, setEditTitle, setItinerario }) => {
    const { event, setEvent } = EventContextProvider()
    const { config } = AuthContextProvider()
    const toast = useToast()
    const { t } = useTranslation();
    const [modal, setModal] = useState<Modal>({ state: false, title: null, handle: () => { } })

    const [title, setTitle] = useState<string>()

    useEffect(() => {
        setTitle(itinerario?.title)
    }, [itinerario])


    const handleDeleteItinerario = async () => {
        setModal({
            state: true,
            title: <span className="flex flex-col">
                <strong>{itinerario.title}</strong>
                <strong>Si borras el itinerario no lo podrás recuperar.</strong> ¿Estás segugo de continuar?
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
                    const f1 = event.itinerarios_array?.findIndex(elem => elem._id === itinerario._id)
                    event.itinerarios_array?.splice(f1, 1)
                    setEvent({ ...event })
                    toast("success", t("El itinerario fue eliminado"));
                    setOptionSelect(event.itinerarios_array[0])
                    setModal({ state: false })
                    const idx = f1 > event.itinerarios_array.length - 1 ? f1 - 1 : f1
                    setItinerario({ ...event.itinerarios_array[idx] })
                    setEditTitle(false)
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

    return (
        <div className="w-full px-4 md:px-10 py-4 space-y-2" >
            {modal.state && <Modal classe={"w-[95%] md:w-[450px] h-[200px]"}>
                <DeleteConfirmation setModal={setModal} modal={modal} />
            </Modal>
            }            <div className="flex w-full justify-between items-start">
                <div className="w-1/2 flex flex-col text-xs md:text-[14px] text-azulCorporativo">
                    <span className="text-primary cursor-pointer hover:text-pink-500" onClick={() => disable ? ht() : () => { }}>
                        {t("resetitinerary")}
                    </span>
                    <span className="text-primary cursor-pointer hover:text-pink-500" onClick={() => disable ? ht() : setModalPlantilla(!modalPlantilla)} >
                        {t("loadtemplate")}
                    </span>
                    {/* <div>
                        <span className="text-[14px]">{t("weddingdate")}</span>
                        <span className="text-primary">{date}</span>
                    </div>
                    <div className={` ${event?.usuario_id === user?.uid && user?.displayName !== "guest" ? "hidden" : "block"} `}>
                        <span>{t("permissions")}</span>
                        <span className="text-primary">{disable ? t("reading") : t("edition")}</span>
                    </div> */}
                </div>
                <div className="flex flex-col w-1/2 text-xs md:text-[14px] justify-end items-end space-y-1">
                    <div className={"flex text-gray-700 space-x-2"}>
                        <PencilEdit onClick={() => setEditTitle(!editTitle)} className="w-5 h-5 cursor-pointer" />
                        <MdOutlineDeleteOutline onClick={() => handleDeleteItinerario()} className="w-5 h-5 curso cursor-pointer" />
                        <SelectModeView value={view} setValue={setView} />
                    </div>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center">
                {!editTitle
                    ? <span className="text-3xl md:text-[40px] font-title text-primary">{itinerario?.title}</span>
                    : <div className="flex space-x-2 w-[85%] md:w-[60%] translate-x-5">
                        <input onChange={(e) => setTitle(e.target.value)} type="text" value={title} autoFocus className={`font-display text-center text-sm text-gray-500 border-[1px] border-rose-300 focus:border-gray-400 w-full py-2 px-4 rounded-xl focus:ring-0 focus:outline-none transition`} />
                        <button type="button" onClick={() => handleUpdateTitle()} className="border-primary border font-display focus:outline-none text-primary hover:text-white text-xs bg-white hover:bg-primary px-3 py-1 rounded-lg my-2 transition">
                            <FaCheck />
                        </button>
                    </div>
                }
                <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
            </div>
        </div >
    )
}