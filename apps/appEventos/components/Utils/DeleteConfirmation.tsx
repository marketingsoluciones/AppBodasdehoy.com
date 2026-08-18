import { Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoTrashOutline } from 'react-icons/io5';
import { ModalInterface } from '../../utils/Interfaces';
import ButtonPrimary from '../Invitaciones/ButtonPrimary';
import ButtonSecondary from '../Invitaciones/ButtonSecondary';

interface props {
    setModal: Dispatch<SetStateAction<ModalInterface>>
    modal: ModalInterface & {
        title?: string | ReactNode
        subTitle?: string | ReactNode
        handle?: () => void
    }
}

export const DeleteConfirmation = ({ modal, setModal }: props) => {
    const { t } = useTranslation();
    const [validationText, setValidationText] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const confirmWord = t('deleteconfirmword', 'eliminar')
    const requiresTypedConfirm = Boolean(modal.subTitle)
    const canConfirm = !requiresTypedConfirm
        || validationText.trim().toLowerCase() === confirmWord.toLowerCase()

    useEffect(() => {
        if (!requiresTypedConfirm) return
        const id = window.setTimeout(() => {
            inputRef.current?.focus()
        }, 0)
        return () => window.clearTimeout(id)
    }, [requiresTypedConfirm])

    const handleConfirm = () => {
        if (!canConfirm) return
        modal?.handle?.()
    }

    const isStudio = typeof window !== "undefined"
        && window.location.pathname === "/itinerario"
        && new URLSearchParams(window.location.search).get("studio") !== "legacy"

    if (isStudio) {
        return (
            <div style={{ padding: "22px 22px 18px", textAlign: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FBE4EF", display: "flex", alignItems: "center", justifyContent: "center", color: "#D83E7C", margin: "0 auto 12px" }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" /></svg>
                </div>
                <div style={{ font: "600 14.5px Poppins", color: "#3A3A42", marginBottom: 6 }}>
                    ¿{t("Eliminar", { defaultValue: "Eliminar" })} &quot;{modal?.title}&quot;?
                </div>
                <div style={{ font: "400 12px/1.55 Poppins", color: "#8a8a90", marginBottom: 14 }}>
                    {t("Se borrarán todas sus tareas.", { defaultValue: "Se borrarán todas sus tareas." })} {t("Es")} <b style={{ color: "#D83E7C", fontWeight: 600 }}>{t("definitivo", { defaultValue: "definitivo" })}</b> {t("y no se podrá recuperar.", { defaultValue: "y no se podrá recuperar." })}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    value={validationText}
                    onChange={(e) => setValidationText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirm()
                        if (e.key === 'Escape') setModal({ state: false })
                    }}
                    placeholder={t("confirmDeletePlaceholder", { defaultValue: 'Escribe "ELIMINAR" para confirmar' })}
                    className="msi-confirm"
                    style={{ width: "100%", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "10px 13px", font: "500 12.5px Poppins", color: "#3A3A42", outline: "none", textAlign: "center", marginBottom: 14, background: "transparent" }}
                />
                <div style={{ display: "flex", gap: 9, justifyContent: "center" }}>
                    <button type="button" onClick={() => setModal({ state: false })} style={{ flex: 1, padding: 10, borderRadius: 10, font: "600 12px Poppins", cursor: "pointer", background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72" }}>
                        {t("cancel", "Cancelar")}
                    </button>
                    <button type="button" onClick={handleConfirm} disabled={!canConfirm}
                        style={canConfirm
                            ? { flex: 1, padding: 10, borderRadius: 10, font: "600 12px Poppins", cursor: "pointer", background: "#D83E7C", color: "#fff", border: "none", boxShadow: "0 6px 16px rgba(216,62,124,.3)" }
                            : { flex: 1, padding: 10, borderRadius: 10, font: "600 12px Poppins", cursor: "default", background: "#F3B6CE", color: "#fff", border: "none" }}>
                        {t("Eliminar", { defaultValue: "Eliminar" })}
                    </button>
                </div>
                <style dangerouslySetInnerHTML={{ __html: ".msi-confirm:focus{border-color:#EF5B94 !important;}" }} />
            </div>
        )
    }

    return (
        <div className="w-full h-auto min-h-[200px] p-6 flex flex-col">
            <div className="flex items-center gap-[11px] mb-[18px]">
                <div className="w-10 h-10 rounded-[11px] flex-none bg-[#FCE7F0] text-[#EF5B94] flex items-center justify-center">
                    <IoTrashOutline className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-[16px] font-medium text-gray-500">
                        {modal?.title ? modal.title : t('cannotbeundone')}
                    </div>
                    <div className="text-[16px] font-bold text-gray-600">
                        {t('confirmdelete')}
                    </div>
                </div>
            </div>

            <div className="text-[13px] font-medium text-[#3A3A42] leading-snug mb-4">
                {modal?.subTitle}
            </div>

            {requiresTypedConfirm && (
                <>
                    <div className="text-[11px] font-bold tracking-wider uppercase text-gray-600 mb-2">
                        {t('typeconfirmeliminar')}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        autoComplete="off"
                        value={validationText}
                        onChange={(e) => setValidationText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirm()
                            if (e.key === 'Escape') setModal({ state: false })
                        }}
                        placeholder={confirmWord}
                        className="w-full p-1.5 rounded-[11px] border-[1.5px] border-[#E7E7EA] focus:border-[#EF5B94] outline-none bg-white text-[13px] font-medium text-[#3A3A42] placeholder:text-[#b3b3ba] text-center"
                    />
                </>
            )}

            <div className="flex gap-[11px] justify-end mt-[22px]">
                <ButtonPrimary
                    type="button"
                    variant="gray"
                    onClick={() => setModal({ state: false })}
                    className="!w-auto md:!w-[115px] !mt-0"
                >
                    {t('cancel')}
                </ButtonPrimary>
                <ButtonSecondary
                    type="button"
                    disabled={!canConfirm}
                    onClick={handleConfirm}
                    className="!w-auto md:!w-[115px] !mt-0"
                >
                    {t('eliminate')}
                </ButtonSecondary>
            </div>
        </div>
    )
}
