
import { FC } from "react";
import { EventContextProvider } from "../../context";
import { CanceladoIcon, ConfirmadosIcon, PendienteIcon } from "../icons";
import { RowString } from "./RowString";
import { guests } from "../../utils/Interfaces";
import { RowObject } from "./RowObject";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useTranslation } from 'react-i18next';

interface propsSubTabla {
    row?: any,
    getId?: string,
}

export const SubTabla: FC<propsSubTabla> = ({ row, getId }) => {
    
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
    const { t } = useTranslation();
    const { event, setEvent } = EventContextProvider()
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
                onClick={() => {
                    //    row.toggleRowExpanded(false)
                    fetchApiEventos({
                        query: queries.eventUpdate,
                        variables: {
                            idEvento: event._id,
                            variable: "showChildrenGuest",
                            value: ""
                        }
                    })
                    event.showChildrenGuest = null
                    setEvent({ ...event })
                }
                }
            >
                X
            </button>
            <p className="text-gray-500 text-lg pb-2">
                {t("companionss")}
            </p>
            <div className="grid grid-cols-12 px-5 justify-between border-b py-4 border-gray-100  transition bg-white capitalize">
                <span className="items-center col-span-4 flex flex-col ">
                    <p className="font-body text-[15px] font-semibold">{t("name")}</p>
                </span>
                <span className="items-center col-span-2 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">{t("attendance")}</p>
                </span>
                <span className="items-center col-span-2 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">{t("menu")}</p>
                </span>
                <span className="items-center col-span-2 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">{t("receptiontable")}</p>
                </span>
                <span className="items-center col-span-2 flex flex-col  h-full">
                    <p className="font-body text-[15px] font-semibold">{t("ceremonytable")}</p>
                </span>
            </div>
            {GuestsByFather.length ? GuestsByFather?.map((item, idx) => {
                const getTable = (planSpaceTitle) => {
                    const f1 = event?.planSpace.findIndex(elem => elem?.title === planSpaceTitle)
                    const table = event.planSpace[f1]?.tables.find(el => el.guests.find(elem => elem._id === item._id))
                    return table

                }
                
                return (
                    <div
                        key={idx}
                        className="grid grid-cols-12 px-5 justify-between border-b py-4 border-gray-100  transition bg-white">
                        <span className="items-center col-span-4 flex flex-col ">
                            <div className="flex items-center justify-start gap-1 w-full p-2">
                                <img
                                    className="block w-8 h-8 "
                                    src={image[sexo]?.image}
                                    alt={image[sexo]?.alt}
                                />
                                <p className="font-display text-md capitalize ">{item.nombre} </p>
                            </div>
                        </span>
                        <div className="col-span-2 flex flex-col h-full justify-center items-center">
                            <RowString Lista={Lista} dicc={dicc} initialValue={item.asistencia} variable="asistencia" guestID={item._id} />
                        </div>

                        <div className="col-span-2 flex flex-col h-full justify-center items-center">
                            <RowString Lista={event?.menus_array.map(elem => { return { title: elem.nombre_menu } })} initialValue={item.nombre_menu} variable="nombre_menu" guestID={item._id} />
                        </div>
                        <span className="col-span-2 flex flex-col h-full justify-center items-center">
                            <RowObject initialValue={getTable("recepción")} planSpaceTitle="recepción" guestID={item._id} />
                        </span>
                        <span className="col-span-2 flex flex-col h-full justify-center items-center">
                            <RowObject initialValue={getTable("ceremonia")} planSpaceTitle="ceremonia" guestID={item._id} />
                        </span>
                    </div>
                )
            }) :
                <span className="items-center col-span-3 flex gap-3 text-gray-500 justify-center pt-5">
                    {t("noconfirmedcompanions")}
                </span>
            }

        </>
    );
};
