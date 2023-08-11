import { FC, useState } from "react";
import { Providers, RegisterQuestion } from "./Components";
import FormLogin from "./Forms/FormLogin";
import FormResetPassword from "./Forms/FormResetPassword";
import { FirstStep, SecondStep } from "./Forms/Register/Steps";
import { AuthContextProvider } from "../../../context";
import PageLogin from "../../../pages/login";

interface propsLogin {
  fStageRegister?: any
  setStage: CallableFunction;
}

export const Login: FC<propsLogin> = ({ setStage }) => {
  const { config } = AuthContextProvider()

  return (
    <>
      <div className=" h-full">
        <div className="flex flex-col items-center justify-center w-full">
          {config?.logoDirectory}
        </div>
        <h2 className={`font-light text-tertiary flex items-center text-md `}>
          Accede a tu cuenta
        </h2>
        <Providers setStage={setStage} />
        <h2 className={`font-light text-tertiary flex gap-2 items-center text-md `}>
          O accede con tu email
        </h2>
        <FormLogin setStage={setStage} />
        <RegisterQuestion onClick={() => setStage("register")} />
        {/* <BusinessAccess /> */} {/* componente que no esta terminado */}
      </div>
    </>
  );
};

export const Register: FC<propsLogin> = ({ setStage, fStageRegister }) => {
  const [whoYouAre, setWhoYouAre] = useState<string>(fStageRegister == 1 ? "empresa" : "");
  const [stageRegister, setStageRegister] = useState(fStageRegister)
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

      <h2
        className={`font-light text-tertiary flex gap-2 items-center text-sm `}
      >
        ¿Dispones de una cuenta?
        <span
          className="text-sm text-primary font-semibold cursor-pointer hover:text-tertiary transition"
          onClick={() => setStage("login")}
        >
          Inicia Sesión
        </span>
      </h2>
    </>
  );
};

export const ResetPass: FC<propsLogin> = ({ setStage }) => {
  const { config } = AuthContextProvider()
  return (
    <>
      <div className="flex flex-col gap-2 items-center justify-center w-full">
        {config?.logoDirectory}
      </div>
      <FormResetPassword setStage={setStage} />
      <h2
        className={`font-light text-tertiary flex gap-2 items-center text-sm `}
      >
        ¿Dispones de una cuenta?
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