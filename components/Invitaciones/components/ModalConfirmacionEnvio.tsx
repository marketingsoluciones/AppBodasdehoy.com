import { Dispatch, FC, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalInterface } from '../../../utils/Interfaces';
import { Modal } from '../../Utils/Modal';
import { HiOutlineMail } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { InvitadosIcon } from '../../icons';

interface Props {
  setModal: Dispatch<SetStateAction<ModalInterface>>;
  handleConfirmSend: () => void;
  templateTitle: string;
  templateContent: string;
  templatePreview: string;
  invitadosCount: number;
  optionSelect: string;
  loading: boolean;
}

export const ModalConfirmacionEnvio: FC<Props> = ({ setModal, handleConfirmSend, templateTitle, templateContent, templatePreview, invitadosCount, optionSelect, loading }) => {
  const { t } = useTranslation();

  const getTemplateTypeLabel = () => {
    return optionSelect === "email" ? t("email") : "WhatsApp";
  };

  return (
    <Modal
      set={setModal}
      loading={loading}
      classe={"w-[95%] md:w-[600px] h-auto max-h-[80vh] flex items-center justify-center"}
    >
      <div className="flex flex-col w-full h-full p-6 space-y-6 text-[16px]">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b pb-4">
          <span className="text-2xl flex items-center justify-center">{
            optionSelect === "email"
              ? <HiOutlineMail className="w-12 h-12 -rotate-12 text-primary" />
              : <FaWhatsapp className="w-12 h-12 text-emerald-500 -rotate-12" />
          }</span>
          <div>
            <h2 className={`text-xl font-semibold ${optionSelect === "email" ? "text-primary" : "text-emerald-500"}`}>
              {t("Confirmar envío de invitaciones")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("Se enviarán")} {invitadosCount} {t("invitaciones por")} {getTemplateTypeLabel()}
            </p>
          </div>
        </div>

        {/* Template Information */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-primary mb-2">
              {t("Plantilla seleccionada")}:
            </h3>
            <p className="text-lg font-semibold text-gray-600">
              {templateTitle || t("Sin plantilla seleccionada")}
            </p>
          </div>

          {/* Template Content Preview */}
          {optionSelect !== "email"
            ? <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-medium text-primary mb-3">
                {t("Contenido de la plantilla")}:
              </h3>
              <div className="bg-gray-50 p-3 rounded border h-36 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {templateContent}
                </pre>
              </div>
            </div>
            : <div className="flex items-start justify-center w-full h-[212px] border border-gray-200 rounded-lg overflow-hidden">
              <div className="w-30 h-50 bg-blue">
                <img src={templatePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          }
          {/* Invitados Count */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">
                <InvitadosIcon className="w-6 h-6" />
              </span>
              <span className="font-medium text-blue-800">
                {t("Invitados seleccionados")}: {invitadosCount}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            onClick={() => setModal({ state: false })}
            className="bg-gray-400 h-10 px-6 rounded-lg text-white font-body hover:opacity-80 transition-opacity"
          >
            {t("cancelar")}
          </button>

          <button
            onClick={handleConfirmSend}
            className="bg-primary hover:opacity-80 transition-all h-10 px-6 rounded-lg text-white font-body disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t("Enviando...") : t("Confirmar envío")}
          </button>
        </div>
      </div>
    </Modal>
  );
};
