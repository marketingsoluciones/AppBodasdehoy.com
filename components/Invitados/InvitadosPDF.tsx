import { useRouter } from "next/router";
import { EventContextProvider, EventsGroupContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import { CanceladoIcon, ConfirmadosIcon, PendienteIcon } from "../icons";
import { cloneElement } from "react";

//6723a6ecec2393386595e335

export const InvitadosPDF = () => {
    const { t } = useTranslation();
    const router = useRouter()
    const { eventsGroup } = EventsGroupContextProvider()
    console.log(eventsGroup)
    const eventFound = eventsGroup.find((elem) => elem._id === "6724e5efec2393386597469a")
    console.log(eventFound?.invitados_array)
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
                eventFound?.invitados_array?.map((item, idx) => {
                    return (<>

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
                                <p className="font-body ">{item.nombre_mesa}</p>
                            </span>
                            <span className="items-center col-span-4 flex  justify-center ">
                                <p className="font-body ">{item.puesto}</p>
                            </span>
                            <span className="items-center col-span-4 flex  justify-center ">
                                <p className="font-body ">{item.rol}</p>
                            </span>
                            <span className="items-center col-span-2 flex  justify-center ">
                                <p className="font-body ">{item.passesQuantity}</p>
                            </span>
                        </div>
                    </>)
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