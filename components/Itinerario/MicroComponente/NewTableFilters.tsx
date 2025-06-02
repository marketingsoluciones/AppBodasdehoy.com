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
  ClickUpFiltersProps, 
  ClickUpFilter, 
  ClickUpViewConfig,
  TASK_STATUSES,
  TASK_PRIORITIES 
} from './NewTypes';
import { ClickUpDropdown } from './NewDropdown';

// 1. Primero, definamos los tipos permitidos
type AllowedFilterTypes = 'number' | 'tags' | 'select' | 'text' | 'user' | 'date' | 'multiselect' | 'editor';

// 2. Crear una función auxiliar para convertir tipos de columna a tipos de filtro
const getFilterType = (columnType: string): AllowedFilterTypes => {
  switch (columnType) {
    case 'time':
    case 'status':
    case 'priority':
      return 'select';
    default:
      return (columnType as AllowedFilterTypes) || 'text';
  }
};

export const ClickUpTableFilters: React.FC<ClickUpFiltersProps> = ({
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

  const addFilter = () => {
    const newFilter: ClickUpFilter = {
      id: `filter_${Date.now()}`,
      columnId: columns[0]?.id || '',
      type: 'text',
      operator: 'contains',
      value: '',
      isActive: true
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (filterId: string, updates: Partial<ClickUpFilter>) => {
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
          { value: 'contains', label: 'Contiene' },
          { value: 'equals', label: 'Es igual a' },
          { value: 'startsWith', label: 'Comienza con' },
          { value: 'endsWith', label: 'Termina con' }
        ];
      case 'number':
        return [
          { value: 'equals', label: 'Es igual a' },
          { value: 'gt', label: 'Mayor que' },
          { value: 'lt', label: 'Menor que' },
          { value: 'gte', label: 'Mayor o igual' },
          { value: 'lte', label: 'Menor o igual' }
        ];
      case 'date':
        return [
          { value: 'equals', label: 'Es igual a' },
          { value: 'gt', label: 'Después de' },
          { value: 'lt', label: 'Antes de' },
          { value: 'gte', label: 'Desde' },
          { value: 'lte', label: 'Hasta' }
        ];
      case 'select':
      case 'multiselect':
        return [
          { value: 'in', label: 'Es uno de' },
          { value: 'notIn', label: 'No es uno de' }
        ];
      default:
        return [{ value: 'contains', label: 'Contiene' }];
    }
  };

  const saveView = () => {
    if (!newViewName.trim()) return;

    const newView: ClickUpViewConfig = {
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

  const renderFilterValue = (filter: ClickUpFilter) => {
    const column = columns.find(col => col.id === filter.columnId);
    
    switch (column?.type) {
      case 'select':
        return (
          <ClickUpDropdown
            options={TASK_STATUSES}
            value={filter.value}
            onChange={(value) => updateFilter(filter.id, { value })}
            placeholder="Seleccionar estado"
            multiple={filter.operator === 'in' || filter.operator === 'notIn'}
            size="sm"
          />
        );
      
      case 'priority':
        return (
          <ClickUpDropdown
            options={TASK_PRIORITIES}
            value={filter.value}
            onChange={(value) => updateFilter(filter.id, { value })}
            placeholder="Seleccionar prioridad"
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
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder="Valor"
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder="Valor"
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary"
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
                ? 'bg-pink-100 text-primary' 
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
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
              <span className="text-sm">Vistas</span>
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
                      No hay vistas guardadas
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
              <span className="text-sm">Limpiar</span>
            </button>
          )}

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Save className="w-3 h-3" />
            <span className="text-sm">Guardar vista</span>
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
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.Header}
                      </option>
                    ))}
                  </select>

                  {/* Operador */}
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary"
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
                        ? 'text-green hover:bg-[#dafdda]' 
                        : 'text-gray-400 hover:bg-gray-100'
                      }
                    `}
                    title={filter.isActive ? 'Desactivar filtro' : 'Activar filtro'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="p-1 text-[#ff2525] hover:bg-[#ffdada] rounded transition-colors"
                    title="Eliminar filtro"
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
              <span className="text-sm">Agregar filtro</span>
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
                Guardar vista
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
                    Nombre de la vista
                  </label>
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="Mi vista personalizada"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>Esta vista incluirá:</p>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>Configuración actual de columnas</li>
                    <li>{filters.length} filtro{filters.length !== 1 ? 's' : ''}</li>
                    <li>Orden actual</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveView}
                disabled={!newViewName.trim()}
                className={`
                  px-4 py-2 rounded-md transition-colors
                  ${newViewName.trim()
                    ? 'bg-primary text-white hover:bg-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Guardar vista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};