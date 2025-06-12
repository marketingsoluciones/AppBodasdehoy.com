import { Dispatch, FC, SetStateAction, useEffect, useReducer, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { t } from 'i18next';
import { EditableLabelWithInput } from '../Forms/EditableLabelWithInput';
import { EditableSelect } from '../Forms/EditableSelect';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { EventContextProvider } from '../../context';
import { FloatOptionsMenuInterface, ModalInterface, VisibleColumn } from '../../utils/Interfaces';
import { DotsOpcionesIcon } from '../icons';
import { useAllowed } from '../../hooks/useAllowed';
import { FloatOptionsMenu } from '../Utils/FloatOptionsMenu';
import { GrMoney } from 'react-icons/gr';
import { GoEye, GoEyeClosed, GoTasklist } from 'react-icons/go';
import { PiNewspaperClippingLight } from 'react-icons/pi';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { handleChange, determinatedPositionMenu, handleCreateItem, handleCreateGasto, handleCreateCategoria, handleChangeEstatus, handleChangeEstatusItem } from "./tableBudgetV8.handles"
import { useToast } from '../../hooks/useToast';
import FormAddPago from '../Forms/FormAddPago';
import ClickAwayListener from 'react-click-away-listener';
import { SelectVisiblesColumns } from './SelectVisiblesColumns';
import { getCurrency } from '../../utils/Funciones';
import { ModalTaskList } from '../Presupuesto/ModalTaskList';

interface props {
  data: any
  showModalDelete: ModalInterface
  setShowModalDelete: Dispatch<SetStateAction<ModalInterface>>
  setLoading: any
  showDataState: any
  setShowDataState: any
  setIdItem: any
}

export interface InitialColumn {
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
  onClick?: Dispatch<SetStateAction<any>>
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

export const TableBudgetV8: FC<props> = ({ data, showModalDelete, setShowModalDelete, setLoading, showDataState, setShowDataState, setIdItem }) => {
  const rerender = useReducer(() => ({}), {})[1]
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()
  const toast = useToast()
  const [columnsVisibility, setColumnVisibility] = useState({});
  const columnHelper = createColumnHelper<any>()
  const [showDotsOptionsMenu, setShowDotsOptionsMenu] = useState<FloatOptionsMenuInterface>()
  const [showFloatOptionsMenu, setShowFloatOptionsMenu] = useState<FloatOptionsMenuInterface>()
  const [RelacionarPagoModal, setRelacionarPagoModal] = useState({ id: "", crear: false, categoriaID: "" })
  const [ServisiosListModal, setServisiosListModal] = useState({ id: "", crear: false, categoriaID: "" })

  const initialColumn: InitialColumn[] = [
    { accessor: "categoria", header: t("categoria"), isEditabled: true },
    { accessor: "gasto", header: t("partida de gasto"), isEditabled: true },
    { accessor: "unidad", header: t("unidad"), size: defaultSize.int, type: "select", isEditabled: true },
    { accessor: "cantidad", header: t("cantidad"), size: defaultSize.int, horizontalAlignment: "center", type: "int" },
    { accessor: "nombre", header: t("item"), isEditabled: true },
    { accessor: "valor_unitario", header: t("valor unitario"), size: 100, horizontalAlignment: "end", type: "float", isEditabled: true },
    { accessor: "coste_final", header: t("coste total"), size: defaultSize.float, horizontalAlignment: "end", type: "float" },
    { accessor: "coste_estimado", header: t("coste estimado"), size: defaultSize.float, horizontalAlignment: "end", type: "float", className: "text-primary", isHidden: !event?.presupuesto_objeto?.viewEstimates },
    { accessor: "pagado", header: t("pagado"), size: defaultSize.float, horizontalAlignment: "end", type: "float" },
    { accessor: "pendiente_pagar", header: t("pendiente por pagar"), size: defaultSize.float, horizontalAlignment: "end", type: "float" },
  ]
  console.log('data', data)
  useEffect(() => {
    const columnsVisibility = event?.presupuesto_objeto?.visibleColumns?.reduce((acc, item) => {
      acc = {
        ...acc,
        [item.accessor]: item.show
      }
      return acc
    }, {})
    setColumnVisibility({ ...columnsVisibility })
  }, [event])

  useEffect(() => {
    if (data) {
      console.log(100080, data)
    }
  }, [data])

  const options = [
    {
      icon: <PiNewspaperClippingLight className="w-4 h-4" />,
      title: "Agregar:",
      object: ["categoria", "gasto", "item"]
    },
    {
      title: "Categoría",
      onClick: (info) => {
        handleCreateCategoria({ info, event, setEvent, setShowDotsOptionsMenu })
          .catch(error => toast("error", "ha ocurrido un error"))
      },
      object: ["categoria", "gasto", "item"]
    },
    {
      title: "Partida",
      onClick: (info) => {
        handleCreateGasto({ info, event, setEvent, setShowDotsOptionsMenu })
          .catch(error => toast("error", "ha ocurrido un error"))
      },
      object: ["categoria", "gasto", "item"]
    },
    {
      title: "Item",
      onClick: (info) => {
        handleCreateItem({ info, event, setEvent, setShowDotsOptionsMenu })
          .catch(error => toast("error", "ha ocurrido un error"))
      },
      object: ["gasto", "item"]
    },
    {
      icon: <GrMoney className="w-4 h-4" />,
      title: "Relacionar Pago",
      onClick: (info) => {
        setShowFloatOptionsMenu({ state: false })
        setRelacionarPagoModal({ id: info.row.original._id, crear: true, categoriaID: info.row.original.categoriaID })
      },
      object: ["gasto"]
    },
    {
      icon: true ? <GoEye className="w-4 h-4" /> : <GoEyeClosed className="w-4 h-4" />,
      title: "Estado",
      onClick: (info) => {
        console.log("???????", info)
        if (info.column.id === "gasto") {
          handleChangeEstatus({ event, categoriaID: info.row.original.categoriaID, gastoId: info.row.original.gastoID, setEvent })
            .catch(error => toast("error", "ha ocurrido un error"))
        }
        if (info.column.id === "nombre") {
          handleChangeEstatusItem({ event, categoriaID: info.row.original.categoriaID, gastoId: info.row.original.gastoID, itemId: info.row.original.itemID, setEvent })
            .catch(error => toast("error", "ha ocurrido un error"))
        }
      },
      object: ["gasto", "item"]
    },
    {
      icon: <GoTasklist className="w-4 h-4" />,
      title: "Task",
      onClick: (info) => {
        setShowFloatOptionsMenu({ state: false })
        setServisiosListModal({ id: info.row.original._id, crear: true, categoriaID: info.row.original.categoriaID })
      },
      object: ["gasto"]

    },
    {
      icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
      title: "Borrar",
      onClick: (info) => {
        setShowModalDelete({ state: true, title: info?.row?.original.nombre, values: info?.row?.original, setShowDotsOptionsMenu })
      },
      object: ["categoria", "gasto", "item"]
    },
  ];

  const columnOptions = columnHelper.accessor("options", {
    id: "options",
    header: null,
    cell: info => {
      return <div className='w-full h-full sticky z-10'>
        {(showDotsOptionsMenu?.state && showDotsOptionsMenu?.values?.info?.row?.original?._id === info.row.original._id) && <FloatOptionsMenu showOptionsMenu={showDotsOptionsMenu} setShowOptionsMenu={setShowDotsOptionsMenu} />}
        <div
          onClick={(e) => {
            if (isAllowed()) {
              const element = document.getElementById(`options-${info.row.original._id}`)
              const position = determinatedPositionMenu({ e, element, height: options.length * 32 })
              if (showDotsOptionsMenu?.values?.info?.row?.original?._id === info.row.original._id && showDotsOptionsMenu?.state === true) {
                setShowDotsOptionsMenu({
                  state: false,
                })
              } else {
                info.row.original?.object === "categoria" && options.splice(3, 1)
                setShowFloatOptionsMenu({ state: false })
                setShowDotsOptionsMenu({
                  state: true,
                  values: {
                    info,
                    aling: position.aling,
                    justify: position.justify,
                    options: options
                  }
                })
              }
            } else {
              ht()
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

  const columns = initialColumn.map((elem, idx) => {
    if (!elem.isHidden) {
      const elemtOut = columnHelper.accessor(elem?.accessor ?? elem?.header,
        {
          id: elem?.accessor ?? idx.toString(),
          header: info => elem?.header ?? info.column.id,
          cell: info => {
            let value = info.getValue()
            return elem.isEditabled || info?.row?.original?.accessorEditables?.includes(elem.accessor)
              ? elem?.type !== "select"
                ?
                <>
                  {
                    elem?.accessor === "gasto" && info?.row?.original?.gastoOriginal?.estatus === false &&
                    <GoEyeClosed className="w-4 h-4 mr-1 " />
                  }
                  {
                    elem?.accessor === "nombre" && info?.row?.original?.itemOriginal?.estatus === true &&
                    <GoEyeClosed className="w-4 h-4 mr-1 " />
                  }
                  <EditableLabelWithInput
                    key={idx}
                    accessor={elem?.accessor}
                    handleChange={(values: any) => {
                      handleChange({ values, info, event, setEvent })
                    }}
                    type={elem?.type}
                    value={value as string | number}
                    textAlign={elem?.horizontalAlignment}
                    isLabelDisabled />
                </>
                : <EditableSelect
                  accessor={elem?.accessor}
                  value={value}
                  optionsSelect={optionsSelect}
                  size={elem?.size}
                  handleChange={(values: any) => {
                    handleChange({ values, info, event, setEvent })
                  }}
                />
              : elem.type === "float"
                ? typeof info.getValue() === "number"
                  ? getCurrency(info.getValue())
                  : null
                : info.getValue()
          },
          footer: info => info.column.id,
          size: elem?.size,
        })
      return elemtOut
    }
  }).filter(Boolean)

  columns.push(columnOptions)

  const table = useReactTable({
    state: {
      columnVisibility: columnsVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    if (showFloatOptionsMenu?.control === "ok" && showDotsOptionsMenu?.control === "ok") {
      const showFloatOptionsMenuNew: FloatOptionsMenuInterface = {
        state: true,
        values: { ...showFloatOptionsMenu.values, ...showDotsOptionsMenu.values }
      }
      setShowFloatOptionsMenu({ ...showFloatOptionsMenuNew })
    }

  }, [showFloatOptionsMenu, showDotsOptionsMenu])

  const handleChangeColumnVisible = (props?: VisibleColumn) => {
    if (props) {
      const f1 = event.presupuesto_objeto.visibleColumns.findIndex(elem => elem.accessor === props.accessor)
      if (f1 > -1) {
        event.presupuesto_objeto.visibleColumns[f1].show = props.show
      } else {
        event.presupuesto_objeto.visibleColumns.push({ accessor: props.accessor, show: props.show })
      }
    } else {
      event.presupuesto_objeto.visibleColumns = []
    }
    fetchApiEventos({
      query: queries.editVisibleColumns,
      variables: {
        evento_id: event?._id,
        visibleColumns: event.presupuesto_objeto.visibleColumns
      },
    })
    setEvent({ ...event })
  }

  return (
    < div className="text-sm w-full h-full font-calibri relative." >
      <div className='absolute z-30 right-5 translate-y-2'>
        <SelectVisiblesColumns columns={initialColumn} table={table} handleChangeColumnVisible={handleChangeColumnVisible} showDataState={showDataState} setShowDataState={setShowDataState} />
      </div>
      {
        RelacionarPagoModal.crear &&
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <ClickAwayListener onClickAway={() => RelacionarPagoModal.crear && setRelacionarPagoModal({ id: "", crear: false, categoriaID: "" })}>
            <div className="relative bg-white rounded-xl shadow-lg p-8 w-full max-w-xl h-[90%] overflow-auto">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition transform hover:scale-110"
                onClick={() => setRelacionarPagoModal({ id: "", crear: false, categoriaID: "" })}
              >
                X
              </button>
              <FormAddPago GastoID={RelacionarPagoModal?.id} cate={RelacionarPagoModal?.categoriaID} />
            </div>
          </ClickAwayListener>
        </div>
      }
      {
        ServisiosListModal.crear &&
        <ClickAwayListener onClickAway={() => ServisiosListModal.crear && setServisiosListModal({ id: "", crear: false, categoriaID: "" })}>
          <div >
            <ModalTaskList
              setModal={setServisiosListModal}
              categoria={ServisiosListModal?.categoriaID}
              gasto={ServisiosListModal?.id}
              event={event}
              setEvent={setEvent}
            />
          </div>
        </ClickAwayListener>
      }
      {
        showFloatOptionsMenu?.state &&
        <FloatOptionsMenu showOptionsMenu={showFloatOptionsMenu} setShowOptionsMenu={setShowFloatOptionsMenu} />
      }

      <div className='w-full h-full p-2 ' >
        <table
          className='bg-gray-200 w-full h-full flex flex-col !rounded-xl overflow-auto relative'
          onContextMenuCapture={(e) => {
            const element = document.getElementById("ElementEditable")
            if (isAllowed()) {
              if (!element) {
                const position = { x: e.clientX - 8, y: e.clientY - 144 - 124 }
                setShowFloatOptionsMenu({ state: false, values: { info: undefined, position, options }, control: "ok" })
              }
            }
          }}
        >
          <thead className='flex w-full min-h-8 sticky top-0 z-20'
            style={{
              minWidth: table.getTotalSize(),
            }}
          >
            {table.getHeaderGroups().map(headerGroup => {
              return (
                <tr key={headerGroup.id} className='bg-primary w-full flex border-b-[1px] border-gray-200'>
                  {headerGroup.headers.map(header => {
                    return (
                      <th
                        key={header.id}
                        //onDoubleClick={() => console.log(header.column.getIndex())}
                        style={{
                          ...(header.getContext().column.columnDef.size
                            ? { width: header.getContext().column.columnDef.size }
                            : { flex: 1 })
                        }}
                        className={`flex justify-center items-center text-white capitalize ${`${header.column.getIndex() < 2 ? "sticky z-20 left-0 bg-primary" : ""}`} border-gray-300 ${header.column.getIndex() > 2 ? "border-l-[1px]" : `${header.column.getIndex() === 1 ? "border-l-[1px] border-r-[1px]" : ``}`}`.replace(/\s+/g, ' ').replace(/\n+/g, ' ')}
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
            {/* --------------------------------------------------------------------------------------------------------------------------------------------*/}
            {table.getRowModel().rows.map((row, idx) => {
              return (
                <tr
                  key={row.id}
                  onMouseDown={() => { }}
                  className={`flex ${row.original?.fatherCategoria ? "border-b-[1px] border-gray-300" : ""}`.replace(/\s+/g, ' ').replace(/\n+/g, ' ')}
                >
                  {row.getVisibleCells().map(cell => {
                    const verticalAlignment = initialColumn.find(elem => elem.accessor === cell.getContext().column.columnDef.id)?.verticalAlignment
                    const horizontalAlignment = initialColumn.find(elem => elem.accessor === cell.getContext().column.columnDef.id)?.horizontalAlignment
                    const className = `
                      ${horizontalAlignment === "start" ? "justify-start" : horizontalAlignment === "center" ? "justify-center" : horizontalAlignment === "end" ? "justify-end" : ""}
                      ${verticalAlignment === "start" ? "items-start" : verticalAlignment === "center" ? "items-center" : verticalAlignment === "end" ? "items-end" : ""}
                    `.replace(/\s+/g, ' ').replace(/\n+/g, ' ')
                    // const value = cell.column.id === "categoria"
                    //   ? row.original.firstChildGasto || row.original.firstChild
                    //     ? cell.getValue()
                    //     : ""
                    //   : cell.column.id === "gasto"
                    //     ? !row.original?.fatherCategoria
                    //       ? row.original?.firstChildItem && cell.getValue()
                    //       : ""
                    //     : (cell.column.id === "nombre" && row.original?.fatherCategoria) || (cell.column.id === "nombre" && row.original?.fatherGasto)
                    //       ? ""
                    //       : cell.getValue()
                    return (
                      <td
                        id={`${cell.column.id}-${row.original._id}`}
                        onContextMenuCapture={(e) => {
                          const element = document.getElementById("ElementEditable")
                          let infoAsd = cell.getContext()
                          let info = cell.column.id === "categoria"
                            ? table.getRowModel().rows.find(elem => elem.original._id === infoAsd.row.original.categoriaID).getVisibleCells().find(elem => elem.column.id === cell.column.id)
                            : cell.column.id === "gasto"
                              ? table.getRowModel().rows.find(elem => elem.original._id === infoAsd.row.original.gastoID)?.getVisibleCells().find(elem => elem.column.id === cell.column.id)
                              : cell.getContext()
                          if (!element) {
                            const positionAsd = determinatedPositionMenu({ e, height: options.length * 32, width: 200 })
                            setShowDotsOptionsMenu({
                              state: false, values: {
                                info: info ?? infoAsd,
                                aling: positionAsd.aling,
                                justify: positionAsd.justify,
                                options
                              }, control: "ok"
                            })
                            e.preventDefault()
                          }
                        }}
                        key={cell.id}
                        //onDoubleClick={() => console.log(row.original)}
                        onClick={() => {
                          const initialValue = initialColumn.find(elem => elem.accessor === cell.getContext().column.columnDef.id)
                          !!initialValue && !!initialValue["onClick"] && initialValue.onClick(cell.getContext())
                        }}
                        style={{
                          ...(cell.getContext().column.columnDef.size
                            ? { maxWidth: cell.getContext().column.columnDef.size, width: cell.getContext().column.columnDef.size }
                            : { flex: 1 })
                        }}
                        className={`p-2 cursor-context-menu flex justify-start items-center text-left ${cell.column.getIndex() < 2
                          ? "sticky z-10 left-0"
                          : ""}
                        ${cell.column.id === "categoria" || row.original?.fatherCategoria
                            ? `Ca ${row.original?.categoriaID !== showDotsOptionsMenu?.values?.info?.row?.original?._id
                              ? "bg-[#e6e6d7]"
                              : "bg-[#d1dae3]"} ${!["gasto", "unidad", "cantidad", "nombre", "valor_unitario"].includes(cell.column.id) && "Cc border-l-[1px] border-gray-300"}`
                            : `Cb ${cell.column.id === "gasto" && `Cd ${row.original?.gastoID !== showDotsOptionsMenu?.values?.info?.row?.original?._id
                              ? "bg-[#eaeeee]"
                              : "!bg-[#d8dcde]"} border-l-[1px] border-gray-300`} ${row.original?.fatherGasto
                                ? `Ce ${row.original?.gastoID !== showDotsOptionsMenu?.values?.info?.row?.original?._id
                                  ? "bg-[#eaeeee]"
                                  : "!bg-[#d8dcde]"} border-b-[1px] border-gray-300 ${!["unidad", "cantidad", "nombre", "valor_unitario",].includes(cell.column.id)
                                  && "Cf border-l-[1px] border-gray-300"}`
                                : `Cg ${["unidad", "cantidad", "nombre", "valor_unitario", "coste_final", "coste_estimado", "pagado", "pendiente_pagar", "options"].includes(cell.column.id)
                                  ? `Ch ${row.original?.itemID !== showDotsOptionsMenu?.values?.info?.row?.original?._id
                                    ? "bg-white" : "!bg-[#f5f2ea]"} CI ${["unidad", "cantidad", "nombre", "valor_unitario", "coste_final", "coste_estimado", "options"].includes(cell.column.id)
                                      ? "border-l-[1px] border-gray-300"
                                      : ""}` : ""} CJ ${["unidad", "cantidad", "nombre", "valor_unitario", "coste_final", "coste_estimado", "pagado", "pendiente_pagar", "options"].includes(cell.column.id) || (row.original?.lastChildGasto && cell.column.id !== "gasto")
                                        ? "border-b-[1px] border-gray-300"
                                        : ""}`}`} CK ${className
                                          ? className
                                          : ""} ${cell.column.id === "coste_estimado"
                                            ? "text-primary"
                                            : ""}`
                          .replace(/\s+/g, ' ').replace(/\n+/g, ' ')}
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
            {/* --------------------------------------------------------------------------------------------------------------------------------------------*/}
          </tbody>
          <tfoot
            style={{
              minWidth: table.getTotalSize(),
            }}
          >
            <tr className='flex'>
              {table.getAllLeafColumns().map((column, idx) => {

                return (
                  <th
                    key={column.id}
                    style={{
                      ...(column.columnDef.size
                        ? { width: column.columnDef.size }
                        : { flex: 1 })
                    }}
                    className={` text-right`}
                  >
                    {idx === 5
                      ? "Total"
                      : column.id === "coste_final"
                        ? getCurrency(
                          table
                            .getRowModel()
                            .rows
                            .filter(row => row.original?.fatherCategoria)
                            .reduce(
                              (acc, row) =>
                                acc +
                                (typeof row.original.coste_final === "number"
                                  ? row.original.coste_final
                                  : 0),
                              0
                            )
                        )
                        : column.id === "coste_estimado"
                          ? getCurrency(
                            table
                              .getRowModel()
                              .rows
                              .filter(row => row.original?.fatherCategoria)
                              .reduce(
                                (acc, row) =>
                                  acc +
                                  (typeof row.original.coste_estimado === "number"
                                    ? row.original.coste_estimado
                                    : 0),
                                0
                              )
                          )
                          : column.id === "pendiente_pagar"
                            ? getCurrency(
                              table
                                .getRowModel()
                                .rows
                                .filter(row => row.original?.fatherCategoria)
                                .reduce(
                                  (acc, row) =>
                                    acc +
                                    (typeof row.original.pendiente_pagar === "number"
                                      ? row.original.pendiente_pagar
                                      : 0),
                                  0
                                )
                            )
                            : null}
                  </th>
                )
              })}
            </tr>
          </tfoot>
          {/* <tfoot
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
          </tfoot> */}
        </table>
      </div>
    </div >
  )
}