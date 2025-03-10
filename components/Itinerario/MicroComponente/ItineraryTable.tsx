import { FC, useState } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { useTranslation } from 'react-i18next';

export const ItineraryTable: FC<any> = ({ columns, data = [], selectTask, setSelectTask }) => {
  const { t } = useTranslation();

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data }, useSortBy, useRowSelect, (hooks) => {
      hooks.visibleColumns.push((columns) => [
        ...columns,
      ]);
    });

  const colSpan = {
    description: 7,
    duration: 5,
    date: 4,
    responsables: 7,
    tips: 12,
    attachments: 8,
    tags: 5,
    //selection: 2
  };

  return (
    <div className="relative">
      <div className="col-span-2 col-span-3 col-span-4 col-span-5 col-span-6 col-span-7 col-span-8 col-span-9 col-span-10" />
      <table
        {...getTableProps()}
        className="table-auto border-collapse w-full rounded-lg relative p-4">
        <thead className="relative text-xs text-gray-700 uppercase w-full">
          {headerGroups.map((headerGroup: any, id: any) => {
            return (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                className="grid grid-cols-48"
                key={id} >
                {headerGroup.headers.map((column: any, id: any) => {
                  return (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className={`bg-gray-200 leading-[1] px-1 py-1 md:py-3 text-center flex justify-center items-center text-xs font-light font-display col-span-${colSpan[column.id]
                        } ${column?.className}`}
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
        <tbody {...getTableBodyProps()} className="text-gray-700 text-xs">
          {rows.length >= 1 ? rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                key={i}
                className={`w-full font-display grid grid-cols-48`}
                onClick={() => setSelectTask(row.original?._id)}
              >
                {row.cells.map((cell, i) => {

                  return (
                    <td
                      {...cell.getCellProps()}
                      key={i}
                      className={`${selectTask === row.original._id ? "bg-gray-100" : "bg-white"} flex items-center* leading-[1.3] px-1 py-1 col-span-${colSpan[cell.column.id]} ${cell.column?.className} border-b border-r ${cell.column.totalLeft == 0 && "border-l"}`}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          }) : <tr className="transition hover:bg-base cursor-pointer w-full grid place-items-center">
            <td className="bg-redpy-5 font-display text-lg text-gray-500 uppercase "></td></tr>}
        </tbody>
      </table>
    </div>
  );
};