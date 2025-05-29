import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useRowSelect, useGlobalFilter } from 'react-table';
import { 
  ClickUpTableProps, 
  ClickUpColumn, 
  ClickUpTableState, 
  ClickUpFilter,
  ClickUpViewConfig,
  TASK_STATUSES,
  TASK_PRIORITIES
} from './NewTypes';
import { ClickUpTableHeader } from './NewTableHeader';
import { ClickUpTableFilters } from './NewTableFilters';
import { ClickUpTableCell } from './NewTableCell';
import { ClickUpColumnMenu } from './NewColumnMenu';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../hooks/useToast';

// Definir las columnas antes del estado - ACTUALIZADO
const defineColumns = (t: any): ClickUpColumn[] => [
/*   {
    id: 'select',
    Header: '',
    accessor: '_id',
    width: 40,
    canResize: false,
    canSort: false,
    canFilter: false,
    canHide: false,
    Cell: ({ row }) => (
      <input
        type="checkbox"
        checked={false}
        onChange={() => {}}
        className="rounded border-gray-300 text-primary focus:ring-primary"
      />
    )
  }, */
  {
    id: 'descripcion',
    Header: t('title'),
    accessor: 'descripcion',
    width: 250,
    minWidth: 150,
    maxWidth: 400,
    canResize: true,
    type: 'text'
  },
  {
    id: 'estado',
    Header: 'Estado',
    accessor: 'estado',
    width: 130,
    minWidth: 100,
    maxWidth: 180,
    canResize: true,
    type: 'select',
    options: TASK_STATUSES
  },
  {
    id: 'prioridad',
    Header: 'Prioridad',
    accessor: 'prioridad',
    width: 120,
    minWidth: 100,
    maxWidth: 160,
    canResize: true,
    type: 'priority',
    options: TASK_PRIORITIES
  },
  {
    id: 'responsable',
    Header: t('responsible'),
    accessor: 'responsable',
    width: 150,
    minWidth: 120,
    maxWidth: 250,
    canResize: true,
    type: 'user'
  },
  {
    id: 'fecha',
    Header: t('date'),
    accessor: 'fecha',
    width: 120,
    minWidth: 100,
    maxWidth: 160,
    canResize: true,
    type: 'date'
  },
  {
    id: 'duracion',
    Header: t('duracion'),
    accessor: 'duracion',
    width: 100,
    minWidth: 80,
    maxWidth: 140,
    canResize: true,
    type: 'number'
  },
  {
    id: 'tips',
    Header: t('tips'),
    accessor: 'tips',
    width: 200,
    minWidth: 150,
    maxWidth: 400,
    canResize: true,
    type: 'editor'
  },
  {
    id: 'tags',
    Header: t('labels'),
    accessor: 'tags',
    width: 120,
    minWidth: 100,
    maxWidth: 250,
    canResize: true,
    type: 'tags'
  }
];

