import { useEffect } from "react"
import { BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../context"
import CopilotFilterBar from "../components/Utils/CopilotFilterBar"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import GuestUpsellPage from "../components/Utils/GuestUpsellPage"
import { SkeletonTimeline } from "../components/Utils/SkeletonPage"
import EventLoadingOrError from "../components/Utils/EventLoadingOrError"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { useMounted } from "../hooks/useMounted"

const Itinerario = () => {
    const { eventsGroup } = EventsGroupContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { user, setUser, verificationDone, forCms } = AuthContextProvider()
    const searchParams = useSearchParams()

    useMounted()

    const queryEvent = searchParams.get("event")

    useEffect(() => {
        if (!queryEvent || queryEvent === event?._id || !eventsGroup?.length) return
        const eventFound = eventsGroup.find((elem) => elem._id === queryEvent)
        if (eventFound) {
            setEvent({ ...eventFound })
            user.eventSelected = queryEvent
            setUser({ ...user })
        }
    }, [queryEvent, eventsGroup, event?._id])

    if (!verificationDone) {
        return null
    }
    if (user?.displayName === 'guest') {
        return (
            <GuestUpsellPage
                section="Itinerario del día"
                icon="📋"
                description="Regístrate para construir el itinerario real de tu evento y compartirlo con equipo y proveedores."
                benefits={[
                    "Línea de tiempo por bloques y responsables",
                    "Recordatorios y enlaces al portal del evento",
                    "Coordinación con invitados y mesas",
                ]}
            />
        );
    }
    if (!user) {
        return <VistaSinCookie />
    }
    if (!event) {
        return (
            <EventLoadingOrError
                skeleton={<SkeletonTimeline groups={3} tasksPerGroup={3} />}
            />
        )
    }
    return (
        <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base w-full pt-2 md:py-0"}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-screen-lg mx-auto inset-x-0 w-full px-4 pt-3 gap-4 relative ">
                {/* Header unificado: BlockTitle pinta la cabecera (tarjeta en escritorio, barra
                    limpia full-width en móvil, idéntica al resto de módulos). El filtro copilot
                    queda solo en escritorio. */}
                <BlockTitle title={"Itinerario"} />
                <div className="hidden md:block"><CopilotFilterBar entity="moments" /></div>
                <BoddyIter />
            </motion.div>
        </section>
    )
}

export default Itinerario
