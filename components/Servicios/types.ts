import { Task } from '../../utils/Interfaces';
import React from 'react';

// Interfaces para orden
export interface TaskOrder {
  taskId: string;
  order: number;
  columnId: string;
}

export interface ColumnOrder {
  columnId: string;
  order: number;
}

// Tipos actualizados para el tablero
export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  colorConfig?: {
    bg: string;
    border: string;
    text: string;
  };
  icon?: React.ReactNode;
  tasks: Task[];
  isCollapsed: boolean;
  isHidden?: boolean;
  order: number;
  bgColor?: string;
}

export interface BoardState {
  columns: Record<string, BoardColumn>;
  columnOrder: string[];
  deletedColumns: BoardColumn[];
  isGlobalCollapsed: boolean;
  viewMode?: 'board' | 'compact' | 'list';
}

export interface DragItem {
  id: string;
  type: 'task' | 'column';
  data: Task | BoardColumn;
  sourceColumnId?: string; // Metadatos adicionales para tareas
}