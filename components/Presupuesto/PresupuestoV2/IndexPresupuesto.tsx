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
import { fetchApiEventos, queries } from "../../../utils/Fetching";

export const SmartSpreadsheetView2 = () => {
  const { event, setEvent } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const [viewLevel, setViewLevel] = useState(3); // 1=Solo categorías, 2=Cat+Gastos, 3=Todo
  
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
  const [showDeleteModal, setShowDeleteModal] = useState({ state: false, title: "", values: null });
  const [loading, setLoading] = useState(false);
  
  // FILTROS ACTUALIZADOS - Agregar visibilityStatus
  const [filters, setFilters] = useState({
    categories: [],
    paymentStatus: 'all', // 'all', 'paid', 'pending', 'partial'
    visibilityStatus: 'all', // 'all', 'visible', 'hidden'
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

  // Usar los datos reales del evento con validación
  const categorias_array = event?.presupuesto_objeto?.categorias_array || [];
  const currency = event?.presupuesto_objeto?.currency || 'eur';
  const totalStimatedGuests = event?.presupuesto_objeto?.totalStimatedGuests || { adults: 0, children: 0 };

  // Función para formatear números con puntos y comas sin símbolo de moneda
  const formatNumber = (value) => {
    if (typeof value !== 'number') return value || 0;
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // NUEVA SOLUCIÓN: Función para recalcular y actualizar totales directamente en el contexto
  const recalculateEventTotals = React.useCallback(() => {
    if (!event?.presupuesto_objeto?.categorias_array) return false;

    let hasChanges = false;
    const updatedEvent = { ...event };

    updatedEvent.presupuesto_objeto.categorias_array.forEach(categoria => {
      if (!categoria.gastos_array || !Array.isArray(categoria.gastos_array)) return;
      
      let categoriaTotalCalculated = 0;
      
      categoria.gastos_array.forEach(gasto => {
        let gastoTotalCalculated = 0;
        
        // Si el gasto tiene items, calcular su total como suma de items
        if (gasto.items_array && Array.isArray(gasto.items_array) && gasto.items_array.length > 0) {
          gasto.items_array.forEach(item => {
            const cantidad = item.unidad === 'xAdultos.' ? totalStimatedGuests.adults :
                           item.unidad === 'xNiños.' ? totalStimatedGuests.children :
                           item.unidad === 'xInv.' ? (totalStimatedGuests.adults + totalStimatedGuests.children) :
                           item.cantidad || 0;
            
            gastoTotalCalculated += cantidad * (item.valor_unitario || 0);
          });
          
          // Actualizar el coste_final del gasto si es diferente
          if (Math.abs(gasto.coste_final - gastoTotalCalculated) > 0.01) {
            gasto.coste_final = gastoTotalCalculated;
            hasChanges = true;
          }
        } else {
          // Si no tiene items, usar el coste_final actual del gasto
          gastoTotalCalculated = gasto.coste_final || 0;
        }
        
        // Sumar al total de la categoría
        categoriaTotalCalculated += gastoTotalCalculated;
      });
      
      // Actualizar el coste_final de la categoría si es diferente
      if (Math.abs(categoria.coste_final - categoriaTotalCalculated) > 0.01) {
        categoria.coste_final = categoriaTotalCalculated;
        hasChanges = true;
      }
    });
    
    // Si hubo cambios, actualizar el evento inmediatamente
    if (hasChanges) {
      setEvent(updatedEvent);
      return true;
    }
    return false;
  }, [event, setEvent, totalStimatedGuests]);

  // Función para determinar si un gasto es editable (no tiene items)
  const isGastoEditable = (gasto) => {
    return !gasto.items_array || !Array.isArray(gasto.items_array) || gasto.items_array.length === 0;
  };

  // Función personalizada para manejar cambios CON recálculo inmediato
  const handleChangeWithRecalculation = React.useCallback((values, info) => {
    // Primero hacer el cambio original
    handleChange({ values, info, event, setEvent });
    
    // Si es un cambio que afecta los costes, recalcular inmediatamente
    if (['valor_unitario', 'cantidad', 'unidad', 'coste_final'].includes(values.accessor)) {
      // Pequeño delay para que se procese el cambio anterior
      setTimeout(() => {
        recalculateEventTotals();
      }, 50);
    }
  }, [recalculateEventTotals, event, setEvent]);

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

  // Actualizar categorías expandidas cuando cambien los datos
  React.useEffect(() => {
    if (categorias_array.length > 0) {
      setExpandedCategories(new Set(categorias_array.map(cat => cat._id)));
    }
  }, [categorias_array.length]);

  // Efecto para recalcular totales cuando cambien datos relevantes
  React.useEffect(() => {
    // Recalcular totales cuando cambien las categorías, gastos o items
    const timeoutId = setTimeout(() => {
      recalculateEventTotals();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [recalculateEventTotals]);

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

  // Función para generar opciones dinámicas del menú
  const getMenuOptions = (info) => {
    // Determinar el estado actual del elemento
    let isHidden = false;
    if (info?.row?.original?.object === 'gasto' && info?.row?.original?.gastoOriginal) {
      isHidden = info.row.original.gastoOriginal.estatus === false;
    } else if (info?.row?.original?.object === 'item') {
      // Buscar el item original para verificar su estatus
      const categoria = categorias_array.find(cat => cat._id === info?.row?.original?.categoriaID);
      const gasto = categoria?.gastos_array?.find(g => g._id === info?.row?.original?.gastoID);
      const itemOriginal = gasto?.items_array?.find(item => item._id === info?.row?.original?.itemID);
      isHidden = itemOriginal?.estatus === true;
    }

    return [
      {
        icon: <PiNewspaperClippingLight className="w-4 h-4" />,
        title: "Agregar:",
        object: ["categoria", "gasto", "item"]
      },
      {
        title: "Categoría",
        onClick: async (info) => {
          try {
            setShowOptionsMenu({ ...showOptionsMenu, select: "Categoría" });
            
            // Crear la categoría
            await handleCreateCategoria({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu });
            
            // Esperar un poco para que se procese la creación de la categoría
            setTimeout(async () => {
              try {
                // Obtener la categoría recién creada (la última en el array)
                const nuevaCategoria = event?.presupuesto_objeto?.categorias_array[event.presupuesto_objeto.categorias_array.length - 1];
                
                if (nuevaCategoria) {
                  // Asegurar que tenga gastos_array inicializado
                  if (!nuevaCategoria.gastos_array) {
                    nuevaCategoria.gastos_array = [];
                  }
                  
                  // Crear una partida de gasto automáticamente
                  const mockInfoGasto = {
                    row: {
                      original: {
                        categoriaID: nuevaCategoria._id,
                        object: 'categoria'
                      }
                    }
                  };
                  
                  await handleCreateGasto({ 
                    info: mockInfoGasto, 
                    event, 
                    setEvent, 
                    setShowDotsOptionsMenu: setShowOptionsMenu 
                  });
                  
                  // Expandir la nueva categoría
                  setExpandedCategories(prev => new Set([...prev, nuevaCategoria._id]));
                  
                  toast("success", "Categoría y partida de gasto creadas exitosamente");
                }
              } catch (error) {
                console.error("Error al crear partida de gasto automática:", error);
                toast("warning", "Categoría creada, pero hubo un problema al crear la partida automática");
              }
            }, 500);
            
          } catch (error) {
            toast("error", "Error al crear categoría");
            console.error(error);
          } finally {
            setShowOptionsMenu({ state: false });
          }
        },
        object: ["categoria", "gasto", "item"]
      },
      {
        title: "Partida",
        onClick: async (info) => {
          try {
            setShowOptionsMenu({ ...showOptionsMenu, select: "Partida" });
            
            // Crear la partida de gasto
            await handleCreateGasto({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu });
            
            // Forzar actualización del estado para sincronización en tiempo real
            setTimeout(() => {
              setEvent(prevEvent => ({ ...prevEvent }));
              
              // Si es una categoría, asegurar que esté expandida
              if (info?.row?.original?.categoriaID) {
                setExpandedCategories(prev => new Set([...prev, info.row.original.categoriaID]));
              }
            }, 100);
            
            toast("success", "Partida de gasto creada exitosamente");
          } catch (error) {
            toast("error", "Error al crear partida de gasto");
            console.error(error);
          } finally {
            setShowOptionsMenu({ state: false });
          }
        },
        object: ["categoria", "gasto", "item"]
      },
      {
        title: "Item",
        onClick: async (info) => {
          try {
            setShowOptionsMenu({ ...showOptionsMenu, select: "Item" });
            
            // Crear el item
            await handleCreateItem({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu });
            
            // Forzar actualización del estado y recalcular totales inmediatamente
            setTimeout(() => {
              const updated = recalculateEventTotals();
              if (!updated) {
                // Si no hubo cambios en recalculation, forzar update manual
                setEvent(prevEvent => ({ ...prevEvent }));
              }
              
              // Asegurar que la categoría esté expandida
              if (info?.row?.original?.categoriaID) {
                setExpandedCategories(prev => new Set([...prev, info.row.original.categoriaID]));
              }
            }, 100);
            
            toast("success", "Item creado exitosamente");
          } catch (error) {
            toast("error", "Error al crear item");
            console.error(error);
          } finally {
            setShowOptionsMenu({ state: false });
          }
        },
        object: ["gasto", "item"]
      },
      {
        icon: <GrMoney className="w-4 h-4" />,
        title: "Relacionar Pago",
        onClick: (info) => {
          setShowOptionsMenu({ state: false });
          setRelacionarPagoModal({ id: info.row.original._id, crear: true, categoriaID: info.row.original.categoriaID });
        },
        object: ["gasto"]
      },
      {
        icon: isHidden ? <GoEyeClosed className="w-4 h-4" /> : <GoEye className="w-4 h-4" />,
        title: isHidden ? "Mostrar" : "Ocultar",
        onClick: async (info) => {
          try {
            setShowOptionsMenu({ ...showOptionsMenu, select: "Estado" });
            if (info.row.original.object === 'gasto') {
              await handleChangeEstatus({ event, categoriaID: info.row.original.categoriaID, gastoId: info.row.original.gastoID, setEvent });
              toast("success", "Estado del gasto actualizado");
            }
            if (info.row.original.object === 'item') {
              await handleChangeEstatusItem({ event, categoriaID: info.row.original.categoriaID, gastoId: info.row.original.gastoID, itemId: info.row.original.itemID, setEvent });
              toast("success", "Estado del item actualizado");
            }
          } catch (error) {
            toast("error", "Error al actualizar estado");
            console.error(error);
          } finally {
            setShowOptionsMenu({ state: false });
          }
        },
        object: ["gasto", "item"]
      },
      {
        icon: <GoTasklist className="w-4 h-4" />,
        title: "Task",
        onClick: (info) => {
          setShowOptionsMenu({ state: false });
          setServisiosListModal({ id: info.row.original._id, crear: true, categoriaID: info.row.original.categoriaID });
        },
        object: ["gasto"]
      },
      {
        icon: <MdOutlineDeleteOutline className="w-4 h-4" />,
        title: "Borrar",
        onClick: (info) => {
          // Abrir modal de confirmación de borrado
          const objectType = info.row.original.object === 'categoria' ? 'Categoría' :
                            info.row.original.object === 'gasto' ? 'Partida de gasto' : 'Item';
          const objectName = info.row.original.object === 'categoria' ? info.row.original.categoria :
                            info.row.original.object === 'gasto' ? info.row.original.partida : info.row.original.item;
          
          setShowDeleteModal({
            state: true,
            title: `${objectType}: ${objectName}`,
            values: {
              object: info.row.original.object,
              _id: info.row.original.object === 'categoria' ? info.row.original.categoriaID :
                   info.row.original.object === 'gasto' ? info.row.original.gastoID : info.row.original.itemID,
              categoriaID: info.row.original.categoriaID,
              gastoID: info.row.original.gastoID,
              itemID: info.row.original.itemID,
              nombre: objectName
            }
          });
          setShowOptionsMenu({ state: false });
        },
        object: ["categoria", "gasto", "item"]
      },
    ];
  };

  // Función para manejar el menú de opciones
  const handleOptionsMenu = (e, row, isContextMenu = false) => {
    if (isAllowed()) {
      e.preventDefault();
      e.stopPropagation();
      
      if (showOptionsMenu?.values?.info?.row?.original?._id === row.id && showOptionsMenu?.state === true) {
        setShowOptionsMenu({ state: false });
        return;
      }

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

      // Obtener el contenedor de la tabla
      const tableContainer = e.target.closest('.table-container') || document.querySelector('[class*="overflow-auto"]');
      const tableRect = tableContainer?.getBoundingClientRect() || { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      
      let position;
      
      if (isContextMenu) {
        // Para click derecho, usar la posición del mouse
        position = {
          x: e.clientX - tableRect.left,
          y: e.clientY - tableRect.top
        };
      } else {
        // Para botón de acciones, usar la posición del elemento
        const buttonRect = e.target.getBoundingClientRect();
        position = {
          x: buttonRect.left - tableRect.left + buttonRect.width,
          y: buttonRect.top - tableRect.top
        };
      }

      // Dimensiones del menú (estimadas)
      const menuWidth = 200;
      const menuHeight = getMenuOptions(mockInfo).length * 32;

      // Ajustar posición para que no se salga de la tabla
      const maxX = tableRect.width - menuWidth - 10;
      const maxY = tableRect.height - menuHeight - 10;

      position.x = Math.min(Math.max(10, position.x), maxX);
      position.y = Math.min(Math.max(10, position.y), maxY);

      // Determinar alineación basada en la posición ajustada
      const aling = position.y > tableRect.height / 2 ? "botton" : "top";
      const justify = position.x > tableRect.width / 2 ? "end" : "start";
      
      // Generar opciones dinámicas
      const dynamicOptions = getMenuOptions(mockInfo);
        
      setShowOptionsMenu({
        state: true,
        values: {
          info: mockInfo,
          position: position,
          aling: aling,
          justify: justify,
          options: dynamicOptions
        },
        select: ""
      });
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
      visibilityStatus: 'all', // Resetear también el filtro de visibilidad
      amountRange: { min: '', max: '' },
      searchText: ''
    });
  };

  // FUNCIÓN APPLYFILTERS ACTUALIZADA - Agregar lógica para filtro de visibilidad
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

      // NUEVO: Filtro por estado de visibilidad
      if (filters.visibilityStatus !== 'all') {
        let isHidden = false;
        
        if (row.type === 'expense') {
          // Para gastos: estatus === false significa oculto
          isHidden = row.gastoOriginal?.estatus === false;
        } else if (row.type === 'item') {
          // Para items: estatus === true significa oculto
          const categoria = categorias_array.find(cat => cat._id === row.categoriaID);
          const gasto = categoria?.gastos_array?.find(g => g._id === row.gastoID);
          const itemOriginal = gasto?.items_array?.find(item => item._id === row.itemID);
          isHidden = itemOriginal?.estatus === true;
        }
        // Las categorías siempre se consideran visibles
        
        switch (filters.visibilityStatus) {
          case 'visible':
            if (isHidden) return false;
            break;
          case 'hidden':
            if (!isHidden && row.type !== 'category') return false;
            // Si filtro "solo ocultos" está activo, no mostrar categorías
            if (row.type === 'category') return false;
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

  // Función para manejar el borrado después de la confirmación
  const handleDeleteConfirm = async () => {
    if (!showDeleteModal.values) return;
    
    setLoading(true);
    
    try {
      const { values } = showDeleteModal;
      
      // Función de borrado implementada directamente
      if (values?.object === "categoria") {
        await fetchApiEventos({
          query: queries.borraCategoria,
          variables: {
            evento_id: event?._id,
            categoria_id: values?._id,
          },
        });
        
        // Actualizar el estado local
        const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === values?._id);
        if (f1 > -1) {
          event?.presupuesto_objeto?.categorias_array.splice(f1, 1);
        }
      }
      
      if (values?.object === "gasto") {
        await fetchApiEventos({
          query: queries.borrarGasto,
          variables: {
            evento_id: event?._id,
            categoria_id: values?.categoriaID,
            gasto_id: values?._id,
          },
        });
        
        // Actualizar el estado local
        const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === values?.categoriaID);
        if (f1 > -1) {
          const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex(elem => elem._id === values?._id);
          if (f2 > -1) {
            event?.presupuesto_objeto?.categorias_array[f1].gastos_array.splice(f2, 1);
          }
        }
      }
      
      if (values?.object === "item") {
        await fetchApiEventos({
          query: queries.borrarItemsGastos,
          variables: {
            evento_id: event?._id,
            categoria_id: values?.categoriaID,
            gasto_id: values?.gastoID,
            itemsGastos_ids: [values?._id],
          },
        });
        
        // Actualizar el estado local
        const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === values?.categoriaID);
        if (f1 > -1) {
          const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex(elem => elem._id === values?.gastoID);
          if (f2 > -1) {
            const f3 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array[f2].items_array.findIndex(elem => elem._id === values._id);
            if (f3 > -1) {
              event?.presupuesto_objeto?.categorias_array[f1].gastos_array[f2].items_array.splice(f3, 1);
            }
          }
        }
      }
      
      // Forzar actualización del estado
      setEvent({ ...event });
      
      // Cerrar modal y opciones
      setShowOptionsMenu({ state: false });
      
      // Recalcular totales después de eliminar
      setTimeout(() => {
        recalculateEventTotals();
      }, 50);
      
      toast("success", `${values.object === 'categoria' ? 'Categoría' : 
                       values.object === 'gasto' ? 'Partida de gasto' : 'Item'} eliminado exitosamente`);
      
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast("error", "Error al eliminar el elemento");
    } finally {
      setLoading(false);
      setShowDeleteModal({ state: false, title: "", values: null });
    }
  };

  // Función para sincronizar costes en el contexto del evento
  const syncEventCosts = React.useCallback(() => {
    if (!event?.presupuesto_objeto?.categorias_array) return;

    let eventUpdated = false;
    
    event.presupuesto_objeto.categorias_array.forEach(categoria => {
      if (!categoria.gastos_array || !Array.isArray(categoria.gastos_array)) return;
      
      let categoriaTotalCalculated = 0;
      
      categoria.gastos_array.forEach(gasto => {
        // Si el gasto tiene items, calcular su total como suma de items
        if (gasto.items_array && Array.isArray(gasto.items_array) && gasto.items_array.length > 0) {
          let gastoTotalCalculated = 0;
          
          gasto.items_array.forEach(item => {
            const cantidad = item.unidad === 'xAdultos.' ? totalStimatedGuests.adults :
                           item.unidad === 'xNiños.' ? totalStimatedGuests.children :
                           item.unidad === 'xInv.' ? (totalStimatedGuests.adults + totalStimatedGuests.children) :
                           item.cantidad || 0;
            
            gastoTotalCalculated += cantidad * (item.valor_unitario || 0);
          });
          
          // Actualizar el coste_final del gasto si es diferente
          if (Math.abs(gasto.coste_final - gastoTotalCalculated) > 0.01) {
            gasto.coste_final = gastoTotalCalculated;
            eventUpdated = true;
          }
        }
        
        // Sumar al total de la categoría
        categoriaTotalCalculated += gasto.coste_final || 0;
      });
      
      // Actualizar el coste_final de la categoría si es diferente
      if (Math.abs(categoria.coste_final - categoriaTotalCalculated) > 0.01) {
        categoria.coste_final = categoriaTotalCalculated;
        eventUpdated = true;
      }
    });
    
    // Si hubo cambios, actualizar el evento
    if (eventUpdated) {
      setEvent({ ...event });
    }
  }, [event, setEvent, totalStimatedGuests]);

  // Función para determinar si un gasto es editable (no tiene items)
  
  // Función personalizada para manejar cambios con sincronización de costes
  const handleChangeWithSync = (values, info) => {
    handleChange({ values, info, event, setEvent });
    
    // Si es un cambio que afecta los costes (valor_unitario, cantidad, unidad), sincronizar
    if (['valor_unitario', 'cantidad', 'unidad', 'coste_final'].includes(values.accessor)) {
      setTimeout(() => {
        syncEventCosts();
      }, 150);
    }
  };

  // Renderizar celda de Categoría
  const renderCategoriaCell = (row) => {
    if (row.type === 'category' && row.categoria) {
      return (
        <div className="flex items-center gap-2">
          <EditableLabelWithInput
            accessor="categoria"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChangeWithRecalculation(values, mockInfo);
            }}
            type={null}
            value={row.categoria}
            textAlign="left"
            isLabelDisabled
          />
        </div>
      );
    }
    return row.categoria;
  };

  // Renderizar celda de Partida de Gasto
  const renderPartidaCell = (row) => {
    if (row.type === 'expense' && row.partida) {
      const gastoOriginal = row.gastoOriginal;
      const isHidden = gastoOriginal?.estatus === false;
      
      return (
        <div className="flex items-center gap-2">
          {isHidden && (
            <GoEyeClosed className="w-4 h-4 text-gray-400 flex-shrink-0" title="Partida oculta" />
          )}
          <EditableLabelWithInput
            accessor="gasto"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChangeWithRecalculation(values, mockInfo);
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
            handleChangeWithRecalculation(values, mockInfo);
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
              handleChangeWithRecalculation(values, mockInfo);
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
      // Buscar el item original para verificar su estatus
      const categoria = categorias_array.find(cat => cat._id === row.categoriaID);
      const gasto = categoria?.gastos_array?.find(g => g._id === row.gastoID);
      const itemOriginal = gasto?.items_array?.find(item => item._id === row.itemID);
      const isHidden = itemOriginal?.estatus === true; // true significa oculto para items
      
      return (
        <div className="flex items-center gap-2">
          {isHidden && (
            <GoEyeClosed className="w-4 h-4 text-gray-400 flex-shrink-0" title="Item oculto" />
          )}
          <EditableLabelWithInput
            accessor="nombre"
            handleChange={(values) => {
              const mockInfo = createInfoObject(row);
              handleChangeWithRecalculation(values, mockInfo);
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
              handleChangeWithRecalculation(values, mockInfo);
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
    
    // Validar que categorias_array sea un array válido
    if (!categorias_array || !Array.isArray(categorias_array)) {
      return [];
    }
    
    // Forzar re-render usando una clave única basada en el timestamp del evento
    const eventKey = Date.now();
    
    categorias_array.forEach(categoria => {
      // Validar que categoria tenga los campos necesarios
      if (!categoria || !categoria._id) {
        return; // Skip categorías inválidas
      }
      
      // Asegurar que gastos_array esté inicializado
      if (!categoria.gastos_array || !Array.isArray(categoria.gastos_array)) {
        categoria.gastos_array = [];
      }
      
      // CAMBIO CLAVE: Usar el coste_final del contexto, no calcular aquí
      const gastosData = [];
      
      // Filas de gastos si está expandida - Validar que gastos_array existe y es un array
      if (categoria.gastos_array && Array.isArray(categoria.gastos_array)) {
        categoria.gastos_array.forEach(gasto => {
          // Validar que gasto tenga los campos necesarios
          if (!gasto || !gasto._id) {
            return; // Skip gastos inválidos
          }
          
          // Asegurar que items_array esté inicializado
          if (!gasto.items_array || !Array.isArray(gasto.items_array)) {
            gasto.items_array = [];
          }
          
          // IMPORTANTE: Solo calcular totales para mostrar en tabla, pero usar valores del contexto
          const itemsData = [];
          
          // Si el gasto tiene items, mostrar los items en la tabla
          if (gasto.items_array && Array.isArray(gasto.items_array) && gasto.items_array.length > 0) {
            gasto.items_array.forEach(item => {
              // Validar que item tenga los campos necesarios
              if (!item || !item._id) {
                return; // Skip items inválidos
              }
              
              const cantidad = item.unidad === 'xAdultos.' ? totalStimatedGuests.adults :
                             item.unidad === 'xNiños.' ? totalStimatedGuests.children :
                             item.unidad === 'xInv.' ? (totalStimatedGuests.adults + totalStimatedGuests.children) :
                             item.cantidad || 0;
              
              const totalItem = cantidad * (item.valor_unitario || 0);
              
              // Items si está en nivel 3
              if (viewLevel >= 3) {
                itemsData.push({
                  type: 'item',
                  id: item._id,
                  categoria: '',
                  partida: '',
                  unidad: item.unidad || '',
                  cantidad: cantidad,
                  item: item.nombre || 'Sin nombre',
                  valorUnitario: item.valor_unitario || 0,
                  estimado: null, // Items no tienen coste estimado
                  total: totalItem, // Calculado para mostrar, pero no afecta el contexto
                  pagado: 0,
                  pendiente: totalItem,
                  level: 2,
                  categoriaID: categoria._id,
                  gastoID: gasto._id,
                  itemID: item._id,
                  object: 'item',
                  eventKey: eventKey // Agregar clave para forzar re-render
                });
              }
            });
          }
          
          // Agregar fila de gasto si está en nivel 2 o superior
          if (viewLevel >= 2) {
            gastosData.push({
              type: 'expense',
              id: gasto._id,
              categoria: '',
              partida: gasto.nombre || 'Sin nombre',
              unidad: '',
              cantidad: '',
              item: '',
              valorUnitario: '',
              estimado: null, // Gastos no tienen coste estimado
              total: gasto.coste_final || 0, // USAR VALOR DEL CONTEXTO directamente
              pagado: gasto.pagado || 0,
              pendiente: (gasto.coste_final || 0) - (gasto.pagado || 0),
              level: 1,
              categoriaID: categoria._id,
              gastoID: gasto._id,
              itemID: null,
              object: 'gasto',
              gastoOriginal: gasto,
              isEditable: isGastoEditable(gasto),
              items: itemsData,
              eventKey: eventKey // Agregar clave para forzar re-render
            });
          }
        });
      }
      
      // Fila de categoría - USAR VALORES DEL CONTEXTO
      rows.push({
        type: 'category',
        id: categoria._id,
        categoria: categoria.nombre || 'Sin nombre',
        partida: '',
        unidad: '',
        cantidad: '',
        item: '',
        valorUnitario: '',
        estimado: categoria.coste_estimado || 0,
        total: categoria.coste_final || 0, // USAR VALOR DEL CONTEXTO directamente
        pagado: categoria.pagado || 0,
        pendiente: (categoria.coste_final || 0) - (categoria.pagado || 0),
        level: 0,
        expandable: true,
        expanded: expandedCategories.has(categoria._id),
        categoriaID: categoria._id,
        gastoID: null,
        itemID: null,
        object: 'categoria',
        eventKey: eventKey // Agregar clave para forzar re-render
      });

      // Agregar gastos si está expandida
      if (expandedCategories.has(categoria._id) && viewLevel >= 2) {
        gastosData.forEach(gastoData => {
          rows.push(gastoData);
          
          // Agregar items del gasto si están disponibles
          if (gastoData.items && gastoData.items.length > 0) {
            gastoData.items.forEach(itemData => {
              rows.push(itemData);
            });
          }
        });
      }
    });

    // Aplicar filtros
    return applyFilters(rows);
  }, [viewLevel, expandedCategories, categorias_array, totalStimatedGuests, filters, event?.presupuesto_objeto]); // Usar event?.presupuesto_objeto como dependencia

  const totals = useMemo(() => {
    // Calcular totales basados en los datos procesados de la tabla
    const categoryRows = tableData.filter(row => row.type === 'category');
    
    return {
      estimado: categoryRows.reduce((acc, cat) => acc + (cat.estimado || 0), 0),
      total: categoryRows.reduce((acc, cat) => acc + (cat.total || 0), 0),
      pagado: categoryRows.reduce((acc, cat) => acc + (cat.pagado || 0), 0),
    };
  }, [tableData]); // Cambié la dependencia de categorias_array por tableData

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
              handleChangeWithRecalculation(values, mockInfo);
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
              {(filters.categories.length > 0 || filters.paymentStatus !== 'all' || filters.visibilityStatus !== 'all' || filters.amountRange.min || filters.amountRange.max) && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {filters.categories.length + (filters.paymentStatus !== 'all' ? 1 : 0) + (filters.visibilityStatus !== 'all' ? 1 : 0) + (filters.amountRange.min || filters.amountRange.max ? 1 : 0)}
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

      {/* Modal de Filtros - ACTUALIZADO */}
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
                {categorias_array && Array.isArray(categorias_array) ? categorias_array.map(categoria => (
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
                )) : (
                  <p className="text-xs text-gray-500 italic">No hay categorías disponibles</p>
                )}
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

            {/* NUEVO: Filtro por Estado de Visibilidad */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <GoEye className="w-3 h-3" />
                  Estado de Visibilidad
                </div>
              </label>
              <select
                value={filters.visibilityStatus}
                onChange={(e) => handleFilterChange('visibilityStatus', e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">Todos</option>
                <option value="visible">Solo Visibles</option>
                <option value="hidden">Solo Ocultos</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Filtra partidas e items según su estado de visibilidad
              </div>
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

      {/* [Resto de los modales y componentes permanecen igual...] */}
      
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
                    {categorias_array.reduce((acc, cat) => acc + ((cat.gastos_array && Array.isArray(cat.gastos_array)) ? cat.gastos_array.length : 0), 0)}
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

      {/* [Resto de modales: RelacionarPagoModal, ServisiosListModal, showOptionsMenu, showDeleteModal, showColumnsConfig...] */}
      {/* [Tabla completa...] */}
      
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

      {/* Modal de Confirmación de Borrado */}
      {showDeleteModal.state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <MdOutlineDeleteOutline className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirmar Eliminación
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                ¿Estás seguro de que deseas eliminar{' '}
                <span className="font-semibold text-gray-700">
                  {showDeleteModal.title}
                </span>
                ? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal({ state: false, title: "", values: null })}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Columnas */}
      {showColumnsConfig && (
        <div className="columns-modal absolute top-12 left-3 bg-white shadow-lg rounded border z-50 w-52 max-w-[calc(100vw-24px)]">
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
      <div className="flex-1 overflow-auto bg-white relative table-container">
        {/* Contenedor con scroll horizontal en pantallas pequeñas */}
        <div className="min-w-[800px]" onContextMenu={(e) => {
          // Manejar click derecho en área vacía para crear categorías
          if (tableData.length === 0) {
            const mockRow = {
              id: 'empty',
              type: 'category',
              object: 'categoria',
              categoriaID: null,
              gastoID: null,
              itemID: null
            };
            
            const mockInfo = {
              row: {
                original: mockRow
              }
            };
            
            const dynamicOptions = getMenuOptions(mockInfo);
            
            const position = {
              x: e.clientX - e.currentTarget.getBoundingClientRect().left,
              y: e.clientY - e.currentTarget.getBoundingClientRect().top
            };
            
            setShowOptionsMenu({
              state: true,
              values: {
                info: mockInfo,
                position: position,
                aling: "top",
                justify: "start",
                options: dynamicOptions
              },
              select: ""
            });
            
            e.preventDefault();
          }
        }}>
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr>
                {columnConfig.categoria.visible && (
                  <th className="text-left p-2 font-medium text-gray-700 border-r text-xs sticky left-0 bg-gray-100 z-30" style={{width: columnConfig.categoria.width}}>
                    Categoría
                  </th>
                )}
                {columnConfig.partida.visible && (
                  <th className="text-left p-2 font-medium text-gray-700 border-r text-xs sticky bg-gray-100 z-30" style={{width: columnConfig.partida.width, left: columnConfig.categoria.visible ? columnConfig.categoria.width : 0}}>
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
              {tableData.length > 0 ? tableData.map((row, index) => {
                const bgColor = row.type === 'category' ? 'bg-blue-50' : 
                               row.type === 'expense' ? 'bg-gray-50' : 'bg-white';
                const textWeight = row.type === 'category' ? 'font-semibold' : 
                                 row.type === 'expense' ? 'font-medium' : 'font-normal';
                const paddingLeft = `${row.level * 16 + 8}px`;

                return (
                  <tr 
                    key={row.id} 
                    className={`${bgColor} border-b transition-colors group hover:bg-gray-100`}
                    onContextMenu={(e) => {
                      handleOptionsMenu(e, row, true);
                    }}
                  >
                    {columnConfig.categoria.visible && (
                      <td className={`p-2 border-r text-xs sticky left-0 z-10 ${bgColor} group-hover:bg-gray-100`} style={{paddingLeft, width: columnConfig.categoria.width}}>
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
                      <td className={`p-2 border-r text-left text-xs sticky z-10 ${bgColor} group-hover:bg-gray-100`} style={{width: columnConfig.partida.width, left: columnConfig.categoria.visible ? columnConfig.categoria.width : 0}}>
                        <div className="truncate">
                          {renderPartidaCell(row)}
                        </div>
                      </td>
                    )}
                    {columnConfig.unidad.visible && (
                      <td className="p-2 border-r text-center text-xs text-gray-600 group-hover:bg-gray-100">
                        {renderUnidadCell(row)}
                      </td>
                    )}
                    {columnConfig.cantidad.visible && (
                      <td className="p-2 border-r text-center text-xs text-gray-600 group-hover:bg-gray-100">
                        {renderCantidadCell(row)}
                      </td>
                    )}
                    {columnConfig.item.visible && (
                      <td className="p-2 border-r text-left text-xs group-hover:bg-gray-100">
                        <div className="truncate">
                          {renderItemCell(row)}
                        </div>
                      </td>
                    )}
                    {columnConfig.valorUnitario.visible && (
                      <td className="p-2 border-r text-right text-xs group-hover:bg-gray-100">
                        {renderValorUnitarioCell(row)}
                      </td>
                    )}
                    {columnConfig.total.visible && (
                      <td className={`p-2 border-r ${textWeight} text-xs group-hover:bg-gray-100`}>
                        {renderCosteTotalCell(row)}
                      </td>
                    )}
                    {columnConfig.estimado.visible && event?.presupuesto_objeto?.viewEstimates && (
                      <td className="p-2 border-r text-right text-xs group-hover:bg-gray-100">
                        {row.type === 'category' ? (
                          <span className="text-blue-600">
                            {formatNumber(row.estimado)}
                          </span>
                        ) : (
                          <span className="text-gray-300">
                            —
                          </span>
                        )}
                      </td>
                    )}
                    {columnConfig.pagado.visible && (
                      <td className="p-2 border-r text-right text-xs group-hover:bg-gray-100">
                        <span className="text-green-600">
                          {formatNumber(row.pagado)}
                        </span>
                      </td>
                    )}
                    {columnConfig.pendiente.visible && (
                      <td className="p-2 border-r text-right text-xs group-hover:bg-gray-100">
                        <span className="text-red-600">
                          {formatNumber(row.pendiente)}
                        </span>
                      </td>
                    )}
                    {columnConfig.acciones.visible && (
                      <td className="p-2 text-center group-hover:bg-gray-100">
                        <button 
                          className="text-gray-400 hover:text-gray-600 p-0.5"
                          onClick={(e) => {
                            handleOptionsMenu(e, row, false);
                          }}
                        >
                          <IoSettingsOutline size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={Object.values(columnConfig).filter(col => col.visible).length} className="p-8 text-center text-gray-500 italic">
                    <div className="flex flex-col items-center gap-2">
                      <span>No hay datos disponibles</span>
                      <span className="text-xs">Haz clic derecho para agregar una categoría</span>
                    </div>
                  </td>
                </tr>
              )}
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