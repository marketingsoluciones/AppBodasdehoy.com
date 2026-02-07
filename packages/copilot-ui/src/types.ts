export interface UserData {
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  uid?: string;
  role?: string[];
}

export interface Event {
  _id: string;
  nombre: string;
  tipo?: string;
  fecha?: string;
  invitados_array?: any[];
  presupuesto_objeto?: any;
  mesas_array?: any[];
  itinerarios_array?: any[];
  [key: string]: any;
}

export interface CopilotChatProps {
  userId?: string;
  development?: string;
  eventId?: string;
  eventName?: string;
  className?: string;
  userData?: UserData;
  event?: Event | null;
  eventsList?: any[];
  onNavigate?: (path: string) => void;
  onAction?: (action: string, payload: any) => void;
}

export interface PageContextData {
  pageName: string;
  screenData: Record<string, any>;
  eventSummary?: {
    id: string;
    name: string;
    type?: string;
    date?: string;
    guestsCount?: number;
    budget?: number;
    tasks?: number;
  };
}
