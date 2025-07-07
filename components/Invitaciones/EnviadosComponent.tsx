import { GuestTable } from "./GuestTable"
import { AuthContextProvider } from "../../context/AuthContext"
import { useState } from "react"
import { useTranslation } from 'react-i18next';

export const EnviadosComponent = ({ dataInvitationSent, dataInvitationNotSent, event }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const [stateTable, setStateTable] = useState("noenviados")

    return (
        <>
            <div className="my-4">
                <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                    <span className="text-primary flex items-center text-[20px] first-letter:capitalize ml-3">
                        {`${stateTable === "noenviados" ? "Invitaciones pendientes" : "Invitaciones enviadas"}`}
                    </span>
                    <div className="w-[calc(100%-80px)] md:w-96 mx-auto inset-x-0 flex my-2 mt-4 rounded-2xl overflow-hidden border">
                        <button
                            className={`w-1/2 md:w-[270px] py-1 ${stateTable == "noenviados" ? "bg-primary text-white" : "bg-white text-primary"} h-full grid place-items-center font-display font-medium text-sm cursor-pointer hover:opacity-90`}
                            onClick={() => setStateTable("noenviados")}>
                            {t("earrings")}
                        </button>
                        <button
                            className={`w-1/2 md:w-[270px] py-1 ${stateTable == "enviados" ? "bg-primary text-white" : "bg-white text-primary"} h-full grid place-items-center font-display font-medium text-sm cursor-pointer hover:opacity-90`}
                            onClick={() => setStateTable("enviados")}>
                            {t("sent")}
                        </button>
                    </div>
                    <div className="w-full overflow-auto">
                        <div className="w-[200%] md:w-full">
                            <GuestTable data={stateTable === "noenviados" ? dataInvitationNotSent : dataInvitationSent} multiSeled={true} reenviar={false} />
                        </div>
                    </div>
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