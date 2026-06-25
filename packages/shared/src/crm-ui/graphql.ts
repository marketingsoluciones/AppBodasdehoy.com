/**
 * Queries y mutations GraphQL contra api-mcp para CRM_Note.
 *
 * Se llama DIRECTO desde el navegador a api-mcp.eventosorganizador.com/graphql
 * (api-mcp confirmó CORS + bypass proxy, 24-jun). Sin pasar por api-ia.
 *
 * Auth: Authorization Bearer <mcp_jwt_token> + X-Development header.
 */

export const GQL_GET_CRM_NOTES_BY_MULTIPLE_ENTITIES = `
  query GetCRMNotesByMultipleEntities($entities: [CRM_NoteRelatedEntityInput!]!, $pagination: CRM_PaginationInput) {
    getCRMNotesByMultipleEntities(entities: $entities, pagination: $pagination) {
      success
      errors { field message code }
      total
      notes {
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
      }
    }
  }
`;

export const GQL_GET_CRM_NOTES_BY_ENTITY = `
  query GetCRMNotesByEntity($entityType: CRM_NoteEntityType!, $entityId: ID!, $pagination: CRM_PaginationInput) {
    getCRMNotesByEntity(entityType: $entityType, entityId: $entityId, pagination: $pagination) {
      success
      errors { field message code }
      total
      notes {
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
      }
    }
  }
`;

export const GQL_CREATE_CRM_NOTE = `
  mutation CreateCRMNote($input: CRM_NoteInput!) {
    createCRMNote(input: $input) {
      success
      errors { field message code }
      note {
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
      }
    }
  }
`;

export const GQL_UPDATE_CRM_NOTE = `
  mutation UpdateCRMNote($id: ID!, $input: CRM_NoteUpdateInput!) {
    updateCRMNote(id: $id, input: $input) {
      success
      errors { field message code }
      note {
        id
        content
        tags
        isPrivate
        isPinned
        updatedAt
      }
    }
  }
`;

export const GQL_DELETE_CRM_NOTE = `
  mutation DeleteCRMNote($id: ID!) {
    deleteCRMNote(id: $id) {
      success
      message
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
      note {
        id
        relatedTo { entityType entityId entityName }
        updatedAt
      }
    }
  }
`;

export const GQL_REMOVE_NOTE_RELATION = `
  mutation RemoveNoteRelation($noteId: ID!, $entityType: CRM_NoteEntityType!, $entityId: ID!) {
    removeNoteRelation(noteId: $noteId, entityType: $entityType, entityId: $entityId) {
      success
      errors { field message code }
      note {
        id
        relatedTo { entityType entityId entityName }
        updatedAt
      }
    }
  }
`;

/* ════════════════════════════════════════════════════════════════════
   FASE B v2.0 — Mutaciones api-mcp Bandeja Eventos (commit 926b5df 25-jun)
   ════════════════════════════════════════════════════════════════════ */

/** Mutación RSVP: actualizar asistencia del invitado vinculado a la conversación.
 *  api-mcp resuelve invitado por teléfono + linkedEvents internamente.
 *  status canónico inglés: "confirmed" | "pending" | "declined".
 *  Devuelve objeto GuestRsvpResponse — leer .success (NO boolean pelado). */
export const GQL_UPDATE_GUEST_RSVP_BY_CONVERSATION = `
mutation UpdateGuestRsvpByConversation($conversationId: ID!, $status: String!) {
  updateGuestRsvpByConversation(conversationId: $conversationId, status: $status) {
    success
    message
    guestStatus
    eventId
    invitadoId
  }
}
`;

/** Mutación asignación: setear el usuario asignado a la conversación.
 *  userId null = desasignar. Devuelve Boolean.
 *  Variante user-only. Teams requiere entidad Teams (sprint aparte). */
export const GQL_ASSIGN_CONVERSATION_TO_USER = `
mutation AssignConversationToUser($conversationId: ID!, $userId: ID) {
  assignConversationToUser(conversationId: $conversationId, userId: $userId)
}
`;

/** Buscar usuarios del workspace por nombre o email (Diseño picker asignación).
 *  api-mcp YA expuesto en schema — devuelve users del mismo development.
 *  CRM_SearchUsersResponse { users, total, errors }. */
export const GQL_SEARCH_CRM_USERS = `
query SearchCrmUsers($search: String, $limit: Int) {
  searchCRMUsers(search: $search, limit: $limit) {
    users { id name email avatar }
    total
    errors { field message code }
  }
}
`;
