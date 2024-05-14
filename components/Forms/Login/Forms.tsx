import { FC, useEffect, useState } from "react";
import { Providers, RegisterQuestion } from "./Components";
import FormLogin from "./Forms/FormLogin";
import FormResetPassword from "./Forms/FormResetPassword";
import { FirstStep, SecondStep } from "./Forms/Register/Steps";
import { AuthContextProvider } from "../../../context";
import PageLogin from "../../../pages/login";

interface propsLogin {
  fStageRegister?: any
  setStage: CallableFunction;
  stageRegister?: any
  setStageRegister?: any
  whoYouAre: string
  setWhoYouAre?: any
}

export const Login: FC<propsLogin> = ({ setStage, whoYouAre}) => {
  return (
    <>
      <h2 className={`font-light text-tertiary justify-center flex text-md mt-12`}>
        Accede a tu cuenta
      </h2>
      <Providers setStage={setStage} whoYouAre={whoYouAre} />
      <h2 className={`font-light text-tertiary justify-center flex gap-2 text-md `}>
        O accede con tu email
      </h2>
      <FormLogin setStage={setStage} />
      <RegisterQuestion onClick={() => setStage("register")} />
      {/* <BusinessAccess /> */} {/* componente que no esta terminado */}
    </>
  );
};

export const Register: FC<propsLogin> = ({ setStage, fStageRegister, stageRegister, setStageRegister, whoYouAre, setWhoYouAre }) => {
  const { linkMedia, preregister } = AuthContextProvider()

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

      {(linkMedia == null && !preregister) && <h2 className={`font-light text-tertiary flex gap-2 text-sm  pt-3`}>
        ¿Dispones de una cuenta?
        <span
          className="text-sm text-primary font-semibold cursor-pointer hover:text-tertiary transition"
          onClick={() => {
            setStageRegister(0)
            setStage("login")
          }}
        >
          Inicia Sesión
        </span>
      </h2>}
    </>
  );
};

export const ResetPass: FC<propsLogin> = ({ setStage }) => {
  return (
    <>
      <div className="flex flex-col gap-2 items-center justify-center w-full">
        {/* <LogoFullColor className="w-auto h-10" /> */}
      </div>
      <FormResetPassword setStage={setStage} />
      <h2
        className={`font-light text-tertiary flex gap-2 items-center text-sm `}
      >
        ¿Dispones de una cuenta1?
        <span
          className="text-sm text-primary font-semibold cursor-pointer hover:text-tertiary transition"
          onClick={() => setStage("login")}
        >
          Inicia Sesión
        </span>
      </h2>
      {/* <BusinessAccess /> */} {/* componente que no esta terminado */}
    </>
  );
};