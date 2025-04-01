import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useExpanded, useTable, useRowSelect, useSortBy } from "react-table";
import { t } from 'i18next';

interface props {
  data: any
}
export const TableBudget: FC<props> = ({ data }) => {
  const [columnVisibility, setColumnVisibility] = useState({});


  useEffect(() => {
    if (data) {
      console.log(data)
    }
  }, [data])

  console.log(data)

  const columns = useMemo(
    () => [
      {
        Header: "Categoría", accessor: "Categoría",
        Cell: (data) => {
          console.log(data)
          return (<>algo</>)
        }
      }, {
        Header: "Part. de Gasto", accessor: "Part. de Gasto",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Und.", accessor: "Und.",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Can.", accessor: "Can.",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Item", accessor: "Item",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Val.", accessor: "Val.",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Unitario", accessor: "Unitario",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Coste", accessor: "Coste",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Total	Coste", accessor: "Total	Coste",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Estimado", accessor: "Estimado",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Pagado", accessor: "Pagado",
        Cell: (data) => {
          return (<>algo</>)
        }
      }, {
        Header: "Pnd. por Pagar", accessor: "Pnd. por Pagar",
        Cell: (data) => {
          return (<>algo</>)
        }
      },],
    []
  );

  useEffect(() => {
    const columnVisibility = columns.reduce((acc, item) => {
      acc[item.Header] = { visible: true }
      return acc
    }, {})
    setColumnVisibility(columnVisibility)
  }, [columns])

  const colSpan = {
    columna1: 1,
    columna2: 1,
  };

  const visibleColumns = useMemo(
    () => columns.filter(column => columnVisibility[column.accessor]?.visible),
    [columns, columnVisibility]
  );

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable(
    { columns: visibleColumns, data }, useSortBy, useExpanded,
  );

  const renderRowSubComponent = useCallback(({ row }) => {
    return (
      <div>hola</div>
    )
  }, [visibleColumns]);


  return (
    <table {...getTableProps()} className="table-auto border-collapse rounded-lg relative p-4 overflow-x-auto w-[900px]">
      <thead className="relative text-xs text-gray-700 uppercase">
        {headerGroups.map((headerGroup: any, id: any) => {
          return (
            <tr
              {...headerGroup.getHeaderGroupProps()}
              className="grid grid-cols-19"
              key={id} >
              {headerGroup.headers.map((column: any, id: any) => {
                return (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className={`bg-[#e6e6d7] leading-[1] px-1 py-1 md:py-2 text-center flex justify-center items-center text-xs font-light font-display col-span-${colSpan[column.id]
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
            <>
              <tr
                {...row.getRowProps()}
                key={i}
                className={`w-full font-display grid grid-cols-19`}
              >
                {row.cells.map((cell, i) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      key={i}
                      className={`bg-[#eaecee] flex leading-[1.3] px-1 py-1 col-span-${colSpan[cell.column.id]} ${cell.column?.className}  `}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            </>

          );
        }) : <tbody className='h-[50px] capitalize flex items-center justify-center text-azulCorporativo bg-white'>
          <tr>
            <td colSpan={16}>No hay datos disponibles.</td>
          </tr>
        </tbody>}
      </tbody>
    </table>
  )
}




