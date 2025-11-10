import { Dispatch, FC, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalInterface } from '../../../utils/Interfaces';
import { Modal } from '../../Utils/Modal';
import { HiOutlineMail } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { InvitadosIcon } from '../../icons';
import { TemplateDesign } from '../../../utils/Interfaces';
import { IoCloseSharp } from 'react-icons/io5';

type TransportType = 'email' | 'whatsapp';

interface WhatsappTemplateOption {
  _id: string;
  templateName: string;
  bodyContent: string;
}

interface Props {
  setModal: Dispatch<SetStateAction<ModalInterface>>;
  handleConfirmSend: () => void;
  templateTitle: string;
  templateContent: string;
  templatePreview: string;
  invitadosCount: number;
  optionSelect: TransportType;
  loading: boolean;
  onChangeTransport: (transport: TransportType) => void;
  emailTemplates: TemplateDesign[];
  whatsappTemplates: WhatsappTemplateOption[];
  onSelectTemplate: (transport: TransportType, templateId: string) => void;
  loadingTemplates: boolean;
  selectedTemplateId: string;
}

export const ModalConfirmacionEnvio: FC<Props> = ({
  setModal,
  handleConfirmSend,
  templateTitle,
  templateContent,
  templatePreview,
  invitadosCount,
  optionSelect,
  loading,
  onChangeTransport,
  emailTemplates,
  whatsappTemplates,
  onSelectTemplate,
  loadingTemplates,
  selectedTemplateId
}) => {
  const { t } = useTranslation();

  const getTemplateTypeLabel = () => optionSelect === "email" ? t("email") : t("whatsapp");

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const transportOptions = useMemo(() => ([
    {
      value: 'email' as TransportType,
      label: t("email"),
      icon: <HiOutlineMail className="w-5 h-5 text-primary" />
    },
    {
      value: 'whatsapp' as TransportType,
      label: t("whatsapp"),
      icon: <FaWhatsapp className="w-5 h-5 text-emerald-500" />
    }
  ]), [t]);

  const selectOptions = useMemo(() => {
    if (optionSelect === 'email') {
      return emailTemplates.map(template => ({
        value: template._id,
        label: template?.configTemplate?.name ?? t("Sin plantilla seleccionada"),
      }));
    }
    return whatsappTemplates.map(template => ({
      value: template._id,
      label: template.templateName ?? t("Sin plantilla seleccionada"),
    }));
  }, [emailTemplates, optionSelect, t, whatsappTemplates]);

  const selectValue = useMemo(() => selectOptions.find(option => option.value === selectedTemplateId) ?? null, [selectOptions, selectedTemplateId]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return selectOptions;
    const normalizedSearch = searchTerm.toLowerCase();
    return selectOptions.filter(option => option.label.toLowerCase().includes(normalizedSearch));
  }, [searchTerm, selectOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchTerm('');
  }, [optionSelect, selectedTemplateId]);

  const handleOptionSelect = (value: string) => {
    onSelectTemplate(optionSelect, value);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleClearInput = () => {
    if (searchTerm) {
      setSearchTerm('');
    } else if (selectValue) {
      onSelectTemplate(optionSelect, '');
    }
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
              {t("Confirmar envío")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("Se enviarán")} {invitadosCount} {t("invitaciones por")} {getTemplateTypeLabel()}
            </p>
          </div>
        </div>

        {/* Template Information */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-500">{t("Canal de envío")}</span>
            <div className="bg-gray-100 w-full flex justify-center my-2 mt-4 rounded-2xl text-xs md:text-sm">
              {transportOptions.map((transport) => (
                <button
                  key={transport.value}
                  onClick={() => onChangeTransport(transport.value)}
                  className={`flex-1 px-2 py-2 h-full flex justify-center items-center cursor-pointer capitalize rounded-2xl transition-colors ${optionSelect === transport.value ? (transport.value === 'email' ? 'bg-primary text-white shadow-sm' : 'bg-primary text-white shadow-sm') : 'text-primary'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {transport.icon}
                    {transport.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <span className="text-sm font-medium text-gray-500">
              {t("Seleccionar plantilla")}:
            </span>
            <div className="space-y-2 relative" ref={dropdownRef}>
              <div className={`w-full flex items-center bg-white border ${isDropdownOpen ? 'border-primary' : 'border-gray-300'} rounded-2xl pr-4 cursor-text`} onClick={() => setIsDropdownOpen(true)}>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder={selectValue?.label || ""}
                  className="flex-1 bg-transparent text-xs md:text-sm text-gray-700 outline-none focus:outline-none border-0 focus:border-0 focus:ring-0"
                  disabled={loadingTemplates || !selectOptions.length}
                />
                {(searchTerm || selectValue) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClearInput();
                    }}
                    className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={t("cancelar")}
                  >
                    <IoCloseSharp />
                  </button>
                )}
              </div>
              {isDropdownOpen && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-md mt-2 max-h-60 overflow-y-auto">
                  {loadingTemplates ? (
                    <div className="px-3 py-2 text-sm text-gray-500">{t("Cargando")}...</div>
                  ) : filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleOptionSelect(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${option.value === selectedTemplateId ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        {option.label}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      {t("Sin resultados")}
                    </div>
                  )}
                </div>
              )}
            </div>
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
                {templatePreview
                  ? <img src={templatePreview} alt="Preview" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
                    {t("Sin vista previa disponible")}
                  </div>
                }
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
            disabled={loading || loadingTemplates || !selectedTemplateId}
          >
            {loading ? t("Enviando...") : t("Confirmar envío")}
          </button>
        </div>
      </div>
    </Modal>
  );
};
