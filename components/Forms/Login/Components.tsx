import { FC, MouseEventHandler, useContext } from "react";
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
  return (
    <h2 className={`font-light text-tertiary flex gap-2 items-center text-sm `}>
      {t("dontaccount")}
      <span
        className="text-primary font-semibold cursor-pointer hover:text-tertiary transition"
        onClick={onClick}
      >
        {t("register")}
      </span>
    </h2>
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
