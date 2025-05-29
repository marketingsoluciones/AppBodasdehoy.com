import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  Settings,
  Grid3X3,
  List,
  MoreHorizontal,
  X,
  ChevronDown,
  Eye
} from 'lucide-react';
import { ClickUpColumn } from './NewTypes';
import { ColumnConfigModal } from './NewColumnMenu';

interface ClickUpTableHeaderProps {
  title: string;
  totalItems: number;
  selectedItems: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddTask: () => void;
  onExport: () => void;
  onImport: () => void;
  viewMode: 'table' | 'board';
  onViewModeChange: (mode: 'table' | 'board') => void;
  columns: ClickUpColumn[];
  hiddenColumns: string[];
  onToggleColumn: (columnId: string) => void;
  onFiltersToggle: () => void;
  filtersActive: boolean;
}

export const ClickUpTableHeader: React.FC<ClickUpTableHeaderProps> = ({
  title,
  totalItems,
  selectedItems,
  searchValue,
  onSearchChange,
  onAddTask,
  onExport,
  onImport,
  viewMode,
  onViewModeChange,
  columns,
  hiddenColumns,
  onToggleColumn,
  onFiltersToggle,
  filtersActive
}) => {
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const visibleColumnsCount = columns.filter(col => !hiddenColumns.includes(col.id)).length;

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        {/* Primera fila: Título y controles principales */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <div className="flex items-center text-sm text-gray-500">
              <span>{totalItems} tarea{totalItems !== 1 ? 's' : ''}</span>
              {selectedItems > 0 && (
                <span className="ml-2 px-2 py-1 bg-pink-100 text-primary rounded-full text-xs">
                  {selectedItems} seleccionada{selectedItems !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Selector de vista */}
{/*             <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => onViewModeChange('table')}
                className={`
                  flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors
                  ${viewMode === 'table' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <List className="w-4 h-4" />
                <span>Tabla</span>
              </button>
              <button
                onClick={() => onViewModeChange('board')}
                className={`
                  flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors
                  ${viewMode === 'board' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Tablero</span>
              </button>
            </div> */}

            {/* Botón de agregar */}
            <button
              onClick={onAddTask}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva tarea</span>
            </button>

            {/* Menú de más opciones */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onExport();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar</span>
                    </button>
                    <button
                      onClick={() => {
                        onImport();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importar</span>
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setShowColumnConfig(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configurar columnas</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Segunda fila: Búsqueda y filtros */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Barra de búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botón de filtros */}
            <button
              onClick={onFiltersToggle}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md transition-colors
                ${filtersActive 
                  ? 'bg-pink-100 text-primary border border-pink-200' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {filtersActive && (
                <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Información de columnas */}
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <button
              onClick={() => setShowColumnConfig(true)}
              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{visibleColumnsCount} de {columns.length} columnas</span>
            </button>
          </div>
        </div>

        {/* Tercera fila: Acciones en lote (solo visible cuando hay selecciones) */}
        {selectedItems > 0 && (
          <div className="flex items-center justify-between mt-3 p-3 bg-pink-50 border border-pink-200 rounded-md">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-pink-900">
                {selectedItems} tarea{selectedItems !== 1 ? 's' : ''} seleccionada{selectedItems !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-primary hover:bg-pink-100 rounded transition-colors">
                Cambiar estado
              </button>
              <button className="px-3 py-1 text-sm text-primary hover:bg-pink-100 rounded transition-colors">
                Asignar
              </button>
              <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de configuración de columnas */}
      {showColumnConfig && (
        <ColumnConfigModal
          columns={columns}
          hiddenColumns={hiddenColumns}
          onToggleColumn={onToggleColumn}
          onClose={() => setShowColumnConfig(false)}
        />
      )}
    </>
  );
};

// Componente adicional para el mini header de la tabla
export const TableMiniHeader: React.FC<{
  sortBy: { id: string; desc: boolean }[];
  onSort: (columnId: string) => void;
  onSelectAll: (selected: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
}> = ({ sortBy, onSort, onSelectAll, allSelected, someSelected }) => {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected && !allSelected;
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
          <span className="text-sm text-gray-600">Seleccionar todo</span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {sortBy.length > 0 && (
            <div className="flex items-center space-x-1">
              <span>Ordenado por:</span>
              {sortBy.map((sort, index) => (
                <span key={`sort-${sort.id}-${index}`} className="flex items-center">
                  {index > 0 && <span className="mx-1">,</span>}
                  <span className="font-medium">{sort.id}</span>
                  <ChevronDown className={`w-3 h-3 ml-1 ${sort.desc ? 'rotate-180' : ''}`} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};