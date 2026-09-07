import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import ConfirmarAsistenciaStudio from "../components/ConfirmarAsistencia/ConfirmarAsistenciaStudio"
import { guests, menu } from "../utils/Interfaces"

/**
 * Portal público de confirmación de asistencia (RSVP del invitado).
 * Carga los datos del invitado desde el enlace (?pGuestEvent=…) vía la API pública
 * y renderiza el rediseño studio (ConfirmarAsistenciaStudio), fiel al HTML. Sin nav
 * de la app: la ruta está en isPublicPortal (_app.tsx).
 */
const ConfirmaAsistencia = () => {
    const router = useRouter()
    const [guestData, setGuestData] = useState<guests[]>()
    const [guestFather, setGuestFather] = useState<guests>()
    const [menus_array, setMenus_array] = useState<menu[]>()
    const [eventId, setEventId] = useState<string | undefined>()

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
        <ConfirmarAsistenciaStudio
            guestData={guestData}
            guestFather={guestFather}
            menus_array={menus_array}
            eventId={eventId}
            pGuestToken={pGuestEvent}
        />
    )
}

export default ConfirmaAsistencia
