import { Task, Itinerary } from '../../../utils/Interfaces';

// Tipos base para la tabla
export interface TableColumn {
  id: string;
  Header: string;
  accessor: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  canResize?: boolean;
  canSort?: boolean;
  canFilter?: boolean;
  canHide?: boolean;
  isHidden?: boolean;
  isPinned?: boolean;
  position?: 'left' | 'right' | null;
  Cell?: (data: any) => React.ReactElement;
  type?: 'text' | 'select' | 'date' | 'time' | 'number' | 'multiselect' | 'user' | 'priority' | 'status' | 'editor' | 'tags' | 'responsable' | 'tips' | 'comments' | 'attachments';
  options?: SelectOption[];
  truncate?: number; // Para limitar caracteres en campos de texto
}

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactElement;
}

export interface TableState {
  columns: TableColumn[];
  hiddenColumns: string[];
  pinnedColumns: { left: string[]; right: string[] };
  sortBy: { id: string; desc: boolean }[];
  filters: TableFilter[];
  globalFilter: string;
  selectedRows: string[];
}

export interface TableFilter {
  id: string;
  columnId: string;
  type: 'text' | 'select' | 'date' | 'number' | 'multiselect' | 'user' | 'tags' | 'editor' | 'responsable' | 'tips';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn';
  value: any;
  isActive: boolean;
}

export interface ViewConfig {
  id: string;
  name: string;
  columns: TableColumn[];
  filters: TableFilter[];
  sortBy: { id: string; desc: boolean }[];
  isDefault?: boolean;
}

// Estados y prioridades predefinidos (legacy, para compatibilidad)
export const LEGACY_TASK_STATUSES: SelectOption[] = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'En Curso', color: 'bg-primary' },
  { value: 'completed', label: 'Completado', color: 'bg-green' },
  { value: 'blocked', label: 'Bloqueado', color: 'bg-red' },
];

export const LEGACY_TASK_PRIORITIES: SelectOption[] = [
  { value: 'alta', label: 'Alta', color: 'bg-red' },
  { value: 'media', label: 'Media', color: 'bg-yellow-500' },
  { value: 'baja', label: 'Baja', color: 'bg-gray-400' },
];

// Props para componentes
export interface TableProps {
  data: Task[];
  itinerario: Itinerary;
  selectTask: string;
  setSelectTask: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
}

export interface TableCellProps {
  column: any;
  row: any;
  value: any;
  task: any;
  onUpdate: (value: any) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onCommentsClick?: () => void;
  itinerarioId?: string;
  handleUpdate?: (field: string, value: any) => Promise<void>;
}

