import { BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../context"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import { motion } from "framer-motion"

const Itinerario = () => {
    const { event } = EventContextProvider()
    const { user, verificationDone, forCms } = AuthContextProvider()
    const { copilotFilter, clearCopilotFilter } = EventsGroupContextProvider()

    if (!verificationDone) {
        return null
    }
    if (!user) {
        return <VistaSinCookie />
    }
    if (!event) {
        return null
    }
    return (
        <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base w-full pt-2 md:py-0"}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-0 gap-4 relative ">
                <BlockTitle title={"Itinerario"} />
                {copilotFilter?.entity === 'moments' && (copilotFilter.ids?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-lg text-xs text-pink-700">
                        <span>🤖</span>
                        <span className="flex-1 truncate">
                            {copilotFilter.query
                                ? `Copilot filtró: "${copilotFilter.query}" · ${copilotFilter.ids?.length ?? 0} momento(s)`
                                : `Copilot filtró · ${copilotFilter.ids?.length ?? 0} momento(s)`}
                        </span>
                        <button onClick={clearCopilotFilter} className="ml-1 text-pink-400 hover:text-pink-600 font-bold leading-none" aria-label="Limpiar filtro">✕</button>
                    </div>
                )}
                <BoddyIter />
            </motion.div>
        </section>
    )
}

export default Itinerario