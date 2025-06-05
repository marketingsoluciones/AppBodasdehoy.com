
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
  Cell?: (data: any) => JSX.Element;
  type?: 'text' | 'select' | 'date' | 'time' | 'number' | 'multiselect' | 'user' | 'priority' | 'status' | 'editor' | 'tags' | 'responsable' | 'tips' | 'comments' | 'attachments';
  options?: SelectOption[];
  truncate?: number; // Para limitar caracteres en campos de texto
}

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: JSX.Element;
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

// Estados y prioridades predefinidos
export const TASK_STATUSES: SelectOption[] = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'En Curso', color: 'bg-primary' },
  { value: 'completed', label: 'Completado', color: 'bg-green' },
  { value: 'blocked', label: 'Bloqueado', color: 'bg-red' },
];

export const TASK_PRIORITIES: SelectOption[] = [
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

