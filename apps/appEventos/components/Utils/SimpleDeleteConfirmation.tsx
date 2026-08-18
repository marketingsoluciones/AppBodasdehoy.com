import { Dispatch, FC, ReactNode, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { IoTrashOutline } from 'react-icons/io5';
import { ModalInterface } from '../../utils/Interfaces';
import ButtonPrimary from '../Invitaciones/ButtonPrimary';
import ButtonSecondary from '../Invitaciones/ButtonSecondary';
import { Modal } from './Modal';

interface props {
  setModal: Dispatch<SetStateAction<ModalInterface>>
  handleDelete: () => void
  message: ReactNode | string
  loading?: boolean
  /** Nombre del ítem a eliminar (cabecera). Si no se pasa, se usa un fallback. */
  title?: string | ReactNode
}

const modalShellClass =
  'w-[380px] max-w-[95%] h-auto min-h-[200px] !top-1/2 !left-1/2 !right-auto !bottom-auto -translate-x-1/2 -translate-y-1/2'

export const SimpleDeleteConfirmation: FC<props> = ({
  setModal,
  handleDelete,
  message,
  loading = false,
  title,
}) => {
  const { t } = useTranslation();
  const isStudio = typeof window !== "undefined"
    && window.location.pathname === "/itinerario"
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  if (isStudio) {
    return (
      <Modal set={setModal} loading={loading} classe="w-[320px] max-w-[92%] h-auto !top-1/2 !left-1/2 !right-auto !bottom-auto -translate-x-1/2 -translate-y-1/2">
        <div style={{ padding: "22px 22px 18px", textAlign: "center" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FBE4EF", display: "flex", alignItems: "center", justifyContent: "center", color: "#D83E7C", margin: "0 auto 12px" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" /></svg>
          </div>
          <div style={{ font: "600 14.5px Poppins", color: "#3A3A42", marginBottom: 6 }}>
            ¿{t("Borrar", { defaultValue: "Borrar" })} &quot;{title}&quot;?
          </div>
          <div style={{ font: "400 12px/1.55 Poppins", color: "#8a8a90", marginBottom: 18 }}>
            {t("Es")} <b style={{ color: "#D83E7C", fontWeight: 600 }}>{t("definitivo", { defaultValue: "definitivo" })}</b> {t("y no se podrá recuperar.", { defaultValue: "y no se podrá recuperar." })}
          </div>
          <div style={{ display: "flex", gap: 9, justifyContent: "center" }}>
            <button type="button" onClick={() => setModal({ state: false })} style={{ flex: 1, padding: 10, borderRadius: 10, font: "600 12px Poppins", cursor: "pointer", background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72" }}>
              {t("cancel", "Cancelar")}
            </button>
            <button type="button" onClick={handleDelete} style={{ flex: 1, padding: 10, borderRadius: 10, font: "600 12px Poppins", cursor: "pointer", background: "#D83E7C", color: "#fff", border: "none", boxShadow: "0 6px 16px rgba(216,62,124,.3)" }}>
              {t("Borrar", { defaultValue: "Borrar" })}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal set={setModal} loading={loading} classe={modalShellClass}>
      <div className="w-full h-auto min-h-[200px] p-6 flex flex-col">
        <div className="flex items-center gap-[11px] mb-[18px]">
          <div className="w-10 h-10 rounded-[11px] flex-none bg-[#FCE7F0] text-[#EF5B94] flex items-center justify-center">
            <IoTrashOutline className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[16px] font-medium text-gray-500">
              {title ?? t('cannotbeundone', 'Esta acción no se puede deshacer')}
            </div>
            <div className="text-[16px] font-bold text-gray-600">
              {t('confirmdelete', 'Confirmar eliminación')}
            </div>
          </div>
        </div>

        <div className="text-[13px] font-medium text-[#3A3A42] leading-snug mb-4">
          {message}
        </div>

        <div className="flex gap-[11px] justify-end mt-[22px]">
          <ButtonPrimary
            type="button"
            variant="gray"
            onClick={() => setModal({ state: false })}
            className="!w-auto md:!w-[115px] !mt-0"
          >
            {t('cancel', 'Cancelar')}
          </ButtonPrimary>
          <ButtonSecondary
            type="button"
            onClick={handleDelete}
            className="!w-auto md:!w-[115px] !mt-0"
          >
            {t('eliminate', 'Eliminar')}
          </ButtonSecondary>
        </div>
      </div>
    </Modal>
  )
}
