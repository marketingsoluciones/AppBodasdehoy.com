import {  useState } from "react"
import { FormConfirmarAsistencia } from "../Forms/FormConfirmarAsistencia"
import { ConfirmacionIcon } from "../icons"
import { useRouter } from "next/navigation"
import { useTranslation } from 'react-i18next';

export const FormComponent = ({ guestData, guestFather, menus_array, eventId = undefined as string | undefined, pGuestToken = undefined as string | undefined }) => {
    const { t } = useTranslation();
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
                            {t("confirmyourdetails")}
                        </div>
                        {
                            guestFather && <FormConfirmarAsistencia visible={visible} setVisible={setVisible} guestData={guestData} guestFather={guestFather} menus_array={menus_array} />
                        }
                    </>
                    : <div className="flex flex-col justify-center items-center text-primary space-y-3 py-16">
                        <ConfirmacionIcon />
                        <div className="flex flex-col justify-center items-center">
                            <p className="font-body text-xl ">
                                {/*  {pases.length > 0 ? "Asistencias confirmadas" : "Asistencia confirmada"} */}
                            </p>
                            <p className="font-body text-gray-500 font-semibold text-3xl">
                                {t("successfullys")}
                            </p>
                        </div>
                        {eventId && (
                            <a
                                href={`/e/${eventId}${pGuestToken ? `?g=${pGuestToken}` : ''}`}
                                className="mt-4 inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-3 rounded-xl shadow hover:opacity-90 transition"
                            >
                                Ver el programa del evento →
                            </a>
                        )}
                    </div>
                }
            </div>

        </>
    )
}