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
import { BsCalendarPlus } from "react-icons/bs";
import ClickAwayListener from "react-click-away-listener";
import { CopiarLink } from "../../Utils/Compartir";
import { useSearchParams } from "next/navigation";

import axios from "axios";
import { buildSchemaPdfHtml } from "../../../utils/buildSchemaPdfHtml";

interface props {
    itinerario: Itinerary
    editTitle: boolean
    setEditTitle: any
    handleDeleteItinerario: any
    handleUpdateTitle: any
    title: string
    setTitle: any
    view: ViewItinerary
    allExpanded?: boolean
    onToggleExpandAll?: () => void
}
interface Modal {
    state: boolean
    title?: string | React.ReactElement
    handle?: () => void
}

export const SubHeader: FC<props> = ({ view, itinerario, editTitle, setEditTitle, handleDeleteItinerario, handleUpdateTitle, title, setTitle, allExpanded, onToggleExpandAll }) => {
    const { event } = EventContextProvider()
    const { config } = AuthContextProvider()
    const toast = useToast()
    const { t } = useTranslation();
    const [modal, setModal] = useState<Modal>({ state: false, title: null, handle: () => { } })
    const [isAllowed, ht] = useAllowed()
    const [loading, setLoading] = useState<boolean>()
    const [showModalCompartir, setShowModalCompartir] = useState(false);
    const [copied, setCopied] = useState(false);
    const link = `${window.location.origin}/public-itinerary/itinerary-${event?._id}-${itinerario?._id}`
    const handleCopyStudio = () => {
        try { navigator.clipboard?.writeText(link) } catch (e) { /* noop */ }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Rediseño studio (gate ?studio, default ON): cabecera del itinerario fiel a
    // itinerariovistatarjeta.html (.cab). Solo /itinerario; Servicios usa
    // SubHeaderServicios. Rollback ?studio=legacy. Mismo backend/handlers.
    const searchParams = useSearchParams()
    const isStudio = searchParams.get("studio") !== "legacy"
        && (typeof window !== "undefined" && window.location.pathname === "/itinerario")

    const downloadPdf = async () => {
        try {
            setLoading(true);
            const root = document.querySelector('[data-pdf-root="itinerario-schema"]');
            if (!(root instanceof HTMLElement)) {
                toast("error", "No se encontró el esquema para exportar");
                return;
            }
            const html = buildSchemaPdfHtml(root);
            const response = await axios.post('/api/generate-pdf', {
                html,
                format: "letter"
            });
            const blob = new Blob([Uint8Array.from(atob(response.data.base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
            const objectUrl = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = objectUrl;
            anchor.download = `${event.nombre} ${itinerario.title}`.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, "_") + '.pdf';
            anchor.click();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error('[SubHeader] generate-pdf', error);
            toast("error", "Error al generar PDF");
        } finally {
            setLoading(false);
        }
    }

    // ── Rediseño studio: cabecera fiel a itinerariovistatarjeta.html (.cab) ──
    if (isStudio) {
        return (
            <div style={{ width: "100%", padding: "0 32px", position: "relative" }}>
                {modal.state && <Modal set={setModal} classe={"w-[380px] max-w-[95%] h-auto min-h-[220px] !top-1/2 !left-1/2 !right-auto !bottom-auto -translate-x-1/2 -translate-y-1/2"}>
                    <DeleteConfirmation setModal={setModal} modal={modal} />
                </Modal>}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", margin: "24px 0 10px" }}>
                    {/* acciones (renombrar · enlace · borrar) — o (PDF · enlace) en esquema */}
                    <div className="sh-actions" style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6 }}>
                        {view !== "schema"
                            ? <>
                                {view === "cards" && onToggleExpandAll && <button className="cab-acc" title={allExpanded ? t("collapseAll", { defaultValue: "Contraer todo" }) : t("expandAll", { defaultValue: "Expandir todo" })} onClick={() => onToggleExpandAll()}>
                                    {allExpanded
                                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l5 5 5-5" /><path d="M7 20l5-5 5 5" /></svg>
                                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 9l5-5 5 5" /><path d="M7 15l5 5 5-5" /></svg>}
                                </button>}
                                <button className="cab-acc" title={t("Copiar enlace")} onClick={() => setShowModalCompartir(!showModalCompartir)}><LiaLinkSolid className="w-[15px] h-[15px]" /></button>
                                <button className="cab-acc" title={t("Eliminar itinerario")} onClick={() => !isAllowed() ? ht() : handleDeleteItinerario()}><MdOutlineDeleteOutline className="w-[15px] h-[15px]" /></button>
                            </>
                            : <>
                                <button className="cab-acc" title={t("Descargar PDF", { defaultValue: "Descargar PDF" })} onClick={() => downloadPdf()}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></svg></button>
                                <button className="cab-acc" title={t("Copiar enlace")} onClick={() => setShowModalCompartir(!showModalCompartir)}><LiaLinkSolid className="w-[15px] h-[15px]" /></button>
                            </>}
                        {showModalCompartir && <ClickAwayListener onClickAway={() => showModalCompartir && setShowModalCompartir(false)}>
                            <div data-pdf-hide style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, width: 320, background: "#fff", borderRadius: 14, border: "1px solid #f0f0f2", boxShadow: "0 18px 50px rgba(0,0,0,.16)", zIndex: 50, padding: 14 }}>
                                <input type="text" readOnly value={link} onClick={(e) => e.currentTarget.select()} className="share-url-studio" style={{ width: "100%", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "10px 13px", font: "400 12px Poppins", color: "#6b6b72", outline: "none", background: "#fafafa", marginBottom: 10 }} />
                                <div onClick={handleCopyStudio} className="share-copy-studio" style={{ display: "flex", alignItems: "center", gap: 8, font: "600 13px Poppins", color: "#EF5B94", cursor: "pointer", padding: "4px 2px 12px", borderBottom: "1px solid #f0f0f2" }}>
                                    <span>{copied ? t("¡Enlace copiado!", { defaultValue: "¡Enlace copiado!" }) : t("Copiar Enlace", { defaultValue: "Copiar Enlace" })}</span>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                                </div>
                                <a href={`/api/ical/${event?._id}/${itinerario?._id}`} download={`itinerario-${itinerario?._id}.ics`} onClick={() => setShowModalCompartir(false)} className="share-ics-studio" style={{ display: "flex", alignItems: "center", gap: 10, font: "500 13px Poppins", color: "#6b6b72", cursor: "pointer", padding: "12px 2px 2px", textDecoration: "none" }}>
                                    <span style={{ width: 26, height: 26, borderRadius: 8, background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", flex: "none" }}>
                                        <BsCalendarPlus className="w-[14px] h-[14px]" />
                                    </span>
                                    {t("Añadir al calendario (.ics)", { defaultValue: "Añadir al calendario (.ics)" })}
                                </a>
                            </div>
                        </ClickAwayListener>}
                    </div>
                    {/* título centrado */}
                    {!editTitle
                        ? <h2 onClick={() => !isAllowed() ? ht() : setEditTitle(true)} title={t("Haz clic para renombrar", { defaultValue: "Haz clic para renombrar" })} style={{ font: "700 24px Poppins", color: "#3A3A42", textAlign: "center", margin: 0, cursor: "pointer" }}>{title}</h2>
                        : <div style={{ display: "flex", gap: 8, width: "min(60%, 420px)" }}>
                            <input onChange={(e) => setTitle(e.target.value)} type="text" value={title} autoFocus style={{ flex: 1, font: "500 14px Poppins", color: "#3A3A42", textAlign: "center", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "8px 14px", outline: "none" }} />
                            <button type="button" onClick={() => handleUpdateTitle()} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, borderRadius: 10, background: "#EF5B94", color: "#fff", border: "none", cursor: "pointer" }}>
                                <FaCheck />
                            </button>
                        </div>}
                    {/* subrayado rosa */}
                    <div style={{ width: 56, height: 3, borderRadius: 3, background: "#EF5B94", marginTop: 10 }} />
                </div>
                {loading && <div className="fixed top-0 left-0 w-[100vw] h-[100vh] flex items-center justify-center z-50">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4" />
                </div>}
                <style jsx>{`
                    .cab-acc{width:34px;height:34px;border-radius:10px;background:#fff;border:1.5px solid #E7E7EA;display:flex;align-items:center;justify-content:center;color:#6b6b72;cursor:pointer;transition:all .15s;}
                    .cab-acc:hover{border-color:#EF5B94;color:#EF5B94;}
                    .share-copy-studio:hover{color:#D83E7C;}
                    .share-ics-studio:hover{color:#3A3A42;}
                    .share-url-studio:focus{border-color:#EF5B94;}
                    @media(max-width:767px){.sh-actions{display:none !important;}}
                    .loader{border-top-color:${config?.theme?.primaryColor || "#EF5B94"};-webkit-animation:spinner 1.5s linear infinite;animation:spinner 1.5s linear infinite;}
                    @-webkit-keyframes spinner{0%{-webkit-transform:rotate(0deg);}100%{-webkit-transform:rotate(360deg);}}
                    @keyframes spinner{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
                `}</style>
            </div>
        )
    }

    return (
        <div className="w-full px-4 md:px-10 py-4" >
            {modal.state && <Modal set={setModal} classe={"w-[380px] max-w-[95%] h-auto min-h-[220px] !top-1/2 !left-1/2 !right-auto !bottom-auto -translate-x-1/2 -translate-y-1/2"}>
                <DeleteConfirmation setModal={setModal} modal={modal} />
            </Modal>}
            <div className="flex w-full justify-between items-start relative">
                <div className="w-1/2 flex flex-col text-xs md:text-[14px] text-azulCorporativo">
                    {/* <span className="text-primary* text-gray-300 *cursor-pointer *hover:text-pink-500" onClick={() => {disable ? ht() : setModalPlantilla(!modalPlantilla) }} >
                        {t("loadtemplate")}
                    </span> */}
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
                    <div className="flex items-center absolute  right-6 space-x-1" data-pdf-hide>
                        <div onClick={() => downloadPdf()} className="bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full absolute* flex justify-center items-center right-6* cursor-pointer">
                            <GrDocumentPdf className="w-5 h-5 text-primary" />
                            {loading &&
                                <div className="fixed top-0 left-0 w-[100vw] h-[100vh] flex items-center justify-center">
                                    < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4" />
                                </div>
                            }
                        </div>
                        <div className="bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full  flex justify-center items-center right-0* cursor-pointer">
                            <LiaLinkSolid onClick={() => setShowModalCompartir(!showModalCompartir)} className="w-5 h-5 curso cursor-pointer" />
                        </div>
                    </div>
                }
                {
                    showModalCompartir && <ClickAwayListener onClickAway={() => showModalCompartir && setShowModalCompartir(false)}>
                        <ul
                            data-pdf-hide
                            className={`${showModalCompartir ? "block opacity-100" : "hidden opacity-0"
                                } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-[30px] right-5 w-[300px] z-50`}
                        >
                            <li
                                className="flex items-center py-4 px-6 font-display text-sm text-gray-500 bg-base transition w-full capitalize"
                            >
                                <CopiarLink link={link} />
                            </li>
                            <li className="border-t border-gray-100">
                                <a
                                    href={`/api/ical/${event?._id}/${itinerario?._id}`}
                                    download={`itinerario-${itinerario?._id}.ics`}
                                    className="flex items-center gap-2 py-3 px-6 font-display text-sm text-gray-500 hover:bg-gray-50 transition w-full"
                                    onClick={() => setShowModalCompartir(false)}
                                >
                                    <BsCalendarPlus className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span>Añadir al calendario (.ics)</span>
                                </a>
                            </li>
                        </ul>
                    </ClickAwayListener>
                }
            </div>
            <div className="flex flex-col justify-center items-center">
                {!editTitle
                    ? <span className="text-3xl md:text-[40px] font-title text-primary">{title}</span>
                    : <div className="flex space-x-2 w-[85%] md:w-[60%] translate-x-5">
                        <input onChange={(e) => setTitle(e.target.value)} type="text" value={title} autoFocus className={`font-display text-center text-sm text-gray-500 border-[1px] border-gray-300 focus:border-primary w-full py-2 px-4 rounded-xl focus:ring-0 focus:outline-none transition`} />
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
