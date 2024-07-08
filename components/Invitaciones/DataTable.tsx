import { FC, useEffect, useState } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { IndeterminateCheckbox } from "./IndeterminateCheckbox";
import { DataTableGroupContextProvider } from "../../context/DataTableGroupContext";



export const DataTable: FC<any> = ({ columns, data = [], multiSeled = false, setArrEnviatInvitaciones, reenviar, activeFunction }) => {
  const [valir, setValir] = useState(false)
  const [asd, setAsd] = useState({ arrIDs: undefined, getToggleAllRowsSelectedProps: undefined })


  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data }, useSortBy, useRowSelect, (hooks) => {
      hooks.visibleColumns.push((columns) => [
        {
          id: "selection",

          Cell: ({ row }) => {
            const { dispatch, dataTableGroup: { arrIDs } } = DataTableGroupContextProvider()
            useEffect(() => {
              const id = row?.original?._id;
              if (row.isSelected && !arrIDs.includes(id)) {
                dispatch({ type: "ADD_ROW_SELECTED", payload: id })
              }
              if (!row.isSelected && arrIDs.includes(id)) {
                dispatch({ type: "REMOVE_ROW_SELECTED", payload: id })
              }
            }, [row.isSelected, row, dispatch, arrIDs]);

            return (
              <>
                <div>
                  {multiSeled && < IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />}
                </div>
              </>
            )
          },
          Header: ({ getToggleAllRowsSelectedProps, row }) => {
            const { dataTableGroup: { arrIDs } } = DataTableGroupContextProvider()

            useEffect(() => {
              setAsd({ arrIDs, getToggleAllRowsSelectedProps })
            }, [arrIDs])

            useEffect(() => {
              console.log(arrIDs)
            }, [arrIDs])


            useEffect(() => {
              if (arrIDs.length > 0) {
                setValir(true)
              } else {
                setValir(false)
              }
            }, [arrIDs, valir]);

            return (
              <div className="absolute z-10 -translate-y-11 -translate-x-1">
                <IndeterminateCheckbox  {...getToggleAllRowsSelectedProps()} />
              </div>
            )
          },
        },
        ...columns,
      ]);
    });


  const colSpan = {
    selection: 1,
    nombre: 4,
    correo: 5,
    telefono: 4,
    invitacion: 4,
    acompañantes: 3,
    date: 3
  };


  return (
    <div className="relative">
      {multiSeled &&
        <div className=" flex justify-between py-3 ml-[52px] w-auto pr-5">
          <button
            disabled={!valir}
            onClick={() => { setArrEnviatInvitaciones(asd?.arrIDs) }}
            className={`focus:outline-none ${valir ? "hover:opacity-70 transition bg-primary" : "bg-gray-300"} text-white py-1 px-2 rounded-lg text-center text-[10px] md:text-sm w-full*`}>
            {reenviar ? "Reenviar" : "Enviar"}
          </button>
          <button onClick={() => activeFunction()} className="border border-primary rounded-lg px-2 text-sm text-primary">
            Detalles
          </button>
        </div>}
      <table
        {...getTableProps()}
        className="table-auto border-collapse w-full rounded-lg relative p-4 "
      >
        <thead className="relative text-xs text-gray-700 uppercase bg-gray-100 w-full">
          {headerGroups.map((headerGroup: any, id: any) => (
            <tr
              {...headerGroup.getHeaderGroupProps()}
              className="grid grid-cols-24"
              key={id}
            >
              {headerGroup.headers.map((column: any, id: any) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className={`px-6 py-1 md:py-2 text-center flex justify-center items-center text-sm font-light font-display col-span-${colSpan[column.id]
                    }`}
                  key={id}
                >
                  {column.render("Header")}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody {...getTableBodyProps()} className="text-gray-700 text-sm ">
          {rows.length >= 1 ? rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr
                key={i}
                {...row.getRowProps()}
                className={`w-full bg-white border-b font-display text-sm grid grid-cols-24`}
              >
                {row.cells.map((cell, i) => {
                  return (
                    <td
                      key={i}
                      {...cell.getCellProps()}
                      className={`truncate px-3 py-2 flex items-center col-span-${colSpan[cell.column.id]}`}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          }) : <tr className="transition border-b border-base hover:bg-base cursor-pointer w-full grid place-items-center">
            <td className="py-5 font-display text-lg text-gray-500 uppercase ">No hay invitados asociados al evento</td></tr>}
        </tbody>
      </table>
    </div>
  );
};