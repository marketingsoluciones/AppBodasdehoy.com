import { useRouter } from "next/router";
import { EventContextProvider, EventsGroupContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { CanceladoIcon, ConfirmadosIcon, PendienteIcon } from "../icons";
import { cloneElement, useEffect, useState } from "react";
import { guests, table } from "../../utils/Interfaces";

interface guestsExt extends guests {
    tableNameRecepcion: Partial<table>
    tableNameCeremonia: Partial<table>
}

//6723a6ecec2393386595e335

export const InvitadosPDF = (props) => {
    const { t } = useTranslation();
    const router = useRouter()
    const { eventsGroup } = EventsGroupContextProvider()
    const { allFilterGuests } = EventContextProvider();
    const eventFound = eventsGroup.find((elem) => elem._id === "6724e5efec2393386597469a")
    const asd: guests[] = eventFound?.invitados_array
    const [data, setData] = useState<{ data: guestsExt[] }[]>([]);

    useEffect(() => {
        let asd = {}
        for (let i = 0; i < eventFound?.grupos_array?.length; i++) {
            asd = { ...asd, [eventFound?.grupos_array[i]]: {  data: [] } }
        }
        const tablesRecepcion = eventFound?.planSpace.find(elem => elem?.title === "recepción")?.tables
        const tablesCeremonia = eventFound?.planSpace.find(elem => elem?.title === "ceremonia")?.tables
        const Data = eventFound?.invitados_array?.reduce((acc, item: guestsExt) => {
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

            if (eventFound?.grupos_array?.includes(item?.rol)) {
                acc[item.rol] = { titulo: item.rol, data: acc[item.rol]?.data ? [...acc[item.rol]?.data, item] : [item] }
            } else {
                acc["no asignado"] = { titulo: "no asignado", data: acc["no asignado"]?.data ? [...acc["no asignado"]?.data, item] : [item] }
            }
            return acc;
        }, asd);
        Data && setData(Object.values(Data));
    }, [allFilterGuests]);

  
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
        <div className={`bg-transparent pb-4 mt-5 rounded-md  grid col-span-12 items-center w-full justify-items-center `}>
            <div className="grid grid-cols-24 px-5 py-4 justify-between relative text-xs text-gray-700 uppercase bg-gray-200  w-[90%] rounded-sm">
                <span className="items-center col-span-3 flex flex-col ">
                    <p className="font-body text-[15px] font-semibold">{t("name")}</p>
                </span>
                <span className="items-center col-span-3 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">{t("attendance")}</p>
                </span>
                <span className="items-center col-span-3 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">{t("menu")}</p>
                </span>
                <span className="items-center col-span-4 flex flex-col h-full">
                    <p className="font-body text-[15px] font-semibold">{t("receptiontable")}</p>
                </span>
                <span className="items-center col-span-4 flex flex-col  h-full">
                    <p className="font-body text-[15px] font-semibold">{t("ceremonytable")}</p>
                </span>
                <span className="items-center col-span-4 flex flex-col  h-full">
                    <p className="font-body text-[15px] font-semibold">Rol </p>
                </span>
                <span className="items-center col-span-2 flex flex-col  h-full">
                    <p className="font-body text-[15px] font-semibold">acompañantes </p>
                </span>
            </div>
            {
                asd?.map((item, idx) => {
                    const fatherGuest = item?.father != null && eventFound?.invitados_array?.find((elem) => elem?._id === item?.father)
                    return (
                        <div key={idx} className="grid grid-cols-24 px-5 py-4 justify-between relative text-xs text-gray-700 capitalize bg-white  border-b w-[90%]">
                            <span className="items-center col-span-3 flex  ">
                                <img
                                    className="block w-10 h-10 mr-2"
                                    src={image[item.sexo]?.image}
                                    alt={image[item.sexo]?.alt}
                                />
                                <p className="font-body ">{item.nombre}</p>
                            </span>
                            <span className="items-center col-span-3 flex space-x-2 pl-4">
                                {dicc[item.asistencia]?.icon && cloneElement(dicc[item.asistencia]?.icon, { className: "w-5 h-5" })}
                                <p className="font-body ">{item.asistencia}</p>
                            </span>
                            <span className="items-center col-span-3 flex  justify-center ">
                                <p className="font-body ">{item.nombre_menu}</p>
                            </span>
                            <span className="items-center col-span-4 flex justify-center ">
                                <p className="font-body ">{item?.tableNameRecepcion?.title}</p>
                            </span>
                            <span className="items-center col-span-4 flex  justify-center ">
                                <p className="font-body ">{item?.tableNameCeremonia?.title}</p>
                            </span>
                            <span className="items-center col-span-4 flex  justify-center ">
                                <p className="font-body ">{item.father === null ? item.rol : ` acompañante de ${fatherGuest.nombre} `}</p>
                            </span>
                            <span className="items-center col-span-2 flex  justify-center ">
                                <p className="font-body ">{item.passesQuantity != null ? item.passesQuantity : "N/A"}</p>
                            </span>
                        </div>
                    )
                })
            }


            {/*   <table
                className="w-full text-sm text-left text-gray-500"
            >
                <thead className="relative text-xs text-gray-700 uppercase bg-gray-100 w-full">
                    {
                        // Loop over the header rows
                        headerGroups.map((headerGroup, i) => (
                            // Apply the header row props
                            <tr
                                {...headerGroup.getHeaderGroupProps()}
                                key={i}
                                className="grid grid-cols-24"
                            >
                                {
                                    // Loop over the headers in each row
                                    headerGroup.headers.map((column, i) => {
                                        return (
                                            // Apply the header cell props
                                            <th
                                                {...column.getHeaderProps()}
                                                key={i}
                                                className={`px-6 py-1 md:py-2 text-center flex justify-center items-center text-sm font-light font-display ${ColSpan(column.id, headerGroup.headers, 12)}`}
                                            >
                                                {
                                                    // Render the header
                                                    column.render("Header")
                                                }
                                            </th>
                                        )
                                    })
                                }
                            </tr>

                        ))
                    }
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows?.length == 0 && (
                        <tr className="bg-white border-b font-display text-sm w-full grid grid-cols-12">
                            <td className="pl-6 py-4 col-span-1 table-cell	">
                            </td>
                            <td className="py-4 w-max pl-5 text-gray-300">
                                {t("noguests")}
                            </td>
                        </tr>
                    )}
                    {
                        // Loop over the table rows
                        rows.map((row, i) => {
                            // Prepare the row for display
                            prepareRow(row);
                            return (
                                <TrExpand key={i} row={row} ColSpan={ColSpan} renderRowSubComponent={renderRowSubComponent} />
                            );
                        })
                    }
                </tbody>
            </table> */}
        </div>
    )
}