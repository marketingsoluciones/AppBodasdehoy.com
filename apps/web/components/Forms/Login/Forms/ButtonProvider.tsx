import { FC } from "react";
import { useToast } from "../../../../hooks/useToast";
import { useAuthentication } from "../../../../utils/Authentication";
import { AuthContextProvider } from "../../../../context";
import { useTranslation } from "react-i18next";

interface propsButtonProvider {
  provider: string
  handle: any
  icon: any
  setStage: any
  whoYouAre: string
}

export const ButtonProvider: FC<propsButtonProvider> = ({ provider, handle, icon, setStage, whoYouAre }) => {
  const { setIsStartingRegisterOrLogin } = AuthContextProvider()
  const { signIn } = useAuthentication();
  const toast = useToast();
  const { t } = useTranslation()

  const handleClick = async (provider: any) => {
    try {
      console.log("[ButtonProvider] Iniciando login con provider:", provider);
      await signIn({ type: "provider", payload: provider, setStage, whoYouAre, setIsStartingRegisterOrLogin });
      console.log("[ButtonProvider] signIn completado");
    } catch (error: any) {
      console.error("[ButtonProvider] Error en handleClick:", error);
      toast("error", error?.message || JSON.stringify(error));
    }
  };
  return (
    <>
      <div className="*bg-blue-200">
        <span className="*bg-white flex m-2 rounded  ">
          <button onClick={() => handleClick(handle)} className="*bg-[#ffbfbf] rounded-md border-[1px] border-gray-300 hover:border-blue-300 hover:border-2 w-[250px] h-[40px] flex items-center" >
            {icon}
            <p className="*bg-blue-300 w-[215px] font-['Roboto'] text-[14px]">{`${t("Continúa con")} ${provider}`}</p>
          </button>
        </span>
      </div>
    </>
  )

}