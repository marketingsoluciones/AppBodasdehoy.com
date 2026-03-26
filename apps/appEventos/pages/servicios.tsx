import { FC, useEffect, useState } from "react"
import { BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, } from "../context"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import GuestDemoWrapper from "../components/Utils/GuestDemoWrapper"
import { SkeletonTimeline } from "../components/Utils/SkeletonPage"
import EventLoadingOrError from "../components/Utils/EventLoadingOrError"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { useMounted } from "../hooks/useMounted"
import CopilotFilterBar from "../components/Utils/CopilotFilterBar"


const Itinerario: FC<any> = (props) => {
    const { eventsGroup } = EventsGroupContextProvider()
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
                <GuestDemoWrapper
                    section="Servicios y proveedores"
                    icon="🤝"
                    description="Gestiona todos los proveedores de tu boda: catering, flores, fotografía, música y más."
                >
                    <BoddyIter />
                </GuestDemoWrapper>
            )
        }
        if (!user) {
            return <VistaSinCookie />
        }
        if (!event) return <EventLoadingOrError skeleton={<SkeletonTimeline groups={2} tasksPerGroup={3} />} />
        return (
            event &&
            <section className={`${forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base  w-full pt-2 md:py-0"} flex`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-4 gap-4 relative">
                    <BlockTitle title={"Tasks"} />
                    <CopilotFilterBar entity="services" />
                    <BoddyIter />
                </motion.div>
            </section>
        )
    }
}

export default Itinerario
