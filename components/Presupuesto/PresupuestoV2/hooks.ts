// hooks/useSmartTableData.ts
import { useMemo, useCallback, useState } from 'react';
import { TableRow, TableFilters, TableTotals, ColumnConfig } from '../PresupuestoV2/types';

export const useSmartTableData = (
  categorias_array: any[],
  viewLevel: number,
  expandedCategories: Set<string>,
  filters: TableFilters,
  totalStimatedGuests: { adults: number; children: number },
  event: any
) => {
  
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

  // Generar datos de la tabla
  const tableData = useMemo(() => {
    const rows: TableRow[] = [];
    
    if (!categorias_array || !Array.isArray(categorias_array)) {
      return [];
    }
    
    const eventKey = Date.now();
    
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
              
              const cantidad = item.unidad === 'xAdultos.' ? totalStimatedGuests.adults :
                             item.unidad === 'xNiños.' ? totalStimatedGuests.children :
                             item.unidad === 'xInv.' ? (totalStimatedGuests.adults + totalStimatedGuests.children) :
                             item.cantidad || 0;
              
              const totalItem = cantidad * (item.valor_unitario || 0);
              
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
                  eventKey: eventKey
                });
              }
            });
          }
          
          if (viewLevel >= 2) {
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
              total: gasto.coste_final || 0,
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
              eventKey: eventKey
            });
          }
        });
      }
      
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
        total: categoria.coste_final || 0,
        pagado: categoria.pagado || 0,
        pendiente: (categoria.coste_final || 0) - (categoria.pagado || 0),
        level: 0,
        expandable: true,
        expanded: expandedCategories.has(categoria._id),
        categoriaID: categoria._id,
        gastoID: null,
        itemID: null,
        object: 'categoria',
        eventKey: eventKey
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
  }, [viewLevel, expandedCategories, categorias_array, totalStimatedGuests, filters, event?.presupuesto_objeto, applyFilters, isGastoEditable]);

  // Calcular totales
  const totals = useMemo((): TableTotals => {
    const categoryRows = tableData.filter(row => row.type === 'category');
    
    return {
      estimado: categoryRows.reduce((acc, cat) => acc + (cat.estimado || 0), 0),
      total: categoryRows.reduce((acc, cat) => acc + (cat.total || 0), 0),
      pagado: categoryRows.reduce((acc, cat) => acc + (cat.pagado || 0), 0),
    };
  }, [tableData]);

  return {
    tableData,
    totals,
    isGastoEditable
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