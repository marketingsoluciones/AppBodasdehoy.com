import { ApiIaFileService } from './apiIa';

// CAPA 2 PASO C 2026-06-05: file 100% vía api-ia REST.
// Eliminado ternary tRPC/drizzle/pglite — server.ts, client.ts, _deprecated.ts borrados.
// 3 métodos sin endpoint api-ia (checkFileHash, removeAllFiles, removeFileAsyncTask)
// son stubs (ver apiIa.ts). Preguntas abiertas a backend si son necesarios.

export const fileService = new ApiIaFileService();
