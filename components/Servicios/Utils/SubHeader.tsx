import { useEffect, useState, FC } from "react"
import { AuthContextProvider } from "../../../context/AuthContext"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useTranslation } from 'react-i18next';
import { PencilEdit } from "../../icons";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { Itinerary } from "../../../utils/Interfaces";
import { Modal } from "../../Utils/Modal";
import { DeleteConfirmation } from "../../Utils/DeleteConfirmation";
import { useToast } from "../../../hooks/useToast";
import { FaCheck } from "react-icons/fa";
import { useAllowed } from "../../../hooks/useAllowed";
import { ViewItinerary } from "../../../pages/invitados";
import { GrDocumentPdf } from "react-icons/gr";
import { LiaLinkSolid } from "react-icons/lia";
import ClickAwayListener from "react-click-away-listener";
import { CopiarLink } from "../../Utils/Compartir";

import axios from "axios";

interface props {
    itinerario: Itinerary
    editTitle: boolean
    setEditTitle: any
    handleDeleteItinerario: any
    handleUpdateTitle: any
    title: string
    setTitle: any
    view: ViewItinerary
}
interface Modal {
    state: boolean
    title?: string | JSX.Element
    handle?: () => void
}

export const SubHeader: FC<props> = ({ view, itinerario, editTitle, setEditTitle, handleDeleteItinerario, handleUpdateTitle, title, setTitle }) => {
    const { event } = EventContextProvider()
    const { config } = AuthContextProvider()
    const toast = useToast()
    const { t } = useTranslation();
    const [modal, setModal] = useState<Modal>({ state: false, title: null, handle: () => { } })
    const [isAllowed, ht] = useAllowed()
    const [loading, setLoading] = useState<boolean>()
    const [showModalCompartir, setShowModalCompartir] = useState(false);
    const link = `${window.location.origin}/public-itinerary/itinerary-${event?._id}-${itinerario?._id}`

    useEffect(() => {
        setTitle(itinerario?.title)
    }, [itinerario])

    const downloadPdf = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/api/generate-pdf', {
                url: `${window.location.origin}/public-itinerary/itinerary-${event._id}-${itinerario._id}`,
                format: "letter"
            });
            const blob = new Blob([Uint8Array.from(atob(response.data.base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${event.nombre} ${itinerario.title}`.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, "_") + '.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast("error", "Error al generar PDF");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full px-4 md:px-10 py-4" >
            {modal.state && <Modal set={setModal} classe={"w-[95%] md:w-[450px] h-[200px] flex items-center justify-center"}>
                <DeleteConfirmation setModal={setModal} modal={modal} />
            </Modal>}
            <div className="flex w-full justify-between items-start relative">
                <div className="w-1/2 flex flex-col text-xs md:text-[14px] text-azulCorporativo">
                    <span className="text-primary* text-gray-300 *cursor-pointer *hover:text-pink-500" onClick={() => {/*disable ? ht() : setModalPlantilla(!modalPlantilla)*/ }} >
                        {t("loadtemplate")}
                    </span>
                </div>

                {view !== "schema"
                    ? <div className="flex flex-col w-1/2 text-xs md:text-[14px] justify-end items-end space-y-1">
                        <div className={`flex ${isAllowed() ? "text-gray-700" : "text-gray-300"} space-x-2`}>
                            <PencilEdit onClick={() => !isAllowed() ? ht() : setEditTitle(!editTitle)} className="w-5 h-5 cursor-pointer" />
                            <LiaLinkSolid onClick={() => setShowModalCompartir(!showModalCompartir)} className="w-5 h-5 curso cursor-pointer" />
                            <MdOutlineDeleteOutline onClick={() => !isAllowed() ? ht() : handleDeleteItinerario()} className="w-5 h-5 curso cursor-pointer" />
                        </div>
                    </div>

                    :
                    <div className="flex items-center absolute  right-6 space-x-1">
                        <div onClick={() => downloadPdf()} className="bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full absolute* flex justify-center items-center right-6* cursor-pointer">

                            <GrDocumentPdf className="w-5 h-5 text-primary" />
                            {loading && <div className="fixed top-0 left-0 w-[100vw] h-[100vh] flex items-center justify-center">
                                < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4" />
                            </div>}
                        </div>
                        <div className="bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full  flex justify-center items-center right-0* cursor-pointer">

                            <LiaLinkSolid onClick={() => setShowModalCompartir(!showModalCompartir)} className="w-5 h-5 curso cursor-pointer" />
                        </div>
                    </div>
                }
                {
                    showModalCompartir && <ClickAwayListener onClickAway={() => showModalCompartir && setShowModalCompartir(false)}>
                        <ul
                            className={`${showModalCompartir ? "block opacity-100" : "hidden opacity-0"
                                } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-[30px] right-5 w-[300px] z-50`}
                        >
                            <li
                                className="flex items-center py-4 px-6 font-display text-sm text-gray-500 bg-base transition w-full capitalize"
                            >
                                <CopiarLink link={link} />
                            </li>
                        </ul>
                    </ClickAwayListener>
                }
            </div>
            <div className="flex flex-col justify-center items-center">
                {!editTitle
                    ? <span className="text-3xl md:text-[40px] font-title text-primary">{title }</span>
                    : <div className="flex space-x-2 w-[85%] md:w-[60%] translate-x-5">
                        <input onChange={(e) => setTitle(e.target.value)} type="text" value={title} autoFocus className={`font-display text-center text-sm text-gray-500 border-[1px] border-rose-300 focus:border-gray-400 w-full py-2 px-4 rounded-xl focus:ring-0 focus:outline-none transition`} />
                        <button type="button" onClick={() => handleUpdateTitle()} className="border-primary border font-display focus:outline-none text-primary hover:text-white text-xs bg-white hover:bg-primary px-3 py-1 rounded-lg my-2 transition">
                            <FaCheck />
                        </button>
                    </div>
                }
                <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
            </div>
            <style jsx>
                {`
                    .loader {
                        border-top-color:  ${config?.theme?.primaryColor};
                        -webkit-animation: spinner 1.5s linear infinite;
                        animation: spinner 1.5s linear infinite;
                    }

                    @-webkit-keyframes spinner {
                        0% {
                        -webkit-transform: rotate(0deg);
                        }
                        100% {
                        -webkit-transform: rotate(360deg);
                        }
                    }

                    @keyframes spinner {
                        0% {
                        transform: rotate(0deg);
                        }
                        100% {
                        transform: rotate(360deg);
                        }
                    }
                `}
            </style>
        </div >
    )
}