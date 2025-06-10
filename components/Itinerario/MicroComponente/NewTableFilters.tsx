import React, { useState } from 'react';
import {
  Filter,
  Plus,
  X,
  Search,
  Save,
  RotateCcw,
  Eye,
  ChevronDown,
  Settings
} from 'lucide-react';
import { 
  FiltersProps, 
  TableFilter, 
  ViewConfig,
  TASK_STATUSES,
  TASK_PRIORITIES 
} from './NewTypes';
import { TableDropdown } from './NewDropdown';
import { useTranslation } from 'react-i18next';

// Función auxiliar para convertir tipos de columna a tipos de filtro
const getFilterType = (columnType: string): TableFilter['type'] => {
  switch (columnType) {
    case 'time':
    case 'status':
    case 'priority':
      return 'select';
    case 'responsable':
      return 'responsable';
    case 'tips':
      return 'tips';
    default:
      return (columnType as TableFilter['type']) || 'text';
  }
};

export const TableFilters: React.FC<FiltersProps> = ({
  filters,
  columns,
  onFiltersChange,
  onSaveView,
  savedViews,
  onLoadView
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  const { t } = useTranslation();

  const addFilter = () => {
    const newFilter: TableFilter = {
      id: `filter_${Date.now()}`,
      columnId: columns[0]?.id || '',
      type: 'text',
      operator: 'contains',
      value: '',
      isActive: true
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (filterId: string, updates: Partial<TableFilter>) => {
    const updatedFilters = filters.map(filter =>
      filter.id === filterId ? { ...filter, ...updates } : filter
    );
    onFiltersChange(updatedFilters);
  };

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter(filter => filter.id !== filterId));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const activeFiltersCount = filters.filter(f => f.isActive && f.value).length;

  const getFilterOperators = (type: string) => {
    switch (type) {
      case 'text':
        return [
          { value: 'contains', label: t('Contiene') },
          { value: 'equals', label: t('Es igual a') },
          { value: 'startsWith', label: t('Comienza con') },
          { value: 'endsWith', label: t('Termina con') }
        ];
      case 'number':
        return [
          { value: 'equals', label: t('Es igual a') },
          { value: 'gt', label: t('Mayor que') },
          { value: 'lt', label: t('Menor que') },
          { value: 'gte', label: t('Mayor o igual') },
          { value: 'lte', label: t('Menor o igual') }
        ];
      case 'date':
        return [
          { value: 'equals', label: t('Es igual a') },
          { value: 'gt', label: t('Después de') },
          { value: 'lt', label: t('Antes de') },
          { value: 'gte', label: t('Desde') },
          { value: 'lte', label: t('Hasta') }
        ];
      case 'select':
      case 'multiselect':
        return [
          { value: 'in', label: t('Es uno de') },
          { value: 'notIn', label: t('No es uno de') }
        ];
      default:
        return [{ value: 'contains', label: t('Contiene') }];
    }
  };

  const saveView = () => {
    if (!newViewName.trim()) return;

    const newView: ViewConfig = {
      id: `view_${Date.now()}`,
      name: newViewName.trim(),
      columns,
      filters,
      sortBy: []
    };

    onSaveView(newView);
    setNewViewName('');
    setShowSaveModal(false);
  };

  const renderFilterValue = (filter: TableFilter) => {
    const column = columns.find(col => col.id === filter.columnId);
    
    switch (column?.type) {
      case 'select':
        return (
          <TableDropdown
            options={TASK_STATUSES}
            value={filter.value}
            onChange={(value) => updateFilter(filter.id, { value })}
            placeholder={t('Seleccionar estado')}
            multiple={filter.operator === 'in' || filter.operator === 'notIn'}
            size="sm"
          />
        );
      
      case 'priority':
        return (
          <TableDropdown
            options={TASK_PRIORITIES}
            value={filter.value}
            onChange={(value) => updateFilter(filter.id, { value })}
            placeholder={t('Seleccionar prioridad')}
            multiple={filter.operator === 'in' || filter.operator === 'notIn'}
            size="sm"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary/20"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder={t('Valor')}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary/20"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder={t('Valor')}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary/20"
          />
        );
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Header del panel de filtros */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              flex items-center space-x-2 px-3 py-1 rounded-md transition-colors
              ${activeFiltersCount > 0 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">{t('Filtros')}</span>
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Vistas guardadas */}
          <div className="relative">
            <button
              onClick={() => setShowViewsDropdown(!showViewsDropdown)}
              className="flex items-center space-x-2 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">{t('Vistas')}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showViewsDropdown && (
              <div className="absolute top-8 left-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {savedViews.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => {
                        onLoadView(view);
                        setShowViewsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      {view.name}
                    </button>
                  ))}
                  {savedViews.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {t('No hay vistas guardadas')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-sm">{t('Limpiar')}</span>
            </button>
          )}

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Save className="w-3 h-3" />
            <span className="text-sm">{t('Guardar vista')}</span>
          </button>
        </div>
      </div>

      {/* Panel expandido de filtros */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-200">
          <div className="space-y-3 mt-3">
            {filters.map((filter) => {
              const column = columns.find(col => col.id === filter.columnId);
              const operators = getFilterOperators(column?.type || 'text');

              return (
                <div key={filter.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                  {/* Columna */}
                  <select
                    value={filter.columnId}
                    onChange={(e) => {
                      const selectedColumn = columns.find(col => col.id === e.target.value);
                      updateFilter(filter.id, {
                        columnId: e.target.value,
                        type: getFilterType(selectedColumn?.type || 'text'),
                        operator: 'contains',
                        value: ''
                      });
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    {columns.filter(col => col.id !== 'actions' && col.canFilter !== false).map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.Header}
                      </option>
                    ))}
                  </select>

                  {/* Operador */}
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Valor */}
                  <div className="flex-1">
                    {renderFilterValue(filter)}
                  </div>

                  {/* Activar/Desactivar */}
                  <button
                    onClick={() => updateFilter(filter.id, { isActive: !filter.isActive })}
                    className={`
                      p-1 rounded transition-colors
                      ${filter.isActive 
                        ? 'text-green hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                      }
                    `}
                    title={filter.isActive ? t('Desactivar filtro') : t('Activar filtro')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title={t('Eliminar filtro')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Botón para agregar filtro */}
            <button
              onClick={addFilter}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors w-full"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">{t('Agregar filtro')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal para guardar vista */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {t('Guardar vista')}
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Nombre de la vista')}
                  </label>
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder={t('Mi vista personalizada')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    autoFocus
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>{t('Esta vista incluirá')}:</p>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>{t('Configuración actual de columnas')}</li>
                    <li>{filters.length} {t('filtros')}</li>
                    <li>{t('Orden actual')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                {t('Cancelar')}
              </button>
              <button
                onClick={saveView}
                disabled={!newViewName.trim()}
                className={`
                  px-4 py-2 rounded-md transition-colors
                  ${newViewName.trim()
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {t('Guardar vista')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};