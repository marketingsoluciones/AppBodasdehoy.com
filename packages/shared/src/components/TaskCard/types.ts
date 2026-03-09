export type TaskPriority = 'alta' | 'media' | 'baja';

export interface TaskCardData {
  _id: string;
  descripcion: string;
  icon?: string;
  fecha?: string | Date;
  horaActiva?: boolean;
  duracion?: number;
  tags?: string[];
  responsable?: string[];
  tips?: string;
  prioridad?: TaskPriority;
  /** true = bloqueado/cerrado */
  estatus?: boolean;
  /** 'pending' | 'in_progress' | 'completed' */
  estado?: string;
  completada?: boolean;
}

export interface TaskCardProps {
  task: TaskCardData;
  /** Name of the parent itinerary / service group */
  itinerarioTitle?: string;
  /** 'light' = appEventos white cards, 'dark' = chat-ia zinc theme */
  theme?: 'light' | 'dark';
  onComplete?: () => void;
  onEdit?: () => void;
  onOpenInApp?: () => void;
}