export interface TableDropdownProps {
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ColumnMenuProps {
  column: TableColumn;
  onSort: (direction: 'asc' | 'desc') => void;
  onFilter: () => void;
  onHide: () => void;
  onPin: (position: 'left' | 'right' | null) => void;
  onResize: () => void;
  onInsertLeft: () => void;
  onInsertRight: () => void;
}

export interface FiltersProps {
  filters: TableFilter[];
  columns: TableColumn[];
  onFiltersChange: (filters: TableFilter[]) => void;
  onSaveView: (view: ViewConfig) => void;
  savedViews: ViewConfig[];
  onLoadView: (view: ViewConfig) => void;
}

// --- INTEGRACIÓN DE NUEVO CÓDIGO ---

// Tipos y constantes para las tareas

export interface TaskStatus {
  value: "pending" | "in_progress" | "completed" | "blocked";
  label: string;
  color: string;
  description?: string;
}

export interface TaskPriority {
  value: "baja" | "media" | "alta";
  label: string;
  color: string;
  description?: string;
}

// Estados de las tareas
export const TASK_STATUSES: TaskStatus[] = [
  {
    value: 'pending',
    label: 'Pendiente',
    color: 'bg-gray-500',
    description: 'Tarea sin iniciar'
  },
  {
    value: 'in_progress',
    label: 'En Curso',
    color: 'bg-primary',
    description: 'Tarea en progreso'
  },
  {
    value: 'completed',
    label: 'Completado',
    color: 'bg-green',
    description: 'Tarea finalizada'
  },
  {
    value: 'blocked',
    label: 'Bloqueado',
    color: 'bg-red',
    description: 'Tarea bloqueada'
  }
];

// Prioridades de las tareas
export const TASK_PRIORITIES: TaskPriority[] = [
  {
    value: 'baja',
    label: 'Baja',
    color: 'bg-green',
    description: 'Prioridad baja'
  },
  {
    value: 'media',
    label: 'Media',
    color: 'bg-yellow-500',
    description: 'Prioridad media'
  },
  {
    value: 'alta',
    label: 'Alta',
    color: 'bg-red',
    description: 'Prioridad alta'
  },
];

// Función helper para obtener el estado por valor
export const getTaskStatusByValue = (value: string): TaskStatus | undefined => {
  return TASK_STATUSES.find(status => status.value === value);
};

// Función helper para obtener la prioridad por valor
export const getTaskPriorityByValue = (value: string): TaskPriority | undefined => {
  return TASK_PRIORITIES.find(priority => priority.value === value);
};

// Función helper para obtener color CSS de estado
export const getStatusColor = (status: string): string => {
  const statusObj = getTaskStatusByValue(status);
  return statusObj?.color || 'bg-gray-500';
};

// Función helper para obtener color CSS de prioridad
export const getPriorityColor = (priority: string): string => {
  const priorityObj = getTaskPriorityByValue(priority);
  return priorityObj?.color || 'bg-gray-500';
};

// Mapeo de estados legacy a nuevos estados
export const LEGACY_STATUS_MAPPING: Record<string, string> = {
  'true': 'completed',
  'false': 'pending',
  'null': 'pending',
  'undefined': 'pending'
};

// Función para normalizar estados legacy
export const normalizeLegacyStatus = (legacyStatus: any): string => {
  if (typeof legacyStatus === 'boolean') {
    return legacyStatus ? 'completed' : 'pending';
  }

  if (legacyStatus === null || legacyStatus === undefined) {
    return 'pending';
  }

  if (typeof legacyStatus === 'string') {
    // Si ya es un estado válido, devolverlo
    if (TASK_STATUSES.some(status => status.value === legacyStatus)) {
      return legacyStatus;
    }

    // Mapear estados legacy
    return LEGACY_STATUS_MAPPING[legacyStatus] || 'pending';
  }

  return 'pending';
};

// Tipos para formularios
export interface TaskFormData {
  _id?: string;
  descripcion: string;
  fecha: Date | string;
  duracion: number;
  estado: string;
  prioridad: string;
  responsable: string[];
  tags: string[];
  tips?: string;
  attachments?: any[];
  spectatorView?: boolean;
  estatus?: boolean;
  icon?: string;
}

// Configuración de columnas para el tablero
export interface BoardColumnConfig {
  id: string;
  title: string;
  color: string;
  description?: string;
  allowedStatuses: string[];
  defaultPriority?: string;
}

export const DEFAULT_BOARD_COLUMNS: BoardColumnConfig[] = [
  {
    id: 'pending',
    title: 'Pendiente',
    color: 'bg-gray-50 border-gray-300',
    description: 'Tareas sin iniciar',
    allowedStatuses: ['pending'],
    defaultPriority: 'media'
  },
  {
    id: 'in_progress',
    title: 'En Curso',
    color: 'bg-blue-50 border-blue-300',
    description: 'Tareas en progreso',
    allowedStatuses: ['in_progress'],
    defaultPriority: 'media'
  },
  {
    id: 'completed',
    title: 'Completado',
    color: 'bg-green-50 border-green-300',
    description: 'Tareas completadas',
    allowedStatuses: ['completed'],
    defaultPriority: 'baja'
  },
  {
    id: 'blocked',
    title: 'Bloqueado',
    color: 'bg-red-50 border-red-300',
    description: 'Tareas bloqueadas',
    allowedStatuses: ['blocked', 'on_hold'],
    defaultPriority: 'alta'
  }
];

// Validaciones
export const validateTaskStatus = (status: string): boolean => {
  return TASK_STATUSES.some(s => s.value === status);
};

export const validateTaskPriority = (priority: string): boolean => {
  return TASK_PRIORITIES.some(p => p.value === priority);
};

// Configuración de colores para diferentes temas
export const THEME_COLORS = {
  primary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

export default {
  TASK_STATUSES,
  TASK_PRIORITIES,
  getTaskStatusByValue,
  getTaskPriorityByValue,
  getStatusColor,
  getPriorityColor,
  normalizeLegacyStatus,
  validateTaskStatus,
  validateTaskPriority,
  DEFAULT_BOARD_COLUMNS,
  THEME_COLORS
};