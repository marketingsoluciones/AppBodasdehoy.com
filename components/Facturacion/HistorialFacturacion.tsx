import ClickAwayListener from "react-click-away-listener"
import { DotsOpcionesIcon } from "../icons"
import { useState } from "react";

export const HistorialFacturacion = () => {
    const [show, setShow] = useState(false);

    return (
        <div className=" w-full pt-6 relative rounded-lg pb-10">
            <div className="grid grid-cols-12 px-5 justify-between border-b py-4 border-gray-100  transition bg-white capitalize rounded-t-lg">
                <div className="items-center col-span-3 flex flex-col ">
                    <p className="font-body text-[15px] font-semibold text-gray-600">Id. de la Factura</p>
                </div>
                <div className="items-center col-span-2 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold text-gray-600">Fecha</p>
                </div>
                <div className="items-center col-span-3 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold text-gray-600">Total</p>
                </div>
                <div className="items-center col-span-2 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold text-gray-600">Estatus</p>
                </div>
                <div className="items-center col-span-2 flex flex-col  h-full">
                    <p className="font-body text-[15px] font-semibold text-gray-600"></p>
                </div>
            </div>
            <div className="grid grid-cols-12 px-5 justify-between py-4 transition bg-white rounded-b-lg gap-y-4 text-gray-600  ">
                <div className="items-center col-span-3 flex flex-col ">
                    156485
                </div>
                <div className="col-span-2 flex flex-col h-full justify-center items-center">
                    11/09/2022
                </div>

                <div className="col-span-3 flex flex-col h-full justify-center items-center">
                    10 EUR
                </div>
                <div className="col-span-2 flex h-full justify-center items-center space-x-1">
                    <div className=" bg-green h-3 w-3 rounded-full" />
                    <div>
                        Pagado
                    </div>
                </div>
                <div className="col-span-2 flex flex-col h-full justify-center items-center">
                    <ClickAwayListener onClickAway={() => show && setShow(false)}>
                        <div className="w-full flex justify-center items-center relative">
                            <span
                                onClick={() => setShow(!show)}
                                className={`cursor-pointer relative w-max rounded-lg text-sm text-gray-700`}
                            >
                                <DotsOpcionesIcon className="text-gray-500 w-4 h-4" />
                            </span>
                            <ul
                                className={`${show ? "block" : "hidden" } top-5 right-16 absolute w-max border border-base bg-white capitalize rounded-md  shadow-lg z-10 translate-x-[-12px] p-3 cursor-pointer hover:bg-gray-100`}
                            >
                                Descargar Factura
                            </ul>
                        </div>
                    </ClickAwayListener>
                </div>
            </div>
        </div >
    )
}