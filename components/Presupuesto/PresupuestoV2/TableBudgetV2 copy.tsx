import { Dispatch, FC, SetStateAction, useEffect, useReducer, useState, useMemo, useCallback } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { t } from 'i18next';
import { EditableLabelWithInput } from '../../Forms/EditableLabelWithInput';
import { EditableSelect } from '../../Forms/EditableSelect';
import { EventContextProvider } from '../../../context';
import { FloatOptionsMenuInterface, ModalInterface, VisibleColumn, TableFilters, InitialColumn, ColumnConfig } from '../../../utils/Interfaces';
import { useAllowed } from '../../../hooks/useAllowed';
import { FloatOptionsMenu } from '../../Utils/FloatOptionsMenu';
import { GrMoney } from 'react-icons/gr';
import { GoEye, GoEyeClosed, GoTasklist } from 'react-icons/go';
import { PiNewspaperClippingLight } from 'react-icons/pi';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { IoCloseOutline, IoSettingsOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { HiOutlineSearch, HiOutlineX, HiOutlineFilter } from 'react-icons/hi';
import { TbColumns3 } from 'react-icons/tb';
import { handleChange, handleCreateItem, handleCreateGasto, handleCreateCategoria, handleChangeEstatus, handleChangeEstatusItem } from "../../TablesComponents/tableBudgetV8.handles"
import { useToast } from '../../../hooks/useToast';
import FormAddPago from '../../Forms/FormAddPago';
import ClickAwayListener from 'react-click-away-listener';
import { getCurrency } from '../../../utils/Funciones';
import { ModalTaskList } from '../PresupuestoV2/modals/ModalTaskList';
import { EventInfoModal } from '../PresupuestoV2/modals/EventInfoModal';
import { ColumnsConfigModal } from '../PresupuestoV2/modals/ColumnsConfigModal';
import { FiltersModal } from '../PresupuestoV2/modals/FiltersModal';
import { OptionsTableModal } from './modals/OptionsTableModal';

interface props {
  data: any
  setShowModalDelete: Dispatch<SetStateAction<ModalInterface>>
  showDataState: any
  setShowDataState: any
}

const optionsSelect = [
  { title: "xUni", value: "xUni." },
  { title: "xInv", value: "xInv." },
  { title: "xAdultos", value: "xAdultos." },
  { title: "xNiños", value: "xNiños." },
]

export const TableBudgetV2: FC<props> = ({ data, setShowModalDelete }) => {
  const { event, setEvent } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()
  const toast = useToast()
  const [columnsVisibility, setColumnVisibility] = useState({});
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>({});
  const [isResizing, setIsResizing] = useState<{column: string, startX: number, startWidth: number} | null>(null);
  const columnHelper = createColumnHelper<any>()
  const [showDotsOptionsMenu, setShowDotsOptionsMenu] = useState<FloatOptionsMenuInterface>()
  const [showFloatOptionsMenu, setShowFloatOptionsMenu] = useState<FloatOptionsMenuInterface>()
  const [RelacionarPagoModal, setRelacionarPagoModal] = useState({ id: "", crear: false, categoriaID: "" })
  const [ServisiosListModal, setServisiosListModal] = useState({ id: "", crear: false, categoriaID: "" })
  const [showEventInfoModal, setShowEventInfoModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOptionsModal, setShowOptionsModal] = useState<{ show: boolean; info?: any; availableOptions?: any[]; }>({ show: false });
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [viewLevel, setViewLevel] = useState(3);
  const [filters, setFilters] = useState<TableFilters>({ categories: [], paymentStatus: 'all', visibilityStatus: 'all', amountRange: { min: '', max: '' } });
  const [isMobile, setIsMobile] = useState<boolean>(false)


  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFiltersModal) {
        const filtersModal = document.querySelector('.filters-modal');
        const filtersButton = document.querySelector('[data-filters-button]');
        if (filtersModal && !filtersModal.contains(target) &&
          filtersButton && !filtersButton.contains(target)) {
          setShowFiltersModal(false);
        }
      }
      if (showColumnsModal) {
        const columnsModal = document.querySelector('.columns-modal');
        const columnsButton = document.querySelector('[data-columns-button]');
        if (columnsModal && !columnsModal.contains(target) &&
          columnsButton && !columnsButton.contains(target)) {
          setShowColumnsModal(false);
        }
      }
      if (showEventInfoModal) {
        const eventModal = document.querySelector('.event-info-modal');
        const eventButton = document.querySelector('[data-event-button]');
        if (eventModal && !eventModal.contains(target) &&
          eventButton && !eventButton.contains(target)) {
          setShowEventInfoModal(false);
        }
      }
    };
    if (showFiltersModal || showColumnsModal || showEventInfoModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFiltersModal, showColumnsModal, showEventInfoModal]);

  // Hook para manejar el redimensionamiento
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - isResizing.startX;
      const newWidth = Math.max(50, isResizing.startWidth + deltaX); // Mínimo 50px
      
      setColumnWidths(prev => ({
        ...prev,
        [isResizing.column]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

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

  // Función para inicializar los anchos de columnas
  useEffect(() => {
    const initialWidths = initialColumn.reduce((acc, col) => {
      if (col.accessor) {
        acc[col.accessor] = col.size || 100;
      }
      return acc;
    }, {} as {[key: string]: number});
    
    initialWidths['options'] = 60;
    
    setColumnWidths(initialWidths);
  }, []);

  const handleResizeStart = (columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentWidth = columnWidths[columnId] || 100;
    
    setIsResizing({
      column: columnId,
      startX: e.clientX,
      startWidth: currentWidth
    });
  };

  const getColumnWidth = (columnId: string) => {
    return columnWidths[columnId] || 100;
  };

  const handleFilterChange = (filterType: keyof TableFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      paymentStatus: 'all',
      visibilityStatus: 'all',
      amountRange: {
        min: '',
        max: ''
      }
    });
    setViewLevel(3);
  };

  const applyFilters = useCallback((data: any[]) => {
    let filteredData = [...data];

    if (viewLevel === 1) {
      filteredData = filteredData.filter(item => item?.fatherCategoria);
    } else if (viewLevel === 2) {
      filteredData = filteredData.filter(item =>
        item?.fatherCategoria || item?.fatherGasto
      );
    }

    if (filters.categories.length > 0) {
      filteredData = filteredData.filter(item => {
        if (item?.fatherCategoria) {
          return filters.categories.includes(item._id);
        } else if (item?.fatherGasto || item?.object === 'item') {
          return filters.categories.includes(item.categoriaID);
        }
        return false;
      });
    }

    if (filters.paymentStatus !== 'all') {
      filteredData = filteredData.filter(item => {
        const pagado = item.pagado || 0;
        const total = item.coste_final || 0;

        switch (filters.paymentStatus) {
          case 'paid':
            return pagado >= total && total > 0;
          case 'pending':
            return pagado === 0 && total > 0;
          case 'partial':
            return pagado > 0 && pagado < total;
          default:
            return true;
        }
      });
    }

    if (filters.visibilityStatus !== 'all') {
      filteredData = filteredData.filter(item => {
        const isHidden = (item?.gastoOriginal?.estatus === false) ||
          (item?.itemOriginal?.estatus === false);

        switch (filters.visibilityStatus) {
          case 'visible':
            return !isHidden;
          case 'hidden':
            return isHidden;
          default:
            return true;
        }
      });
    }

    if (filters.amountRange.min || filters.amountRange.max) {
      filteredData = filteredData.filter(item => {
        const amount = item.coste_final || 0;
        const min = filters.amountRange.min ? parseFloat(filters.amountRange.min) : 0;
        const max = filters.amountRange.max ? parseFloat(filters.amountRange.max) : Infinity;

        return amount >= min && amount <= max;
      });
    }

    return filteredData;
  }, [filters, viewLevel]);

  const getCategorias = () => {
    return data
      .filter(item => item?.fatherCategoria)
      .map(item => ({
        _id: item._id,
        nombre: item.categoria
      }));
  };

  const hasActiveFilters = () => {
    return filters.categories.length > 0 ||
      filters.paymentStatus !== 'all' ||
      filters.visibilityStatus !== 'all' ||
      filters.amountRange.min ||
      filters.amountRange.max ||
      viewLevel !== 3;
  };

  const getColumnVisibility = (accessor: string): boolean => {
    if (accessor === "coste_estimado") {
      return event?.presupuesto_objeto?.viewEstimates && (columnsVisibility[accessor] !== false);
    }
    return columnsVisibility[accessor] !== false;
  };

  const columnConfig: ColumnConfig = useMemo(() => {
    return {
      categoria: { visible: getColumnVisibility("categoria") },
      gasto: { visible: getColumnVisibility("gasto") },
      unidad: { visible: getColumnVisibility("unidad") },
      cantidad: { visible: getColumnVisibility("cantidad") },
      nombre: { visible: getColumnVisibility("nombre") },
      valor_unitario: { visible: getColumnVisibility("valor_unitario") },
      coste_final: { visible: getColumnVisibility("coste_final") },
      coste_estimado: { visible: getColumnVisibility("coste_estimado") },
      pagado: { visible: getColumnVisibility("pagado") },
      pendiente_pagar: { visible: getColumnVisibility("pendiente_pagar") },
      options: { visible: getColumnVisibility("options") }
    };
  }, [columnsVisibility, event?.presupuesto_objeto?.viewEstimates]);

  const toggleColumnVisibility = (columnKey: keyof ColumnConfig) => {
    const accessor = columnKey;

    if (accessor === "options") {
      setColumnVisibility(prev => ({
        ...prev,
        [accessor]: !columnConfig[columnKey].visible
      }));
    } else {
      const currentVisibility = columnConfig[columnKey].visible;
      handleChangeColumnVisible({
        accessor,
        show: !currentVisibility
      });
    }
  };

  const filteredData = useMemo(() => {
    let result = data;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter((item: any) => {
        const searchableFields = [
          item.categoria,
          item.gasto,
          item.nombre,
          item.unidad
        ];
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
    }

    result = applyFilters(result);
    return result;
  }, [data, searchTerm, applyFilters]);

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

  const openOptionsModal = (info: any, objectType?: string) => {
    let type = objectType;
    if (!type && info) {
      type = info.row?.original?.object || "categoria";
    }
    if (!type) {
      type = "categoria";
    }

    let filteredOptions = [...options];

    if (type === "categoria") {
      filteredOptions = filteredOptions.filter(opt => opt.title !== "Item");
    }

    filteredOptions = filteredOptions.filter(option => {
      if (!option.object) return true;
      return option.object.includes(type);
    });

    setShowOptionsModal({
      show: true,
      info,
      availableOptions: filteredOptions
    });

    setShowDotsOptionsMenu({ state: false });
    setShowFloatOptionsMenu({ state: false });
  };

  const getRowStyles = (row: any) => {
    if (row.original?.fatherCategoria) {
      return "bg-blue-50 font-semibold text-blue-800";
    } else if (row.original?.fatherGasto) {
      return "bg-gray-50 font-medium text-gray-800";
    } else {
      return "bg-white font-normal text-gray-800";
    }
  };

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
          <button
            onClick={(e) => {
              if (isAllowed()) {
                if (showOptionsModal.show && showOptionsModal.info?.row?.original?._id === info.row.original._id) {
                  setShowOptionsModal({ show: false });
                } else {
                  openOptionsModal(info, info.row.original.object);
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
                  ? getCurrency(parseFloat(info.getValue()))
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
    data: filteredData,
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
    setEvent({ ...event })
  }

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

  const getCategoriasForModal = () => {
    return data
      .filter(item => item?.fatherCategoria);
  };

  const getModalTotals = () => {
    return {
      total: getTotalFinal(),
      pagado: getTotalPagado(),
      pendiente: getTotalPendiente(),
      estimado: getTotalEstimado()
    };
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative w-full">
      <div className="bg-white shadow-sm border-b px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className=" hidden md:flex items-center gap-1.5 ">
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
          </div>
          <div className="relative">
            <button
              data-filters-button="true"
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`p-1 rounded transition-colors flex items-center gap-1 ${showFiltersModal || hasActiveFilters()
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              title="Filtros"
            >
              <HiOutlineFilter className="w-3.5 h-3.5" />
              <span className="text-xs">Filtros</span>
              {hasActiveFilters() && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>

          </div>
          <div className="relative">
            <button
              data-event-button="true"
              onClick={() => setShowEventInfoModal(true)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors group flex items-center gap-1"
              title="Información del evento"
            >
              <IoInformationCircleOutline className="w-3.5 h-3.5" />
              <span className="text-xs">Info evento</span>
            </button>
          </div>
          <div className="relative">
            <button
              data-columns-button="true"
              onClick={() => setShowColumnsModal(true)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
              title="Configurar columnas"
            >
              <TbColumns3 className="w-3.5 h-3.5" />
              <span className="text-xs">Columnas</span>
            </button>

          </div>
        </div>
        <div className={`hidden md:flex items-center gap-3. mr-6 ${event?.presupuesto_objeto?.viewEstimates ? "w-[38%]" : "w-[33.7%]"}`}>
          <div className={`text-center ${!event?.presupuesto_objeto?.viewEstimates ? "w-[27%]" : "w-[22%]"} `}>
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold text-gray-800 text-xs">
              {getCurrency(parseFloat(getTotalFinal()))}
            </div>
          </div>
          {event?.presupuesto_objeto?.viewEstimates && (
            <div className="text-center  w-[22%] ">
              <div className="text-xs text-gray-500 ">Estimado</div>
              <div className="font-semibold text-blue-600 text-xs">
                {formatNumber(getTotalEstimado())}
              </div>
            </div>
          )}
          <div className={`text-center ${!event?.presupuesto_objeto?.viewEstimates ? "w-[27%]" : "w-[22%]"} `}>
            <div className="text-xs text-gray-500">Pagado</div>
            <div className="font-semibold text-green text-xs">
              {getCurrency(parseFloat(getTotalPagado()))}
            </div>
          </div>
          <div className={`text-center ${!event?.presupuesto_objeto?.viewEstimates ? "w-[27%]" : "w-[22%]"} `}>
            <div className="text-xs text-gray-500">Pendiente</div>
            <div className="font-semibold text-red text-xs">
              {getCurrency(parseFloat(getTotalPendiente()))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-white relative">
        <div className="min-w-[700px]" onContextMenu={(e) => {
          const element = document.getElementById("ElementEditable")
          if (isAllowed()) {
            if (!element) {
              e.preventDefault();
            }
          }
        }}>

          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-20">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const isSticky = header.column.getIndex() < 2;
                    const leftPosition = header.column.getIndex() === 1 ? getColumnWidth('categoria') : 0;
                    const columnId = header.column.id;

                    return (
                      <th
                        key={header.id}
                        style={{
                          width: getColumnWidth(columnId),
                          left: isSticky ? leftPosition : undefined,
                         /*  position: isSticky ? 'sticky' : 'relative' */
                        }}
                        className={`text-left p-1.5 font-medium text-gray-700 border-r text-xs ${isSticky ? 'bg-gray-100 z-30' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())
                            }
                          </div>
                          {/* Divisor redimensionable */}
                          <div
                            className="w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50 absolute right-0 top-0 flex items-center justify-center group"
                            onMouseDown={(e) => handleResizeStart(columnId, e)}
                          >
                            <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-500 transition-colors"></div>
                          </div>
                        </div>
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
                        e.preventDefault();
                        const objectType = row.original?.object;
                        openOptionsModal(info, objectType);
                      }
                    }}
                  >
                    {row.getVisibleCells().map(cell => {
                      const isSticky = cell.column.getIndex() < 2;
                      const leftPosition = cell.column.getIndex() === 1 ? getColumnWidth('categoria') : 0;
                      const alignment = initialColumn.find(col => col.accessor === cell.column.id);
                      const columnId = cell.column.id;

                      const alignmentClass = alignment?.horizontalAlignment === "center" ? "text-center" :
                        alignment?.horizontalAlignment === "end" ? "text-right" : "text-left";

                      return (
                        <td
                          key={cell.id}
                          style={{
                            width: getColumnWidth(columnId),
                            left: isSticky ? leftPosition : undefined,
                            /* position: isSticky ? 'sticky' : 'relative' */
                          }}
                          className={`p-1.5 border-r text-xs group-hover:bg-gray-100 ${alignmentClass} ${isSticky ? `z-10 ${rowStyles}` : ''
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
                              e.preventDefault();
                              const objectType = cell.row.original?.object || "categoria";
                              openOptionsModal(info || infoAsd, objectType);
                            }
                          }}
                        >
                          {cell.column.id === "categoria"
                            ? row.original.object === "categoria"
                              ? flexRender(cell.column.columnDef.cell, cell.getContext())
                              : ""
                            : cell.column.id === "gasto"
                              ? row.original.object === "gasto"
                                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                                : ""
                              : cell.column.id === "nombre"
                                ? row.original.object === "item"
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
                      {searchTerm || hasActiveFilters() ? (
                        <>
                          <span className="text-sm">
                            {searchTerm
                              ? `No se encontraron resultados para "${searchTerm}"`
                              : "No se encontraron resultados con los filtros aplicados"
                            }
                          </span>
                          <div className="flex gap-2">
                            {searchTerm && (
                              <button
                                onClick={clearSearch}
                                className="text-blue-600 hover:text-blue-800 text-xs underline"
                              >
                                Limpiar búsqueda
                              </button>
                            )}
                            {hasActiveFilters() && (
                              <button
                                onClick={handleClearFilters}
                                className="text-blue-600 hover:text-blue-800 text-xs underline"
                              >
                                Limpiar filtros
                              </button>
                            )}
                          </div>
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
      <div className="bg-gray-100 px-2 py-1.5 border-t flex justify-end items-center text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <span>Total:
            {getCurrency(parseFloat(getTotalFinal()))}
          </span>
          <span>|</span>
          <span>Pendiente:
            {getCurrency(parseFloat(getTotalPendiente()))}
          </span>
          {hasActiveFilters() && (
            <>
              <span>|</span>
              <span className="text-blue-600">Filtros aplicados</span>
            </>
          )}
        </div>
      </div>

      {
        showColumnsModal && (
          <ColumnsConfigModal
            columnConfig={columnConfig}
            toggleColumnVisibility={toggleColumnVisibility}
            onClose={() => setShowColumnsModal(false)}
          />
        )
      }
      {
        showFiltersModal && (
          <FiltersModal
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFiltersModal(false)}
            onClearFilters={handleClearFilters}
            categorias_array={getCategorias()}
            viewLevel={viewLevel}
            setViewLevel={setViewLevel}
          />
        )
      }
      {
        showOptionsModal.show && (
          <ClickAwayListener onClickAway={() => setShowOptionsModal({ show: false })}>
            <div className="absolute top-12 right-3 bg-white shadow-lg rounded border z-50 w-48 max-w-[calc(100vw-24px)]">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">Opciones disponibles</h3>
                  <button
                    onClick={() => setShowOptionsModal({ show: false })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoCloseOutline className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {showOptionsModal.availableOptions?.map((option, index) => (
                  <div key={index}>
                    {option.icon && typeof option.icon !== 'boolean' && !option.onClick ? (
                      <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded border">
                        <div className="text-gray-500 text-sm">
                          {option.icon}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{option.title}</span>
                      </div>
                    ) : option.onClick ? (
                      <button
                        onClick={() => {
                          option.onClick(showOptionsModal.info);
                          setShowOptionsModal({ show: false });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="text-gray-500 text-sm">
                          {option.icon && typeof option.icon !== 'boolean' && option.icon}
                        </div>
                        <span className="text-xs text-gray-700">{option.title}</span>
                      </button>
                    ) : (
                      <div className="text-xs text-gray-600 font-medium px-2">
                        {option.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ClickAwayListener>
        )
      }
      {
        showEventInfoModal && (
          <EventInfoModal
            event={event}
            currency={event?.presupuesto_objeto?.currency}
            categorias_array={getCategoriasForModal()}
            totalStimatedGuests={event?.presupuesto_objeto?.totalStimatedGuests || { adults: 0, children: 0 }}
            totals={getModalTotals()}
            formatNumber={formatNumber}
            onClose={() => setShowEventInfoModal(false)}
          />
        )
      }
      {
        RelacionarPagoModal.crear && (
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
        )
      }
      {
        ServisiosListModal.crear && (
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
        )
      }
      {
        showFloatOptionsMenu?.state && !showOptionsModal.show && (
          <FloatOptionsMenu showOptionsMenu={showFloatOptionsMenu} setShowOptionsMenu={setShowFloatOptionsMenu} />
        )
      }
    </div >
  )
}