import { useEffect, useState } from "react"
import { BoddyIter } from "../components/Itinerario"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, } from "../context"
import { BlockTitle } from "../components/Utils/BlockTitle"
import VistaSinCookie from "./vista-sin-cookie"
import { motion } from "framer-motion"
import { useRouter } from "next/router"
import { useMounted } from "../hooks/useMounted"
import { fetchApiEventos, queries } from "../utils/Fetching"
import { openGraphData } from "./_app"


const Itinerario = (props) => {
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
                    className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-0 gap-4 relative">
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

export async function getServerSideProps({ params, query }) {
    try {
        const p = params?.slug[0]?.split("-")
        const evento_id = p?.[1] || query?.event;
        const itinerario_id = p?.[2] || query?.itinerary;

        const evento = await fetchApiEventos({
            query: queries.getItinerario,
            variables: {
                evento_id,
                itinerario_id
            }
        }) as any
        if (evento) {
            openGraphData.openGraph.title = `${evento.itinerarios_array[0].tasks[0].descripcion}`
            openGraphData.openGraph.description = ` El Evento ${evento.tipo}, de ${evento.nombre}, ${new Date(parseInt(evento?.itinerarios_array[0].fecha_creacion)).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
${evento.itinerarios_array[0].tasks[0].tips.replace(/<[^>]*>/g, "").replace(".", ". ")}`
        }
        return {
            props: { ...params, query, evento },
        };
    } catch (error) {
        return {
            props: params,
        };

    }
}