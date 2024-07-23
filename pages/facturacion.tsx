import { useEffect, useState } from "react"
import { AuthContextProvider } from "../context"
import { motion } from "framer-motion"
import { fetchApiBodas, queries } from "../utils/Fetching"
import { Productos } from "../components/Facturacion/Productos"
import { EncabezadoFacturacion } from "../components/Facturacion/EncabezadoFacturacion"


const Facturacion = () => {
    const { forCms, config } = AuthContextProvider()
    const [data, setData] = useState({ data: [] })
    const datafilter = data?.data?.filter(element => (element.metadata.grupo === "App"))
    const [products, setProducts] = useState([])

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

    return (
        <>
            <section className={forCms ? " w-[calc(100vw-40px)] " : "bg-base w-full"}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="md:max-w-screen-lg mx-auto inset-x-0 flex-col flex  pb-20"
                >
                    {
                        datafilter.length <= 0 ?
                            <div className="flex  items-center justify-center w-full h-[calc(100vh-240px)]">
                                < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                            </div> :
                            <div className="space-y-4">
                                <EncabezadoFacturacion ProductsAddList={products} />
                                <Productos DataProductos={datafilter} products={products} setProducts={setProducts} />
                            </div>
                    }

                </motion.div>
            </section>
            <style jsx>
                {`
                .loader {
                    border-top-color:  ${config?.theme?.primaryColor};
                    -webkit-animation: spinner 1.5s linear infinite;
                    animation: spinner 1.5s linear infinite;
                }

                @-webkit-keyframes spinner {
                    0% {
                    -webkit-transform: rotate(0deg);
                    }
                    100% {
                    -webkit-transform: rotate(360deg);
                    }
                }

                @keyframes spinner {
                    0% {
                    transform: rotate(0deg);
                    }
                    100% {
                    transform: rotate(360deg);
                    }
                }
                `}
            </style>
        </>
    )
}

export default Facturacion