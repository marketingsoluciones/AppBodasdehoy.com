import { useEffect, useState } from "react"
import { DescripcionComponente } from "../components/ConfirmarAsistencia/Descripcion"
import { FormComponent } from "../components/Forms/FormAcompañantes"
import { Event, guests, menu } from "../utils/Interfaces"
import { fetchApiEventos, queries } from "../utils/Fetching"
import { useRouter } from "next/router"
import { useTranslation } from 'react-i18next';

/* import {  LogoOrganizador } from "../components/icons" */


const ConfirmaAsistencia = () => {
    const { t } = useTranslation();
    const router = useRouter()
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
            <div className="grid md:grid-cols-2 md:px-10 px-5 py-10 bg-base h-[calc(100vh-64px)]">
                <div className="flex flex-col mb-7 md:mb-0   ">
                    <DescripcionComponente />
                </div>
                <div className="">
                    <FormComponent
                        guestData={guestData}
                        guestFather={guestFather}
                        menus_array={menus_array}
                    />
                </div>
            </div>
        </>
    )
}

export default ConfirmaAsistencia