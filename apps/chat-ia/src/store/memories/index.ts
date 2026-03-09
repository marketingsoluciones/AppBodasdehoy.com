/**
 * Re-export desde @bodasdehoy/memories.
 * La lógica vive en el paquete; las páginas de Memories usan el paquete directamente.
 * Este archivo mantiene compatibilidad con cualquier import desde @/store/memories.
 */
export type {
  Album,
  AlbumInvitation,
  AlbumMedia,
  AlbumMember,
  EventAlbumStructure,
  MemoriesConfig,
  MemoriesState,
  MemoriesStore,
} from '@bodasdehoy/memories';
export { useMemoriesStore } from '@bodasdehoy/memories';
