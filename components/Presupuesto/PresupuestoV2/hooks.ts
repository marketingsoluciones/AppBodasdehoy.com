// hooks/useSmartTableData.ts
import { useMemo, useCallback, useState } from 'react';
import { TableRow, TableFilters, TableTotals, ColumnConfig } from '../PresupuestoV2/types';

export const useSmartTableData = (
  categorias_array: any[],
  viewLevel: number,
  expandedCategories: Set<string>,
  filters: TableFilters,
  totalStimatedGuests: { adults: number; children: number },
  event: any,
  updateTrigger?: number // Nuevo parámetro para forzar actualizaciones
) => {
  
  // Función para calcular la cantidad según la unidad
  const calculateCantidad = useCallback((item: any) => {
    if (!item || !item.unidad) return item?.cantidad || 0;
    
    switch (item.unidad) {
      case 'xAdultos.':
        return totalStimatedGuests.adults || 0;
      case 'xNiños.':
        return totalStimatedGuests.children || 0;
      case 'xInv.':
        return (totalStimatedGuests.adults || 0) + (totalStimatedGuests.children || 0);
      case 'xUni.':
      default:
        return item.cantidad || 0;
    }
  }, [totalStimatedGuests]);

  // Función para calcular el total de un item
  const calculateItemTotal = useCallback((item: any) => {
    const cantidad = calculateCantidad(item);
    const valorUnitario = item.valor_unitario || 0;
    return Math.round(cantidad * valorUnitario * 100) / 100;
  }, [calculateCantidad]);

  // Función para calcular el total de un gasto
  const calculateGastoTotal = useCallback((gasto: any) => {
    if (!gasto) return 0;
    
    // Si el gasto tiene items, calcular desde los items
    if (gasto.items_array && Array.isArray(gasto.items_array) && gasto.items_array.length > 0) {
      const total = gasto.items_array.reduce((acc: number, item: any) => {
        return acc + calculateItemTotal(item);
      }, 0);
      return Math.round(total * 100) / 100;
    }
    
    // Si no tiene items, usar el coste_final del gasto
    return gasto.coste_final || 0;
  }, [calculateItemTotal]);

  // Función para calcular el total de una categoría
  const calculateCategoriaTotal = useCallback((categoria: any) => {
    if (!categoria || !categoria.gastos_array || !Array.isArray(categoria.gastos_array)) {
      return 0;
    }
    
    const total = categoria.gastos_array.reduce((acc: number, gasto: any) => {
      return acc + calculateGastoTotal(gasto);
    }, 0);
    
    return Math.round(total * 100) / 100;
  }, [calculateGastoTotal]);
  
  // Función para aplicar filtros
  const applyFilters = useCallback((data: TableRow[]) => {
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

      // Filtro por estado de visibilidad
      if (filters.visibilityStatus !== 'all') {
        let isHidden = false;
        
        if (row.type === 'expense') {
          isHidden = row.gastoOriginal?.estatus === false;
        } else if (row.type === 'item') {
          const categoria = categorias_array.find(cat => cat._id === row.categoriaID);
          const gasto = categoria?.gastos_array?.find(g => g._id === row.gastoID);
          const itemOriginal = gasto?.items_array?.find(item => item._id === row.itemID);
          isHidden = itemOriginal?.estatus === true;
        }
        
        switch (filters.visibilityStatus) {
          case 'visible':
            if (isHidden) return false;
            break;
          case 'hidden':
            if (!isHidden && row.type !== 'category') return false;
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
  }, [filters, categorias_array]);

  // Función para determinar si un gasto es editable
  const isGastoEditable = useCallback((gasto: any) => {
    return !gasto.items_array || !Array.isArray(gasto.items_array) || gasto.items_array.length === 0;
  }, []);

  // Crear un key de dependencia más específico para detectar cambios
  const eventDependencyKey = useMemo(() => {
    
    if (!event?.presupuesto_objeto?.categorias_array) {
      const emptyKey = `empty-${Date.now()}`;
      return emptyKey;
    }
    
    // Crear una cadena única basada en los valores que afectan los cálculos
    const keyParts = [
      `trigger-${updateTrigger}`,
      `guests-${totalStimatedGuests.adults}-${totalStimatedGuests.children}`,
      `level-${viewLevel}`,
      `expanded-${Array.from(expandedCategories).sort().join(',')}`,
      `lastUpdate-${event._lastUpdate || 'none'}`
    ];
    
    // Agregar información específica de cada categoría, gasto e item
    event.presupuesto_objeto.categorias_array.forEach(categoria => {
      keyParts.push(`cat-${categoria._id}-${categoria.nombre}-${categoria.coste_final}`);
      
      if (categoria.gastos_array) {
        categoria.gastos_array.forEach(gasto => {
          keyParts.push(`gas-${gasto._id}-${gasto.nombre}-${gasto.coste_final}`);
          
          if (gasto.items_array) {
            gasto.items_array.forEach(item => {
              keyParts.push(`itm-${item._id}-${item.cantidad}-${item.valor_unitario}-${item.unidad}`);
            });
          }
        });
      }
    });
    
    const finalKey = keyParts.join('|');
    return finalKey;
  }, [event, updateTrigger, totalStimatedGuests, viewLevel, expandedCategories]);

  // Generar datos de la tabla con cálculos automáticos
  const tableData = useMemo(() => {
    
    const rows: TableRow[] = [];
    
    if (!categorias_array || !Array.isArray(categorias_array)) {
      return [];
    }
    
    categorias_array.forEach(categoria => {
      if (!categoria || !categoria._id) return;
      
      if (!categoria.gastos_array || !Array.isArray(categoria.gastos_array)) {
        categoria.gastos_array = [];
      }
      
      const gastosData: TableRow[] = [];
      
      if (categoria.gastos_array && Array.isArray(categoria.gastos_array)) {
        categoria.gastos_array.forEach(gasto => {
          if (!gasto || !gasto._id) return;
          
          if (!gasto.items_array || !Array.isArray(gasto.items_array)) {
            gasto.items_array = [];
          }
          
          const itemsData: TableRow[] = [];
          
          if (gasto.items_array && Array.isArray(gasto.items_array) && gasto.items_array.length > 0) {
            gasto.items_array.forEach(item => {
              if (!item || !item._id) return;
              
              const cantidad = calculateCantidad(item);
              const totalItem = calculateItemTotal(item);
              
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
                  estimado: null,
                  total: totalItem,
                  pagado: 0,
                  pendiente: totalItem,
                  level: 2,
                  categoriaID: categoria._id,
                  gastoID: gasto._id,
                  itemID: item._id,
                  object: 'item',
                  eventKey: eventDependencyKey // Usar el nuevo key
                });
              }
            });
          }
          
          if (viewLevel >= 2) {
            const gastoTotal = calculateGastoTotal(gasto);
            
            gastosData.push({
              type: 'expense',
              id: gasto._id,
              categoria: '',
              partida: gasto.nombre || 'Sin nombre',
              unidad: '',
              cantidad: '',
              item: '',
              valorUnitario: 0,
              estimado: null,
              total: gastoTotal,
              pagado: gasto.pagado || 0,
              pendiente: gastoTotal - (gasto.pagado || 0),
              level: 1,
              categoriaID: categoria._id,
              gastoID: gasto._id,
              itemID: null,
              object: 'gasto',
              gastoOriginal: gasto,
              isEditable: isGastoEditable(gasto),
              items: itemsData,
              eventKey: eventDependencyKey // Usar el nuevo key
            });
          }
        });
      }
      
      // Calcular el total real de la categoría
      const categoriaTotal = calculateCategoriaTotal(categoria);
      
      // Fila de categoría
      rows.push({
        type: 'category',
        id: categoria._id,
        categoria: categoria.nombre || 'Sin nombre',
        partida: '',
        unidad: '',
        cantidad: '',
        item: '',
        valorUnitario: 0,
        estimado: categoria.coste_estimado || 0,
        total: categoriaTotal,
        pagado: categoria.pagado || 0,
        pendiente: categoriaTotal - (categoria.pagado || 0),
        level: 0,
        expandable: true,
        expanded: expandedCategories.has(categoria._id),
        categoriaID: categoria._id,
        gastoID: null,
        itemID: null,
        object: 'categoria',
        eventKey: eventDependencyKey // Usar el nuevo key
      });

      // Agregar gastos si está expandida
      if (expandedCategories.has(categoria._id) && viewLevel >= 2) {
        gastosData.forEach(gastoData => {
          rows.push(gastoData);
          
          if (gastoData.items && gastoData.items.length > 0) {
            gastoData.items.forEach(itemData => {
              rows.push(itemData);
            });
          }
        });
      }
    });

    return applyFilters(rows);
  }, [
    eventDependencyKey, // Nueva dependencia principal que detecta todos los cambios
    filters,
    applyFilters
  ]);

  // Calcular totales con cálculos actualizados
  const totals = useMemo((): TableTotals => {
    const categoryRows = tableData.filter(row => row.type === 'category');
    
    const newTotals = {
      estimado: categoryRows.reduce((acc, cat) => acc + (cat.estimado || 0), 0),
      total: categoryRows.reduce((acc, cat) => acc + (cat.total || 0), 0),
      pagado: categoryRows.reduce((acc, cat) => acc + (cat.pagado || 0), 0),
    };
    
    return newTotals;
  }, [tableData]);

  return {
    tableData,
    totals,
    isGastoEditable,
    calculateCantidad,
    calculateItemTotal,
    calculateGastoTotal,
    calculateCategoriaTotal
  };
};

// hooks/useSmartTableFilters.ts

export const useSmartTableFilters = () => {
  const [filters, setFilters] = useState<TableFilters>({
    categories: [],
    paymentStatus: 'all',
    visibilityStatus: 'all',
    amountRange: { min: '', max: '' },
    searchText: ''
  });

  const handleFilterChange = useCallback((filterType: keyof TableFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      categories: [],
      paymentStatus: 'all',
      visibilityStatus: 'all',
      amountRange: { min: '', max: '' },
      searchText: ''
    });
  }, []);

  return {
    filters,
    handleFilterChange,
    clearFilters
  };
};

// hooks/useSmartTableColumns.ts

export const useSmartTableColumns = () => {
  const [columnConfig, setColumnConfig] = useState<ColumnConfig>({
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

  const toggleColumnVisibility = useCallback((columnKey: keyof ColumnConfig) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        visible: !prev[columnKey].visible
      }
    }));
  }, []);

  return {
    columnConfig,
    toggleColumnVisibility
  };
};