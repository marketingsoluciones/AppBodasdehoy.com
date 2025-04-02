import { FC, useEffect, useReducer, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { t } from 'i18next';

interface props {
  data: any
}

interface ColumnVisibility {
  accessor: string
  header?: string
  size?: number
  isHidden?: boolean
  isEdited?: boolean
  isSelected?: boolean
  className?: string
  type?: "string" | "int" | "float"
}

const defaultSize = {
  int: 70,
  float: 140,
  string: 200
}

export const TableBudgetV8: FC<props> = ({ data }) => {
  const initialColumnVisibility: ColumnVisibility[] = [
    { accessor: "categoria", header: t("categoria") },
    { accessor: "gasto", header: t("partida de gasto") },
    { accessor: "unidad", header: t("unidad"), size: defaultSize.int, },
    { accessor: "cantidad", header: t("cantidad"), size: defaultSize.int, className: "justify-center", },
    { accessor: "nombre", header: t("item") },
    { accessor: "valor_unitario", header: t("valor unitario"), size: 100, className: "justify-end", type: "float" },
    { accessor: "coste_final", header: t("coste total"), size: defaultSize.float, className: "justify-end", type: "float" },
    { accessor: "coste_estimado", header: t("coste estimado"), size: defaultSize.float, className: "justify-end", type: "float" },
    { accessor: "pagado", header: t("pagado"), size: defaultSize.float, className: "justify-end", type: "float" },
    { accessor: "pendiente_pagar", header: t("pendiente por pagar"), size: defaultSize.float, className: "justify-end", type: "float" },
  ]
  const rerender = useReducer(() => ({}), {})[1]
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility[]>(initialColumnVisibility);
  const columnHelper = createColumnHelper<any>()

  useEffect(() => {
    if (data) {
      console.log(100080, data)
    }
  }, [data])

  const columns = initialColumnVisibility.map((elem, idx) => {
    const elemtOut = columnHelper.accessor(elem?.accessor ?? elem?.header,
      {
        id: elem?.accessor ?? idx.toString(),
        header: info => elem?.header ?? info.column.id,
        cell: info => {
          if (elem.type === "float") {
            const asd = info.getValue()
            if (typeof asd === "number") {
              return asd.toFixed(2)
            }
          }
          return info.getValue()
        },
        footer: info => info.column.id,
        size: elem?.size,
      })

    return elemtOut
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // useEffect(() => {
  //   const columnVisibility = columns.reduce((acc, item) => {
  //     acc[item.Header] = { visible: true }
  //     return acc
  //   }, {})
  //   setColumnVisibility(columnVisibility)
  // }, [columns])

  return (
    <div className="text-xs w-full h-full">
      <div className='w-full h-full p-2'>
        <table className='bg-gray-200 w-full h-full flex flex-col !rounded-xl overflow-auto' >
          <thead className='flex w-full min-h-8 bg-red sticky top-0 z-20'
            style={{
              minWidth: table.getTotalSize(),
            }}
          >
            {table.getHeaderGroups().map(headerGroup => {
              return (
                <tr key={headerGroup.id} className='bg-primary w-full flex border-b-[1px] border-gray-200'>
                  {headerGroup.headers.map(header => {
                    console.log(100071, header.column.id, header.getContext().column.columnDef.size)
                    return (
                      <th
                        key={header.id}
                        onDoubleClick={() => console.log(header.column.getIndex())}
                        style={{
                          ...(header.getContext().column.columnDef.size
                            ? { width: header.getContext().column.columnDef.size }
                            : { flex: 1 })
                        }}
                        className={`flex justify-center items-center text-white capitalize font-normal ${`${header.column.getIndex() < 2 ? "sticky z-20 left-0 bg-primary" : ""}`} border-gray-300 ${header.column.getIndex() > 2 ? "border-l-[1px]" : `${header.column.getIndex() === 1 ? "border-l-[1px] border-r-[1px]" : ``}`}`.replace(/\s+/g, ' ').replace(/\n+/g, ' ')}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </th>
                    )
                  })}
                </tr>
              )
            })}
          </thead>
          <tbody className='bg-[#eaeeee]'
            style={{
              minWidth: table.getTotalSize(),
            }}
          >
            {table.getRowModel().rows.map((row, idx) => {
              // console.log(100084, row.original?.fatherCategoria)
              return (
                <tr key={row.id} className={`flex ${row.original?.fatherCategoria ? "border-b-[1px] border-gray-300" : ""}`.replace(/\s+/g, ' ').replace(/\n+/g, ' ')}>
                  {row.getVisibleCells().map(cell => {
                    // console.log(100091, cell.getContext())
                    const className = initialColumnVisibility.find(elem => elem.accessor === cell.getContext().column.columnDef.id).className
                    // console.log(100072, cell.column.id, cell.getContext().column.columnDef.size)
                    return (
                      <td
                        key={cell.id}
                        onDoubleClick={() => console.log(row.original)}
                        style={{
                          ...(cell.getContext().column.columnDef.size
                            ? { maxWidth: cell.getContext().column.columnDef.size, width: cell.getContext().column.columnDef.size }
                            : { flex: 1 })
                        }}
                        className={`p-2 flex justify-start items-center text-left ${cell.column.getIndex() < 2 ? "sticky z-10 left-0" : ""}
                        ${cell.column.id === "categoria" || row.original?.fatherCategoria
                            ? `Ca bg-[#e6e6d7] ${!["gasto", "unidad", "cantidad", "nombre", "valor_unitario"].includes(cell.column.id) && "Cc border-l-[1px] border-gray-300"}`
                            : `Cb ${cell.column.id === "gasto" && "Cd bg-[#eaeeee] border-l-[1px] border-gray-300"} 
                             ${row.original?.fatherGasto ? `Ce bg-[#eaeeee] border-b-[1px] border-gray-300 ${!["unidad", "cantidad", "nombre", "valor_unitario",].includes(cell.column.id) && "Cf border-l-[1px] border-gray-300"}` : `Cg ${["unidad", "cantidad", "nombre", "valor_unitario", "coste_final", "coste_estimado",].includes(cell.column.id) ? "Ch border-l-[1px] border-gray-300 bg-white" : ""} Ci ${["unidad", "cantidad", "nombre", "valor_unitario", "coste_final",].includes(cell.column.id) || (row.original?.lastChildGasto && cell.column.id !== "gasto") ? "border-b-[1px] border-gray-300" : ""}`}`} capitalize ${className ? className : ""} ${cell.column.id === "coste_estimado" ? "text-primary" : ""}`.replace(/\s+/g, ' ').replace(/\n+/g, ' ')}
                      >
                        {cell.column.id === "categoria"
                          ? row.original.firstChildGasto || row.original.firstChild
                            ? flexRender(cell.column.columnDef.cell, cell.getContext())
                            : ""
                          : cell.column.id === "gasto"
                            ? !row.original?.fatherCategoria
                              ? row.original?.firstChildItem && flexRender(cell.column.columnDef.cell, cell.getContext())
                              : ""
                            : (cell.column.id === "nombre" && row.original?.fatherCategoria) || (cell.column.id === "nombre" && row.original?.fatherGasto)
                              ? ""
                              : flexRender(cell.column.columnDef.cell, cell.getContext())
                        }
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot
            style={{
              minWidth: table.getTotalSize(),
            }}
          >
            {table.getFooterGroups().map(footerGroup => (
              <tr key={footerGroup.id} className='flex'>
                {footerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{
                      ...(header.getContext().column.columnDef.size
                        ? { width: header.getContext().column.columnDef.size }
                        : { flex: 1 })
                    }}
                    className={`border-gray-300 border-b-[1px] ${`${header.column.getIndex() < 2 ? "sticky left-0 z-20 bg-gray-200 border-r-[1px]" : ""}`} ${header.column.getIndex() > 1 ? "border-l-[1px]" : ``}`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      <button onClick={() => rerender()} className="border p-2 fixed top-0 left-0 bg-teal-600">
        Rerender
      </button>

    </div >
  )
}