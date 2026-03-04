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
    const prioridades = new Set<string>();
  
    tasks.forEach(task => {
      // Responsables
      if (task.responsable && Array.isArray(task.responsable)) {
        task.responsable.forEach(r => {
          if (r) responsables.add(r);
        });
      }
      
      // Tags
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(t => {
          if (t) tags.add(t);
        });
      }
      
      // Estados - Usando la propiedad estatus
      if (task.estatus === true) {
        statuses.add('completed');
      } else {
        statuses.add('pending');
      }
      
      // Prioridades
      if (task.prioridad) {
        prioridades.add(task.prioridad);
      }
    });
  
    return {
      responsables: Array.from(responsables).sort(),
      tags: Array.from(tags).sort(),
      statuses: Array.from(statuses),
      prioridades: Array.from(prioridades),
    };
  }, [tasks]);

  // Aplicar filtros
  const handleApplyFilters = useCallback(() => {
    // Limpiar filtros vacíos antes de aplicar
    const cleanedFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    onFiltersChange(cleanedFilters);
  }, [localFilters, onFiltersChange]);

  // Limpiar filtros
  const handleClearFilters = useCallback(() => {
    setLocalFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  // Actualizar filtro local
  const updateLocalFilter = useCallback((key: string, value: any) => {
    setLocalFilters(prev => {
      if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  }, []);

  // Alternar elemento en array de filtro
  const toggleArrayFilter = useCallback((key: string, item: string) => {
    setLocalFilters(prev => {
      const currentArray = prev[key] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i: string) => i !== item)
        : [...currentArray, item];
      
      if (newArray.length === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [key]: newArray,
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
            <span className="bg-pink-100 text-primary text-xs px-2 py-1 rounded-full">
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
            {filterOptions.responsables.length > 0 ? (
              filterOptions.responsables.map(responsable => (
                <label
                  key={responsable}
                  className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={(localFilters.responsable || []).includes(responsable)}
                    onChange={() => toggleArrayFilter('responsable', responsable)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>{responsable}</span>
                </label>
              ))
            ) : (
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
              { key: 'pending', label: 'Pendiente', icon: Clock, color: 'text-gray-600' },
              { key: 'completed', label: 'Completado', icon: CheckCircle, color: 'text-[#00b341]' }
            ].map(status => (
              <label
                key={status.key}
                className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={(localFilters.status || []).includes(status.key)}
                  onChange={() => toggleArrayFilter('status', status.key)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <status.icon className={`w-4 h-4 ${status.color}`} />
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
            {filterOptions.tags.length > 0 ? (
              filterOptions.tags.map(tag => (
                <label
                  key={tag}
                  className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={(localFilters.tags || []).includes(tag)}
                    onChange={() => toggleArrayFilter('tags', tag)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="inline-block w-3 h-3 bg-primary rounded"></span>
                  <span>{tag}</span>
                </label>
              ))
            ) : (
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
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) => updateLocalFilter('dateTo', e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botón para aplicar filtros */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};