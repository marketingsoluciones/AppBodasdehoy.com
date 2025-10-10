import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { EventContextProvider } from '../../../context/EventContext';
import i18next from 'i18next';
import { useToast } from '../../../hooks/useToast';


interface SendButtonProps {
  isDisabled: boolean;
  isResend?: boolean;
  optionSelect?: string;
  arrEnviarInvitaciones: string[];
}

export const SendButton: FC<SendButtonProps> = ({
  isDisabled,
  isResend = false,
  optionSelect,
  arrEnviarInvitaciones
}) => {
  const { t } = useTranslation();
  const buttonText = isResend ? t("reenviar") : t("enviar");
  const { event, setEvent } = EventContextProvider();
  const toast = useToast()


  const handleSendInvitation = async () => {
    if (optionSelect === "email") {
      try {
        fetchApiEventos({
          query: queries.testInvitacion,
          variables: {
            evento_id: event?._id,
            email: arrEnviarInvitaciones,
            lang: i18next.language
          }
        })
        toast("success", t("Invitación enviada"))
      } catch (error) {
        console.log(error)
      }
    }
  };

  return (
    <div className="flex justify-between py-3 ml-[52px] w-auto pr-5 relative">
      <button
        disabled={isDisabled}
        onClick={() => handleSendInvitation()}
        className={`focus:outline-none ${isDisabled
          ? "bg-gray-300"
          : "hover:opacity-70 transition bg-primary"
          } text-white py-1 px-2 rounded-lg text-center text-[10px] md:text-sm capitalize`}
      >
        {buttonText}
      </button>
    </div>
  );
}; 