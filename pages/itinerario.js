import { useState } from "react"
import { BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider, } from "../context"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import { motion } from "framer-motion"

const Itinerario = () => {
    const { event } = EventContextProvider()
    const { user, verificationDone, forCms } = AuthContextProvider()

    if (verificationDone) {
        if (!user) {
            return (
                <VistaSinCookie />
            )
        }
        if (!event) return <></>
        return (
            event &&
            <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base w-full pt-2 md:py-0"}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-0 gap-4 relative ">
                    <BlockTitle title={"Itinerario"} />
                    <BoddyIter />
                </motion.div>
            </section>
        )
    }
}

export default Itinerario