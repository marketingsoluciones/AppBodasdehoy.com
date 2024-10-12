import { FC, useEffect, useState } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { IndeterminateCheckbox } from "../../Invitaciones/IndeterminateCheckbox";
import { DataTableGroupContextProvider } from "../../../context/DataTableGroupContext";
import { useTranslation } from 'react-i18next';

export const ItineraryTable: FC<any> = ({ columns, data = [], multiSeled = false, setArrEnviatInvitaciones, reenviar, activeFunction }) => {
  const { t } = useTranslation();
  const [valir, setValir] = useState(false)
  const [asd, setAsd] = useState({ arrIDs: undefined, getToggleAllRowsSelectedProps: undefined })


  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, allColumns, rows } =
    useTable({ columns, data }, useSortBy, useRowSelect, (hooks) => {
      hooks.visibleColumns.push((columns) => [
        ...columns,

      ]);
    });



  const colSpan = {
    description: 5,
    date: 2,
    time: 2,
    duration: 2,
    responsables: 3,
    tips: 5,
    attachment: 4,
    selection: 1
  };


  return (
    <div className="relative">
      {multiSeled &&
        <div className=" flex justify-between py-3 ml-[52px] w-auto pr-5 relative">
          {/* <button
            disabled={!valir}
            onClick={() => { setArrEnviatInvitaciones(asd?.arrIDs) }}
            className={`focus:outline-none ${valir ? "hover:opacity-70 transition bg-primary" : "bg-gray-300"} text-white py-1 px-2 rounded-lg text-center text-[10px] md:text-sm capitalize`}>
            {reenviar ? t("reenviar") : t("enviar")}
          </button> */}
        </div>}
      <table
        {...getTableProps()}
        className="table-auto border-collapse w-full rounded-lg relative p-4 ">
        <thead className="relative text-xs text-gray-700 uppercase bg-gray-100 w-full">
          {headerGroups.map((headerGroup: any, id: any) => {
            return (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                className="grid grid-cols-24"
                key={id} >
                {headerGroup.headers.map((column: any, id: any) => {
                  return (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className={`leading-[1] px-6 py-1 md:py-2 text-center flex justify-center items-center text-sm font-light font-display col-span-${colSpan[column.id]
                        }`}
                      key={id} >
                      {typeof column.render("Header") == "string" && t(column.render("Header"))}
                      <span>
                        {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                      </span>
                    </th>
                  )
                })}
              </tr>
            )
          })}
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
                      className={`leading-[1.5] px-1 py-1 flex items-center col-span-${colSpan[cell.column.id]} border-[1px]`}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          }) : <tr className="transition border-b border-base hover:bg-base cursor-pointer w-full grid place-items-center">
            <td className="py-5 font-display text-lg text-gray-500 uppercase ">{t("noguestsevent")}</td></tr>}
        </tbody>
      </table>

    </div>
  );
};