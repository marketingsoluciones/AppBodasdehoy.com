/**
 * @bodasdehoy/memories
 * Paquete compartido: álbumes y fotos por evento.
 * Uso: instalar en Copilot, App Bodas, CRM, ERP; opcional web standalone.
 */

export {
  useMemoriesStore,
  type MemoriesStore,
} from './store';

export {
  MemoriesProvider,
  useMemoriesConfig,
  type MemoriesProviderProps,
} from './context';

export type {
  Album,
  AlbumInvitation,
  AlbumMedia,
  AlbumMember,
  AlbumType,
  EventAlbumStructure,
  MemoriesConfig,
  MemoriesState,
} from './initialState';

export { initialMemoriesState } from './initialState';

export {
  selectAlbums,
  selectAlbumsLoading,
  selectAlbumsError,
  selectCurrentAlbum,
  selectCurrentAlbumLoading,
  selectCurrentAlbumError,
  selectCurrentMedia,
  selectMediaLoading,
  selectMediaError,
  selectCurrentMembers,
  selectMembersLoading,
  selectUploadProgress,
  selectSearchTerm,
  selectSelectedMediaIds,
  selectIsCreateAlbumModalOpen,
  selectEventAlbumStructure,
  selectEventAlbumLoading,
} from './selectors';

export { getCached, setCache, invalidateCache, clearAllCache } from './cache';
