import { fileService } from '@/services/file';

import { ApiIaFileService } from './apiIa';

/**
 * API usada por el File Manager (listado, detalle, quitar tarea async).
 *
 * CAPA 2 PASO C 2026-06-05: ahora siempre devuelve la instancia ApiIaFileService
 * (vía fileService). Eliminado el ternary tRPC/pglite — file 100% por api-ia REST.
 */
export function getFileManageService(): ApiIaFileService {
  return fileService;
}
