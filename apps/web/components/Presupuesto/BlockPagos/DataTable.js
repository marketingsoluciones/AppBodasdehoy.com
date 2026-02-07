import React, { useEffect, useState } from "react";
import { useTable } from "react-table";
import { useTranslation } from 'react-i18next';

const DataTable = ({ columns, data, estado }) => {
  const { t } = useTranslation()

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data });

  const [stado, setStado] = useState({})

  const colSpan = {
    0: 2,
    1: 4,
    2: 3,
    3: 4,
    4: 3,
    5: 4,
    6: 3,
    7: 1
  };

  const colSpan1 = {
    0: 1,
    1: 2,
    2: 3,
    3: 2,
    4: 1,
  };
  useEffect(() => {
    if (estado == "pagado") {
      setStado(colSpan)
    } else {
      setStado(colSpan1)
    }
  }, [estado])

  const colSpanMovil = {
    0: 1,
    1: 1,
    2: 1,
    3: 1,
    4: 1,
  };

  return (
    <div className="w-full  ">
      <table {...getTableProps()} className="table w-full rounded-lg relative overflow-x-auto    ">
        <thead className="w-full  ">
          {headerGroups.map((headerGroup, id) => (
            <tr
              {...headerGroup.getHeaderGroupProps()}
              key={id}
              className={`w-full grid grid-cols-4 ${estado == "pagado" ? "md:grid-cols-24" : "md:grid-cols-9"} py-2 bg-base uppercase`}
            >
              {headerGroup.headers.map((column, idx) => (
                <th
                  {...column.getHeaderProps()}
                  key={idx}
                  className={`font-display  font-light text-gray-500 text-sm col-span-${colSpanMovil[idx]} md:col-span-${stado[idx]} `}
                >
                  {t(column.render("Header"))}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()} className="text-gray-500 text-sm  overflow-x-auto   ">
          {rows.length >= 1 ? rows.map((row, id) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                key={id}
                className={`transition border-b border-base hover:bg-base cursor-default w-full grid  ${estado == "pagado" ? "md:grid-cols-24" : "md:grid-cols-9"}`}
              >
                {row.cells.map((cell, idx) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      key={idx}
                      className={`font-display text-sm text-center truncate px-2  py-2 col-span-${colSpanMovil[idx]}  md:col-span-${stado[idx]} `}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          }) : <tr className=" transition border-b border-base hover:bg-base  w-full grid place-items-center">
            <td className="py-5 font-display text-lg text-gray-500 uppercase ">{t("No hay pagos asociados")}</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable; 