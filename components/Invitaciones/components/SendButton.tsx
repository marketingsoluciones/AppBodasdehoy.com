import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { EventContextProvider } from '../../../context/EventContext';
import i18next from 'i18next';
import { useToast } from '../../../hooks/useToast';
import { AuthContextProvider } from '../../../context/AuthContext';
import { DataTableGroupContextProvider } from '../../../context/DataTableGroupContext';
import { ModalConfirmacionEnvio } from './ModalConfirmacionEnvio';
import { ModalInterface } from '../../../utils/Interfaces';

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

  // Función para obtener los datos de la plantilla
  const getTemplateData = async () => {
    try {
      if (optionSelect === "email" && event?.templateEmailSelect) {
        const result: any = await fetchApiEventos({
          query: queries.getVariableEmailTemplate,
          variables: {
            template_id: event.templateEmailSelect,
            selectVariable: "configTemplate"
          }
        });
        const resultPreview: any = await fetchApiEventos({
          query: queries.getVariableEmailTemplate,
          variables: {
            template_id: event.templateEmailSelect,
            selectVariable: "preview"
          }
        });
        return {
          title: result?.configTemplate?.name || '',
          content: result?.configTemplate?.html || '',
          preview: resultPreview?.preview || ''
        };
      } else if (optionSelect === "whatsapp" && event?.templateWhatsappSelect) {
        const result: any = await fetchApiEventos({
          query: queries.getWhatsappInvitationTemplates,
          variables: {
            evento_id: event._id
          }
        });
        const template = result?.find((elem: any) => elem._id === event.templateWhatsappSelect);
        return {
          title: template?.data?.templateName || '',
          content: template?.data?.bodyContent || ''
        };
      }
      return { title: '', content: '' };
    } catch (error) {
      console.error('Error obteniendo datos de plantilla:', error);
      return { title: '', content: '' };
    }
  };

  const handleSendInvitation = async () => {
    if (!arrIDs?.length) {
      toast("error", t("No hay invitados seleccionados"));
      return;
    }

    // Obtener datos de la plantilla
    const templateInfo = await getTemplateData();
    setTemplateData(templateInfo as { title: string; content: string; preview: string });

    // Mostrar modal de confirmación
    setShowModalConfirmacion({ state: true });
  };

  const handleConfirmSend = async () => {
    setLoading(true);
    try {

      const result: any = await fetchApiEventos({
        query: queries.sendInvitations,
        variables: {
          evento_id: event?._id,
          invitados_ids_array: arrIDs,
          dominio: auth.config?.dominio,
          transport: optionSelect,
          lang: i18next.language
        }
      });

      toast("success", optionSelect === "email" ? t("Envio por email exitoso") : t("Envio por WhatsApp exitoso"));

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
          className={`focus:outline-none ${!arrIDs?.length
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
          optionSelect={optionSelect || ''}
          loading={loading}
        />
      )}
    </>
  );
}; 