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
        if (!event) { router.push("/") }
        return (
            <>
                <section className={` flex flex-col items-center bg-base h-[calc(100vh-145px)] `}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0   ">
                        <BlockTitle title={"Itinerario"} />
                    </motion.div>

                    <div className="space-y-4 my-5 w-[80%] rounded-xl">
                        <BoddyIter IterArryst={IterArryst} setIterArryst={setIterArryst} createPdf={createPdf} setOption={setOption} />
                    </div>

                    {/*      
                        {
                            createPdf ? (
                                <Modal openIcon={createPdf} setOpenIcon={setCreatePdf} classe={"h-[50%] w-[85%]"} >
                                <MyDocument IterArryst={IterArryst} />
                                </Modal>
                            ) : null
                        } 
                    */}
                </section>
            </>
        )
    }
}

export default Itinerario