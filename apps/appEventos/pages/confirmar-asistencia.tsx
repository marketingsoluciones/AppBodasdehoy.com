import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { DescripcionComponente } from "../components/ConfirmarAsistencia/Descripcion"
import { FormComponent } from "../components/Forms/FormAcompañantes"
import { guests, menu } from "../utils/Interfaces"
import { useTranslation } from 'react-i18next';

/* import {  LogoOrganizador } from "../components/icons" */


const ConfirmaAsistencia = () => {
    const { t } = useTranslation();
    const router = useRouter()
    const [guestData, setGuestData] = useState<guests[]>()
    const [guestFather, setGuestFather] = useState<guests>()
    const [menus_array, setMenus_array] = useState<menu[]>()
    const [eventId, setEventId] = useState<string | undefined>()

    // Pages Router: leer query param directamente de router.query
    const pGuestEvent = router.isReady ? (router.query.pGuestEvent as string | undefined) : undefined

    useEffect(() => {
        if (!pGuestEvent) return
        fetch(`/api/public/rsvp-guest?p=${encodeURIComponent(pGuestEvent)}`)
            .then((r) => r.json())
            .then((result) => {
                if (result?.error) return
                setGuestData(result?.invitados)
                setGuestFather(result?.invitados?.[0])
                setMenus_array(result?.menus)
                if (result?._id) setEventId(result._id)
            })
            .catch(() => {
                // Fallo silencioso — el formulario queda vacío
            })
    }, [pGuestEvent])
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
                        eventId={eventId}
                        pGuestToken={pGuestEvent}
                    />
                </div>
            </div>
        </>
    )
}

export default ConfirmaAsistencia