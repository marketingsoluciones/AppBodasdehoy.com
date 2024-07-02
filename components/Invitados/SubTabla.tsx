
import { FC, cloneElement, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { CanceladoIcon, ConfirmadosIcon, PendienteIcon } from "../icons";


interface propsSubComponenteTabla {
    row?: any,
    wantCreate?: any,
    getId?: any,
}

export const SubComponenteTabla: FC<propsSubComponenteTabla> = ({ row, wantCreate, getId }) => {
    const { event } = EventContextProvider();
    const GuestsByFather = event.invitados_array.filter((invitado) => invitado.father === getId)
    console.log(getId,row)
 /*    useEffect(() => {
      
            row.toggleRowExpanded(false);
      
    }, [getId]); */

    return (
        <div className="grid bg-base px-10 pb-12 pt-6 relative">
            <ListadoComponent
                GuestsByFather={GuestsByFather}
                row={row}
            />
        </div>
    );
};



const ListadoComponent = ({ row, GuestsByFather }) => {
    const { sexo } = row?.original;
    const image = {
        hombre: {
            image: "/profile_men.png",
            alt: "Hombre",
        },
        mujer: {
            image: "profile_woman.png",
            alt: "Mujer",
        },
    };

    const Lista = [
        {
            title: "pendiente",
            icon: <PendienteIcon />,
        },
        {
            title: "confirmado",
            icon: <ConfirmadosIcon />,
        },
        {
            title: "cancelado",
            icon: <CanceladoIcon />,
        },
    ];
    const dicc = Lista.reduce((acc, el) => {
        acc[el.title] = { ...el };
        return acc;
    }, {});


    return (
        <>
            <button
                className="top-5 right-5 text-lg text-gray-500 hover:text-gray-300 transition hover:scale-125 absolute transform focus:outline-none"
                onClick={() => row.toggleRowExpanded(false)}
            >
                X
            </button>
            <p className="text-gray-500 text-lg pb-2">
                Acompañantes
            </p>
            {GuestsByFather.length ? GuestsByFather?.map((item, idx) => {
                return (
                    <div
                        key={idx}
                        className="grid grid-cols-8 px-5 justify-between border-b py-4 border-gray-100  transition bg-white  "
                    >
                        <span className="items-center col-span-2 flex flex-col ">
                            <p className="font-body text-[15px] font-semibold">Nombre</p>
                            <div className="flex items-center justify-start gap-1 w-full p-2">
                                <img
                                    className="block w-8 h-8 "
                                    src={image[sexo]?.image}
                                    alt={image[sexo]?.alt}
                                />
                                <p className="font-display text-md capitalize ">{item.nombre} </p>
                            </div>
                        </span>

                        <span className="items-center col-span-2 flex flex-col h-full">
                            <p className="font-body text-[15px] font-semibold">Asistencia</p>
                            <div className="flex items-center gap-1 h-full">
                                {cloneElement(dicc[item.asistencia].icon, { className: "w-5 h-5" })}
                                <p className="font-display text-md capitalize">{item.asistencia}</p>
                            </div>
                        </span>

                        <span className="items-center col-span-2 flex flex-col h-full">
                            <p className="font-body text-[15px] font-semibold">Menu</p>
                            <p className="h-full flex items-center">
                                {item.nombre_menu}
                            </p>
                        </span>

                        <span className="items-center col-span-2 flex flex-col  h-full">
                            <p className="font-body text-[15px] font-semibold">edad</p>
                            <p className={`font-display text-md h-full flex items-center`}>
                                {item.grupo_edad}
                            </p>
                        </span>
                    </div>
                )
            } ) :
                <span className="items-center col-span-3 flex gap-3 text-gray-500 justify-center pt-5">
                    Sin Acompañantes confirmados

                </span>
            }
            
        </>
    );
};
