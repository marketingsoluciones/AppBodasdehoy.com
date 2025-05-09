import { Dispatch, FC, MouseEventHandler, SetStateAction, useState } from 'react';
import { Providers } from '../../Components';
import FormRegister from '../FormRegister';
import { AuthContextProvider } from '../../../../../context';
import { WhoYouAre } from './WhoYouAre';
import { useTranslation } from 'react-i18next';
import { getAuth } from 'firebase/auth';

/*
  ### Componente FirstStep ###
  @params value : Callback para enviar el valor de tipo de perfil seleccionado 
*/
interface propsFirstStep {
  value: FunctionStringCallback;
  setStageRegister: Dispatch<SetStateAction<number>>
}

export const FirstStep: FC<propsFirstStep> = ({ value, setStageRegister }) => {
  const { t } = useTranslation();
  const [select, setSelect] = useState<string>("");
  const email = getAuth()?.currentUser?.email

  // Tipo de dato para definir opciones

  return (
    <div className="flex flex-col items-center justify-center gap-8 mb-4 mt-16">
      {!!email && <span className='bg-primary px-4 py-2 rounded-full text-sm translate-y-3'>
        {email}
      </span>}
      <h2 className="text-2xl text-primary ">{t("quien eres")}</h2>
      <WhoYouAre select={select} setSelect={setSelect} />
      <button
        className={` rounded-full px-10 py-2 text-white font-medium w-max mx-auto inset-x-0 ${select === ""
          ? "bg-gray-200"
          : "bg-primary hover:bg-tertiary transition"
          }`}
        onClick={() => {
          value(select)
          setStageRegister(old => old + 1)
        }}
        disabled={select === ""}
      >
        {t("following")}
      </button>
    </div>
  );
};



/*
  ### Componente Option (para ser usado como iteracion de las opciones de tipo de perfil) ###
  @params icon : ReactNode, componente svg referente al icono
  @params title: String, titulo descriptivo del tipo de perfil
  @params onClick: Function, funcion a ejecutar al momento de hacer click
  @params color: Boolean, estado para deshabilitar o no
*/
interface propsOption {
  icon: string;
  title: string;
  onClick: MouseEventHandler;
  color: boolean;
}
const Option: FC<propsOption> = ({ icon, title, onClick, color = false }) => {
  return (
    <>
      <div
        className={`flex flex-col items-center justify-center gap-2 capitalize ${color ? "selected" : "option"
          }`}
      >
        <div
          onClick={onClick}
          className="w-24 h-24 rounded-full shadow bg-color-base grid place-items-center overflow-hidden p-1 "
        >
          <img src={icon} alt={title} className="object-contain" />
        </div>
        <h2 className="text-gray-500 text-lg text-light">{title}</h2>
      </div>
      <style jsx>
        {`
          .selected {
            transform: scale(1.05);
            transition: 0.5s;
          }
          .option {
            filter: saturate(0);
            transition: 0.5s;
          }

          .option:hover {
            filter: saturate(1);
            transition: 0.5s;
            cursor: pointer;
            transform: scale(1.05);
          }
        `}
      </style>
    </>
  );
};




/*
  ### Componente SecondStep ###
  @params whoYouAre : valor seleccionado en la primera fase que determina el perfil del usuario
*/
interface propsSecondStep {
  whoYouAre: string;
  stageRegister: number;
  setStageRegister: Dispatch<SetStateAction<number>>
  setStage: CallableFunction
}
export const SecondStep: FC<propsSecondStep> = (props) => {
  const { linkMedia, preregister, WihtProvider } = AuthContextProvider()
  const email = getAuth()?.currentUser?.email
  return (
    <div className="gap-1 flex flex-col justify-center items-center w-full ">
      {linkMedia == null &&
        <div className={` ${WihtProvider ? "hidden" : ""}`}>
          <Providers setStage={props.setStage} whoYouAre={preregister?.role[0] ?? props?.whoYouAre} />
          <h2 className={`font-light w-full text-tertiary text-center text-md`}>
            Ó
          </h2>
        </div>
      }
      {!!email && <span className='bg-primary px-4 py-2 rounded-full text-sm translate-y-[76px] mb-8'>
        {email}
      </span>}
      <FormRegister {...props} />
    </div>
  );
};
