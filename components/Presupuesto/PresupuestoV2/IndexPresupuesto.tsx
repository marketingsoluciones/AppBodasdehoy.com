// components/SmartSpreadsheetView2.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { GrMoney } from 'react-icons/gr';
import { GoEye, GoEyeClosed, GoTasklist } from 'react-icons/go';
import { PiNewspaperClippingLight } from 'react-icons/pi';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { EventContextProvider } from "../../../context";
import { handleChange, handleCreateItem, handleCreateGasto, handleCreateCategoria, handleChangeEstatus, handleChangeEstatusItem } from "../../TablesComponents/tableBudgetV8.handles";
import { useAllowed } from "../../../hooks/useAllowed";
import { useToast } from "../../../hooks/useToast";
import { FloatOptionsMenu } from "../../Utils/FloatOptionsMenu";
import FormAddPago from "../../Forms/FormAddPago";
import { ModalTaskList } from "../ModalTaskList";
import ClickAwayListener from "react-click-away-listener";
import { FloatOptionsMenuInterface, ModalInterface } from '../../../utils/Interfaces';
import { fetchApiEventos, queries } from "../../../utils/Fetching";

// Importar componentes separados
import { SmartSpreadsheetHeader } from './SmartSpreadsheetHeader';
import { SmartSpreadsheetTable } from './SmartSpreadsheetTable';
import { SmartSpreadsheetFooter } from './SmartSpreadsheetFooter';
import { FiltersModal } from './modals/FiltersModal';
import { EventInfoModal } from './modals/EventInfoModal';
import { ColumnsConfigModal } from './modals/ColumnsConfigModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';

// Importar hooks personalizados
import { useSmartTableData, useSmartTableFilters, useSmartTableColumns } from './hooks';

// Importar tipos
import { TableRow, MenuOption, ModalState, DeleteModalState } from './types';

