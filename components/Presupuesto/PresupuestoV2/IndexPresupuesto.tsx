import React, { useState, useMemo } from 'react';
import { IoSettingsOutline, IoFilterOutline, IoSearchOutline, IoEyeOutline, IoCloseOutline, IoInformationCircleOutline } from "react-icons/io5";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { GrMoney } from 'react-icons/gr';
import { GoEye, GoEyeClosed, GoTasklist } from 'react-icons/go';
import { PiNewspaperClippingLight } from 'react-icons/pi';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { EventContextProvider } from "../../../context";
import { EditableLabelWithInput } from "../../Forms/EditableLabelWithInput";
import { EditableSelect } from "../../Forms/EditableSelect";
import { handleChange, determinatedPositionMenu, handleCreateItem, handleCreateGasto, handleCreateCategoria, handleChangeEstatus, handleChangeEstatusItem } from "../../TablesComponents/tableBudgetV8.handles";
import { getCurrency } from "../../../utils/Funciones";
import { useAllowed } from "../../../hooks/useAllowed";
import { useToast } from "../../../hooks/useToast";
import { FloatOptionsMenu } from "../../Utils/FloatOptionsMenu";
import FormAddPago from "../../Forms/FormAddPago";
import { ModalTaskList } from "../ModalTaskList";
import ClickAwayListener from "react-click-away-listener";
import { FloatOptionsMenuInterface } from '../../../utils/Interfaces';

