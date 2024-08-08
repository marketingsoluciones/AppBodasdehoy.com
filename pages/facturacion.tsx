import { useEffect, useState } from "react"
import { AuthContextProvider } from "../context"
import { motion } from "framer-motion"
import { fetchApiBodas, queries } from "../utils/Fetching"
import { Planes, MetodosDePago, InformacionFacturacion, HistorialFacturacion } from "../components/Facturacion"

const Facturacion = () => {
    const { forCms, user, config } = AuthContextProvider()
    const [dataFetch, setDataFetch] = useState([])
    const [data, setData] = useState([])
    const [optionSelect, setOptionSelect] = useState(0)

    useEffect(() => {
        fetchApiBodas({
            query: queries.getAllProducts,
            variables: { grupo: "app" },
            development: config.development
        }).then(results => {
            const data = JSON.parse(results)
            console.log(data)
            setDataFetch(data)
        })
    }, [])

    useEffect(() => {
        const data = dataFetch.map(elem => {
            const price = elem?.prices?.find(el => el?.currency === user.currency)
            return { ...elem, prices: [price] }
        })
        console.log(99999, data)
        setData(data)
    }, [user, dataFetch])


    const ComponentesArray = [
        {
            title: "Planes",
            componente: <Planes data={data} />
        },
        {
            title: "Métodos de pago",
            componente: <MetodosDePago setOptionSelect={setOptionSelect} />
        },
        {
            title: "Información de Facturación",
            componente: <InformacionFacturacion />
        },
        {
            title: "Historial de facturación",
            componente: <HistorialFacturacion />
        },
    ]

    return (
        <>
            <section className={forCms ? " w-[calc(100vw-40px)] " : "bg-base w-full"}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="md:max-w-screen-lg mx-auto inset-x-0 flex-col flex mt-3 pb-20">
                    <div className="flex justify-center border-b space-x-8 ">
                        {ComponentesArray.map((item, idx) => (
                            <div
                                key={idx}
                                className={`${optionSelect === idx ? "text-primary border-b  border-primary " : ""}  cursor-pointer hover:border-b  border-primary text-gray-700 `}
                                onClick={() => setOptionSelect(idx)}
                            >
                                {item.title}
                            </div>
                        ))}
                    </div>
                    <div className="h-[calc(100vh-270px)] w-full flex items-start justify-center">
                        {ComponentesArray[optionSelect].componente}
                    </div>
                </motion.div>
            </section>
        </>
    )
}

export default Facturacion