import { FC, useEffect, useState } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { IndeterminateCheckbox } from "./IndeterminateCheckbox";



export const DataTable: FC<any> = ({ columns, data = [], multiSeled = false }) => {

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data }, useSortBy, useRowSelect, (hooks) => {
      hooks.visibleColumns.push((columns) => [
        {
          id: "selection",
          Header: ({ getToggleAllRowsSelectedProps }) => (
            multiSeled &&
            <div className="">
              <p className="cursor-pointer gap-2 rounded-xl md:rounded-2xl border border-gray-300 hover:bg-gray-200 hover:text-white transition text-center text-[10px] md:text-sm text-gray-500 font-display md:py-1">
                Enviar
              </p>
              <IndeterminateCheckbox  {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          Cell: ({ row }) => {
            useEffect(() => {
              const id = row?.original?._id;
              if (row.isSelected && !row?.original?.invitacion) {
                console.log("ADD_ROW_SELECTED", row?.original)
              }
              if (!row.isSelected) {
                console.log("REMOVE_ROW_SELECTED", row?.original)
              }
            }, [row.isSelected, row]);

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
    correo: 3,
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
                className="w-full grid grid-cols-9 py-2 px-4 "
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
          <tbody {...getTableBodyProps()} className="text-gray-300 text-sm ">
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <tr
                  key={i}
                  {...row.getRowProps()}
                  className="w-full transition border-b border-base hover:bg-base  w-full grid grid-cols-9 px-4"
                >
                  {row.cells.map((cell, i) => {
                    return (
                      <td
                        key={i}
                        {...cell.getCellProps()}
                        className={`font-display grid place-items-center text-sm w-full h-full text-center text-left py-2 col-span-${colSpan[cell.column.id]
                          }`}
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