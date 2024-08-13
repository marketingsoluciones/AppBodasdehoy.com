import ClickAwayListener from "react-click-away-listener"
import { DotsOpcionesIcon } from "../icons"
import { useEffect, useState } from "react";
import { AuthContextProvider } from "../../context";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { PiNewspaperClippingThin } from "react-icons/pi";
import { useRouter } from "next/router";

export const HistorialFacturacion = () => {
    const { config } = AuthContextProvider();
    const [activeSpiner, setActiveSpiner] = useState(false)
    const [show, setShow] = useState({ state: false, idx: null });
    const [dataFactura, setDataFactura] = useState({ results: [], total: 0 })
    const router = useRouter()

    const options: object = {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
    }

    useEffect(() => {
        setActiveSpiner(false)
        setTimeout(() => {
            setActiveSpiner(true)
        }, 1000);
    }, [])

    useEffect(() => {
        fetchApiBodas({
            query: queries.getInvoices,
            variables: {},
            development: config?.name
        }).then(result => {
            setDataFactura(result)
        })
    }, [])

    return (
        <>
            <div className=" w-full pt-6 relative rounded-lg pb-10">
                <div className="grid grid-cols-12 px-5 justify-between border-b py-4 border-gray-100  transition bg-white capitalize rounded-t-lg">
                    <div className="items-center md:col-span-3 flex flex-col ">
                        <p className="font-body text-[15px] font-semibold text-gray-600 hidden md:block">Id. de la Factura</p>
                    </div>
                    <div className="items-center col-span-2 flex flex-col h-full">
                        <p className="font-body text-[15px] font-semibold text-gray-600">Fecha</p>
                    </div>
                    <div className="items-center md:col-span-3 col-span-5 flex flex-col h-full">
                        <p className="font-body text-[15px] font-semibold text-gray-600">Total</p>
                    </div>
                    <div className="items-center col-span-2 flex flex-col h-full">
                        <p className="font-body text-[15px] font-semibold text-gray-600">Estatus</p>
                    </div>
                    <div className="items-center col-span-2 flex flex-col  h-full">
                        <p className="font-body text-[15px] font-semibold text-gray-600"></p>
                    </div>
                </div>
                <div className="bg-white rounded-b-lg max-h-[calc(100vh-320px)] h-[calc(100vh)] overflow-y-auto overflow-x-auto">
                    {activeSpiner
                        ? dataFactura?.total > 0
                            ? dataFactura?.results?.map((item, idx) => {
                                return (
                                    <div key={idx} className={`grid grid-cols-12 md:px-5 justify-between py-4 transition gap-y-4 text-gray-600 ${idx % 2 === 0 ? "bg-gray-50" : ""}`}>
                                        <div className=" items-center md:col-span-3  flex flex-col">
                                            <div className=" hidden md:block">
                                                {item.number.split("-")[1]}
                                            </div>
                                        </div>
                                        <div className=" col-span-2 flex flex-col h-full justify-center items-center">
                                            {`${new Date(item?.created * 1000).toLocaleDateString(undefined, options)}`}
                                        </div>
                                        <div className="md:col-span-3 col-span-5 flex h-full justify-center items-center space-x-1">
                                            <span>
                                                {(item.amount / 100).toFixed(2)}
                                            </span>
                                            <span>
                                                {item.currency}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex h-full justify-center items-center space-x-1">
                                            {item.status === "draft" &&
                                                <div className="flex justify-center items-center space-x-2">
                                                    <div className=" bg-white border border-gray-400 h-3 w-3 rounded-full" />
                                                    <div>
                                                        En proceso
                                                    </div>
                                                </div>
                                            }
                                            {item.status === "open" &&
                                                <div className="flex justify-center items-center space-x-2">
                                                    <div className=" bg-yellow-300 h-3 w-3 rounded-full" />
                                                    <div>
                                                        Pendiente
                                                    </div>
                                                </div>
                                            }
                                            {item.status === "paid" &&
                                                <div className="flex justify-center items-center space-x-2">
                                                    <div className=" bg-green h-3 w-3 rounded-full" />
                                                    <div>
                                                        Pagado
                                                    </div>
                                                </div>
                                            }
                                            {item.status === "void" &&
                                                <div className="flex justify-center items-center space-x-2">
                                                    <div className=" bg-gray-300 h-3 w-3 rounded-full" />
                                                    <div>
                                                        Invalida
                                                    </div>
                                                </div>
                                            }
                                            {item.status === "uncollectible" &&
                                                <div className="flex justify-center items-center space-x-2">
                                                    <div className=" bg-red h-3 w-3 rounded-full" />
                                                    <div>
                                                        Cancelada
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                        <div className="col-span-2 flex flex-col h-full justify-center items-center relative">
                                            <span
                                                onClick={() => setShow({ state: !show.state, idx: idx })}
                                                className={`cursor-pointer relative w-max rounded-lg text-sm text-gray-700`}
                                            >
                                                <DotsOpcionesIcon className="text-gray-500 w-4 h-4" />
                                            </span>
                                            {
                                                show.idx === idx &&
                                                <ClickAwayListener onClickAway={() => show && setShow({ state: false, idx })}>
                                                    <div
                                                        className={`${show.state === true ? "block" : "hidden"} right-16 top-5 absolute w-max border bg-white capitalize rounded-md shadow-lg z-10 translate-x-[-12px] cursor-pointer h-max `}
                                                    >
                                                        <div className="w-full flex flex-col justify-center items-center">
                                                            <a href={`${item.hostedInvoiceUrl}`} target="_blank" rel="noreferrer" className="hover:bg-gray-100 py-3 px-2 text-[14px] w-full">
                                                                Ver Factura
                                                            </a>

                                                            <div onClick={() => router.push(`${item.invoicePdf}`)} className="hover:bg-gray-100 py-3 px-2 text-[14px] w-full">
                                                                Descargar Factura
                                                            </div>
                                                        </div>
                                                    </div>
                                                </ClickAwayListener>
                                            }
                                        </div>
                                    </div>
                                )
                            })
                            : <div className=" flex flex-col  items-center justify-center h-full text-[20px] text-azulCorporativo ">
                                <PiNewspaperClippingThin className="h-20 w-20" />
                                Aun no hay facturas disponibles
                            </div>
                        : <div className="flex  items-center justify-center w-full h-full">
                            < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                        </div>
                    }
                </div>
            </div >
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