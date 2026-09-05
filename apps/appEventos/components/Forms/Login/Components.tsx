import { FC, MouseEventHandler } from "react";
import { GoogleProvider, FacebookProvider, AppleProvidor } from "../../../firebase";
import { ButtonProvider } from "./Forms/ButtonProvider";
import { useToast } from "../../../hooks/useToast";
import { useAuthentication } from "../../../utils/Authentication";
import { FacebookIcon2, GoogleIcon } from "../../icons";
import { useTranslation } from 'react-i18next';

interface propsRegisterQuestion {
  onClick: MouseEventHandler;
}

interface propsResetPassword {
  onClick: MouseEventHandler;
}

export const RegisterQuestion: FC<propsRegisterQuestion> = ({ onClick }) => {
  const { t } = useTranslation();
  // OBS-5 (informe QA 21-jun): el enlace de "Crear cuenta" era texto pequeño en el pie y el
  // usuario nuevo no lo encontraba. Convertimos a botón con borde y padding más prominente.
  return (
    <div className="flex flex-col items-center gap-1 mt-1">
      <span className="font-light text-gray-500 text-sm">{t("dontaccount")}</span>
      <button
        type="button"
        onClick={onClick}
        className="px-4 py-2 rounded-lg border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition"
      >
        {t("register")}
      </button>
    </div>
  );
};

export const ResetPassword: FC<propsResetPassword> = ({ onClick }) => {
  const { t } = useTranslation();
  return (

    <span
      className="text-sm text-primary w-full text-left font-semibold cursor-pointer hover:text-tertiary transition"
      onClick={onClick}
    >
      {t("forgotassword")}
    </span>

  );
};

export const Providers: FC<any> = ({ setStage, whoYouAre }) => {
  

  return (
    <>
      <div className={`text-center flex flex-col gap-2 w-full items-center `}>
        <div className="">
          <ButtonProvider provider="Google" handle={GoogleProvider()} setStage={setStage} whoYouAre={whoYouAre} icon={<GoogleIcon className="ml-[15px] w-[20px] h-[20px] text-gray-500" />} />
          <ButtonProvider provider="Facebook" handle={FacebookProvider} setStage={setStage} whoYouAre={whoYouAre} icon={<FacebookIcon2 className="ml-[15px] w-[20px] h-[20px] text-gray-500" />} />
          {/* <ButtonProvider provider="Apple" handle={AppleProvidor()} icon={<AppleIcon className="ml-[15px] w-[20px] h-[20px] text-gray-500" />} /> */}
        </div>
      </div>
      <style jsx>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,600;1,400;1,600&display=swap');
        `}
      </style>
    </>
  );
};

export const BusinessAccess: FC = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full text-center h-max text-gray-500">
      <p>{t("areyouaprofessional?")}</p>
      <h3 className="text-primary font-medium cursor-pointer hover:text-tertiary transition">
        {t("enterpriseaccess")}
      </h3>
    </div>
  );
};
