import { useEffect, useState } from "react"
import { Separator } from "../Separator"
import { GuestTable } from "./GuestTable"
import { AuthContextProvider } from "../../context"

export const EnviadosComponent = ({ dataInvitationSent, dataInvitationNotSent, event }) => {
    const { config } = AuthContextProvider()
    const [stateTablet, setStateTablet] = useState(false)
    const [stateSpinner, setStateSpinner] = useState(false)

    console.log(dataInvitationNotSent)
    const activeFunction = () => {
        setStateSpinner(true)
        setTimeout(() => {
            console.log("entro")
            setStateSpinner(false)
            setStateTablet(!stateTablet)
        }, 1000);
    }



    return (
        <>
            <div className="my-4">
                {!stateSpinner
                    ? !stateTablet
                        ? <div>
                            <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                                <Separator title="  Invitaciones pendientes" />
                                <div className="w-full overflow-auto">
                                    <div className="w-[200%] md:w-full">
                                        <GuestTable data={dataInvitationNotSent} multiSeled={true} reenviar={false} activeFunction={activeFunction} />
                                    </div>
                                </div>
                            </div>
                            {
                                dataInvitationSent?.length > 0
                                    ? (<div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                                        <Separator title="Invitaciones enviadas" />
                                        <div className="w-full overflow-auto">
                                            <div className="w-[200%] md:w-full">
                                                <GuestTable data={dataInvitationSent} multiSeled={true} reenviar={true}
                                                    activeFunction={activeFunction}
                                                />
                                            </div>
                                        </div>
                                    </div>)
                                    : null
                            }
                        </div>
                        : <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                            <Separator title="  Detalles de tus invitaciones" />
                            <div className="w-full overflow-auto">
                                <div className="w-[200%] md:w-full">
                                    <GuestTable data={dataInvitationNotSent} multiSeled={true} reenviar={false} activeFunction={activeFunction} />
                                </div>
                            </div>
                        </div>
                    : <div className="flex  items-center justify-center w-full h-[550px]">
                        < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                    </div>
                }

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