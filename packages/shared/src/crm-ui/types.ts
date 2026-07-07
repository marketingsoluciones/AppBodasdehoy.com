/**
 * @bodasdehoy/shared/crm-ui — sistema CRM universal (FASE B v2.0, 2026-06-24).
 *
 * Capa UI reusable para los 14+ sistemas CRM expuestos por api-mcp que el
 * front aún no consume (CRM_Note, CRM_Task, CRM_Contact, CRM_Timeline, etc.).
 *
 * Para FASE B implementamos NotesPanel + useCRMNotes (handoff Bandeja v2 +
 * 5 módulos de appEventos: /invitados, /servicios, /presupuesto, /eventos,
 * /tareas).
 *
 * Auditoría que motivó este paquete:
 *   docs/AUDITORIA-CRM-INFRAUTILIZADO-2026-06-24.code.txt
 */

// ───────────────────────────────────────────────────────────────────────
// Entidades del sistema CRM_Note (universal)
// ───────────────────────────────────────────────────────────────────────

/**
 * Tipos de entidad a los que se puede vincular una nota.
 *
 * Enum ratificado 07-jul-2026 contra schema api-mcp
 * (dist-production/src/graphql/typeDefs/crm/note.ts). Todos los valores
 * están soportados en Mongo layer — incluido CONVERSATION.
 */
export type CRMNoteEntityType =
  | 'CONTACT'
  | 'LEAD'
  | 'OPPORTUNITY'
  | 'EVENTO'
  | 'ENTITY'
  | 'CAMPAIGN'
  | 'TASK'
  | 'CONVERSATION';

/**
 * Identificación de una entidad a la que se vincula una nota.
 * El mismo objeto se usa como input para createCRMNote y como output
 * en CRM_Note.relatedTo[].
 */
export interface CRMEntityRef {
  entityType: CRMNoteEntityType;
  /** ID único de la entidad en su sistema (contactId, eventId, taskId, etc.) */
  entityId: string;
  /** Nombre legible para mostrar en la UI sin tener que hacer fetch extra */
  entityName: string;
}

// ───────────────────────────────────────────────────────────────────────
// Modelo CRM_Note (matchea schema api-mcp dist-production/src/db/models/note.js)
// ───────────────────────────────────────────────────────────────────────

export interface CRMNoteAuthor {
  userId: string;
  name: string;
}

export interface CRMNoteAttachment {
  filename: string;
  url: string;
  type: string;
  size?: number;
}

export interface CRMNote {
  id: string;
  content: string;
  author: CRMNoteAuthor;
  relatedTo: CRMEntityRef[];
  tags: string[];
  isPrivate: boolean;
  isPinned: boolean;
  attachments: CRMNoteAttachment[];
  createdAt: string;
  updatedAt: string;
  development: string;
}

// ───────────────────────────────────────────────────────────────────────
// Input para mutations
// ───────────────────────────────────────────────────────────────────────

export interface CreateCRMNoteInput {
  content: string;
  relatedTo: CRMEntityRef[];
  tags?: string[];
  isPrivate?: boolean;
  attachments?: CRMNoteAttachment[];
}

export interface UpdateCRMNoteInput {
  content?: string;
  tags?: string[];
  isPrivate?: boolean;
}

// ───────────────────────────────────────────────────────────────────────
// Filtros para getCRMNotes
// ───────────────────────────────────────────────────────────────────────

export interface CRMNoteFilters {
  authorUserId?: string;
  entityType?: CRMNoteEntityType;
  entityId?: string;
  entityTypes?: CRMNoteEntityType[];
  entityIds?: string[];
  tags?: string[];
  isPrivate?: boolean;
  isPinned?: boolean;
  dateRange?: {
    from?: string;
    to?: string;
  };
  searchQuery?: string;
}

// ───────────────────────────────────────────────────────────────────────
// Hook result shape
// ───────────────────────────────────────────────────────────────────────

export interface UseCRMNotesResult {
  notes: CRMNote[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  /** Carga la siguiente página de notas (paginación opaque cursor) */
  loadMore: () => Promise<void>;
  /** Crear nota nueva. Optimistic update local antes del round trip backend. */
  createNote: (input: Omit<CreateCRMNoteInput, 'relatedTo'>) => Promise<CRMNote | null>;
  /** Editar contenido / tags / privacidad de una nota existente. */
  updateNote: (id: string, input: UpdateCRMNoteInput) => Promise<CRMNote | null>;
  /** Borrar nota. */
  deleteNote: (id: string) => Promise<boolean>;
  /** Pin / Unpin (toggle isPinned). */
  togglePin: (id: string) => Promise<boolean>;
  /** Añadir otra entidad relacionada a una nota existente (multi-vinculación). */
  addRelation: (noteId: string, entity: CRMEntityRef) => Promise<CRMNote | null>;
  /** Quitar una entidad relacionada. */
  removeRelation: (noteId: string, entityType: CRMNoteEntityType, entityId: string) => Promise<CRMNote | null>;
  /** Recargar manualmente (invalidar cache). */
  refetch: () => Promise<void>;
}

// ───────────────────────────────────────────────────────────────────────
// Props de NotesPanel
// ───────────────────────────────────────────────────────────────────────

export interface NotesPanelProps {
  /**
   * Entidad principal a la que se vincula la nota cuando se crea desde
   * este panel. Si la entidad es CONVERSATION pero hay linked_contact_id,
   * conviene pasar el contact aquí (vida del contacto > vida de la conv).
   */
  entity: CRMEntityRef;

  /**
   * Entidades secundarias para mostrar también las notas vinculadas
   * (ej. abriendo /messages de Ana, mostrar notas del CONTACTO + las del
   * EVENTO donde es invitada). Se usa para getCRMNotesByMultipleEntities.
   */
  alsoShow?: CRMEntityRef[];

  /** Título del panel (default: "Notas internas") */
  title?: string;

  /** Permitir mentions @usuario en el editor (default: true) */
  enableMentions?: boolean;

  /** Permitir attachments (default: false hasta R2 estable) */
  enableAttachments?: boolean;

  /** Permitir tags (default: true) */
  enableTags?: boolean;

  /** Solo lectura (default: false) */
  readOnly?: boolean;

  /** Callback cuando se crea/edita/borra (para invalidar caches externos) */
  onChange?: (note: CRMNote, action: 'create' | 'update' | 'delete' | 'pin' | 'unpin') => void;

  /** Mostrar variante compacta (menos padding, fuente más pequeña). */
  compact?: boolean;
}
