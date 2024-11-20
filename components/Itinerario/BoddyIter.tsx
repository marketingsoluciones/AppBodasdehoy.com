import { useEffect, useState } from "react"
import { ItineraryTabs } from "./MicroComponente/ItineraryTabs"
import { ItineraryPanel } from "./MicroComponente/ItineraryPanel"
import { AuthContextProvider, EventContextProvider } from "../../context";
import { Itinerary } from "../../utils/Interfaces"
import { ViewItinerary } from "../../pages/invitados";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../Utils/Modal";
import { DeleteConfirmation } from "./MicroComponente/DeleteConfirmation";
import { useTranslation } from "react-i18next";
import { useAllowed, useAllowedViewer } from "../../hooks/useAllowed";

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

    useEffect(() => {
        setView(window.innerWidth > window.innerHeight && isAllowed() ? "table" : "cards")
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
                <strong>Si borras el itinerario no lo podrás recuperar.</strong>
                <p className=" text-xs"> Para confirmar, escribe <span className="font-semibold">{itinerario.title.replace(/\s+/g, '').toLocaleLowerCase()}</span> en el espacio de abajo </p>
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
                    const itinerarios = event.itinerarios_array.filter(elem => elem.tipo === window?.location?.pathname.slice(1))
                    const f1idx = itinerarios?.findIndex(elem => elem._id === itinerario._id)
                    const f1 = event.itinerarios_array?.findIndex(elem => elem._id === itinerario._id)
                    event.itinerarios_array?.splice(f1, 1)
                    setEvent({ ...event })
                    toast("success", t("El itinerario fue eliminado"));
                    setModal({ state: false })
                    itinerarios.splice(f1idx, 1)
                    const idx = f1idx > itinerarios.length - 1 ? f1idx - 1 : f1idx
                    setItinerario({ ...itinerarios[idx] })
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

    useEffect(() => {
        const itinerarios = event?.itinerarios_array.filter(elem => elem.tipo === window?.location?.pathname.slice(1))
        if (itinerarios.length) {
            const f1 = itinerarios.findIndex(elem => elem?._id === itinerario?._id)
            if (f1 < 0) {
                setItinerario(itinerarios[0])
            } else {
                setItinerario(itinerarios[f1])
            }
        }
    }, [event])

    return (
        <div className="w-full h-[calc(100vh-234px)] flex flex-col items-center bg-white rounded-lg mt-3">
            {modal.state && <Modal set={setModal} classe={"w-[95%] md:w-[450px] h-[250px]"}>
                <DeleteConfirmation setModal={setModal} modal={modal} />
            </Modal>}
            <ItineraryTabs itinerario={itinerario} setItinerario={setItinerario} setEditTitle={setEditTitle} title={title} setTitle={setTitle} view={view} setView={setView} handleDeleteItinerario={handleDeleteItinerario} handleUpdateTitle={handleUpdateTitle} editTitle={editTitle} />
            {(isAllowedViewer(itinerario?.viewers ?? []) || window?.location?.pathname === "/itinerario")
                && <ItineraryPanel itinerario={itinerario} editTitle={editTitle} setEditTitle={setEditTitle} title={title} setTitle={setTitle} view={view} handleDeleteItinerario={handleDeleteItinerario} handleUpdateTitle={handleUpdateTitle} />
            }
        </div>
    )
}