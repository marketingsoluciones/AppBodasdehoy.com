import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import { BorrarIcon, EditarIcon, PlusIcon } from "../icons";
import { api } from "../../api";
import { FC, useContext, useEffect, useState } from "react";
import { EventContextProvider, AuthContextProvider } from "../../context";
import FormEditarPago from "../Forms/FormEditarPago";
import { GoPlusCircle } from "react-icons/go";

interface propsSubComponenteTabla {
    row?: any,
    cate?: any,
    gasto?: any,
    wantCreate?: any,
    getId?: any,
}

export const SubComponenteTabla: FC<propsSubComponenteTabla> = ({ row, wantCreate, getId }) => {
    const [show, setShow] = useState(true);
    const [PagoModificar, setPagoModificar] = useState("")

    useEffect(() => {
        if (row?.original?.pagos_array?.length <= 0) {
            row.toggleRowExpanded(false);
        }
    }, [row.original.pagos_array]);

    return (
        <div className="grid bg-base px-10 pb-12 pt-6 relative">
           
                <ListadoComponent
                    pagos_array={row?.original?.pagos_array}
                  
                    wantCreate={wantCreate}
                    idModificar={id => {
                        setPagoModificar(id)
                        setShow(!show)
                    }}
                    row={row}
                />
            
        </div>
    );
};



const ListadoComponent = ({ pagos_array,  wantCreate, idModificar, row }) => {
    const { event, setEvent } = EventContextProvider();
   

    return (
        <>
            <button
                className="top-5 right-5 text-lg font-display text-gray-500 hover:text-gray-300 transition hover:scale-125 absolute transform focus:outline-none"
                onClick={() => row.toggleRowExpanded(false)}
            >
                X
            </button>
            <p className="text-gray-500 font-display text-lg pb-2">
                Acompañantes
            </p>
          {/*   {pagos_array?.map((item, idx) => ( */}
                <div
                   /*  key={idx} */
                    className="grid grid-cols-10 px-5 justify-between border-b py-4 border-gray-100 hover:bg-base* transition bg-white  "
                >
                    <span className="items-center col-span-1 flex flex-col justify-center">
                        <p className="font-display text-sm font-medium">Nombre</p>
                        <p className="font-display text-md">{/* {idx + 1} */} </p>
                    </span>

                    <span className="items-center col-span-2 flex flex-col justify-center">
                        <p className="font-display text-md font-medium">Asistencia</p>
                        <p className="font-display text-md">{/* {getCurrency(item.importe, event?.presupuesto_objeto?.currency)} */}</p>
                    </span>

                    <span className="items-center col-span-2 flex flex-col justify-center">
                        <p className="font-display text-md font-medium">Menu</p>
                        <p
                           /*  className={`font-display text-md ${item.estado == "pagado" ? "text-green" : " text-red"
                                }`} */
                        >
                            {/* {capitalize(item.estado)} */}
                        </p>
                    </span>

                    <span className="items-center col-span-3 flex flex-col justify-center">
                        <p className="font-display text-md font-medium">Fecha de pago</p>
                        <p className={`font-display text-md`}>{/* {item.fecha_pago} */}</p>
                    </span>

                    <span className="items-center col-span-3 flex gap-3 text-gray-500 justify-center pt-5">
                         Sin Acompañantes confirmados
                        
                    </span>

                  
                </div>
          {/*   ))} */}
            
        </>
    );
};
