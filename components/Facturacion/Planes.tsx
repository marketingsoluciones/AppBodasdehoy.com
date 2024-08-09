import { useState } from "react"
import { EncabezadoFacturacion, Productos } from "./index"
import { AuthContextProvider } from "../../context"


export const Planes = ({ data }) => {
    const { forCms, config } = AuthContextProvider()
    const [products, setProducts] = useState([])

    return (
        <>
                <div className="space-y-4 mb-5">
                    <EncabezadoFacturacion products={products} />
                    <Productos data={data} products={products} setProducts={setProducts} />
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