export const SmartSpreadsheetView2 = () => {
  const { event, setEvent } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const [viewLevel, setViewLevel] = useState(2); // 1=Solo categorías, 2=Cat+Gastos, 3=Todo
  
  // Inicializar con todas las categorías expandidas por defecto
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const categorias = event?.presupuesto_objeto?.categorias_array || [];
    return new Set(categorias.map(cat => cat._id));
  });
  
  // Estados para filtros y opciones
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showColumnsConfig, setShowColumnsConfig] = useState(false);
  const [showEventInfoModal, setShowEventInfoModal] = useState(false);
  
  // Estados para opciones y modales adicionales
  const [showOptionsMenu, setShowOptionsMenu] = useState<FloatOptionsMenuInterface>();
  const [RelacionarPagoModal, setRelacionarPagoModal] = useState({ id: "", crear: false, categoriaID: "" });
  const [ServisiosListModal, setServisiosListModal] = useState({ id: "", crear: false, categoriaID: "" });
  const [filters, setFilters] = useState({
    categories: [],
    paymentStatus: 'all', // 'all', 'paid', 'pending', 'partial'
    amountRange: { min: '', max: '' },
    searchText: ''
  });
  
  const [columnConfig, setColumnConfig] = useState({
    categoria: { visible: true, width: 160 },
    partida: { visible: true, width: 200 },
    unidad: { visible: true, width: 60 },
    cantidad: { visible: true, width: 60 },
    item: { visible: true, width: 140 },
    valorUnitario: { visible: true, width: 100 },
    total: { visible: true, width: 100 },
    estimado: { visible: true, width: 100 },
    pagado: { visible: true, width: 100 },
    pendiente: { visible: true, width: 100 },
    acciones: { visible: true, width: 80 }
  });

  // Usar los datos reales del evento
  const categorias_array = event?.presupuesto_objeto?.categorias_array || [];
  const currency = event?.presupuesto_objeto?.currency || 'eur';
  const totalStimatedGuests = event?.presupuesto_objeto?.totalStimatedGuests || { adults: 0, children: 0 };

  // Función para formatear números con puntos y comas sin símbolo de moneda
  const formatNumber = (value) => {
    if (typeof value !== 'number') return value || 0;
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Actualizar categorías expandidas cuando cambien los datos
  React.useEffect(() => {
    if (categorias_array.length > 0) {
      setExpandedCategories(new Set(categorias_array.map(cat => cat._id)));
    }
  }, [categorias_array.length]);

  // Cerrar modales al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFiltersModal || showColumnsConfig || showEventInfoModal) {
        const isFiltersModal = event.target.closest('.filters-modal');
        const isColumnsModal = event.target.closest('.columns-modal');
        const isEventInfoModal = event.target.closest('.event-info-modal');
        const isFilterButton = event.target.closest('.filter-button');
        const isColumnButton = event.target.closest('.column-button');
        const isEventInfoButton = event.target.closest('.event-info-button');

        if (!isFiltersModal && !isFilterButton && showFiltersModal) {
          setShowFiltersModal(false);
        }
        if (!isColumnsModal && !isColumnButton && showColumnsConfig) {
          setShowColumnsConfig(false);
        }
        if (!isEventInfoModal && !isEventInfoButton && showEventInfoModal) {
          setShowEventInfoModal(false);
        }
        // El menú de opciones se maneja por ClickAwayListener en FloatOptionsMenu
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFiltersModal, showColumnsConfig, showEventInfoModal]);

  // Opciones para el select de unidades
  const optionsSelect = [
    { title: "xUni", value: "xUni." },
    { title: "xInv", value: "xInv." },
    { title: "xAdultos", value: "xAdultos." },
    { title: "xNiños", value: "xNiños." },
  ];

  // Array de opciones para el menú contextual
  const options = [
    {
      icon: <PiNewspaperClippingLight className="w-4 h-4" />,
      title: "Agregar:",
      object: ["categoria", "gasto", "item"]
    },
    {
      title: "Categoría",
      onClick: (info) => {
        handleCreateCategoria({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu })
          .catch(error => toast("error", "ha ocurrido un error"))
      },
      object: ["categoria", "gasto", "item"]
    },
    {
      title: "Partida",
      onClick: (info) => {
        handleCreateGasto({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu })
          .catch(error => toast("error", "ha ocurrido un error"))
      },
      object: ["categoria", "gasto", "item"]
    },
    {
      title: "Item",
      onClick: (info) => {
        handleCreateItem({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu })
          .catch(error => toast("error", "ha ocurrido un error"))
      },
      object: ["gasto", "item"]
    },
    {
      icon: <GrMoney className="w-4 h-4" />,
      title: "Relacionar Pago",
      onClick: (info) => {
        setShowOptionsMenu({ state: false })
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
        setShowOptionsMenu({ state: false })
        setServisiosListModal({ id: info.row.original._id, crear: true, categoriaID: info.row.original.categoriaID })
      },
      object: ["gasto"]
    },
    {
      icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
      title: "Borrar",
      onClick: (info) => {
        // Aquí podrías agregar un modal de confirmación si lo necesitas
        console.log("Borrar:", info.row.original);
      },
      object: ["categoria", "gasto", "item"]
    },
  ];

  // Función para manejar el menú de opciones
  const handleOptionsMenu = (e, row) => {
    if (isAllowed()) {
      const position = determinatedPositionMenu({ e, height: options.length * 32, width: 200 });
      if (showOptionsMenu?.values?.info?.row?.original?._id === row.id && showOptionsMenu?.state === true) {
        setShowOptionsMenu({ state: false });
      } else {
        const mockInfo = {
          row: {
            original: {
              object: row.object,
              categoriaID: row.categoriaID,
              gastoID: row.gastoID,
              itemID: row.itemID,
              _id: row.type === 'category' ? row.categoriaID : row.type === 'expense' ? row.gastoID : row.itemID,
              nombre: row.type === 'category' ? row.categoria : row.type === 'expense' ? row.partida : row.item
            }
          }
        };
        
        setShowOptionsMenu({
          state: true,
          values: {
            info: mockInfo,
            aling: position.aling,
            justify: position.justify,
            options: options
          }
        });
      }
    } else {
      ht();
    }
  };
  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Funciones para manejar filtros
  const toggleColumnVisibility = (columnKey) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        visible: !prev[columnKey].visible
      }
    }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      paymentStatus: 'all',
      amountRange: { min: '', max: '' },
      searchText: ''
    });
  };

  // Función para filtrar datos
  const applyFilters = (data) => {
    return data.filter(row => {
      // Filtro por texto de búsqueda
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch = 
          row.categoria?.toLowerCase().includes(searchLower) ||
          row.partida?.toLowerCase().includes(searchLower) ||
          row.item?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por categorías seleccionadas
      if (filters.categories.length > 0) {
        if (row.type === 'category' && !filters.categories.includes(row.id)) return false;
        if (row.type !== 'category' && !filters.categories.includes(row.categoriaID)) return false;
      }

      // Filtro por estado de pago
      if (filters.paymentStatus !== 'all') {
        const isPaid = row.pagado >= row.total;
        const isPending = row.pagado === 0;
        const isPartial = row.pagado > 0 && row.pagado < row.total;

        switch (filters.paymentStatus) {
          case 'paid':
            if (!isPaid) return false;
            break;
          case 'pending':
            if (!isPending) return false;
            break;
          case 'partial':
            if (!isPartial) return false;
            break;
        }
      }

      // Filtro por rango de montos
      if (filters.amountRange.min !== '' || filters.amountRange.max !== '') {
        const amount = row.total || 0;
        if (filters.amountRange.min !== '' && amount < parseFloat(filters.amountRange.min)) return false;
        if (filters.amountRange.max !== '' && amount > parseFloat(filters.amountRange.max)) return false;
      }

      return true;
    });
  };

  // Función para determinar si un gasto es editable (no tiene items)
  const isGastoEditable = (gasto) => {
    return !gasto.items_array || gasto.items_array.length === 0;
  };

  // Función para crear el objeto info para handleChange
  const createInfoObject = (row) => ({
    row: {
      original: {
        object: row.object,
        categoriaID: row.categoriaID,
        gastoID: row.gastoID,
        itemID: row.itemID,
        _id: row.type === 'category' ? row.categoriaID : row.type === 'expense' ? row.gastoID : row.itemID
      }
    }
  });

  // Renderizar celda de Categoría
  const renderCategoriaCell = (row) => {
    if (row.type === 'category' && row.categoria) {
      return (
        <EditableLabelWithInput
          accessor="categoria"
          handleChange={(values) => {
            const mockInfo = createInfoObject(row);
            handleChange({ values, info: mockInfo, event, setEvent });
          }}
          type={null}
          value={row.categoria}
          textAlign="left"
          isLabelDisabled
        />
      );
    }
    return row.categoria;
  };

  // Renderizar celda de Partida de Gasto
  const renderPartidaCell = (row) => {
    if (row.type === 'expense' && row.partida) {
      return (
        <div className="text-left">
          <EditableLabelWithInput
            accessor="gasto"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type={null}
            value={row.partida}
            textAlign="left"
            isLabelDisabled
          />
        </div>
      );
    }
    return <span className="text-left block w-full">{row.partida}</span>;
  };

  // Renderizar celda de Unidad
  const renderUnidadCell = (row) => {
    if (row.type === 'item' && row.unidad) {
      return (
        <EditableSelect
          accessor="unidad"
          value={row.unidad}
          optionsSelect={optionsSelect}
          size={60}
          handleChange={(values) => {
            const mockInfo = createInfoObject(row);
            handleChange({ values, info: mockInfo, event, setEvent });
          }}
        />
      );
    }
    return row.unidad;
  };

  // Renderizar celda de Cantidad
  const renderCantidadCell = (row) => {
    if (row.type === 'item' && row.unidad === 'xUni.') {
      return (
        <div className="flex justify-center">
          <EditableLabelWithInput
            accessor="cantidad"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type="int"
            value={row.cantidad}
            textAlign="center"
            isLabelDisabled
          />
        </div>
      );
    }
    return <span className="text-center block w-full">{row.cantidad}</span>;
  };

  // Renderizar celda de Item
  const renderItemCell = (row) => {
    if (row.type === 'item' && row.item) {
      return (
        <div className="text-left">
          <EditableLabelWithInput
            accessor="nombre"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type={null}
            value={row.item}
            textAlign="left"
            isLabelDisabled
          />
        </div>
      );
    }
    return <span className="text-left block w-full">{row.item}</span>;
  };

  // Renderizar celda de Valor Unitario
  const renderValorUnitarioCell = (row) => {
    if (row.type === 'item' && typeof row.valorUnitario === 'number') {
      return (
        <div className="flex justify-end">
          <EditableLabelWithInput
            accessor="valor_unitario"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type="float"
            value={row.valorUnitario}
            textAlign="end"
            isLabelDisabled
          />
        </div>
      );
    } else if (row.type === 'item') {
      // Solo mostrar valor para items
      return (
        <span className="text-right block w-full pr-2">
          {formatNumber(row.valorUnitario)}
        </span>
      );
    }
    // Para categorías y gastos, no mostrar nada
    return '';
  };

  const tableData = useMemo(() => {
    const rows = [];
    
    categorias_array.forEach(categoria => {
      // Fila de categoría
      rows.push({
        type: 'category',
        id: categoria._id,
        categoria: categoria.nombre,
        partida: '',
        unidad: '',
        cantidad: '',
        item: '',
        valorUnitario: '',
        estimado: categoria.coste_estimado,
        total: categoria.coste_final,
        pagado: categoria.pagado,
        pendiente: categoria.coste_final - categoria.pagado,
        level: 0,
        expandable: true,
        expanded: expandedCategories.has(categoria._id),
        categoriaID: categoria._id,
        gastoID: null,
        itemID: null,
        object: 'categoria'
      });

      // Filas de gastos si está expandida
      if (expandedCategories.has(categoria._id) && viewLevel >= 2) {
        categoria.gastos_array.forEach(gasto => {
          rows.push({
            type: 'expense',
            id: gasto._id,
            categoria: '',
            partida: gasto.nombre,
            unidad: '',
            cantidad: '',
            item: '',
            valorUnitario: '',
            estimado: null,
            total: gasto.coste_final,
            pagado: gasto.pagado,
            pendiente: gasto.coste_final - gasto.pagado,
            level: 1,
            categoriaID: categoria._id,
            gastoID: gasto._id,
            itemID: null,
            object: 'gasto',
            gastoOriginal: gasto,
            isEditable: isGastoEditable(gasto)
          });

          // Items si está en nivel 3
          if (viewLevel >= 3 && gasto.items_array) {
            gasto.items_array.forEach(item => {
              const cantidad = item.unidad === 'xAdultos.' ? totalStimatedGuests.adults :
                             item.unidad === 'xNiños.' ? totalStimatedGuests.children :
                             item.cantidad;
              
              rows.push({
                type: 'item',
                id: item._id,
                categoria: '',
                partida: '',
                unidad: item.unidad,
                cantidad: cantidad,
                item: item.nombre,
                valorUnitario: item.valor_unitario,
                estimado: null,
                total: cantidad * item.valor_unitario,
                pagado: 0,
                pendiente: cantidad * item.valor_unitario,
                level: 2,
                categoriaID: categoria._id,
                gastoID: gasto._id,
                itemID: item._id,
                object: 'item'
              });
            });
          }
        });
      }
    });

    // Aplicar filtros
    return applyFilters(rows);
  }, [viewLevel, expandedCategories, categorias_array, totalStimatedGuests, filters]);

  const totals = useMemo(() => {
    return {
      estimado: categorias_array.reduce((acc, cat) => acc + (cat.coste_estimado || 0), 0),
      total: categorias_array.reduce((acc, cat) => acc + (cat.coste_final || 0), 0),
      pagado: categorias_array.reduce((acc, cat) => acc + (cat.pagado || 0), 0),
    };
  }, [categorias_array]);

  // Renderizar la celda de Coste Total
  const renderCosteTotalCell = (row) => {
    if (row.type === 'expense' && row.isEditable) {
      // Gasto sin items - editable
      return (
        <div className="flex justify-end">
          <EditableLabelWithInput
            accessor="coste_final"
            handleChange={(values) => {
              const mockInfo = {
                row: {
                  original: {
                    object: row.object,
                    categoriaID: row.categoriaID,
                    gastoID: row.gastoID,
                    _id: row.gastoID
                  }
                }
              };
              handleChange({ values, info: mockInfo, event, setEvent });
            }}
            type="float"
            value={row.total}
            textAlign="end"
            isLabelDisabled
          />
        </div>
      );
    } else {
      // Categoría, gasto con items, o item - solo lectura
      return (
        <span className="text-right block w-full pr-2">
          {formatNumber(row.total)}
        </span>
      );
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col relative">
      {/* Header con controles */}
      <div className="bg-white shadow-sm border-b px-3 py-2 flex flex-col lg:flex-row lg:items-center lg:justify-between relative gap-2 lg:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <h2 className="text-base font-semibold text-gray-800">Vista Inteligente</h2>
          
          {/* Barra de búsqueda */}
          <div className="relative">
            <IoSearchOutline className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              className="pl-8 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
            />
          </div>

          {/* Botones de control */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEventInfoModal(!showEventInfoModal)}
              className={`event-info-button flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${
                showEventInfoModal ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <IoInformationCircleOutline className="w-3 h-3" />
              <span className="hidden sm:inline">Info</span>
            </button>

            <button
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`filter-button flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${
                showFiltersModal || Object.values(filters).some(f => f !== 'all' && f !== '' && (Array.isArray(f) ? f.length > 0 : typeof f === 'object' && f !== null ? (f.min !== '' || f.max !== '') : f !== 'all' && f !== ''))
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <IoFilterOutline className="w-3 h-3" />
              <span className="hidden sm:inline">Filtros</span>
              {(filters.categories.length > 0 || filters.paymentStatus !== 'all' || filters.amountRange.min || filters.amountRange.max) && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {filters.categories.length + (filters.paymentStatus !== 'all' ? 1 : 0) + (filters.amountRange.min || filters.amountRange.max ? 1 : 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowColumnsConfig(!showColumnsConfig)}
              className={`column-button flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${
                showColumnsConfig ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <IoEyeOutline className="w-3 h-3" />
              <span className="hidden sm:inline">Columnas</span>
            </button>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="flex items-center gap-2 sm:gap-4 lg:pr-8 overflow-x-auto">
          <div className="text-center min-w-0 flex-shrink-0">
            <div className="text-xs text-gray-500">Estimado</div>
            <div className="font-semibold text-blue-600 text-xs sm:text-sm">{formatNumber(totals.estimado)}</div>
          </div>
          <div className="text-center min-w-0 flex-shrink-0">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold text-gray-800 text-xs sm:text-sm">{formatNumber(totals.total)}</div>
          </div>
          <div className="text-center min-w-0 flex-shrink-0">
            <div className="text-xs text-gray-500">Pagado</div>
            <div className="font-semibold text-green-600 text-xs sm:text-sm">{formatNumber(totals.pagado)}</div>
          </div>
          <div className="text-center min-w-0 flex-shrink-0">
            <div className="text-xs text-gray-500">Pendiente</div>
            <div className="font-semibold text-red-600 text-xs sm:text-sm">{formatNumber(totals.total - totals.pagado)}</div>
          </div>
        </div>
      </div>

      {/* Modal de Información del Evento */}
      {showEventInfoModal && (
        <div className="event-info-modal absolute top-12 left-3 bg-white shadow-lg rounded border z-50 w-80 max-w-[calc(100vw-24px)]">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Información del Evento</h3>
              <button
                onClick={() => setShowEventInfoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="p-3 space-y-4">
            {/* Resumen de Invitados */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Resumen de Invitados</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {totalStimatedGuests.adults + totalStimatedGuests.children}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">
                    {totalStimatedGuests.adults}
                  </div>
                  <div className="text-xs text-gray-500">Adultos</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">
                    {totalStimatedGuests.children}
                  </div>
                  <div className="text-xs text-gray-500">Niños</div>
                </div>
              </div>
            </div>

            {/* Información del Evento */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Detalles del Evento</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="text-gray-800 font-medium truncate ml-2">{event?.nombre || 'Sin nombre'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Moneda:</span>
                  <span className="text-gray-800 font-medium uppercase">{currency}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Categorías:</span>
                  <span className="text-gray-800 font-medium">{categorias_array.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Gastos:</span>
                  <span className="text-gray-800 font-medium">
                    {categorias_array.reduce((acc, cat) => acc + (cat.gastos_array?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progreso del Presupuesto */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Progreso del Presupuesto</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">% Pagado:</span>
                  <span className="text-gray-800 font-medium">
                    {totals.total > 0 ? Math.round((totals.pagado / totals.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${totals.total > 0 ? Math.min((totals.pagado / totals.total) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">Pagado: {formatNumber(totals.pagado)}</span>
                  <span className="text-red-600">Pendiente: {formatNumber(totals.total - totals.pagado)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales adicionales */}
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
              <FormAddPago GastoID={RelacionarPagoModal?.id} cate={RelacionarPagoModal?.categoriaID} />
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

      {showOptionsMenu?.state && (
        <FloatOptionsMenu showOptionsMenu={showOptionsMenu} setShowOptionsMenu={setShowOptionsMenu} />
      )}

      {/* Modal de Filtros */}
      {showFiltersModal && (
        <div className="filters-modal absolute top-12 left-3 bg-white shadow-lg rounded border z-50 w-80 max-w-[calc(100vw-24px)]">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Filtros</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IoCloseOutline className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
            {/* Vista de Detalle */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vista de Detalle</label>
              <select 
                value={viewLevel} 
                onChange={(e) => setViewLevel(Number(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value={1}>Solo Categorías</option>
                <option value={2}>Categorías + Gastos</option>
                <option value={3}>Detalle Completo</option>
              </select>
            </div>

            {/* Filtro por Categorías */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categorías</label>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {categorias_array.map(categoria => (
                  <label key={categoria._id} className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(categoria._id)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.categories, categoria._id]
                          : filters.categories.filter(id => id !== categoria._id);
                        handleFilterChange('categories', newCategories);
                      }}
                      className="mr-2 rounded text-xs"
                    />
                    <span className="truncate">{categoria.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por Estado de Pago */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado de Pago</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">Todos</option>
                <option value="paid">Pagado</option>
                <option value="pending">Pendiente</option>
                <option value="partial">Pago Parcial</option>
              </select>
            </div>

            {/* Filtro por Rango de Montos */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rango de Montos</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.amountRange.min}
                  onChange={(e) => handleFilterChange('amountRange', { ...filters.amountRange, min: e.target.value })}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.amountRange.max}
                  onChange={(e) => handleFilterChange('amountRange', { ...filters.amountRange, max: e.target.value })}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Columnas */}
      {showColumnsConfig && (
        <div className="columns-modal absolute top-12 right-3 bg-white shadow-lg rounded border z-50 w-52 max-w-[calc(100vw-24px)]">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Columnas</h3>
              <button
                onClick={() => setShowColumnsConfig(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
            {Object.entries(columnConfig).map(([key, config]) => (
              <label key={key} className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={config.visible}
                  onChange={() => toggleColumnVisibility(key)}
                  className="mr-2 rounded text-xs"
                />
                <span className="truncate">
                  {key === 'categoria' ? 'Categoría' :
                   key === 'partida' ? 'Partida de Gasto' :
                   key === 'unidad' ? 'Unidad' :
                   key === 'cantidad' ? 'Cantidad' :
                   key === 'item' ? 'Item' :
                   key === 'valorUnitario' ? 'Valor Unitario' :
                   key === 'total' ? 'Coste Total' :
                   key === 'estimado' ? 'Coste Estimado' :
                   key === 'pagado' ? 'Pagado' :
                   key === 'pendiente' ? 'Pendiente' :
                   'Acciones'}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="flex-1 overflow-auto bg-white relative">
        {/* Contenedor con scroll horizontal en pantallas pequeñas */}
        <div className="min-w-[800px]">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {columnConfig.categoria.visible && (
                  <th className="text-left p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.categoria.width}}>
                    Categoría
                  </th>
                )}
                {columnConfig.partida.visible && (
                  <th className="text-left p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.partida.width}}>
                    Partida de Gasto
                  </th>
                )}
                {columnConfig.unidad.visible && (
                  <th className="text-center p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.unidad.width}}>
                    Unidad
                  </th>
                )}
                {columnConfig.cantidad.visible && (
                  <th className="text-center p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.cantidad.width}}>
                    Cantidad
                  </th>
                )}
                {columnConfig.item.visible && (
                  <th className="text-left p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.item.width}}>
                    Item
                  </th>
                )}
                {columnConfig.valorUnitario.visible && (
                  <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.valorUnitario.width}}>
                    Valor Unitario
                  </th>
                )}
                {columnConfig.total.visible && (
                  <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.total.width}}>
                    Coste Total
                  </th>
                )}
                {columnConfig.estimado.visible && event?.presupuesto_objeto?.viewEstimates && (
                  <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.estimado.width}}>
                    Coste Estimado
                  </th>
                )}
                {columnConfig.pagado.visible && (
                  <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.pagado.width}}>
                    Pagado
                  </th>
                )}
                {columnConfig.pendiente.visible && (
                  <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.pendiente.width}}>
                    Pendiente
                  </th>
                )}
                {columnConfig.acciones.visible && (
                  <th className="text-center p-2 font-medium text-gray-700 text-xs" style={{width: columnConfig.acciones.width}}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => {
                const bgColor = row.type === 'category' ? 'bg-blue-50' : 
                               row.type === 'expense' ? 'bg-gray-50' : 'bg-white';
                const textWeight = row.type === 'category' ? 'font-semibold' : 
                                 row.type === 'expense' ? 'font-medium' : 'font-normal';
                const paddingLeft = `${row.level * 16 + 8}px`;

                return (
                  <tr 
                    key={row.id} 
                    className={`${bgColor} border-b hover:bg-gray-100 transition-colors`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleOptionsMenu(e, row);
                    }}
                  >
                    {columnConfig.categoria.visible && (
                      <td className="p-2 border-r text-xs" style={{paddingLeft}}>
                        <div className="flex items-center gap-1">
                          {row.expandable && (
                            <button 
                              onClick={() => toggleCategory(row.id)}
                              className="hover:bg-gray-200 p-0.5 rounded flex-shrink-0"
                            >
                              {row.expanded ? <IoIosArrowDown size={12} /> : <IoIosArrowForward size={12} />}
                            </button>
                          )}
                          <span className={`${textWeight} ${row.type === 'category' ? 'text-blue-800' : 'text-gray-800'} truncate`}>
                            {renderCategoriaCell(row)}
                          </span>
                        </div>
                      </td>
                    )}
                    {columnConfig.partida.visible && (
                      <td className="p-2 border-r text-left text-xs">
                        <div className="truncate">
                          {renderPartidaCell(row)}
                        </div>
                      </td>
                    )}
                    {columnConfig.unidad.visible && (
                      <td className="p-2 border-r text-center text-xs text-gray-600">
                        {renderUnidadCell(row)}
                      </td>
                    )}
                    {columnConfig.cantidad.visible && (
                      <td className="p-2 border-r text-center text-xs text-gray-600">
                        {renderCantidadCell(row)}
                      </td>
                    )}
                    {columnConfig.item.visible && (
                      <td className="p-2 border-r text-left text-xs">
                        <div className="truncate">
                          {renderItemCell(row)}
                        </div>
                      </td>
                    )}
                    {columnConfig.valorUnitario.visible && (
                      <td className="p-2 border-r text-right text-xs">
                        {renderValorUnitarioCell(row)}
                      </td>
                    )}
                    {columnConfig.total.visible && (
                      <td className={`p-2 border-r ${textWeight} text-xs`}>
                        {renderCosteTotalCell(row)}
                      </td>
                    )}
                    {columnConfig.estimado.visible && event?.presupuesto_objeto?.viewEstimates && (
                      <td className="p-2 border-r text-right text-xs">
                        <span className="text-blue-600">
                          {formatNumber(row.estimado)}
                        </span>
                      </td>
                    )}
                    {columnConfig.pagado.visible && (
                      <td className="p-2 border-r text-right text-xs">
                        <span className="text-green-600">
                          {formatNumber(row.pagado)}
                        </span>
                      </td>
                    )}
                    {columnConfig.pendiente.visible && (
                      <td className="p-2 border-r text-right text-xs">
                        <span className="text-red-600">
                          {formatNumber(row.pendiente)}
                        </span>
                      </td>
                    )}
                    {columnConfig.acciones.visible && (
                      <td className="p-2 text-center">
                        <button 
                          className="text-gray-400 hover:text-gray-600 p-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOptionsMenu(e, row);
                          }}
                        >
                          <IoSettingsOutline size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer con información */}
      <div className="bg-gray-100 px-3 py-1 border-t flex flex-col sm:flex-row sm:justify-end items-center text-xs text-gray-600 gap-1 sm:gap-0">
        <div className="flex items-center gap-3">
          <span>Total: {formatNumber(totals.total)}</span>
          <span className="hidden sm:inline">|</span>
          <span>Pendiente: {formatNumber(totals.total - totals.pagado)}</span>
        </div>
      </div>
    </div>
  );
};