import { useEffect, useState } from "react"
import { AuthContextProvider } from "../context"
import { motion } from "framer-motion"
import { fetchApiBodas, queries } from "../utils/Fetching"
import { Planes, MetodosDePago, InformacionFacturacion, HistorialFacturacion } from "../components/Facturacion"
import { countries_eur } from "../utils/Currencies"
import VistaSinCookie from "./vista-sin-cookie"

const Facturacion = () => {
    const { forCms, user, config, geoInfo, verificationDone } = AuthContextProvider()
    const [dataFetch, setDataFetch] = useState<any>({})
    const [data, setData] = useState([])
    const [optionSelect, setOptionSelect] = useState(0)
    const [currency, setCurrency] = useState(countries_eur.includes(geoInfo?.ipcountry?.toLowerCase()) ? "eur" : "usd")
    const [stripeCurrency, setStripeCurrency] = useState(null)

    useEffect(() => {
        if (user?.uid && user.displayName !== "guest") {
            fetchApiBodas({
                query: queries.getAllProducts,
                variables: { grupo: "app" },
                development: config.development
            }).then(results => {
                setDataFetch(results)
                setStripeCurrency(results?.currency)
            })
        }
    }, [])

    useEffect(() => {
        const data = dataFetch?.results?.map(elem => {
            const price = elem?.prices?.find(el => data?.currency
                ? el?.currency === data.currency
                : el?.currency === currency)
            return { ...elem, prices: [price] }
        })
        const dataSort = data?.sort((a, b) => {
            if (a.usage !== b.usage) {
                return b.usage - a.usage
            }
        })
        setData(dataSort)
    }, [user, dataFetch, currency])


    const ComponentesArray = [
        {
            title: "Planes",
            componente: <Planes data={data} currency={currency} setCurrency={setCurrency} stripeCurrency={stripeCurrency} />
        },
        {
            title: "Métodos de pago",
            componente: <MetodosDePago setOptionSelect={setOptionSelect} stripeCurrency={stripeCurrency} />
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
    if (verificationDone) {
        if (!user) {
            return (
                <VistaSinCookie />
            )
        }
        return (
            <>
                <section className={forCms ? " w-[calc(100vw-40px)] " : "bg-base w-full"}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="md:max-w-screen-lg mx-auto md:px-3 px-2 flex-col flex mt-3 pb-20">
                        <div className="flex justify-center md:border-b md:space-x-8 px-0.5 overflow-x-auto md:overflow-x-hidden items-center text-center  ">
                            {ComponentesArray.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`${optionSelect === idx ? "text-primary md:border-b  md:border-primary " : ""}  cursor-pointer md:hover:border-b  md:border-primary text-gray-700 text-[10px] md:text-[16px] px-5`}
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
}

export default Facturacion