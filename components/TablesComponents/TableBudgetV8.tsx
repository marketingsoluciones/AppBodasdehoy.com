import { FC, useEffect, useReducer, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { t } from 'i18next';
import { EditableLabelWithInput } from '../Forms/EditableLabelWithInput';
import { EditableSelect } from '../Forms/EditableSelect';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { EventContextProvider } from '../../context';
import { DotsMenu } from '../../utils/Interfaces';
import { DotsOpcionesIcon } from '../icons';
import { useAllowed } from '../../hooks/useAllowed';
import { DotsOptionsMenu } from '../Utils/DotsOptionsMenu';
import { GrMoney } from 'react-icons/gr';
import { GoEye, GoEyeClosed, GoTasklist } from 'react-icons/go';
import { PiNewspaperClippingLight } from 'react-icons/pi';
import { MdOutlineDeleteOutline } from 'react-icons/md';

interface props {
  data: any
}

interface ColumnVisibility {
  accessor: string
  header?: string
  size?: number
  isHidden?: boolean
  isEditabled?: boolean
  isSelected?: boolean
  verticalAlignment?: "start" | "center" | "end"
  horizontalAlignment?: "start" | "center" | "end"
  className?: string
  type?: "string" | "int" | "float" | "select"
}

const defaultSize = {
  int: 70,
  float: 140,
  string: 200
}

const optionsSelect = [
  { title: "xUni", value: "xUni." },
  { title: "xInv", value: "xInv." },
  { title: "xAdultos", value: "xAdultos." },
  { title: "xNiños", value: "xNiños." },
]

export const TableBudgetV8: FC<props> = ({ data }) => {
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()

  const initialColumnVisibility: ColumnVisibility[] = [
    { accessor: "categoria", header: t("categoria"), isEditabled: true },
    { accessor: "gasto", header: t("partida de gasto"), isEditabled: true },
    { accessor: "unidad", header: t("unidad"), size: defaultSize.int, type: "select", isEditabled: true },
    { accessor: "cantidad", header: t("cantidad"), size: defaultSize.int, horizontalAlignment: "center", type: "int", isEditabled: true },
    { accessor: "nombre", header: t("item"), isEditabled: true },
    { accessor: "valor_unitario", header: t("valor unitario"), size: 100, horizontalAlignment: "end", type: "float", isEditabled: true },
    { accessor: "coste_final", header: t("coste total"), size: defaultSize.float, horizontalAlignment: "end", type: "float" },
    { accessor: "coste_estimado", header: t("coste estimado"), size: defaultSize.float, horizontalAlignment: "end", type: "float", className: "text-primary" },
    { accessor: "pagado", header: t("pagado"), size: defaultSize.float, horizontalAlignment: "end", type: "float" },
    { accessor: "pendiente_pagar", header: t("pendiente por pagar"), size: defaultSize.float, horizontalAlignment: "end", type: "float" },
  ]
  const rerender = useReducer(() => ({}), {})[1]
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility[]>(initialColumnVisibility);
  const columnHelper = createColumnHelper<any>()
  const [showDotsOptionsMenu, setShowDotsOptionsMenu] = useState<{ state: boolean, values: DotsMenu }>()


  useEffect(() => {
    if (data) {
      console.log(100080, data)
    }
  }, [data])

  const handleChange: any = ({ values, info }) => {
    try {
      const original = info.row.original
      if (original.object === "item" && (!["categoria", "gasto"].includes(values.accessor))) {
        fetchApiEventos({
          query: queries.editItemGasto,
          variables: {
            evento_id: event?._id,
            categoria_id: original?.categoriaID,
            gasto_id: original?.gastoID,
            itemGasto_id: original?.itemID,
            variable: values.accessor,
            valor: values.value
          }
        }).then((result: any) => {
          event.presupuesto_objeto = result
          setEvent({ ...event })
          return
        }).catch((error) => {
          console.log(error);
        })
      }
      if ((original.object === "gasto" && (!["categoria"].includes(values.accessor)) || (original.object === "item" && values.accessor === "gasto"))) {
        fetchApiEventos({
          query: queries.editGasto,
          variables: {
            evento_id: event?._id,
            categoria_id: original?.categoriaID,
            gasto_id: original?.gastoID,
            variable_reemplazar: values.accessor === "gasto" ? "nombre" : values.accessor,
            valor_reemplazar: values.value
          }
        }).then((result: any) => {
          event.presupuesto_objeto = result
          setEvent({ ...event })
          return
        }).catch((error) => {
          console.log(error);
        })
      }
      if (original.object === "categoria" || (original.object === "gasto" && values.accessor === "categoria") || (original.object === "item" && values.accessor === "categoria")) {
        fetchApiEventos({
          query: queries.editCategoria,
          variables: {
            evento_id: event?._id,
            categoria_id: original?.categoriaID,
            nombre: values.value
          }
        }).then((result: any) => {
          // event.presupuesto_objeto = result
          // setEvent({ ...event })
          return
        }).catch((error) => {
          console.log(error);
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  const determinatedPositionMenu = ({ e, height = 0, width = 0 }): { aling: "top" | "botton", justify: "start" | "end" } => {
    const trElement = e.currentTarget.offsetParent as HTMLElement
    const tableElement = trElement.offsetParent
    // const tableElementWidth = tableElementHeight.offsetParent
    const aling = trElement.offsetTop + height + 30 > tableElement.scrollTop + tableElement.clientHeight
      ? "botton"
      : "top"
    const justify = trElement.offsetLeft - width - 20 < 0
      ? "start" : "end"
    return { justify, aling }
  }

  const options = [
    {
      icon: <PiNewspaperClippingLight className="w-4 h-4" />,
      title: "Agregar:",
      //onClick: () => { console.log("Agregar categoría") }
    },
    {
      // icon: <GrMoney className="w-4 h-4" />,
      title: "Categoría",
      onClick: () => { console.log("Categoría") }
    },
    {
      // icon: <GrMoney className="w-4 h-4" />,
      title: "Partida",
      onClick: () => { console.log("Partida") }
    },
    {
      // icon: <GrMoney className="w-4 h-4" />,
      title: "Item",
      onClick: () => { console.log("Item") }// handleCreateItem()
    },
    {
      icon: <GrMoney className="w-4 h-4" />,
      title: "Relacionar Pago",
      onClick: () => { console.log("Relacionar Pago") }//handlePago()
    },
    {
      icon: true ? <GoEye className="w-4 h-4" /> : <GoEyeClosed className="w-4 h-4" />,
      title: "Estado",
      onClick: () => { console.log("Estado") }//handleChangeState()
    },
    {
      icon: <GoTasklist className="w-4 h-4" />,
      title: "Task",
      onClick: () => { console.log("Task") }//setShow(true)
    },
    {
      icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
      title: "Borrar",
      onClick: () => { console.log("Borrar") }//handleRemove()
    },
  ];

  const columnOptions = columnHelper.accessor("options", {
    id: "options",
    header: "",
    cell: info => {
      return <div id='TR' className='w-full h-full relative'>
        {(showDotsOptionsMenu?.state && showDotsOptionsMenu.values.info.row.original._id === info.row.original._id) && <DotsOptionsMenu showDotsOptionsMenu={showDotsOptionsMenu} setShowDotsOptionsMenu={setShowDotsOptionsMenu} />
        }
        <div
          onClick={(e) => {
            if (isAllowed()) {
              const position = determinatedPositionMenu({ e, height: options.length * 32, width: 150 })
              setShowDotsOptionsMenu({
                state: showDotsOptionsMenu?.values?.info?.row?.original?._id === info.row.original._id ? !showDotsOptionsMenu.state : true,
                values: {
                  info,
                  aling: position.aling,
                  justify: position.justify,
                  options
                }
              })
            }
          }}
          className='w-full h-full flex justify-center items-center cursor-pointer'
        >
          <DotsOpcionesIcon className={`w-3 h-3`} />


        </div>
      </div>
    },
    footer: "",
    size: 45,
  })

  const columns = initialColumnVisibility.map((elem, idx) => {
    const elemtOut = columnHelper.accessor(elem?.accessor ?? elem?.header,
      {
        id: elem?.accessor ?? idx.toString(),
        header: info => elem?.header ?? info.column.id,
        cell: info => {

          let value = info.getValue()
          return elem.isEditabled || info?.row?.original?.accessorEditables?.includes(elem.accessor)
            ? elem?.type !== "select"
              ? <EditableLabelWithInput
                key={idx}
                accessor={elem?.accessor}
                handleChange={(values: any) => { handleChange({ values, info }) }}
                type={elem?.type}
                value={value as string | number}
                textAlign={elem?.horizontalAlignment}
                isLabelDisabled />
              : <EditableSelect
                accessor={elem?.accessor}
                value={value}
                optionsSelect={optionsSelect}
                size={elem?.size}
                handleChange={(values: any) => { handleChange({ values, info }) }}
              />
            : elem.type === "float"
              ? typeof info.getValue() === "number"
                ? info.getValue().toFixed(2)
                : null
              : info.getValue()
        },
        footer: info => info.column.id,
        size: elem?.size,
      })
    return elemtOut
  })


  columns.push(columnOptions)
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
          <thead className='flex w-full min-h-8 sticky top-0 z-20'
            style={{
              minWidth: table.getTotalSize(),
            }}
          >
            {table.getHeaderGroups().map(headerGroup => {
              return (
                <tr key={headerGroup.id} className='bg-primary w-full flex border-b-[1px] border-gray-200'>
                  {headerGroup.headers.map(header => {
                    // console.log(100071, header.column.id, header.getContext().column.columnDef.size)
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
          <tbody className='bg-[#eaeeee] relative'
            style={{
              minWidth: table.getTotalSize(),
            }}
          >
            {table.getRowModel().rows.map((row, idx) => {
              // console.log(100084, row.original?.fatherCategoria)
              return (
                <tr
                  key={row.id}
                  onMouseDown={() => { }}
                  onContextMenuCapture={(e) => { e.preventDefault() }}
                  className={`flex ${row.original?.fatherCategoria ? "border-b-[1px] border-gray-300" : ""}`.replace(/\s+/g, ' ').replace(/\n+/g, ' ')}
                >
                  {row.getVisibleCells().map(cell => {
                    // console.log(100091, cell.getContext())
                    const verticalAlignment = initialColumnVisibility.find(elem => elem.accessor === cell.getContext().column.columnDef.id)?.verticalAlignment
                    const horizontalAlignment = initialColumnVisibility.find(elem => elem.accessor === cell.getContext().column.columnDef.id)?.horizontalAlignment
                    const className = `
                      ${horizontalAlignment === "start" ? "justify-start" : horizontalAlignment === "center" ? "justify-center" : horizontalAlignment === "end" ? "justify-end" : ""}
                      ${verticalAlignment === "start" ? "items-start" : verticalAlignment === "center" ? "items-center" : verticalAlignment === "end" ? "items-end" : ""}
                    `.replace(/\s+/g, ' ').replace(/\n+/g, ' ')

                    // console.log(100072, cell.getValue(), cell.getContext().column.columnDef)
                    const value = cell.column.id === "categoria"
                      ? row.original.firstChildGasto || row.original.firstChild
                        ? cell.getValue()
                        : ""
                      : cell.column.id === "gasto"
                        ? !row.original?.fatherCategoria
                          ? row.original?.firstChildItem && cell.getValue()
                          : ""
                        : (cell.column.id === "nombre" && row.original?.fatherCategoria) || (cell.column.id === "nombre" && row.original?.fatherGasto)
                          ? ""
                          : cell.getValue()


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
                             ${row.original?.fatherGasto ? `Ce bg-[#eaeeee] border-b-[1px] border-gray-300 ${!["unidad", "cantidad", "nombre", "valor_unitario",].includes(cell.column.id) && "Cf border-l-[1px] border-gray-300"}` : `Cg ${["unidad", "cantidad", "nombre", "valor_unitario", "coste_final", "coste_estimado", "pagado", "pendiente_pagar"].includes(cell.column.id) ? `Ch bg-white ${["unidad", "cantidad", "nombre", "valor_unitario", "coste_final", "coste_estimado"].includes(cell.column.id) ? "border-l-[1px] border-gray-300" : ""}` : ""} Ci ${["unidad", "cantidad", "nombre", "valor_unitario", "coste_final", "coste_estimado", "pagado", "pendiente_pagar"].includes(cell.column.id) || (row.original?.lastChildGasto && cell.column.id !== "gasto") ? "border-b-[1px] border-gray-300" : ""}`}`} ${className ? className : ""} ${cell.column.id === "coste_estimado" ? "text-primary" : ""}`.replace(/\s+/g, ' ').replace(/\n+/g, ' ')}
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