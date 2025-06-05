import { Task, Itinerary } from '../../../utils/Interfaces';

// Tipos base para la tabla ClickUp
export interface ClickUpColumn {
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
  type?: 'text' | 'select' | 'date' | 'time' | 'number' | 'multiselect' | 'user' | 'priority' | 'status' | 'editor' | 'tags';
  options?: ClickUpSelectOption[];
}

export interface ClickUpSelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: JSX.Element;
}

export interface ClickUpTableState {
  columns: ClickUpColumn[];
  hiddenColumns: string[];
  pinnedColumns: { left: string[]; right: string[] };
  sortBy: { id: string; desc: boolean }[];
  filters: ClickUpFilter[];
  globalFilter: string;
  selectedRows: string[];
}

export interface ClickUpFilter {
  id: string;
  columnId: string;
  type: 'text' | 'select' | 'date' | 'number' | 'multiselect' | 'user' | 'tags' | 'editor';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn';
  value: any;
  isActive: boolean;
}

export interface ClickUpViewConfig {
  id: string;
  name: string;
  columns: ClickUpColumn[];
  filters: ClickUpFilter[];
  sortBy: { id: string; desc: boolean }[];
  isDefault?: boolean;
}

// Estados y prioridades predefinidos
export const TASK_STATUSES: ClickUpSelectOption[] = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'En Progreso', color: 'bg-primary' },
  { value: 'completed', label: 'Completado', color: 'bg-green' },
  { value: 'blocked', label: 'Bloqueado', color: 'bg-red' },
];

export const TASK_PRIORITIES: ClickUpSelectOption[] = [
  { value: 'high', label: 'Alta', color: 'bg-red' },
  { value: 'normal', label: 'Normal', color: 'bg-yellow-500' },
  { value: 'low', label: 'Baja', color: 'bg-green' },
];

// Props para componentes
export interface ClickUpTableProps {
  data: Task[];
  itinerario: Itinerary;
  selectTask: string;
  setSelectTask: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
}

export interface ClickUpCellProps {
  column: ClickUpColumn;
  row: any;
  value: any;
  onUpdate: (value: any) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}

export interface ClickUpDropdownProps {
  options: ClickUpSelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ClickUpColumnMenuProps {
  column: ClickUpColumn;
  onSort: (direction: 'asc' | 'desc') => void;
  onFilter: () => void;
  onHide: () => void;
  onPin: (position: 'left' | 'right' | null) => void;
  onResize: () => void;
  onInsertLeft: () => void;
  onInsertRight: () => void;
}

export interface ClickUpFiltersProps {
  filters: ClickUpFilter[];
  columns: ClickUpColumn[];
  onFiltersChange: (filters: ClickUpFilter[]) => void;
  onSaveView: (view: ClickUpViewConfig) => void;
  savedViews: ClickUpViewConfig[];
  onLoadView: (view: ClickUpViewConfig) => void;
}