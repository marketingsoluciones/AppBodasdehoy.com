import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { EventContextProvider } from '../../../context/EventContext';
import i18next from 'i18next';
import { useToast } from '../../../hooks/useToast';
import { AuthContextProvider } from '../../../context/AuthContext';
import { DataTableGroupContextProvider } from '../../../context/DataTableGroupContext';

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

  const handleSendInvitation = async () => {
    if (optionSelect === "email") {
      try {
        fetchApiEventos({
          query: queries.sendInvitations,
          variables: {
            evento_id: event?._id,
            invitados_ids_array: arrIDs,
            dominio: auth.config?.dominio,
            transport: "email",
            lang: i18next.language
          }
        }).then((result: any) => {
          toast("success", t("Invitación enviada"))          
          if (result?.invitados_array) {
            const invitadosActualizados = event.invitados_array.map(invitado => {
              const invitadoActualizado = result.invitados_array.find((inv: any) => inv._id === invitado._id);
              return invitadoActualizado 
                ? { ...invitado, ...invitadoActualizado } 
                : invitado;
            });
            
            setEvent({ ...event, invitados_array: invitadosActualizados });
          }
        })
      } catch (error) {
        console.log(error)
      }
    }
  };

  return (
    <div className="flex justify-between py-3 ml-[52px] w-auto pr-5 relative">
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
  );
}; 