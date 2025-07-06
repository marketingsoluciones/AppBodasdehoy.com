import { Dispatch, FC, SetStateAction, useEffect, useReducer, useState, useMemo } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { t } from 'i18next';
import { EditableLabelWithInput } from '../Forms/EditableLabelWithInput';
import { EditableSelect } from '../Forms/EditableSelect';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { FloatOptionsMenuInterface, ModalInterface, VisibleColumn } from '../../utils/Interfaces';
import { DotsOpcionesIcon } from '../icons';
import { useAllowed } from '../../hooks/useAllowed';
import { FloatOptionsMenu } from '../Utils/FloatOptionsMenu';
import { GrMoney } from 'react-icons/gr';
import { GoEye, GoEyeClosed, GoTasklist } from 'react-icons/go';
import { PiNewspaperClippingLight } from 'react-icons/pi';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { IoSettingsOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { handleChange, determinatedPositionMenu, handleCreateItem, handleCreateGasto, handleCreateCategoria, handleChangeEstatus, handleChangeEstatusItem } from "./tableBudgetV8.handles"
import { useToast } from '../../hooks/useToast';
import FormAddPago from '../Forms/FormAddPago';
import ClickAwayListener from 'react-click-away-listener';
import { SelectVisiblesColumns } from './SelectVisiblesColumns';
import { getCurrency } from '../../utils/Funciones';
import { ModalTaskList } from '../Presupuesto/ModalTaskList';
import { EventInfoModal } from '../Presupuesto/PresupuestoV2/modals/EventInfoModal';

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

  // Estado para el modal de información
  const [showEventInfoModal, setShowEventInfoModal] = useState(false);

  // Estados para el buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const initialColumn: InitialColumn[] = [
    { accessor: "categoria", header: t("categoria"), isEditabled: true, size: 140 },
    { accessor: "gasto", header: t("partida de gasto"), isEditabled: true, size: 180 },
    { accessor: "unidad", header: t("unidad"), size: 50, type: "select", isEditabled: true, horizontalAlignment: "center" },
    { accessor: "cantidad", header: t("cantidad"), size: 50, horizontalAlignment: "center", type: "int" },
    { accessor: "nombre", header: t("item"), isEditabled: true, size: 120 },
    { accessor: "valor_unitario", header: t("valor unitario"), size: 90, horizontalAlignment: "end", type: "float", isEditabled: true },
    { accessor: "coste_final", header: t("coste total"), size: 90, horizontalAlignment: "end", type: "float" },
    { accessor: "coste_estimado", header: t("coste estimado"), size: 90, horizontalAlignment: "end", type: "float", className: "text-blue-600", isHidden: !event?.presupuesto_objeto?.viewEstimates },
    { accessor: "pagado", header: t("pagado"), size: 90, horizontalAlignment: "end", type: "float" },
    { accessor: "pendiente_pagar", header: t("pendiente por pagar"), size: 90, horizontalAlignment: "end", type: "float" },
  ]

  // Función para filtrar los datos basada en el término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    return data.filter((item: any) => {
      // Buscar en campos de texto
      const searchableFields = [
        item.categoria,
        item.gasto,
        item.nombre,
        item.unidad
      ];

      // Buscar en campos numéricos convertidos a string
      const numericFields = [
        item.cantidad?.toString(),
        item.valor_unitario?.toString(),
        item.coste_final?.toString(),
        item.coste_estimado?.toString(),
        item.pagado?.toString(),
        item.pendiente_pagar?.toString()
      ];

      const allFields = [...searchableFields, ...numericFields];

      return allFields.some(field =>
        field && field.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

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
        if (info.row.original.object === 'gasto') {
          handleChangeEstatus({ event, categoriaID: info.row.original.categoriaID, gastoId: info.row.original.gastoID, setEvent })
            .catch(error => { toast("error", "ha ocurrido un error"), console.log(error) })
        }

        if (info.row.original.object === 'item') {
          handleChangeEstatusItem({ event, categoriaID: info.row.original.categoriaID, gastoId: info.row.original.gastoID, itemId: info.row.original.itemID, setEvent })
            .catch(error => { toast("error", "ha ocurrido un error"), console.log(error) })
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

  // Función para obtener los estilos de fila según el tipo
  const getRowStyles = (row: any) => {
    if (row.original?.fatherCategoria) {
      return "bg-blue-50 font-semibold text-blue-800"; // Categoría
    } else if (row.original?.fatherGasto) {
      return "bg-gray-50 font-medium text-gray-800"; // Gasto
    } else {
      return "bg-white font-normal text-gray-800"; // Item
    }
  };

  // Función para formatear números
  const formatNumber = (value: number) => {
    if (typeof value !== 'number') return String(value || 0);
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const columnOptions = columnHelper.accessor("options", {
    id: "options",
    header: null,
    cell: info => {
      return (
        <div className='w-full h-full flex justify-center items-center'>
          {(showDotsOptionsMenu?.state && showDotsOptionsMenu?.values?.info?.row?.original?._id === info.row.original._id) &&
            <FloatOptionsMenu showOptionsMenu={showDotsOptionsMenu} setShowOptionsMenu={setShowDotsOptionsMenu} />
          }
          <button
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
            className='text-gray-400 hover:text-gray-600 p-1 rounded transition-colors'
            data-options-trigger="true"
          >
            <IoSettingsOutline className="w-3 h-3" />
          </button>
        </div>
      )
    },
    footer: "",
    size: 60,
  })

  const columns = initialColumn.map((elem, idx) => {
    if (!elem.isHidden) {
      const elemtOut = columnHelper.accessor(elem?.accessor ?? elem?.header,
        {
          id: elem?.accessor ?? idx.toString(),
          header: info => elem?.header ?? info.column.id,
          cell: info => {
            let value = info.getValue()
            const isHidden = (elem?.accessor === "gasto" && info?.row?.original?.gastoOriginal?.estatus === false) ||
              (elem?.accessor === "nombre" && info?.row?.original?.itemOriginal?.estatus === true);

            return elem.isEditabled || info?.row?.original?.accessorEditables?.includes(elem.accessor)
              ? elem?.type !== "select"
                ?
                <div className="flex items-center gap-2">
                  {isHidden && <GoEyeClosed className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  <EditableLabelWithInput
                    key={idx}
                    accessor={elem?.accessor}
                    handleChange={(values: any) => {
                      handleChange({ values, info, event, setEvent })
                    }}
                    type={elem?.type}
                    value={value as string | number}
                    textAlign={elem?.horizontalAlignment}
                    isLabelDisabled
                  />
                </div>
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
                  ? formatNumber(info.getValue())
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
    data: filteredData, // Usar los datos filtrados aquí
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

  // Funciones de totales usando los datos originales (no filtrados) para mantener consistencia
  const getTotalEstimado = () => {
    return data
      .filter(item => item?.fatherCategoria)
      .reduce(
        (acc, item) =>
          acc +
          (typeof item.coste_estimado === "number"
            ? item.coste_estimado
            : 0),
        0
      );
  };

  const getTotalFinal = () => {
    return data
      .filter(item => item?.fatherCategoria)
      .reduce(
        (acc, item) =>
          acc +
          (typeof item.coste_final === "number"
            ? item.coste_final
            : 0),
        0
      );
  };

  const getTotalPagado = () => {
    return data
      .filter(item => item?.fatherCategoria)
      .reduce(
        (acc, item) =>
          acc +
          (typeof item.pagado === "number"
            ? item.pagado
            : 0),
        0
      );
  };

  const getTotalPendiente = () => {
    return data
      .filter(item => item?.fatherCategoria)
      .reduce(
        (acc, item) =>
          acc +
          (typeof item.pendiente_pagar === "number"
            ? item.pendiente_pagar
            : 0),
        0
      );
  };

  // Función para obtener las categorías para el modal
  const getCategorias = () => {
    return data
      .filter(item => item?.fatherCategoria);
  };

  // Función para obtener los totales para el modal
  const getModalTotals = () => {
    return {
      total: getTotalFinal(),
      pagado: getTotalPagado(),
      pendiente: getTotalPendiente(),
      estimado: getTotalEstimado()
    };
  };

  // Función para limpiar el buscador
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative w-full">
      {/* Header con controles */}
      <div className="bg-white shadow-sm border-b px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800">Presupuesto</h2>

          {/* Buscador */}
          <div className="flex items-center gap-1.5">
            {false? (
              <button
                onClick={() => setShowSearch(true)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Buscar"
              >
                <HiOutlineSearch className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1 border">
                <HiOutlineSearch className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs placeholder-gray-400 w-40 h-5"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HiOutlineX className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Botón de información del evento */}
          <div className="relative">
            <button
              onClick={() => setShowEventInfoModal(true)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors group flex items-center gap-1"
              title="Información del evento"
            >
              <IoInformationCircleOutline className="w-3.5 h-3.5" />
              <span className="text-xs">Info evento</span>
            </button>
          </div>
        </div>

        {/* Selector de columnas */}
        <div className="relative">
          <SelectVisiblesColumns
            columns={initialColumn}
            table={table}
            handleChangeColumnVisible={handleChangeColumnVisible}
            showDataState={showDataState}
            setShowDataState={setShowDataState}
          />
        </div>

        {/* Resumen financiero */}
        <div className="flex items-center gap-3">
          {event?.presupuesto_objeto?.viewEstimates && (
            <div className="text-center">
              <div className="text-xs text-gray-500">Estimado</div>
              <div className="font-semibold text-blue-600 text-xs">
                {formatNumber(getTotalEstimado())}
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold text-gray-800 text-xs">
              {formatNumber(getTotalFinal())}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Pagado</div>
            <div className="font-semibold text-green text-xs">
              {formatNumber(getTotalPagado())}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Pendiente</div>
            <div className="font-semibold text-red text-xs">
              {formatNumber(getTotalPendiente())}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto bg-white relative">
        <div className="min-w-[700px]" onContextMenu={(e) => {
          const element = document.getElementById("ElementEditable")
          if (isAllowed()) {
            if (!element) {
              const position = { x: e.clientX - 8, y: e.clientY - 144 - 124 }
              setShowFloatOptionsMenu({ state: false, values: { info: undefined, position, options }, control: "ok" })
            }
          }
        }}>
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-20">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const isSticky = header.column.getIndex() < 2;
                    const leftPosition = header.column.getIndex() === 1 ? initialColumn[0]?.size || 140 : 0;

                    return (
                      <th
                        key={header.id}
                        style={{
                          width: header.getContext().column.columnDef.size || 'auto',
                          left: isSticky ? leftPosition : undefined
                        }}
                        className={`text-left p-1.5 font-medium text-gray-700 border-r text-xs ${isSticky ? 'sticky bg-gray-100 z-30' : ''
                          }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())
                        }
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map((row, index) => {
                const rowStyles = getRowStyles(row);

                return (
                  <tr
                    key={row.id}
                    className={`${rowStyles} border-b transition-colors group hover:bg-gray-100`}
                    onContextMenu={(e) => {
                      const element = document.getElementById("ElementEditable")
                      let infoAsd = row.getVisibleCells()[0].getContext()
                      let info = row.getVisibleCells().find(cell => cell.column.id === "categoria")?.getContext() || infoAsd
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
                  >
                    {row.getVisibleCells().map(cell => {
                      const isSticky = cell.column.getIndex() < 2;
                      const leftPosition = cell.column.getIndex() === 1 ? initialColumn[0]?.size || 140 : 0;
                      const alignment = initialColumn.find(col => col.accessor === cell.column.id);

                      const alignmentClass = alignment?.horizontalAlignment === "center" ? "text-center" :
                        alignment?.horizontalAlignment === "end" ? "text-right" : "text-left";

                      return (
                        <td
                          key={cell.id}
                          style={{
                            width: cell.getContext().column.columnDef.size || 'auto',
                            left: isSticky ? leftPosition : undefined
                          }}
                          className={`p-1.5 border-r text-xs group-hover:bg-gray-100 ${alignmentClass} ${isSticky ? `sticky z-10 ${rowStyles}` : ''
                            }`}
                          onContextMenu={(e) => {
                            const element = document.getElementById("ElementEditable")
                            let infoAsd = cell.getContext()
                            let info = cell.column.id === "categoria"
                              ? table.getRowModel().rows.find(elem => elem.original._id === infoAsd.row.original.categoriaID)?.getVisibleCells().find(elem => elem.column.id === cell.column.id)
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
                        >
                          {cell.column.id === "categoria"
                            ? row.original.object === "categoria" // Solo mostrar en filas de categoría
                              ? flexRender(cell.column.columnDef.cell, cell.getContext())
                              : ""
                            : cell.column.id === "gasto"
                              ? row.original.object === "gasto" // Solo mostrar en filas de gasto
                                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                                : ""
                              : cell.column.id === "nombre"
                                ? row.original.object === "item" // Solo mostrar nombre en filas de item
                                  ? flexRender(cell.column.columnDef.cell, cell.getContext())
                                  : ""
                                : flexRender(cell.column.columnDef.cell, cell.getContext())
                          }
                        </td>
                      )
                    })}
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={table.getAllLeafColumns().length} className="p-6 text-center text-gray-500 italic">
                    <div className="flex flex-col items-center gap-1.5">
                      {searchTerm ? (
                        <>
                          <span className="text-sm">{`No se encontraron resultados para "${searchTerm}" `}</span>
                          <button
                            onClick={clearSearch}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            Limpiar búsqueda
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">No hay datos disponibles</span>
                          <span className="text-xs">Haz clic derecho para agregar una categoría</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-2 py-1.5 border-t flex justify-end items-center text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <span>Total: {formatNumber(getTotalFinal())}</span>
          <span>|</span>
          <span>Pendiente: {formatNumber(getTotalPendiente())}</span>
        </div>
      </div>

      {/* Modal de información del evento */}
      {showEventInfoModal && (
        <EventInfoModal
          event={event}
          currency={event?.presupuesto_objeto?.currency}
          categorias_array={getCategorias()}
          totalStimatedGuests={event?.presupuesto_objeto?.totalStimatedGuests || { adults: 0, children: 0 }}
          totals={getModalTotals()}
          formatNumber={formatNumber}
          onClose={() => setShowEventInfoModal(false)}
        />
      )}

      {/* Modales existentes */}
      {RelacionarPagoModal.crear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <ClickAwayListener onClickAway={() => RelacionarPagoModal.crear && setRelacionarPagoModal({ id: "", crear: false, categoriaID: "" })}>
            <div className="relative bg-white rounded-xl shadow-lg p-8 w-full max-w-xl h-[90%] overflow-auto">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition transform hover:scale-110"
                onClick={() => setRelacionarPagoModal({ id: "", crear: false, categoriaID: "" })}
              >
                ✕
              </button>
              <FormAddPago
                GastoID={RelacionarPagoModal?.id}
                cate={RelacionarPagoModal?.categoriaID}
                setGastoID={setRelacionarPagoModal}
              />
            </div>
          </ClickAwayListener>
        </div>
      )}

      {ServisiosListModal.crear && (
        <ClickAwayListener onClickAway={() => ServisiosListModal.crear && setServisiosListModal({ id: "", crear: false, categoriaID: "" })}>
          <div>
            <ModalTaskList
              setModal={setServisiosListModal}
              categoria={ServisiosListModal?.categoriaID}
              gasto={ServisiosListModal?.id}
              event={event}
              setEvent={setEvent}
            />
          </div>
        </ClickAwayListener>
      )}

      {showFloatOptionsMenu?.state && (
        <FloatOptionsMenu showOptionsMenu={showFloatOptionsMenu} setShowOptionsMenu={setShowFloatOptionsMenu} />
      )}
    </div>
  )
}