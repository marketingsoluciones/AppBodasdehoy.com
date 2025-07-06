// types.ts - Tipos específicos para SmartSpreadsheet
export interface TableRow {
  type: 'category' | 'expense' | 'item';
  id: string;
  categoria: string;
  partida: string;
  unidad: string;
  cantidad: number | string;
  item: string;
  valorUnitario: number;
  estimado: number | null;
  total: number;
  pagado: number;
  pendiente: number;
  level: number;
  expandable?: boolean;
  expanded?: boolean;
  categoriaID: string;
  gastoID: string | null;
  itemID: string | null;
  object: 'categoria' | 'gasto' | 'item';
  gastoOriginal?: any;
  isEditable?: boolean;
  items?: TableRow[];
  eventKey?: string;
}

export interface TableFilters {
  categories: string[];
  paymentStatus: 'all' | 'paid' | 'pending' | 'partial';
  visibilityStatus: 'all' | 'visible' | 'hidden';
  amountRange: { min: string; max: string };
  searchText: string;
}


export interface TableTotals {
  estimado: number;
  total: number;
  pagado: number;
}

export interface MenuOption {
  icon?: React.ReactElement;
  title: string;
  onClick?: (info: any) => void | Promise<void>;
  object: string[];
}

export interface ModalState {
  id: string;
  crear: boolean;
  categoriaID: string;
}

export interface DeleteModalState {
  state: boolean;
  title: string;
  values: any;
}