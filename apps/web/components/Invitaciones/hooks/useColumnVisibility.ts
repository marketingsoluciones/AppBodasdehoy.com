import { useState, useEffect, useMemo } from 'react';
import { ColumnConfig } from '../types';

const STORAGE_KEY = 'invitaciones_visible_columns';

export const useColumnVisibility = (columns: ColumnConfig[], eventId?: string) => {
  const storageKey = eventId ? `${STORAGE_KEY}_${eventId}` : STORAGE_KEY;

  // Inicializar con todas las columnas visibles por defecto
  const defaultVisibleColumns = useMemo(() => {
    return new Set(columns.map(col => col.id));
  }, [columns]);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return defaultVisibleColumns;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verificar que las columnas guardadas existen en las columnas actuales
        const validColumns = parsed.filter((id: string) => 
          columns.some(col => col.id === id)
        );
        return new Set(validColumns);
      }
    } catch (error) {
      console.error('Error loading column visibility:', error);
    }
    
    return defaultVisibleColumns;
  });

  // Guardar preferencias en localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify([...visibleColumns]));
    } catch (error) {
      console.error('Error saving column visibility:', error);
    }
  }, [visibleColumns, storageKey]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        // No permitir ocultar todas las columnas
        if (newSet.size > 1) {
          newSet.delete(columnId);
        }
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleColumns);
  };

  const filteredColumns = useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.id));
  }, [columns, visibleColumns]);

  return {
    visibleColumns,
    toggleColumn,
    resetColumns,
    filteredColumns,
  };
};

