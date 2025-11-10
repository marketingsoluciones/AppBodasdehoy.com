import { AuthContextProvider } from "../../context/AuthContext"
import { useState } from "react"
import { useTranslation } from 'react-i18next';
import { DataTableGroupContextProvider } from "../../context/DataTableGroupContext";
import { GuestTableAll } from "./GuestTableAll";

export const EnviadosComponent = ({ dataInvitationSent, dataInvitationNotSent, optionSelect }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const [stateTable, setStateTable] = useState("noenviados")
    const { dispatch, dataTableGroup: { arrIDs } } = DataTableGroupContextProvider();

    return (
        <>
            <div className="bg-white flex flex-col w-full h-full rounded-xl shadow-md relative">
                <span className="text-primary flex items-center text-[20px] first-letter:capitalize px-3">
                    {t("Lista de invitados")}
                </span>
                {/* <div className="w-[calc(100%-80px)] md:w-96 mx-auto inset-x-0 flex my-2 mt-4 rounded-2xl overflow-hidden border">
                        <button
                            className={`w-1/2 md:w-[270px] py-1 ${stateTable == "noenviados" ? "bg-primary text-white" : "bg-white text-primary"} h-full grid place-items-center font-display font-medium text-sm cursor-pointer hover:opacity-90`}
                            onClick={() => {
                                dispatch({ type: "RESET_STATE" });
                                setStateTable("noenviados")
                            }}>
                            {t("earrings")}
                        </button>
                        <button
                            className={`w-1/2 md:w-[270px] py-1 ${stateTable == "enviados" ? "bg-primary text-white" : "bg-white text-primary"} h-full grid place-items-center font-display font-medium text-sm cursor-pointer hover:opacity-90`}
                            onClick={() => {
                                dispatch({ type: "RESET_STATE" });
                                setStateTable("enviados")
                            }}>
                            {t("sent")}
                        </button>
                    </div> */}
                <div className="flex w-full flex-1">
                    <GuestTableAll multiSeled={true} />
                    {/* <GuestTable data={stateTable === "noenviados" ? dataInvitationNotSent : dataInvitationSent} multiSeled={true} optionSelect={optionSelect} /> */}
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