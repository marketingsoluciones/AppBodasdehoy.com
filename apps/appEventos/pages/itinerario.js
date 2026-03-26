import { BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider } from "../context"
import CopilotFilterBar from "../components/Utils/CopilotFilterBar"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import GuestDemoWrapper from "../components/Utils/GuestDemoWrapper"
import { SkeletonTimeline } from "../components/Utils/SkeletonPage"
import { motion } from "framer-motion"

const Itinerario = () => {
    const { event } = EventContextProvider()
    const { user, verificationDone, forCms } = AuthContextProvider()

    if (!verificationDone) {
        return null
    }
    if (user?.displayName === 'guest') {
        return (
            <GuestDemoWrapper
                section="Itinerario del día"
                icon="📋"
                description="Planifica cada momento de tu boda al minuto y compártelo con tu equipo."
            >
                <BoddyIter />
            </GuestDemoWrapper>
        )
    }
    if (!user) {
        return <VistaSinCookie />
    }
    if (!event) {
        return <SkeletonTimeline groups={3} tasksPerGroup={3} />
    }
    return (
        <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base w-full pt-2 md:py-0"}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-0 gap-4 relative ">
                <BlockTitle title={"Itinerario"} />
                <CopilotFilterBar entity="moments" />
                <BoddyIter />
            </motion.div>
        </section>
    )
}

export default Itinerario