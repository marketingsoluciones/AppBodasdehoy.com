import { useState } from "react"
import { HeaderIter, BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../context"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import { motion } from "framer-motion"
import { useRouter } from "next/router"

/* import { Modal } from "../modals/Modal" */
/* import { MyDocument } from "../CreatePDF" */

const Itinerario = () => {
    const [IterArryst, setIterArryst] = useState([])
    const [createPdf, setCreatePdf] = useState(false)
    const { event } = EventContextProvider()
    const { user, verificationDone, forCms } = AuthContextProvider()
    const [option, setOption] = useState("el gran día")
    const f1 = event?.itinerarios_array?.find(itinerario => itinerario.title === option)
    const router = useRouter()
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
                    className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-0 gap-4 relative">
                    <BlockTitle title={"Itinerario"} />
                    <BoddyIter IterArryst={IterArryst} setIterArryst={setIterArryst} createPdf={createPdf} setOption={setOption} />

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