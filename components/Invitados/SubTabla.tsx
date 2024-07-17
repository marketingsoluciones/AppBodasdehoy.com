
import { FC, cloneElement } from "react";
import { EventContextProvider } from "../../context";
import { CanceladoIcon, ConfirmadosIcon, PendienteIcon } from "../icons";
import { RowString } from "./RowString";
import { guests } from "../../utils/Interfaces";

interface propsSubTabla {
    row?: any,
    wantCreate?: any,
    getId?: string,
}

export const SubTabla: FC<propsSubTabla> = ({ row, wantCreate, getId }) => {
    const { event } = EventContextProvider();
    const GuestsByFather = event?.invitados_array?.filter((invitado) => invitado?.father === getId)
    return (
        <div className=" bg-base px-10 pb-12 pt-6 relative">
            <ListadoComponent
                GuestsByFather={GuestsByFather}
                row={row}
            />
        </div>
    );
};


interface props {
    row: any
    GuestsByFather: guests[]
}

const ListadoComponent: FC<props> = ({ row, GuestsByFather }) => {
    const { event } = EventContextProvider()
    const sexo = row?.original?.sexo;
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
            <div className="grid grid-cols-12 px-5 justify-between border-b py-4 border-gray-100  transition bg-white capitalize">
                <span className="items-center col-span-2 flex flex-col ">
                    <p className="font-body text-[15px] font-semibold">Nombre</p>
                </span>
                <span className="items-center col-span-2 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">Asistencia</p>
                </span>
                <span className="items-center col-span-2 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">Menu</p>
                </span>
                <span className="items-center col-span-2 flex flex-col  h-full">
                    <p className="font-body text-[15px] font-semibold">edad</p>
                </span>
                <span className="items-center col-span-2 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">Mesa Recepcion</p>
                </span>
                <span className="items-center col-span-2 flex flex-col  h-full">
                    <p className="font-body text-[15px] font-semibold">Mesa  Ceremonia</p>
                </span>
            </div>
            {GuestsByFather.length ? GuestsByFather?.map((item, idx) => {
                return (
                    <div
                        key={idx}
                        className="grid grid-cols-12 px-5 justify-between border-b py-4 border-gray-100  transition bg-white  "
                    >
                        <span className="bg-red items-center col-span-2 flex flex-col ">
                            <div className="flex items-center justify-start gap-1 w-full p-2">
                                <img
                                    className="block w-8 h-8 "
                                    src={image[sexo]?.image}
                                    alt={image[sexo]?.alt}
                                />
                                <p className="font-display text-md capitalize ">{item.nombre} </p>
                            </div>
                        </span>
                        <div className="items-center col-span-2 flex flex-col h-full">
                            <RowString Lista={Lista} dicc={dicc} initialValue={item.asistencia} columnID="" rowID="asistencia" />
                        </div>

                        <div className="items-center col-span-2 flex flex-col h-full">
                            <RowString Lista={event?.menus_array.map(elem => { return { title: elem.nombre_menu } })} initialValue={item.nombre_menu} rowID={row?.original?._id} columnID="nombre_menu" />
                        </div>
                        <span className="items-center col-span-2 flex flex-col  h-full">
                            <p className={`font-display text-md h-full flex items-center capitalize`}>
                                no asignado
                            </p>
                        </span>
                        <span className="items-center col-span-2 flex flex-col  h-full">
                            <p className={`font-display text-md h-full flex items-center capitalize`}>
                                no asignado
                            </p>
                        </span>
                    </div>
                )
            }) :
                <span className="items-center col-span-3 flex gap-3 text-gray-500 justify-center pt-5">
                    Sin Acompañantes confirmados
                </span>
            }

        </>
    );
};
