import { useState } from "react"
import { EncabezadoFacturacion, Productos } from "./index"
import { AuthContextProvider } from "../../context"

export const Planes = ({ data, currency, setCurrency, stripeCurrency }) => {
    console.log(data)
    const { config } = AuthContextProvider()
    const [products, setProducts] = useState([])
    return (
        <>
            <div className="space-y-4 mb-5 w-full">
                <EncabezadoFacturacion products={products} currency={currency} setCurrency={setCurrency} stripeCurrency={stripeCurrency} />
                {data?.length > 0 ?
                    <Productos data={data} products={products} setProducts={setProducts} /> :
                    <div className="flex  items-center justify-center h-[300px] ">
                        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                    </div>
                }
            </div>
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