import {  useState } from "react"
import { FormConfirmarAsistencia } from "../Forms/FormConfirmarAsistencia"
import { ConfirmacionIcon } from "../icons"
import { useRouter } from "next/router"

export const FormComponent = ({ guestData, guestFather, menus_array }) => {
    const router = useRouter()
    const [visible, setVisible] = useState<boolean>(false)

    return (
        <>
            <div className="bg-white rounded-lg shadow flex flex-col items-center py-7 space-y-5">
                {!visible
                    ? <>
                        <div className="space-y-4">
                            <p className=" text-3xl text-primary text-center ">! Hola ¡</p>
                            <p className=" text-5xl text-gray-500 text-center "> {guestFather?.nombre} </p>
                        </div>
                        <div className=" w-full font-semibold font-body text-lg text-primary px-5" >
                            Por favor confirma tus datos y los de tus acompañantes
                        </div>
                        {
                            guestFather && <FormConfirmarAsistencia visible={visible} setVisible={setVisible} guestData={guestData} guestFather={guestFather} menus_array={menus_array} />
                        }
                    </>
                    : <div className="flex flex-col justify-center items-center text-primary space-y-3 py-28">
                        <ConfirmacionIcon />
                        <div className="flex flex-col justify-center items-center">
                            <p className="font-body text-xl ">
                                {/*  {pases.length > 0 ? "Asistencias confirmadas" : "Asistencia confirmada"} */}
                            </p>
                            <p className="font-body text-gray-500 font-semibold text-3xl">
                                con exito
                            </p>
                        </div>
                    </div>
                }
            </div>

        </>
    )
}