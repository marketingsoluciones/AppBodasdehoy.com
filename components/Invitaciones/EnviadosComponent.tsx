import { AuthContextProvider } from "../../context/AuthContext"
import { useTranslation } from 'react-i18next';
import { GuestTableAll } from "./GuestTableAll";

export const EnviadosComponent = ({ stateConfi }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    

    return (
        <>
            <div className="bg-white flex flex-col w-full h-full rounded-xl shadow-md relative mt-1">
                <span className="text-primary flex items-center text-[20px] first-letter:capitalize px-3">
                    {t("Lista de invitados")}
                </span>
                <div className="flex w-full flex-1 ">
                    <GuestTableAll multiSeled={true} stateConfi={stateConfi} />
                </div>
            </div>
            <style jsx>
                {`
                    .loader {
                        border-top-color:  ${config?.theme?.primaryColor};
                        -webkit-animation: spinner 1.5s linear infinite;
                        animation: spinner 1.5s linear infinite;
                    }

                    @-webkit-keyframes spinner {
                        0% {
                        -webkit-transform: rotate(0deg);
                        }
                        100% {
                        -webkit-transform: rotate(360deg);
                        }
                    }

                    @keyframes spinner {
                        0% {
                        transform: rotate(0deg);
                        }
                        100% {
                        transform: rotate(360deg);
                        }
                    }
                `}
            </style>
        </>
    )
}