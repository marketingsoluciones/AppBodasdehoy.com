import { FC, useEffect, useMemo, useState } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { useTranslation } from 'react-i18next';
import { EventsGroupContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import { LiaPaperclipSolid } from "react-icons/lia";



export const EventsTable: FC<any> = () => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [columns, setColumns] = useState([
    {
      Header: "propietario",
      accessor: "usuario_nombre",
      id: "usuario_nombre",
      Cell: (data) => {
        return (
          <span className="flex items-center capitalize"> {data.value != null ? data.value : "null"}</span>
        )
      }
    },
    {
      Header: "nombre",
      accessor: "nombre",
      id: "nombre",
      Cell: (data) => {
        return (
          <span className="flex items-center capitalize"> {data.value != null ? data.value : "null"}</span>
        )
      }
    },
    {
      Header: "tipo",
      accessor: "tipo",
      id: "tipo",
      Cell: (data) => {
        return (
          <span className="flex items-center capitalize"> {data.value != null ? data.value : "null"}</span>
        )
      }
    },
    {
      Header: "estilo",
      accessor: "estilo",
      id: "estilo",
      Cell: (data) => {
        return (
          <span className="flex items-center capitalize"> {data.value != null ? data.value : "null"}</span>
        )
      }
    },
    {
      Header: "color",
      accessor: "color",
      id: "color",
      Cell: (data) => {
        const list = [
          { color: "bg-yellow-300	", title: "Amarillo" },
          { color: "bg-cyan-400	", title: "Celeste" },
          { color: "bg-pink-400", title: "Rosado" },
          { color: "bg-red", title: "Rojo" },
          { color: "bg-purple-600", title: "Morado" },
          { color: "bg-amber-100	", title: "Beige" },
          { color: "bg-yellow-500", title: "Dorado" },
          { color: "bg-slate-400", title: "Plata" },
          { color: "bg-orange-400", title: "Naranja" },
          { color: "bg-lime-600", title: "verde" },
        ]
        const colorFind = list.find((elem) => elem.title === data.value[0])
        return (
          <div className={`flex w-full items-center justify-center capitalize capitalize `}>
            {data.value.length > 0 ?
              <span className={`${colorFind?.color} flex w-full* items-center capitalize text-white  p-1 rounded-md text-[10px] `}>
                {colorFind.title + " +" + (data.value.length - 1)}
              </span> :
              <span className={`bg-gray-400 flex w-full* items-center capitalize text-white  p-1 rounded-md text-[10px]`}>
                null
              </span>}
          </div>
        )
      }
    },
    {
      Header: "tarta",
      accessor: "tarta",
      id: "tarta",
      Cell: (data) => {
        return (
          <span className="flex items-center justify-center w-full capitalize"> {data.value != null ? <LiaPaperclipSolid className="h-5 w-5" /> : "null"} </span>
        )
      }
    },
    {
      Header: "temporada",
      accessor: "temporada",
      id: "temporada",
      Cell: (data) => {
        return (
          <span className="flex items-center justify-center w-full capitalize"> {data.value != null ? data.value : "null"} </span>
        )
      }
    },
    {
      Header: "tematica",
      accessor: "tematica",
      id: "tematica",
      Cell: (data) => {
        return (
          <span className="flex items-center justify-center w-full capitalize"> {data.value != null ? data.value : "null"} </span>
        )
      }
    },
    {
      Header: "fecha del evento",
      accessor: "fecha",
      id: "fecha",
      Cell: (data) => {
        return (
          <div className="flex w-full justify-center items-center capitalize">
            {`${new Date(parseInt(data.value)).toLocaleDateString("es-VE", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}`}
          </div>
        )
      }
    },
    {
      Header: "fecha de creacion",
      accessor: "fecha_creacion",
      id: "fecha_creacion",
      Cell: (data) => {
        return (
          <div className="flex w-full justify-center items-center capitalize">
            {`${new Date(parseInt(data.value)).toLocaleDateString("es-VE", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}`}
          </div>
        )
      }
    },
    {
      Header: "invitados",
      accessor: "invitados_array",
      id: "invitados_array",
      Cell: (data) => {
        return (
          <div className="flex w-full items-center justify-center capitalize">
            {data.value.length > 0 ? data.value.length : "null"}
          </div>
        )
      }
    },
    {
      Header: "itinerarios",
      accessor: "itinerarios_array",
      id: "itinerarios_array",
      Cell: (data) => {
        return (
          <div className="flex w-full items-center justify-center capitalize">
            {data.value.length > 0 ? data.value.length : "null"}
          </div>
        )
      }
    },
    {
      Header: "menus",
      accessor: "menus_array",
      id: "menus_array",
      Cell: (data) => {
        return (
          <div className="flex w-full items-center justify-center capitalize">
            {data.value.length > 0 ? data.value.length : "null"}
          </div>
        )
      }
    },
    {
      Header: "mesas",
      accessor: "mesas_array",
      id: "mesas_array",
      Cell: (data) => {
        return (
          <div className="flex w-full items-center justify-center capitalize">
            {data.value.length > 0 ? data.value.length : "null"}
          </div>
        )
      }
    },
    {
      Header: "presupuesto",
      accessor: "presupuesto_objeto",
      id: "presupuesto_objeto",
      Cell: (data) => {
        return (
          <div className="flex w-full items-center justify-end capitalize">
            {getCurrency(
              data.value.coste_estimado,
              data.value.currency
            )}
            { }
          </div>
        )
      }
    },


  ]);

  useEffect(() => {
    setData(eventsGroup)
  }, [eventsGroup])

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useSortBy, useRowSelect);

  const colSpan = {
    usuario_nombre: 4,
    color: 3,
    nombre: 4,
    tipo: 3,
    estilo: 3,
    fecha: 4,
    fecha_creacion: 4,
    invitados_array: 3,
    tarta: 3,
    temporada: 2,
    tematica: 3,
    itinerarios_array: 3,
    menus_array: 3,
    mesas_array: 2,
    presupuesto_objeto: 4



  };

  return (
    <div className="relative px-3 flex  justify-center w-full">
        <table
          {...getTableProps()}
          className="table-auto border-collapse rounded-lg relative p-4 ">
          <thead className="relative text-xs text-gray-700 uppercase bg-gray-200 w-full truncate">
            {headerGroups.map((headerGroup: any, id: any) => {
              return (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  className="grid grid-cols-48 w-full truncate"
                  key={id} >
                  {headerGroup.headers.map((column: any, id: any) => {
                    return (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className={`truncate w-full leading-[1] px-1 py-1 md:py-3 text-center flex justify-center items-center text-xs font-light font-display col-span-${colSpan[column.id]
                          }`}
                        key={id}
                      >
                        <>
                          {typeof column.render("Header") == "string" && t(column.render("Header"))}
                          <span>
                            {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                          </span>
                        </>
                      </th>
                    )
                  })}
                </tr>
              )
            })}
          </thead>
          <tbody {...getTableBodyProps()} className="text-gray-700 text-xs bg-white">
            {rows.length >= 1 ? rows.map((row, i) => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  key={i}
                  className={` w-full border-b font-display grid grid-cols-48 truncate`}

                >
                  {row.cells.map((cell, i) => {
                    return (
                      <td
                        {...cell.getCellProps()}
                        key={i}
                        className={`flex items-center* leading-[1.3] px-1 py-1 col-span-${colSpan[cell.column.id]} border-x-[1px] truncate`}
                      >
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            }) : <tr className="transition border-b border-base hover:bg-base cursor-pointer w-full grid place-items-center">
              <td className="bg-redpy-5 font-display text-lg text-gray-500 uppercase "></td></tr>}
          </tbody>
        </table>
    </div>
  );
};