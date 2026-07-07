/**
 * Queries y mutations GraphQL contra api-mcp para CRM_Note.
 *
 * Se llama DIRECTO desde el navegador a api-mcp.eventosorganizador.com/graphql
 * (api-mcp confirmó CORS + bypass proxy, 24-jun). Sin pasar por api-ia.
 *
 * Auth: Authorization Bearer <mcp_jwt_token> + X-Development header.
 *
 * Shape ratificado 07-jul contra schema api-mcp
 * (dist-production/src/graphql/typeDefs/crm/note.ts):
 *   CRM_NotesResponse { notes, pagination, totalCount }
 *   CRM_NoteResponse  { success, note, errors }
 *   CRM_SimpleError   { message, code }  (usado por deleteCRMNote)
 */

const NOTE_FIELDS = `
  id
  content
  author { userId name }
  relatedTo { entityType entityId entityName }
  tags
  isPrivate
  isPinned
  attachments { filename url type size }
  createdAt
  updatedAt
  development
`;

const NOTES_RESPONSE_FIELDS = `
  notes { ${NOTE_FIELDS} }
  totalCount
  pagination { page limit totalPages }
`;

const NOTE_RESPONSE_FIELDS = `
  success
  errors { field message code }
  note { ${NOTE_FIELDS} }
`;

export const GQL_GET_CRM_NOTES_BY_MULTIPLE_ENTITIES = `
  query GetCRMNotesByMultipleEntities($entities: [CRM_NoteRelatedEntityInput!]!, $pagination: CRM_PaginationInput) {
    getCRMNotesByMultipleEntities(entities: $entities, pagination: $pagination) {
      ${NOTES_RESPONSE_FIELDS}
    }
  }
`;

export const GQL_GET_CRM_NOTES_BY_ENTITY = `
  query GetCRMNotesByEntity($entityType: CRM_NoteEntityType!, $entityId: ID!, $pagination: CRM_PaginationInput) {
    getCRMNotesByEntity(entityType: $entityType, entityId: $entityId, pagination: $pagination) {
      ${NOTES_RESPONSE_FIELDS}
    }
  }
`;

export const GQL_CREATE_CRM_NOTE = `
  mutation CreateCRMNote($input: CRM_NoteInput!) {
    createCRMNote(input: $input) {
      ${NOTE_RESPONSE_FIELDS}
    }
  }
`;

export const GQL_UPDATE_CRM_NOTE = `
  mutation UpdateCRMNote($id: ID!, $input: CRM_NoteUpdateInput!) {
    updateCRMNote(id: $id, input: $input) {
      success
      errors { field message code }
      note { id content tags isPrivate isPinned updatedAt }
    }
  }
`;

// deleteCRMNote devuelve CRM_SimpleError { message, code }, NO CRM_NoteResponse.
// El hook interpreta ausencia de excepción como éxito.
export const GQL_DELETE_CRM_NOTE = `
  mutation DeleteCRMNote($id: ID!) {
    deleteCRMNote(id: $id) {
      message
      code
    }
  }
`;

export const GQL_PIN_NOTE = `
  mutation PinNote($id: ID!) {
    pinNote(id: $id) {
      success
      errors { field message code }
      note { id isPinned updatedAt }
    }
  }
`;

export const GQL_UNPIN_NOTE = `
  mutation UnpinNote($id: ID!) {
    unpinNote(id: $id) {
      success
      errors { field message code }
      note { id isPinned updatedAt }
    }
  }
`;

export const GQL_ADD_NOTE_RELATION = `
  mutation AddNoteRelation($noteId: ID!, $entity: CRM_NoteRelatedEntityInput!) {
    addNoteRelation(noteId: $noteId, entity: $entity) {
      success
      errors { field message code }
      note { id relatedTo { entityType entityId entityName } updatedAt }
    }
  }
`;

export const GQL_REMOVE_NOTE_RELATION = `
  mutation RemoveNoteRelation($noteId: ID!, $entityType: CRM_NoteEntityType!, $entityId: ID!) {
    removeNoteRelation(noteId: $noteId, entityType: $entityType, entityId: $entityId) {
      success
      errors { field message code }
      note { id relatedTo { entityType entityId entityName } updatedAt }
    }
  }
`;
