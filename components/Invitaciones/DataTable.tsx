import { FC, useEffect, useState } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { IndeterminateCheckbox } from "./IndeterminateCheckbox";
import { DataTableGroupContextProvider } from "../../context/DataTableGroupContext";



export const DataTable: FC<any> = ({ columns, data = [], multiSeled = false, setArrEnviatInvitaciones }) => {


  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data }, useSortBy, useRowSelect, (hooks) => {
      hooks.visibleColumns.push((columns) => [
        {
          id: "selection",
          Header: ({ getToggleAllRowsSelectedProps, row }) => {
            const { dataTableGroup: { arrIDs } } = DataTableGroupContextProvider()
            const [valir, setValir] = useState(false)
            const [enviadosA, setEnviadosA] = useState([])
            
            console.log("usuarios ", enviadosA)
            const dataa=(data.find((cierto) => cierto.invitacion === true))
            useEffect(()=>{
              setEnviadosA(dataa)
            },[data])
            console.log("usuarios enviados", dataa)

            
            useEffect(() => {
              if (arrIDs.length > 0) {
                setValir(true)
              } else {
                setValir(false)
              }
            }, [arrIDs, valir]);

            return (
              multiSeled &&
              <div className="">
                {
                  valir ? (
                    <button onClick={() => { setArrEnviatInvitaciones(arrIDs) }} className="focus:outline-none hover:bg-secondary hover:text-gray-300 transition bg-primary text-white py-1 rounded-xl text-center text-[10px] md:text-sm  w-full">
                      {data.invitacion ? "Reenviar" : "Enviar"}
                    </button>
                  ) : (
                    <button className="focus:outline-none bg-primary text-white py-1 rounded-xl text-center text-[10px] md:text-sm  w-full">
                      {data.invitacion ? "Reenviar" : "Enviar"}
                    </button>
                  )
                }
                <IndeterminateCheckbox  {...getToggleAllRowsSelectedProps()} />
              </div>
            )
          },
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
        },
        ...columns,
      ]);
    });

  const colSpan = {
    selection: 1,
    nombre: 3,
    invitacion: 2,
    correo: 2,
  };
  return (
    <>
      <div>
        <table
          {...getTableProps()}
          className="table w-full rounded-lg relative p-4"
        >
          <thead>
            {headerGroups.map((headerGroup: any, id: any) => (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                className="w-full grid grid-cols-9 py-2 px-2 pr-4"
                key={id}
              >
                {headerGroup.headers.map((column: any, id: any) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className={`capitalize text-sm text-gray-500 font-light font-display col-span-${colSpan[column.id]
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
          <tbody {...getTableBodyProps()} className="text-gray-300 text-sm  ">
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <tr
                  key={i}
                  {...row.getRowProps()}
                  className={`"w-full transition border-b border-base hover:bg-base w-full grid grid-cols-9 md:px-3 pl-3  `}
                >
                  {row.cells.map((cell, i) => {
                    return (
                      <td
                        key={i}
                        {...cell.getCellProps()}
                        className={` mr-5* truncate font-display grid place-items-center text-sm w-full text-black h-full text-center py-2 pr-2 col-span-${colSpan[cell.column.id]}`}
                      >
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};