export const SmartSpreadsheetView2 = () => {
  const { event, setEvent } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const [viewLevel, setViewLevel] = useState(3);
  
  // Inicializar con todas las categorías expandidas por defecto
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const categorias = event?.presupuesto_objeto?.categorias_array || [];
    return new Set(categorias.map(cat => cat._id));
  });
  
  // Estados para modales de control
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showColumnsConfig, setShowColumnsConfig] = useState(false);
  const [showEventInfoModal, setShowEventInfoModal] = useState(false);
  
  // Estados para opciones y modales adicionales
  const [showOptionsMenu, setShowOptionsMenu] = useState<FloatOptionsMenuInterface>();
  const [RelacionarPagoModal, setRelacionarPagoModal] = useState<ModalState>({ id: "", crear: false, categoriaID: "" });
  const [ServisiosListModal, setServisiosListModal] = useState<ModalState>({ id: "", crear: false, categoriaID: "" });
  const [showDeleteModal, setShowDeleteModal] = useState<DeleteModalState>({ state: false, title: "", values: null });
  const [loading, setLoading] = useState(false);
  
  // Usar hooks personalizados
  const { filters, handleFilterChange, clearFilters } = useSmartTableFilters();
  const { columnConfig, toggleColumnVisibility } = useSmartTableColumns();
  
  // Datos del evento con validación
  const categorias_array = event?.presupuesto_objeto?.categorias_array || [];
  const currency = event?.presupuesto_objeto?.currency || 'eur';
  const totalStimatedGuests = event?.presupuesto_objeto?.totalStimatedGuests || { adults: 0, children: 0 };

  // Generar datos de la tabla usando el hook personalizado
  const { tableData, totals, isGastoEditable } = useSmartTableData(
    categorias_array,
    viewLevel,
    expandedCategories,
    filters,
    totalStimatedGuests,
    event
  );

  // Función para formatear números
  const formatNumber = useCallback((value: number) => {
    if (typeof value !== 'number') return String(value || 0);
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  // Función para recalcular totales
  const recalculateEventTotals = useCallback(() => {
    if (!event?.presupuesto_objeto?.categorias_array) return false;

    let hasChanges = false;
    const updatedEvent = { ...event };

    updatedEvent.presupuesto_objeto.categorias_array.forEach(categoria => {
      if (!categoria.gastos_array || !Array.isArray(categoria.gastos_array)) return;
      
      let categoriaTotalCalculated = 0;
      
      categoria.gastos_array.forEach(gasto => {
        let gastoTotalCalculated = 0;
        
        if (gasto.items_array && Array.isArray(gasto.items_array) && gasto.items_array.length > 0) {
          gasto.items_array.forEach(item => {
            const cantidad = item.unidad === 'xAdultos.' ? totalStimatedGuests.adults :
                           item.unidad === 'xNiños.' ? totalStimatedGuests.children :
                           item.unidad === 'xInv.' ? (totalStimatedGuests.adults + totalStimatedGuests.children) :
                           item.cantidad || 0;
            
            gastoTotalCalculated += cantidad * (item.valor_unitario || 0);
          });
          
          if (Math.abs(gasto.coste_final - gastoTotalCalculated) > 0.01) {
            gasto.coste_final = gastoTotalCalculated;
            hasChanges = true;
          }
        } else {
          gastoTotalCalculated = gasto.coste_final || 0;
        }
        
        categoriaTotalCalculated += gastoTotalCalculated;
      });
      
      if (Math.abs(categoria.coste_final - categoriaTotalCalculated) > 0.01) {
        categoria.coste_final = categoriaTotalCalculated;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setEvent(updatedEvent);
      return true;
    }
    return false;
  }, [event, setEvent, totalStimatedGuests]);

  // Función para manejar cambios con recálculo
  const handleChangeWithRecalculation = useCallback((values: any, info: any) => {
    handleChange({ values, info, event, setEvent });
    
    if (['valor_unitario', 'cantidad', 'unidad', 'coste_final'].includes(values.accessor)) {
      setTimeout(() => {
        recalculateEventTotals();
      }, 50);
    }
  }, [recalculateEventTotals, event, setEvent]);

  // Actualizar categorías expandidas cuando cambien los datos
  useEffect(() => {
    if (categorias_array.length > 0) {
      setExpandedCategories(new Set(categorias_array.map(cat => cat._id)));
    }
  }, [categorias_array.length]);

  // Efecto para recalcular totales
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      recalculateEventTotals();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [recalculateEventTotals]);

  // Cerrar modales al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFiltersModal || showColumnsConfig || showEventInfoModal) {
        const target = event.target as Element;
        const isFiltersModal = target.closest('.filters-modal');
        const isColumnsModal = target.closest('.columns-modal');
        const isEventInfoModal = target.closest('.event-info-modal');
        const isFilterButton = target.closest('.filter-button');
        const isColumnButton = target.closest('.column-button');
        const isEventInfoButton = target.closest('.event-info-button');

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

  // Función para generar opciones dinámicas del menú
  const getMenuOptions = useCallback((info: any): MenuOption[] => {
    let isHidden = false;
    if (info?.row?.original?.object === 'gasto' && info?.row?.original?.gastoOriginal) {
      isHidden = info.row.original.gastoOriginal.estatus === false;
    } else if (info?.row?.original?.object === 'item') {
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
            await handleCreateCategoria({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu });
            
            setTimeout(async () => {
              try {
                const nuevaCategoria = event?.presupuesto_objeto?.categorias_array[event.presupuesto_objeto.categorias_array.length - 1];
                
                if (nuevaCategoria) {
                  if (!nuevaCategoria.gastos_array) {
                    nuevaCategoria.gastos_array = [];
                  }
                  
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
            await handleCreateGasto({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu });
            
            setTimeout(() => {
              setEvent(prevEvent => ({ ...prevEvent }));
              
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
            await handleCreateItem({ info, event, setEvent, setShowDotsOptionsMenu: setShowOptionsMenu });
            
            setTimeout(() => {
              const updated = recalculateEventTotals();
              if (!updated) {
                setEvent(prevEvent => ({ ...prevEvent }));
              }
              
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
  }, [categorias_array, showOptionsMenu, event, setEvent, setShowOptionsMenu, recalculateEventTotals, toast]);

  // Función para manejar el menú de opciones
  const handleOptionsMenu = useCallback((e: React.MouseEvent, row: TableRow, isContextMenu = false) => {
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

      const tableContainer = (e.target as Element).closest('.table-container') || document.querySelector('[class*="overflow-auto"]');
      let tableRect = tableContainer?.getBoundingClientRect();

      // Normaliza el rectángulo para evitar problemas de tipos con DOMRect
      const domRect = tableContainer?.getBoundingClientRect();
      tableRect = domRect
        ? {
            left: domRect.left,
            top: domRect.top,
            right: domRect.right,
            bottom: domRect.bottom,
            width: domRect.right - domRect.left,
            height: domRect.bottom - domRect.top,
            x: domRect.x,
            y: domRect.y,
            toJSON: () => domRect.toJSON(),
          }
        : {
            left: 0,
            top: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          };
      
      let position;
      
      if (isContextMenu) {
        position = {
          x: e.clientX - tableRect.left,
          y: e.clientY - tableRect.top
        };
      } else {
        const buttonRect = (e.target as Element).getBoundingClientRect();
        position = {
          x: buttonRect.left - tableRect.left + buttonRect.width,
          y: buttonRect.top - tableRect.top
        };
      }

      const menuWidth = 200;
      const menuHeight = getMenuOptions(mockInfo).length * 32;

      const maxX = tableRect.width - menuWidth - 10;
      const maxY = tableRect.height - menuHeight - 10;

      position.x = Math.min(Math.max(10, position.x), maxX);
      position.y = Math.min(Math.max(10, position.y), maxY);

      const aling = position.y > tableRect.height / 2 ? "botton" : "top";
      const justify = position.x > tableRect.width / 2 ? "end" : "start";
      
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
  }, [isAllowed, showOptionsMenu, getMenuOptions, ht]);

  const toggleCategory = useCallback((categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  }, [expandedCategories]);

  // Función para manejar el borrado
  const handleDeleteConfirm = useCallback(async () => {
    if (!showDeleteModal.values) return;
    
    setLoading(true);
    
    try {
      const { values } = showDeleteModal;
      
      if (values?.object === "categoria") {
        await fetchApiEventos({
          query: queries.borraCategoria,
          variables: {
            evento_id: event?._id,
            categoria_id: values?._id,
          },
        });
        
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
      
      setEvent({ ...event });
      setShowOptionsMenu({ state: false });
      
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
  }, [showDeleteModal, event, setEvent, recalculateEventTotals, toast]);

  if (!categorias_array) {
    return <div className="p-8 text-center text-gray-500">Cargando presupuesto...</div>;
  }

  return (
    <div className="pl-2  h-full bg-gray-50 flex flex-col  relative">
      {/* Header con controles */}
      <SmartSpreadsheetHeader
        filters={filters}
        onFilterChange={handleFilterChange}
        totals={totals}
        showFiltersModal={showFiltersModal}
        setShowFiltersModal={setShowFiltersModal}
        showColumnsConfig={showColumnsConfig}
        setShowColumnsConfig={setShowColumnsConfig}
        showEventInfoModal={showEventInfoModal}
        setShowEventInfoModal={setShowEventInfoModal}
        formatNumber={formatNumber}
      />

      {/* Modales */}
      {showFiltersModal && (
        <FiltersModal
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFiltersModal(false)}
          onClearFilters={clearFilters}
          viewLevel={viewLevel}
          setViewLevel={setViewLevel}
          categorias_array={categorias_array}
        />
      )}

      {showEventInfoModal && (
        <EventInfoModal
          event={event}
          currency={currency}
          categorias_array={categorias_array}
          totalStimatedGuests={totalStimatedGuests}
          totals={totals}
          formatNumber={formatNumber}
          onClose={() => setShowEventInfoModal(false)}
        />
      )}

      {showColumnsConfig && (
        <ColumnsConfigModal
          columnConfig={columnConfig}
          toggleColumnVisibility={toggleColumnVisibility}
          onClose={() => setShowColumnsConfig(false)}
        />
      )}

      {/* Tabla */}
      <SmartSpreadsheetTable
        tableData={tableData}
        columnConfig={columnConfig}
        onToggleCategory={toggleCategory}
        onRowChange={handleChangeWithRecalculation}
        onOptionsMenu={handleOptionsMenu}
        formatNumber={formatNumber}
        categorias_array={categorias_array}
        event={event}
        getMenuOptions={getMenuOptions}
      />

      {/* Footer */}
      <SmartSpreadsheetFooter
        totals={totals}
        formatNumber={formatNumber}
      />

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

      <DeleteConfirmModal
        showDeleteModal={showDeleteModal}
        loading={loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal({ state: false, title: "", values: null })}
      />
    </div>
  );
};