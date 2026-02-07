import { useRef, useCallback, useEffect } from 'react';
import { Task, Itinerary } from '../../../utils/Interfaces';
import { BoardColumn, BoardState } from '../types';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import * as XLSX from 'xlsx';

// Hook personalizado para debounce
export const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Cleanup en desmontaje
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Función auxiliar para validar si un objeto es una Task válida
export const isValidTask = (obj: any): obj is Task => {
  return obj && 
    typeof obj === 'object' &&
    '_id' in obj &&
    typeof obj._id === 'string' &&
    'fecha' in obj &&
    'descripcion' in obj &&
    typeof obj.descripcion === 'string';
};

// Función para determinar el estado de una tarea basado en sus propiedades
export const getTaskStatus = (task: Task, DEFAULT_COLUMNS: Record<string, any>): string => {
  if (!task) return 'pending';
  
  // Si tiene estado explícito y es válido, usarlo
  if (task.estado && DEFAULT_COLUMNS[task.estado]) {
    return task.estado;
  }
  
  // Mapear según propiedades de la tarea
  if (task.estatus === true) return 'completed';
  if (task.spectatorView === false) return 'blocked';
  if (task.responsable?.length > 0 && task.fecha) return 'in_progress';
  
  // Por defecto
  return 'pending';
};

// Función para exportar datos a Excel
export const exportBoardData = (
  boardState: BoardState,
  itinerario: Itinerary,
  t: (key: string) => string
) => {
  const rows: any[] = [];
  boardState.columnOrder.forEach(columnId => {
    const column = boardState.columns[columnId];
    column.tasks.forEach(task => {
      rows.push({
        Estado: column.title,
        Título: task.descripcion,
        Responsable: Array.isArray(task.responsable) ? task.responsable.join(', ') : '',
        Prioridad: task.prioridad,
        EstadoTarea: task.estatus ? 'Completado' : 'Pendiente',
        Fecha: task.fecha ? new Date(task.fecha).toLocaleString() : '',
        Tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
        Tips: task.tips || ''
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tareas');

  XLSX.writeFile(workbook, `tablero-${itinerario.title}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Función para guardar el orden de las columnas
export const saveColumnOrderToAPI = async (
  boardState: BoardState,
  event: any,
  itinerario: Itinerary,
  config: any,
  setEvent: Function
) => {
  const columnsOrder = boardState.columnOrder.map((columnId, index) => ({
    columnId,
    order: index
  }));

  await fetchApiEventos({
    query: queries.editItinerario,
    variables: {
      eventID: event._id,
      itinerarioID: itinerario._id,
      variable: "columnsOrder",
      valor: JSON.stringify(columnsOrder)
    },
    domain: config.domain
  });

  // Actualizar el evento global con el orden de columnas
  setEvent((prevEvent: any) => {
    const newEvent = { ...prevEvent };
    const itineraryIndex = newEvent.itinerarios_array.findIndex(
      (it: any) => it._id === itinerario._id
    );
    
    if (itineraryIndex !== -1) {
      newEvent.itinerarios_array[itineraryIndex].columnsOrder = columnsOrder;
    }
    
    return newEvent;
  });
};

// Función para filtrar tareas
export const filterTasks = (
  columns: Record<string, BoardColumn>,
  searchTerm: string,
  activeFilters: Record<string, any>
): Record<string, BoardColumn> => {
  if (!searchTerm && Object.keys(activeFilters).length === 0) {
    return columns;
  }

  const filtered: Record<string, BoardColumn> = {};

  Object.entries(columns).forEach(([id, column]) => {
    const filteredTasks = column.tasks.filter(task => {
      // Filtro de búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (task.descripcion?.toLowerCase().includes(searchLower) ?? false) ||
          (task.tips?.toLowerCase().includes(searchLower) ?? false) ||
          (Array.isArray(task.responsable) && task.responsable.some(r => r?.toLowerCase().includes(searchLower))) ||
          (Array.isArray(task.tags) && task.tags.some(t => t?.toLowerCase().includes(searchLower)));

        if (!matchesSearch) return false;
      }

      // Filtros adicionales
      if (activeFilters.responsable && activeFilters.responsable.length > 0) {
        const hasResponsible = task.responsable?.some(r =>
          activeFilters.responsable.includes(r)
        );
        if (!hasResponsible) return false;
      }

      if (activeFilters.tags && activeFilters.tags.length > 0) {
        const hasTags = task.tags?.some(t =>
          activeFilters.tags.includes(t)
        );
        if (!hasTags) return false;
      }

      if (activeFilters.status && activeFilters.status.length > 0) {
        const taskStatus = task.estatus ? 'completed' : 'pending';
        if (!activeFilters.status.includes(taskStatus)) return false;
      }

      // Filtro de fechas
      if (activeFilters.dateFrom || activeFilters.dateTo) {
        const taskDate = task.fecha ? new Date(task.fecha) : null;
        if (!taskDate) return false;

        if (activeFilters.dateFrom) {
          const fromDate = new Date(activeFilters.dateFrom);
          if (taskDate < fromDate) return false;
        }

        if (activeFilters.dateTo) {
          const toDate = new Date(activeFilters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (taskDate > toDate) return false;
        }
      }

      return true;
    });

    filtered[id] = {
      ...column,
      tasks: filteredTasks,
    };
  });

  return filtered;
};