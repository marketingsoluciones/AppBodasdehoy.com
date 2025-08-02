export interface Guest {
  _id: string;
  nombre: string;
  correo: string;
  telefono: string;
  invitacion: boolean;
  acompañantes: number;
  date?: string;
  sexo: 'hombre' | 'mujer';
}

export interface GuestTableProps {
  data: Guest[];
  multiSeled?: boolean;
  activeFunction?: () => void;
}

export interface ColumnConfig {
  Header: string;
  accessor: string;
  id: string;
  isVisible?: boolean;
  Cell?: (props: any) => React.ReactNode;
}

export interface DataTableProps {
  columns: ColumnConfig[];
  data: Guest[];
  multiSeled?: boolean;
  setArrEnviatInvitaciones: (ids: string[]) => void;
  activeFunction?: () => void;
}

export interface ConfirmationBlockProps {
  arrEnviarInvitaciones: string[];
  set: (ids: string[]) => void;
}

export interface GuestCellProps {
  value: any;
  row: {
    original: Guest;
  };
  cell: {
    value: any;
  };
}

export interface ProfileImageConfig {
  image: string;
  alt: string;
}

export interface ProfileImages {
  hombre: ProfileImageConfig;
  mujer: ProfileImageConfig;
} 