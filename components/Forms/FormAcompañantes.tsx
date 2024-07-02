import { useEffect, useState } from "react"
import { FormConfirmarAsistencia } from "../Forms/FormConfirmarAsistencia"
import { ConfirmacionIcon } from "../icons"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { useRouter } from "next/router"
import { Event, guests, menu } from "../../utils/Interfaces"

export const FormComponent = () => {
    const router = useRouter()
    const [visible, setVisible] = useState<boolean>(false)
    const [guestData, setGuestData] = useState<guests[]>()
    const [guestFather, setGuestFather] = useState<guests>()
    const [menus_array, setMenus_array] = useState<menu[]>()

    useEffect(() => {
        try {
            fetchApiEventos({
                query: queries.getPGuestEvent,
                variables: {
                    p: router?.query?.pGuestEvent
                },
            }).then((result: Event) => {
                setGuestData(result?.invitados_array)
                setGuestFather(result?.invitados_array?.find(e => e.father === null))
                setMenus_array(result?.menus_array)
            })
        } catch (error) {
            console.log(error)
        }
    }, [router?.query?.pGuestEvent])

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