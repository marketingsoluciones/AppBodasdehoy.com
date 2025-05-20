import { FC, useMemo, useRef } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { useTranslation } from 'react-i18next';

export const ItineraryTable: FC<any> = ({ columns, data = [], selectTask, setSelectTask }) => {
  const { t } = useTranslation();
  const headerRef = useRef(null);

  // Filtrar columnas visibles
  const visibleColumns = useMemo(() => columns.filter((col) => !col.isHidden), [columns]);

  // Configuración de la tabla con react-table
  const { 
    getTableProps, 
    getTableBodyProps, 
    headerGroups, 
    prepareRow, 
    rows,
    totalColumnsWidth
  } = useTable(
    {
      columns: visibleColumns,
      data,
      defaultColumn: { 
        minWidth: 100, 
        width: 200, 
        maxWidth: 400 
      },
    },
    useSortBy,
    useRowSelect
  );

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table
          {...getTableProps()}
          className="table-auto border-collapse w-full rounded-lg relative"
          style={{ minWidth: '100%' }}
        >
          <thead className="relative text-xs text-gray-700 uppercase w-full" ref={headerRef}>
            {headerGroups.map((headerGroup: any, id: any) => {
              return (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  className="flex w-full"
                  key={id}
                >
                  {headerGroup.headers.map((column: any, id: any) => {
                    return (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className={`bg-gray-200 leading-[1] px-1 py-1 md:py-3 text-center flex justify-center items-center text-xs font-light font-display relative border-r border-gray-300 ${column.isHidden ? 'hidden' : ''}`}
                        style={{
                          width: column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth,
                        }}
                        key={id}
                      >
                        <div className="flex items-center justify-center w-full">
                          {typeof column.render("Header") == "string" && t(column.render("Header"))}
                          <span className="ml-1">
                            {column.isSorted ? (
                              column.isSortedDesc ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v12.59l1.95-2.1a.75.75 0 1 1 1.1 1.02l-3.25 3.5a.75.75 0 0 1-1.1 0l-3.25-3.5a.75.75 0 1 1 1.1-1.02l1.95 2.1V2.75A.75.75 0 0 1 10 2Z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path fillRule="evenodd" d="M10 18a.75.75 0 0 1-.75-.75V4.66L7.3 6.76a.75.75 0 0 1-1.1-1.02l3.25-3.5a.75.75 0 0 1 1.1 0l3.25 3.5a.75.75 0 1 1-1.1 1.02l-1.95-2.1v12.59A.75.75 0 0 1 10 18Z" clipRule="evenodd" />
                                </svg>
                              )
                            ) : ""}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()} className="text-gray-700 text-xs">
            {rows.length >= 1 ? rows.map((row, i) => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  key={i}
                  className="flex w-full font-display hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectTask(row.original?._id)}
                >
                  {row.cells.map((cell, i) => {
                    return (
                      <td
                        {...cell.getCellProps()}
                        key={i}
                        className={`${selectTask === row.original._id ? "bg-gray-100" : "bg-white"} flex items-center justify-center leading-[1.3] px-1 py-1 border-b border-r border-gray-300 ${cell.column.isHidden ? 'hidden' : ''}`}
                        style={{
                          width: cell.column.width,
                          minWidth: cell.column.minWidth,
                          maxWidth: cell.column.maxWidth,
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          {cell.render("Cell")}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            }) : (
              <tr className="flex w-full">
                <td className="flex-1 py-5 text-center text-gray-500">
                  {t("No hay datos disponibles")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};