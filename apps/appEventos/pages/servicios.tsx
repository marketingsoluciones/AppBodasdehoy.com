import { FC, useEffect, useState } from "react"
import { BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, } from "../context"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import GuestUpsellPage from "../components/Utils/GuestUpsellPage"
import { SkeletonTimeline } from "../components/Utils/SkeletonPage"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { useMounted } from "../hooks/useMounted"


const Itinerario: FC<any> = (props) => {
    const { eventsGroup, copilotFilter, clearCopilotFilter } = EventsGroupContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { user, setUser, verificationDone, forCms } = AuthContextProvider()
    const router = useRouter()
    const searchParams = useSearchParams()
    useMounted()

    // Query params usando useSearchParams (Next.js 15)
    const queryEvent = searchParams.get("event")

    useEffect(() => {
        if (queryEvent && queryEvent !== event?._id) {
            const eventFound = eventsGroup.find(elem => elem._id === queryEvent)
            if (eventFound) {
                setEvent({ ...eventFound })
                user.eventSelected = queryEvent
                setUser({ ...user })
            }
        }
    }, [queryEvent, eventsGroup])

    if (verificationDone) {
        if (user?.displayName === "guest") {
            return (
                <GuestUpsellPage
                    section="Servicios y proveedores"
                    icon="🤝"
                    description="Gestiona todos los proveedores de tu boda en un solo lugar: catering, flores, fotografía, música y más."
                    benefits={[
                        'Lista centralizada de todos tus proveedores',
                        'Control de pagos y contratos',
                        'Tareas y seguimiento por proveedor',
                        'El copilot IA te ayuda a encontrar opciones',
                    ]}
                />
            )
        }
        if (!user) {
            return <VistaSinCookie />
        }
        if (!event) return <SkeletonTimeline groups={2} tasksPerGroup={3} />
        return (
            event &&
            <section className={`${forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base  w-full pt-2 md:py-0"} flex`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-4 gap-4 relative">
                    <BlockTitle title={"Tasks"} />
                    {copilotFilter?.entity === 'services' && (copilotFilter.ids?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-lg text-xs text-pink-700">
                            <span>🤖</span>
                            <span className="flex-1 truncate">
                                {copilotFilter.query
                                    ? `Copilot filtró: "${copilotFilter.query}" · ${copilotFilter.ids?.length ?? 0} servicio(s)`
                                    : `Copilot filtró · ${copilotFilter.ids?.length ?? 0} servicio(s)`}
                            </span>
                            <button onClick={clearCopilotFilter} className="ml-1 text-pink-400 hover:text-pink-600 font-bold leading-none" aria-label="Limpiar filtro">✕</button>
                        </div>
                    )}
                    <BoddyIter />
                </motion.div>
            </section>
        )
    }
}

export default Itinerario