export const ClickUpTableView: React.FC<ClickUpTableProps> = ({
  data,
  itinerario,
  selectTask,
  setSelectTask,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate
}) => {
  const { t } = useTranslation();
  const { config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();

  // Definir columnas usando useMemo
  const columns = useMemo(() => defineColumns(t), [t]);

  // Estado de la tabla
  const [tableState, setTableState] = useState<ClickUpTableState>(() => ({
    columns: columns,
    hiddenColumns: [],
    pinnedColumns: { left: [], right: [] },
    sortBy: [],
    filters: [],
    globalFilter: '',
    selectedRows: []
  }));

  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [savedViews, setSavedViews] = useState<ClickUpViewConfig[]>([]);

  // Verificación de seguridad para filteredData
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    let filtered = [...data];

    // Memoizar los filtros para evitar recálculos innecesarios
    const activeFilters = tableState.filters.filter(f => f.isActive && f.value);
    
    // Aplicar filtros solo si hay filtros activos
    if (activeFilters.length > 0) {
      filtered = filtered.filter(item => {
        return activeFilters.every(filter => {
          const value = item[filter.columnId];
          const filterValue = filter.value;
          
          switch (filter.operator) {
            case 'contains':
              return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'equals':
              return value === filterValue;
            case 'startsWith':
              return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
            case 'endsWith':
              return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
            case 'gt':
              return Number(value) > Number(filterValue);
            case 'lt':
              return Number(value) < Number(filterValue);
            case 'gte':
              return Number(value) >= Number(filterValue);
            case 'lte':
              return Number(value) <= Number(filterValue);
            case 'in':
              return Array.isArray(filterValue) && filterValue.includes(value);
            case 'notIn':
              return Array.isArray(filterValue) && !filterValue.includes(value);
            default:
              return true;
          }
        });
      });
    }

    // Aplicar filtro global solo si existe
    if (tableState.globalFilter) {
      const searchTerm = tableState.globalFilter.toLowerCase();
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm)
        )
      );
    }

    return filtered;
  }, [data, tableState.filters, tableState.globalFilter]);

  // Configurar react-table
  const tableInstance = useTable(
    {
      columns: useMemo(() => {
        // Asegurarnos de que columns existe antes de filtrar
        if (!tableState.columns) return columns;
        return tableState.columns.filter(
          col => !tableState.hiddenColumns.includes(col.id)
        );
      }, [tableState.columns, tableState.hiddenColumns, columns]),
      data: filteredData,
      initialState: {
        sortBy: tableState.sortBy,
        hiddenColumns: tableState.hiddenColumns
      }
    },
    useGlobalFilter,
    useSortBy,
    useRowSelect
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = tableInstance;

// Optimizar el manejo de actualizaciones de celda - MEJORADO
const handleCellUpdate = useCallback(async (rowIndex: number, columnId: string, value: any) => {
  const task = filteredData[rowIndex];
  
  try {
    let processedValue = value;
    
    // Procesar el valor según el tipo de columna
    switch (columnId) {
      case 'responsable':
      case 'tags':
      case 'attachments':
        // Para arrays, asegurar que sea un array y convertir a JSON
        processedValue = Array.isArray(value) ? JSON.stringify(value) : JSON.stringify([]);
        break;
      case 'tips':
        // Para editor de texto, mantener como string
        processedValue = String(value || '');
        break;
      case 'duracion':
        // Para números, convertir a string
        processedValue = String(value || '0');
        break;
      case 'fecha':
        // Para fechas, manejar formato
        if (value instanceof Date) {
          processedValue = value.toISOString();
        } else if (typeof value === 'string') {
          processedValue = value;
        } else {
          processedValue = new Date().toISOString();
        }
        break;
      case 'estatus':
      case 'spectatorView':
        // Para booleanos
        processedValue = JSON.stringify(Boolean(value));
        break;
      default:
        // Para otros tipos, convertir a string
        processedValue = String(value || '');
    }

    await fetchApiEventos({
      query: queries.editTask,
      variables: {
        eventID: event._id,
        itinerarioID: itinerario._id,
        taskID: task._id,
        variable: columnId,
        valor: processedValue
      },
      domain: config.domain
    });

    // Actualizar el estado local
    const updatedValue = columnId === 'responsable' || columnId === 'tags' || columnId === 'attachments' 
      ? (Array.isArray(value) ? value : [])
      : value;

    onTaskUpdate(task._id, { [columnId]: updatedValue });
    toast('success', t('Item guardado con éxito'));
    
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    toast('error', t('Error al actualizar la tarea'));
  }
}, [event._id, itinerario._id, filteredData, onTaskUpdate, config.domain, t, toast]);

  // Manejar creación de tarea
  const handleAddTask = () => {
    const newTask = {
      descripcion: 'Nueva tarea',
      estado: 'pending',
      prioridad: 'normal',
      responsable: [],
      fecha: new Date(), // Convertir a objeto Date en lugar de string
      duracion: 30,
      tags: [],
      tips: ''
    };
    
    onTaskCreate(newTask);
  };

// Optimizar el manejo de toggles de columnas
const handleToggleColumn = useCallback((columnId: string) => {
  setTableState(prev => ({
    ...prev,
    hiddenColumns: prev.hiddenColumns.includes(columnId)
      ? prev.hiddenColumns.filter(id => id !== columnId)
      : [...prev.hiddenColumns, columnId]
  }));
}, []);

  // Manejar filtros
  const handleFiltersChange = (filters: ClickUpFilter[]) => {
    setTableState(prev => ({ ...prev, filters }));
  };

  // Guardar vista
  const handleSaveView = (view: ClickUpViewConfig) => {
    setSavedViews(prev => [...prev, view]);
    toast('success', 'Vista guardada correctamente');
  };

  // Cargar vista
  const handleLoadView = (view: ClickUpViewConfig) => {
    setTableState(prev => ({
      ...prev,
      columns: view.columns,
      filters: view.filters,
      sortBy: view.sortBy
    }));
    toast('success', `Vista "${view.name}" cargada`);
  };

  const activeFiltersCount = tableState.filters.filter(f => f.isActive && f.value).length;

  // Verificación para el renderizado
  if (!tableState.columns) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header principal */}
      <ClickUpTableHeader
        title={`${itinerario.title} - Vista Tabla`}
        totalItems={data.length}
        selectedItems={tableState.selectedRows.length}
        searchValue={tableState.globalFilter}
        onSearchChange={(value) => setTableState(prev => ({ ...prev, globalFilter: value }))}
        onAddTask={handleAddTask}
        onExport={() => console.log('Exportar')}
        onImport={() => console.log('Importar')}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        columns={tableState.columns}
        hiddenColumns={tableState.hiddenColumns}
        onToggleColumn={handleToggleColumn}
        onFiltersToggle={() => setShowFilters(!showFilters)}
        filtersActive={activeFiltersCount > 0}
      />

      {/* Panel de filtros */}
      {showFilters && (
        <ClickUpTableFilters
          filters={tableState.filters}
          columns={tableState.columns}
          onFiltersChange={handleFiltersChange}
          onSaveView={handleSaveView}
          savedViews={savedViews}
          onLoadView={handleLoadView}
        />
      )}

      {/* Tabla principal */}
      <div className="flex-1 overflow-auto z-0">
        <div className="min-w-full">
          <table {...getTableProps()} className="w-full bg-white">
            {/* Header de la tabla */}
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              {headerGroups.map((headerGroup, headerGroupIndex) => (
                <tr 
                  key={`header-group-${headerGroupIndex}`} 
                  {...headerGroup.getHeaderGroupProps()} 
                  className="divide-x divide-gray-200"
                >
                  {headerGroup.headers.map((column, columnIndex) => (
                    <th
                      key={`header-${column.id || columnIndex}`}
                      {...column.getHeaderProps()}
                      className="group relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          {...(column.canSort ? column.getSortByToggleProps() : {})}
                          className={`flex items-center space-x-1 ${column.canSort ? 'cursor-pointer' : ''}`}
                        >
                          <span>{column.render('Header')}</span>
                          {column.isSorted && (
                            <span className="text-primary">
                              {column.isSortedDesc ? '↓' : '↑'}
                            </span>
                          )}
                        </div>
                        
                        {column.id !== 'select' && (
                          <ClickUpColumnMenu
                            column={column as any}
                            onSort={(direction) => console.log('Sort', direction)}
                            onFilter={() => console.log('Filter')}
                            onHide={() => handleToggleColumn(column.id)}
                            onPin={(position) => console.log('Pin', position)}
                            onResize={() => console.log('Resize')}
                            onInsertLeft={() => console.log('Insert left')}
                            onInsertRight={() => console.log('Insert right')}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body de la tabla */}
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
              {rows.map((row, rowIndex) => {
                prepareRow(row);
                return (
                  <tr
                    key={row.original._id || `row-${rowIndex}`}
                    {...row.getRowProps()}
                    className={`
                      hover:bg-gray-50 transition-colors divide-x divide-gray-200
                      ${selectTask === row.original._id ? 'bg-pink-50' : ''}
                    `}
                    onClick={() => setSelectTask(row.original._id)}
                  >
                    {row.cells.map((cell, cellIndex) => (
                      <td
                        key={`${row.original._id}-${cell.column.id || cellIndex}`}
                        {...cell.getCellProps()}
                        className="px-0 py-0 whitespace-nowrap"
                        style={{
                          width: cell.column.width,
                          minWidth: cell.column.minWidth,
                          maxWidth: cell.column.maxWidth
                        }}
                      >
                        <ClickUpTableCell
                          column={cell.column as any}
                          row={row}
                          value={cell.value}
                          onUpdate={(value) => handleCellUpdate(rowIndex, cell.column.id, value)}
                          isEditing={editingCell?.row === rowIndex && editingCell?.column === cell.column.id}
                          onStartEdit={() => setEditingCell({ row: rowIndex, column: cell.column.id })}
                          onStopEdit={() => setEditingCell(null)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mensaje cuando no hay datos */}
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {data.length === 0 ? (
                  <div>
                    <p className="text-lg mb-2">No hay tareas todavía</p>
                    <p className="text-sm">Crea tu primera tarea para comenzar</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-2">No se encontraron resultados</p>
                    <p className="text-sm">Intenta ajustar tus filtros o búsqueda</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer con información */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            Mostrando {filteredData.length} de {data.length} tareas
          </div>
          <div className="flex items-center space-x-4">
            {tableState.selectedRows.length > 0 && (
              <span>{tableState.selectedRows.length} seleccionadas</span>
            )}
            {activeFiltersCount > 0 && (
              <span>{activeFiltersCount} filtros activos</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};