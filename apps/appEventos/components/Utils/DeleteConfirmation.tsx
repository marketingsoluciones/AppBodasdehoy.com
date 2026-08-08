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
