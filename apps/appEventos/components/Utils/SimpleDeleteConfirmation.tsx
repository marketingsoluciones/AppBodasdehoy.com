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
