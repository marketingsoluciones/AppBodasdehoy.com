import { useEffect, useState } from "react"
import { AuthContextProvider } from "../context"
import { motion } from "framer-motion"
import { fetchApiBodas, queries } from "../utils/Fetching"
import { Productos } from "../components/Facturacion/Productos"
import { EncabezadoFacturacion } from "../components/Facturacion/EncabezadoFacturacion"
import { Planes, MetodosDePago,InformacionFacturacion } from "../components/Facturacion"



const Facturacion = () => {
    const { forCms, config } = AuthContextProvider()
    const [data, setData] = useState({ data: [] })
    const datafilter = data?.data?.filter(element => (element.metadata.grupo === "App"))
    const [optionSelect, setOptionSelect] = useState(0)

    useEffect(() => {
        const fetchData = async () => {
            const data = JSON.parse(await fetchApiBodas({
                query: queries.getAllProducts,
                variables: {},
                development: "bodasdehoy"
            }));
            const asd = data.reduce((acc: any, item: any) => {
                if (!acc.modulos.includes(item.metadata.grupo)) {
                    acc.modulos.push(item.metadata.grupo)
                }
                return acc
            }, { modulos: [] })
            setData({ data, ...asd })
        }
        fetchData()
    }, [])

    const ComponentesArray = [
        {
            title: "Planes",
            componente: <Planes datafilter={datafilter}/>
        },
        {
            title: "Métodos de pago",
            componente: <MetodosDePago setOptionSelect={setOptionSelect}/>
        },
        {
            title: "Información de Facturación",
            componente: <InformacionFacturacion/>
        },
        /* {
            title: "Historial de facturación",
            componente: "a"
        }, */
    ]

    return (
        <>
            <section className={forCms ? " w-[calc(100vw-40px)] " : "bg-base w-full"}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="md:max-w-screen-lg mx-auto inset-x-0 flex-col flex mt-3 pb-20"
                >
                    <div className="flex justify-center border-b space-x-8 ">
                        {
                            ComponentesArray.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`${optionSelect === idx ? "text-primary border-b  border-primary " : ""}  cursor-pointer hover:border-b  border-primary `}
                                    onClick={() => setOptionSelect(idx)}
                                >
                                    {item.title}
                                </div>
                            ))
                        }
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