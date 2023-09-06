import { useEffect, useState } from "react"
import { FormConfirmarAsistencia } from "../Forms/FormConfirmarAsistencia"
import { ConfirmacionIcon } from "../icons"

export const FormComponent = () => {
    const [visible, setVisible] = useState(false)
    const pases = [
        {
            invitado: 1
        },
        {
            invitado: 2
        },
        {
            invitado: 3
        },
        {
            invitado: 4
        },
    ]

  


    return (
        <>
            <div className="bg-white rounded-lg shadow flex flex-col items-center py-7 space-y-5">
                {(() => {
                    if (visible != true) {
                        return (
                            <>
                                <div className="space-y-4">
                                    <p className="font-title text-3xl text-primary text-center ">! Hola ¡</p>
                                    <p className="font-title text-5xl text-gray-500 text-center "> Julio Lopez </p>
                                </div>
                                <div className=" w-full font-semibold font-body text-3xl text-primary px-5" >
                                    Tus datos
                                </div>
                                <FormConfirmarAsistencia visible={visible} setVisible={setVisible} pases={pases} />
                            </>
                        )
                    } else {
                        return (
                            <>
                                <div className="flex flex-col justify-center items-center text-primary space-y-3 py-28">
                                    <ConfirmacionIcon />
                                    <div className="flex flex-col justify-center items-center">
                                        <p className="font-body text-xl ">
                                            {pases.length > 0 ? "Asistencias confirmadas" : "Asistencia confirmada"}
                                        </p>
                                        <p className="font-body text-gray-500 font-semibold text-3xl">
                                            con exito
                                        </p>
                                    </div>
                                </div>
                            </>
                        )
                    }
                })()}
            </div>
               
        </>
    )
}