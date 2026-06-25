/**
 * @bodasdehoy/shared/crm-ui — sistema CRM universal.
 *
 * Exports públicos para chat-ia y appEventos:
 *   import { NotesPanel, useCRMNotes, type CRMEntityRef } from '@bodasdehoy/shared/crm-ui'
 */

export { NotesPanel } from './NotesPanel';
export { useCRMNotes } from './useCRMNotes';
export { callMcpGraphQL } from './client';
export { hasLegacyNotesPending, migrateLocalStorageNotesToCRM } from './migrate';
export {
  GQL_UPDATE_GUEST_RSVP_BY_CONVERSATION,
  GQL_ASSIGN_CONVERSATION_TO_USER,
} from './graphql';
export type { MigrationResult } from './migrate';
export type { MCPGraphQLError, MCPGraphQLResponse } from './client';
export type {
  CRMEntityRef,
  CRMNote,
  CRMNoteAttachment,
  CRMNoteAuthor,
  CRMNoteEntityType,
  CRMNoteFilters,
  CreateCRMNoteInput,
  NotesPanelProps,
  UpdateCRMNoteInput,
  UseCRMNotesResult,
} from './types';
