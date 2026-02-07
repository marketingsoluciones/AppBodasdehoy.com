
import { FC, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { CanceladoIcon, ConfirmadosIcon, PendienteIcon } from "../icons";
import { RowString } from "./RowString";
import { guests, table } from "../../utils/Interfaces";
import { RowObject } from "./RowObject";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useTranslation } from 'react-i18next';
import { useAllowed } from "../../hooks/useAllowed";

interface propsSubTabla {
    row?: any,
    getId?: string,
    handleClick?: any,
    setSelected?: any,
    isMounted?: any,
    setIsMounted?: any
}

interface guestsExt extends guests {
    tableNameRecepcion: Partial<table>
    tableNameCeremonia: Partial<table>
}

export const SubTabla: FC<propsSubTabla> = ({ row, getId, handleClick, setSelected, isMounted, setIsMounted }) => {

    const { event, allFilterGuests } = EventContextProvider();
    const GuestsByFather = event?.invitados_array?.filter((invitado) => invitado?.father === getId)
    const [data, setData] = useState<{ titulo: string; data: guestsExt[] }[]>([]);


    useEffect(() => {
        let asd = {}
        for (let i = 0; i < event?.grupos_array?.length; i++) {
            asd = { ...asd, [event?.grupos_array[i]]: { titulo: event?.grupos_array[i], data: [] } }
        }
        const tablesRecepcion = event?.planSpace.find(elem => elem?.title === "recepción")?.tables
        const tablesCeremonia = event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables
        const Data = GuestsByFather.reduce((acc, item: guestsExt) => {
            const guestRecepcion = allFilterGuests[0]?.sentados.find(elem => elem._id === item._id)
            const guestCeremonia = allFilterGuests[1]?.sentados.find(elem => elem._id === item._id)
            const tableRecepcion = tablesRecepcion?.find(elem => elem._id === guestRecepcion?.tableID)
            const tableCeremonia = tablesCeremonia?.find(elem => elem._id === guestCeremonia?.tableID)
            item.chairs = [
                { planSpaceName: "recepción", chair: guestRecepcion?.chair, table: tableRecepcion },
                { planSpaceName: "ceremmonia", chair: guestCeremonia?.chair, table: tableCeremonia },
            ]
            item.tableNameRecepcion = tableRecepcion?.title ? tableRecepcion : { title: "no asignado" }
            item.tableNameCeremonia = tableCeremonia?.title ? tableCeremonia : { title: "no asignado" }

            if (event?.grupos_array?.includes(item?.rol)) {
                acc[item.rol] = { titulo: item.rol, data: acc[item.rol]?.data ? [...acc[item.rol]?.data, item] : [item] }
            } else {
                acc["no asignado"] = { titulo: "no asignado", data: acc["no asignado"]?.data ? [...acc["no asignado"]?.data, item] : [item] }
            }
            return acc;
        }, asd);
        Data && setData(Object.values(Data));
    }, [allFilterGuests]);

    return (
        <div className=" bg-base px-10 pb-12 pt-6 relative">
            <ListadoComponent
                GuestsByFather={GuestsByFather}
                row={row}
                handleClick={handleClick}
                setSelected={setSelected}
                isMounted={isMounted}
                setIsMounted={setIsMounted}
            />  
        </div>
    );
};


interface props {
    row: any
    GuestsByFather: guests[]
    handleClick?: any
    setSelected?: any
    isMounted?: any
    setIsMounted?: any
}

const ListadoComponent: FC<props> = ({ row, GuestsByFather, handleClick, setSelected, isMounted, setIsMounted }) => {
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
    const [isAllowed] = useAllowed()
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

    const handleEditInvitado = (id: string) => {
        setSelected(id)
        setIsMounted(true)
    }
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
            { GuestsByFather?.map((item, idx) => {
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
                                <p className="font-display text-md capitalize  cursor-pointer" onClick={() =>!isAllowed() ? null : handleEditInvitado(item._id)}>{item.nombre} </p>
                            </div>
                        </span>
                        <div className="col-span-2 flex flex-col h-full justify-center items-center " >
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
            }) 
            }
            {
            row?.original?.passesQuantity > GuestsByFather.length &&
                <span onClick={(e) => handleClick(e, "acompañante", row?.original?._id)} className="bg-white col-span-2 flex flex-col h-full justify-center items-center py-4 cursor-pointer">Registrar acompañante</span>
            }
        </>
    );
};
