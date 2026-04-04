import { FC, useEffect, useState } from "react";
import { FirstStep, SecondStep } from "./Forms/Register/Steps";
import FormResetPassword from "./Forms/FormResetPassword";
import { AuthContextProvider } from "../../../context";
import { useAuthentication } from "../../../utils/Authentication";
import { LoginForm } from "@bodasdehoy/auth-ui";
import { GoogleProvider, FacebookProvider } from "../../../firebase";
import PageLogin from "../../../pages/login";
import { useTranslation } from 'react-i18next';
import { getAuth, signOut } from "firebase/auth";

interface propsLogin {
  fStageRegister?: any
  setStage: CallableFunction;
  stageRegister?: any
  setStageRegister?: any
  whoYouAre: string
  setWhoYouAre?: any
}

export const Login: FC<propsLogin> = ({ setStage, whoYouAre }) => {
  const { SetWihtProvider, setIsStartingRegisterOrLogin } = AuthContextProvider();
  const { signIn } = useAuthentication();

  const handleEmailLogin = async (email: string, password: string) => {
    await signIn({ type: 'credentials', payload: { identifier: email, password }, setStage, setIsStartingRegisterOrLogin });
  };

  const handleGoogleLogin = async () => {
    await signIn({ type: 'provider', payload: GoogleProvider(), setStage, whoYouAre, setIsStartingRegisterOrLogin });
  };

  const handleFacebookLogin = async () => {
    await signIn({ type: 'provider', payload: FacebookProvider, setStage, whoYouAre, setIsStartingRegisterOrLogin });
  };

  return (
    <LoginForm
      onEmailLogin={handleEmailLogin}
      onFacebookLogin={handleFacebookLogin}
      onForgotPassword={() => setStage('resetPassword')}
      onGoogleLogin={handleGoogleLogin}
      onRegister={() => { setStage('register'); SetWihtProvider(false); signOut(getAuth()); }}
    />
  );
};

export const Register: FC<propsLogin> = ({ setStage, fStageRegister, stageRegister, setStageRegister, whoYouAre, setWhoYouAre }) => {
  const { t } = useTranslation();
  const { linkMedia, preregister, SetWihtProvider } = AuthContextProvider()

  useEffect(() => {
    setWhoYouAre(fStageRegister == 1 ? "empresa" : "")
  }, [])

  return (
    <>
      {(() => {
        switch (stageRegister) {
          case 0:
            return <FirstStep setStageRegister={setStageRegister} value={setWhoYouAre} />
            break;
          case 1:
            return <SecondStep setStageRegister={setStageRegister} stageRegister={stageRegister} whoYouAre={whoYouAre} setStage={setStage} />
            break;
          default:
            return <PageLogin />
            break;
        }
      })()}

      {(linkMedia == null && !preregister) && <h2 className={`font-light text-gray-500 flex gap-2 text-sm  pt-3`}>
        {t("doyouhaveanaccount")}
        <span
          className="text-sm text-primary font-semibold cursor-pointer hover:text-tertiary transition"
          onClick={() => {
            setStageRegister(0)
            setStage("login")
            SetWihtProvider(false)
            signOut(getAuth())
          }}
        >       {t("log")}
        </span>
      </h2>}
    </>
  );
};

export const ResetPass: FC<propsLogin> = ({ setStage }) => {
  const { SetWihtProvider } = AuthContextProvider()
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col gap-2 items-center justify-center w-full">
        {/* <LogoFullColor className="w-auto h-10" /> */}
      </div>
      <FormResetPassword setStage={setStage} />
      <h2
        className={`font-light text-gray-500 flex gap-2 items-center text-sm `}
      >
        {t("doyouhaveanaccount")}
        <span
          className="text-sm text-primary font-semibold cursor-pointer hover:text-tertiary transition"
          onClick={() => {
            setStage("login")
            SetWihtProvider(false)
            signOut(getAuth())
          }}
        >
          {t("log")}
        </span>
      </h2>
      {/* <BusinessAccess /> */} {/* componente que no esta terminado */}
    </>
  );
};