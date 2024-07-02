import { useEffect, useState } from "react"
import { FormConfirmarAsistencia } from "../Forms/FormConfirmarAsistencia"
import { ConfirmacionIcon } from "../icons"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { useRouter } from "next/router"

export const FormComponent = () => {
    const [visible, setVisible] = useState(false)
    const router = useRouter()
    const [guestData, setGuestData] = useState<any>([])
    const GuestFather = guestData.find(e => e.father === null)
    useEffect(() => {
        try {
            fetchApiEventos({
                query: queries.getPGuestEvent,
                variables: {
                    p: router?.query?.pGuestEvent
                },
            }).then(result => {
                setGuestData(result)
            })
        } catch (error) {
            console.log(error)
        }
    }, [router?.query?.pGuestEvent])

    console.log(GuestFather)
    return (
        <>
            <div className="bg-white rounded-lg shadow flex flex-col items-center py-7 space-y-5">
                {(() => {
                    if (visible == false) {
                        return (
                            <>
                                <div className="space-y-4">
                                    <p className=" text-3xl text-primary text-center ">! Hola ¡</p>
                                    <p className=" text-5xl text-gray-500 text-center "> {GuestFather?.nombre} </p>
                                </div>
                                <div className=" w-full font-semibold font-body text-3xl text-primary px-5" >
                                    Tus datos
                                </div>
                                {
                                    GuestFather != undefined ?
                                    <FormConfirmarAsistencia visible={visible} setVisible={setVisible} guestData={guestData} />:
                                    null
                                }
                            </>
                        )
                    }

                    if (visible == true) {
                        return (
                            <div className="flex flex-col justify-center items-center text-primary space-y-3 py-28">
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
                        )
                    }
                })()}
            </div>

        </>
    )
}