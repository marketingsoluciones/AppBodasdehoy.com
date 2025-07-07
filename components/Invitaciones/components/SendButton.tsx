import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface SendButtonProps {
  isDisabled: boolean;
  onClick: () => void;
  isResend?: boolean;
}

export const SendButton: FC<SendButtonProps> = ({
  isDisabled,
  onClick,
  isResend = false
}) => {
  const { t } = useTranslation();
  const buttonText = isResend ? t("reenviar") : t("enviar");

  return (
    <div className="flex justify-between py-3 ml-[52px] w-auto pr-5 relative">
      <button
        disabled={isDisabled}
        onClick={onClick}
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