import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  Filter,
  User,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Task } from '../../../utils/Interfaces';

interface BoardFiltersProps {
  activeFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onClose: () => void;
  tasks: Task[];
}

export const BoardFilters: React.FC<BoardFiltersProps> = ({
  activeFilters,
  onFiltersChange,
  onClose,
  tasks,
}) => {
  const [localFilters, setLocalFilters] = useState(activeFilters);

  // Extraer valores únicos para los filtros

  const filterOptions = useMemo(() => {
    const responsables = new Set<string>();
    const tags = new Set<string>();
    const statuses = new Set<string>();
  
    tasks.forEach(task => {
      // Responsables
      task.responsable?.forEach(r => responsables.add(r));
      
      // Tags
      task.tags?.forEach(t => {
        tags.add(t);
      });
      
      // Estados - Usando solo la propiedad estatus
      if (task.estatus === true) {
        statuses.add('completed'); // Completada
      } else {
        statuses.add('pending'); // Pendiente
      }
    });
  
    return {
      responsables: Array.from(responsables),
      tags: Array.from(tags),
      statuses: Array.from(statuses),
    };
  }, [tasks]);


  // Aplicar filtros
  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters);
  }, [localFilters, onFiltersChange]);

  // Limpiar filtros
  const handleClearFilters = useCallback(() => {
    setLocalFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  // Actualizar filtro local
  const updateLocalFilter = useCallback((key: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Alternar elemento en array de filtro
  const toggleArrayFilter = useCallback((key: string, item: string) => {
    setLocalFilters(prev => {
      const currentArray = prev[key] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i: string) => i !== item)
        : [...currentArray, item];
      
      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined,
      };
    });
  }, []);

  // Contar filtros activos
  const activeFilterCount = Object.keys(localFilters).filter(
    key => localFilters[key] && 
    (Array.isArray(localFilters[key]) ? localFilters[key].length > 0 : true)
  ).length;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeFilterCount} activo{activeFilterCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearFilters}
            className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpiar</span>
          </button>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro de Responsables */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <User className="w-4 h-4" />
            <span>Responsables</span>
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
            {filterOptions.responsables.map(responsable => (
              <label
                key={responsable}
                className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={(localFilters.responsable || []).includes(responsable)}
                  onChange={() => toggleArrayFilter('responsable', responsable)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{responsable}</span>
              </label>
            ))}
            {filterOptions.responsables.length === 0 && (
              <p className="text-gray-500 text-sm">No hay responsables</p>
            )}
          </div>
        </div>


{/* Filtro de Estados */}
<div className="space-y-2">
  <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
    <CheckCircle className="w-4 h-4" />
    <span>Estados</span>
  </label>
  <div className="space-y-1">
    {[
      { key: 'pending', label: 'Pendiente', icon: Clock },
      { key: 'completed', label: 'Completado', icon: CheckCircle }
    ].map(status => (
      <label
        key={status.key}
        className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
      >
        <input
          type="checkbox"
          checked={(localFilters.status || []).includes(status.key)}
          onChange={() => toggleArrayFilter('status', status.key)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <status.icon className="w-4 h-4 text-gray-400" />
        <span>{status.label}</span>
      </label>
    ))}
  </div>
</div>

        {/* Filtro de Etiquetas */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <Tag className="w-4 h-4" />
            <span>Etiquetas</span>
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
            {filterOptions.tags.map(tag => (
              <label
                key={tag}
                className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={(localFilters.tags || []).includes(tag)}
                  onChange={() => toggleArrayFilter('tags', tag)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="inline-block w-3 h-3 bg-blue-500 rounded"></span>
                <span>{tag}</span>
              </label>
            ))}
            {filterOptions.tags.length === 0 && (
              <p className="text-gray-500 text-sm">No hay etiquetas</p>
            )}
          </div>
        </div>

        {/* Filtro de Fechas */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4" />
            <span>Fechas</span>
          </label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={localFilters.dateFrom || ''}
                onChange={(e) => updateLocalFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) => updateLocalFilter('dateTo', e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros avanzados */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Filtros Avanzados</h4>
        <div className="flex flex-wrap gap-2">
          {/* Mostrar solo tareas vencidas */}
          <label className="flex items-center space-x-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.overdue || false}
              onChange={(e) => updateLocalFilter('overdue', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Solo vencidas</span>
          </label>

          {/* Mostrar solo tareas con adjuntos */}
          <label className="flex items-center space-x-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.hasAttachments || false}
              onChange={(e) => updateLocalFilter('hasAttachments', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Con adjuntos</span>
          </label>

          {/* Mostrar solo tareas sin responsable */}
          <label className="flex items-center space-x-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.unassigned || false}
              onChange={(e) => updateLocalFilter('unassigned', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Sin responsable</span>
          </label>
        </div>
      </div>

      {/* Botón para aplicar filtros */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};