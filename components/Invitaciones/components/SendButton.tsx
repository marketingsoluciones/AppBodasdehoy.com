import { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { EventContextProvider } from '../../../context/EventContext';
import i18next from 'i18next';
import { useToast } from '../../../hooks/useToast';
import { AuthContextProvider } from '../../../context/AuthContext';
import { DataTableGroupContextProvider } from '../../../context/DataTableGroupContext';
import { ModalConfirmacionEnvio } from './ModalConfirmacionEnvio';
import { ModalInterface } from '../../../utils/Interfaces';
import { TemplateDesign } from '../../../utils/Interfaces';

type TransportType = 'email' | 'whatsapp';

interface WhatsappTemplateSummary {
  _id: string;
  templateName: string;
  bodyContent: string;
}

const getTransportFromOption = (value?: string): TransportType => value === 'whatsapp' ? 'whatsapp' : 'email';
const TRANSPORT_STORAGE_KEY = 'app-bodasdehoy-send-transport';

const getStoredTransport = (): TransportType | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(TRANSPORT_STORAGE_KEY);
  return stored === 'whatsapp' ? 'whatsapp' : stored === 'email' ? 'email' : null;
};

interface SendButtonProps {
  isResend?: boolean;
  optionSelect?: string;
}

export const SendButton: FC<SendButtonProps> = ({ isResend = false, optionSelect }) => {
  const auth = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const { t } = useTranslation();
  const buttonText = isResend ? t("reenviar") : t("enviar");
  const toast = useToast()
  const { dataTableGroup: { arrIDs } } = DataTableGroupContextProvider();

  // Estados para el modal de confirmación
  const [showModalConfirmacion, setShowModalConfirmacion] = useState<ModalInterface>({ state: false });
  const [templateData, setTemplateData] = useState<{ title: string; content: string; preview: string }>({ title: '', content: '', preview: '' });
  const [loading, setLoading] = useState(false);
  const [transportSelected, setTransportSelected] = useState<TransportType>(() => getStoredTransport() ?? getTransportFromOption(optionSelect));
  const [emailTemplates, setEmailTemplates] = useState<TemplateDesign[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsappTemplateSummary[]>([]);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>('');
  const [selectedWhatsappTemplate, setSelectedWhatsappTemplate] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);

  useEffect(() => {
    const storedTransport = getStoredTransport();
    if (storedTransport) {
      setTransportSelected(storedTransport);
    } else {
      setTransportSelected(getTransportFromOption(optionSelect));
    }
  }, [optionSelect]);

  // Función para obtener los datos de la plantilla
  const getTemplateData = useCallback(async (transport: TransportType, templateId?: string) => {
    try {
      if (transport === "email" && (templateId || event?.templateEmailSelect)) {
        const referenceId = templateId || event?.templateEmailSelect;
        const result: any = await fetchApiEventos({
          query: queries.getVariableEmailTemplate,
          variables: {
            template_id: referenceId,
            selectVariable: "configTemplate"
          }
        });
        const resultPreview: any = await fetchApiEventos({
          query: queries.getVariableEmailTemplate,
          variables: {
            template_id: referenceId,
            selectVariable: "preview"
          }
        });
        return {
          title: result?.configTemplate?.name || '',
          content: result?.configTemplate?.html || '',
          preview: resultPreview?.preview || ''
        };
      } else if (transport === "whatsapp" && (templateId || event?.templateWhatsappSelect)) {
        const referenceId = templateId || event?.templateWhatsappSelect;
        const result: any = await fetchApiEventos({
          query: queries.getWhatsappInvitationTemplates,
          variables: {
            evento_id: event._id
          }
        });
        const template = result?.find((elem: any) => elem._id === referenceId);
        return {
          title: template?.data?.templateName || '',
          content: template?.data?.bodyContent || ''
        };
      }
      return { title: '', content: '' };
    } catch (error) {
      console.error('Error obteniendo datos de plantilla:', error);
      return { title: '', content: '', preview: '' };
    }
  }, [event?._id, event?.templateEmailSelect, event?.templateWhatsappSelect]);

  const loadTemplatesData = useCallback(async () => {
    if (!event?._id) return;
    setLoadingTemplates(true);
    try {
      const [emailEventResult, emailGlobalResult, whatsappResult] = await Promise.allSettled([
        fetchApiEventos({
          query: queries.getPreviewsEmailTemplates,
          variables: {
            evento_id: event?._id
          }
        }) as Promise<TemplateDesign[]>,
        fetchApiEventos({
          query: queries.getPreviewsEmailTemplates,
          variables: {}
        }) as Promise<TemplateDesign[]>,
        fetchApiEventos({
          query: queries.getWhatsappInvitationTemplates,
          variables: {
            evento_id: event?._id
          }
        }) as Promise<any[]>
      ]);

      const emailEventTemplates = emailEventResult.status === 'fulfilled' && Array.isArray(emailEventResult.value)
        ? emailEventResult.value
        : [];

      const emailGlobalTemplates = emailGlobalResult.status === 'fulfilled' && Array.isArray(emailGlobalResult.value)
        ? emailGlobalResult.value
        : [];

      const whatsappResponse = whatsappResult.status === 'fulfilled' && Array.isArray(whatsappResult.value)
        ? whatsappResult.value
        : [];

      const mergedEmailTemplates = [
        ...emailEventTemplates,
        ...emailGlobalTemplates.filter((globalTemplate) => !emailEventTemplates.some((localTemplate) => localTemplate._id === globalTemplate._id))
      ];

      const whatsappData = whatsappResponse.map((elem: any) => ({
        _id: elem?._id,
        templateName: elem?.data?.templateName,
        bodyContent: elem?.data?.bodyContent ?? ''
      })) as WhatsappTemplateSummary[];

      setEmailTemplates(mergedEmailTemplates);
      setWhatsappTemplates(whatsappData);
    } catch (error) {
      console.error('Error cargando listas de plantillas:', error);
      toast("error", t("Error cargando plantillas"));
    } finally {
      setLoadingTemplates(false);
    }
  }, [event?._id, t, toast]);

  const updateTemplatePreviewData = useCallback(async (transport: TransportType, templateId?: string) => {
    const data = await getTemplateData(transport, templateId);
    setTemplateData({
      title: data?.title ?? '',
      content: data?.content ?? '',
      preview: data?.preview ?? ''
    });
  }, [getTemplateData]);

  const handleTransportChange = useCallback((value: TransportType) => {
    setTransportSelected(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TRANSPORT_STORAGE_KEY, value);
    }
    const targetTemplateId = value === 'email' ? (selectedEmailTemplate || event?.templateEmailSelect) : (selectedWhatsappTemplate || event?.templateWhatsappSelect);
    updateTemplatePreviewData(value, targetTemplateId);
  }, [event?.templateEmailSelect, event?.templateWhatsappSelect, selectedEmailTemplate, selectedWhatsappTemplate, updateTemplatePreviewData]);

  const handleTemplateSelection = useCallback(async (transport: TransportType, templateId: string) => {
    if (!event?._id) return;
    try {
      if (!templateId) {
        await fetchApiEventos({
          query: queries.eventUpdate,
          variables: {
            idEvento: event?._id,
            variable: transport === 'email' ? "templateEmailSelect" : "templateWhatsappSelect",
            value: ""
          }
        });
        if (transport === 'email') {
          setSelectedEmailTemplate('');
          if (event) {
            setEvent({ ...event, templateEmailSelect: '' });
          }
        } else {
          setSelectedWhatsappTemplate('');
          if (event) {
            setEvent({ ...event, templateWhatsappSelect: '' });
          }
        }
        setTemplateData({ title: '', content: '', preview: '' });
        return;
      }

      await fetchApiEventos({
        query: queries.eventUpdate,
        variables: {
          idEvento: event?._id,
          variable: transport === 'email' ? "templateEmailSelect" : "templateWhatsappSelect",
          value: templateId
        }
      });
      if (transport === 'email') {
        setSelectedEmailTemplate(templateId);
        if (event) {
          setEvent({ ...event, templateEmailSelect: templateId });
        }
      } else {
        setSelectedWhatsappTemplate(templateId);
        if (event) {
          setEvent({ ...event, templateWhatsappSelect: templateId });
        }
      }
      await updateTemplatePreviewData(transport, templateId);
    } catch (error) {
      console.error('Error actualizando plantilla seleccionada:', error);
      toast("error", t("Error al seleccionar plantilla"));
    }
  }, [event, setEvent, t, toast, updateTemplatePreviewData]);

  const handleSendInvitation = async () => {
    if (!arrIDs?.length) {
      toast("error", t("No hay invitados seleccionados"));
      return;
    }

    const storedTransport = getStoredTransport();
    const fallbackTransport = getTransportFromOption(optionSelect);
    const initialTransport = storedTransport ?? transportSelected ?? fallbackTransport;
    setTransportSelected(initialTransport);
    setSelectedEmailTemplate(event?.templateEmailSelect || '');
    setSelectedWhatsappTemplate(event?.templateWhatsappSelect || '');

    await loadTemplatesData();
    await updateTemplatePreviewData(initialTransport);
    setShowModalConfirmacion({ state: true });
  };

  const handleConfirmSend = async () => {
    if (transportSelected === 'email' && !(event?.templateEmailSelect || selectedEmailTemplate)) {
      toast("error", t("Selecciona una plantilla de email"));
      return;
    }
    if (transportSelected === 'whatsapp' && !(event?.templateWhatsappSelect || selectedWhatsappTemplate)) {
      toast("error", t("Selecciona una plantilla de WhatsApp"));
      return;
    }

    setLoading(true);
    try {

      await fetchApiEventos({
        query: queries.sendComunications,
        variables: {
          evento_id: event?._id,
          invitados_ids_array: arrIDs,
          dominio: auth.config?.dominio,
          transport: transportSelected,
          lang: i18next.language
        }
      });

      toast("success", transportSelected === "email" ? t("Envio por email exitoso") : t("Envio por WhatsApp exitoso"));

      // if (result?.invitados_array) {
      //   const invitadosActualizados = event.invitados_array.map(invitado => {
      //     const invitadoActualizado = result.invitados_array.find((inv: any) => inv._id === invitado._id);
      //     return invitadoActualizado
      //       ? { ...invitado, ...invitadoActualizado }
      //       : invitado;
      //   });
      //   setEvent({ ...event, invitados_array: invitadosActualizados });
      // }
      setShowModalConfirmacion({ state: false });
    } catch (error) {
      console.error('Error enviando invitaciones:', error);
      toast("error", t("Error al enviar invitaciones"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex relative">
        <button
          disabled={!arrIDs?.length}
          onClick={() => handleSendInvitation()}
          className={`focus:outline-none px-8 ${!arrIDs?.length
            ? "bg-gray-300"
            : "hover:opacity-70 transition bg-primary"
            } text-white py-1 px-2 rounded-lg text-center text-[10px] md:text-sm capitalize`}
        >
          {buttonText}
        </button>
      </div>

      {/* Modal de confirmación de envío */}
      {showModalConfirmacion.state && (
        <ModalConfirmacionEnvio
          setModal={setShowModalConfirmacion}
          handleConfirmSend={handleConfirmSend}
          templateTitle={templateData.title}
          templateContent={templateData.content}
          templatePreview={templateData.preview}
          invitadosCount={arrIDs?.length || 0}
          optionSelect={transportSelected}
          loading={loading}
          onChangeTransport={handleTransportChange}
          emailTemplates={emailTemplates}
          whatsappTemplates={whatsappTemplates}
          onSelectTemplate={handleTemplateSelection}
          loadingTemplates={loadingTemplates}
          selectedTemplateId={transportSelected === 'email' ? (selectedEmailTemplate || event?.templateEmailSelect || '') : (selectedWhatsappTemplate || event?.templateWhatsappSelect || '')}
        />
      )}
    </>
  );
}; 