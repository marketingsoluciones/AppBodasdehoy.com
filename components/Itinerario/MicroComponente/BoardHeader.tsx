import React from 'react';
import {
  Search,
  Filter,
  Maximize2,
  Minimize2,
  Save,
  Download,
  Zap,
  Layers,
  Hash,
  X,
} from 'lucide-react';
import { Itinerary } from '../../../utils/Interfaces';
import { BoardColumn } from './types';
import { useTranslation } from 'react-i18next';

interface BoardHeaderProps {
  itinerario: Itinerary;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  draggedItem: any;
  visibleColumns: BoardColumn[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilters: Record<string, any>;
  isGlobalCollapsed: boolean;
  onToggleGlobalCollapse: () => void;
  onManualSave: () => void;
  onExport: () => void;
  onShowShortcuts: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  itinerario,
  isSaving,
  hasUnsavedChanges,
  draggedItem,
  visibleColumns,
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFilters,
  isGlobalCollapsed,
  onToggleGlobalCollapse,
  onManualSave,
  onExport,
  onShowShortcuts,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {itinerario.title} - Vista Tablero
            </h2>
            {(isSaving || hasUnsavedChanges || draggedItem) && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {isSaving || draggedItem ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>{draggedItem ? t('Moviendo tarea...') : t('Guardando cambios...')}</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{t('Cambios sin guardar')}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Indicadores de estado */}
            <div className="flex items-center space-x-3 text-sm">
              <span className="flex items-center space-x-1 text-gray-500">
                <Layers className="w-4 h-4" />
                <span>{visibleColumns.length} columnas</span>
              </span>
              <span className="flex items-center space-x-1 text-gray-500">
                <Hash className="w-4 h-4" />
                <span>
                  {visibleColumns.reduce((acc, col) => acc + col.tasks.length, 0)} tareas
                </span>
              </span>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tareas... (Ctrl+F)"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botones de acción */}
            <button
              onClick={onToggleFilters}
              className={`p-2 rounded-md transition-colors ${showFilters || Object.keys(activeFilters).length > 0
                ? 'bg-pink-100 text-primary'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              title="Filtros"
            >
              <Filter className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleGlobalCollapse}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title={isGlobalCollapsed ? 'Expandir todo' : 'Contraer todo'}
            >
              {isGlobalCollapsed ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>

            {/* Botón de guardar manual */}
            {hasUnsavedChanges && (
              <button
                onClick={onManualSave}
                disabled={isSaving}
                className={`p-2 rounded-md transition-colors ${
                  isSaving 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-primary hover:text-white hover:bg-primary bg-pink-100'
                }`}
                title="Guardar cambios (Ctrl+S)"
              >
                <Save className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onExport}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Exportar datos"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onShowShortcuts}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Atajos de teclado (Ctrl+H)"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};