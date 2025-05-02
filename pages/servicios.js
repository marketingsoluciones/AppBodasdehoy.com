import { useEffect, useState } from "react"
import { BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, } from "../context"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import { motion } from "framer-motion"
import { useRouter } from "next/router"
import { useMounted } from "../hooks/useMounted"


const Itinerario = () => {
    const [createPdf, setCreatePdf] = useState(false)
    const { eventsGroup } = EventsGroupContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { user, setUser, verificationDone, forCms } = AuthContextProvider()
    const router = useRouter()
    useMounted()

    useEffect(() => {
        if (router.query?.event && router.query?.event !== event?._id) {
            const event = eventsGroup.find(elem => elem._id === router.query?.event)
            if (event) {
                setEvent({ ...event })
                user.eventSelected = router.query?.event
                setUser({ ...user })
            }
        }
    }, [router])


    if (verificationDone) {
        if (!user) {
            return (
                <VistaSinCookie />
            )
        }
        if (!event) return <></>
        return (
            event &&
            <section className={`${forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base  w-full pt-2 md:py-0"} flex`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mx-auto w-full pl-2 px-[1px] md:px20 gap-4 relative">
                    <BlockTitle title={"Tasks"} />{/*task planning o task management*/} {/* Flujo de tareas */}
                    <BoddyIter />

                    {/* {createPdf
                        ? <Modal openIcon={createPdf} setOpenIcon={setCreatePdf} classe={"h-[50%] w-[85%]"} >
                            <MyDocument IterArryst={IterArryst} />
                        </Modal>
                        : null
                    } */}
                </motion.div>
            </section>
        )
    }
}

export default Itinerario