import { Dispatch, FC, ReactHTMLElement, ReactNode, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalInterface } from '../../utils/Interfaces';
import { Modal } from './Modal';

interface props {
  setModal: Dispatch<SetStateAction<ModalInterface>>
  handleDelete: any
  message: ReactNode | string
  loading: boolean
}

export const SimpleDeleteConfirmation: FC<props> = ({ setModal, handleDelete, message, loading }) => {
  const { t } = useTranslation();

  return (
    <Modal set={setModal} loading={loading} classe={"w-[95%] md:w-[450px] h-[200px] flex items-center justify-center"}>
      <div className="flex flex-col items-center justify-center h-full space-y-8 text-[16px]">
        <div className='flex flex-col items-center space-y-2'>
          {message}
        </div>
        <div className="space-x-5">
          <button onClick={() => setModal({ state: false })} className=" bg-gray-400 h-10 w-24 rounded-lg text-white font-body hover:opacity-80">
            {t("discard")}
          </button>
          
            <button onClick={() => handleDelete()} className={` "hover:opacity-80 bg-primary transition-all   h-10 w-24 rounded-lg text-white font-body`}>
              {t("eliminate")}
            </button>
          
        </div>
      </div>
    </Modal>
  )
}