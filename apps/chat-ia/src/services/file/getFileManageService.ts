import { isDesktop, isServerMode } from '@lobechat/const';

import { fileService } from '@/services/file';
import { ClientService } from '@/services/file/client';
import { ServerService } from '@/services/file/server';

const lambdaFileManage = new ServerService();

let warnedMisconfiguredClient = false;

/**
 * API usada por el File Manager (listado, detalle, quitar tarea async).
 *
 * - Modo servidor o desktop → tRPC (Postgres / flujo LobeChat).
 * - Cliente con PGLite → misma instancia que `fileService` (BD embebida en el navegador).
 *
 * La autenticación y los eventos pueden ir por **API2 GraphQL**; eso es independiente de esta capa.
 */
export function getFileManageService(): ServerService | ClientService {
  if (isServerMode || isDesktop) {
    return lambdaFileManage;
  }

  if (fileService instanceof ClientService) {
    return fileService;
  }

  if (typeof console !== 'undefined' && !warnedMisconfiguredClient) {
    warnedMisconfiguredClient = true;
    console.warn(
      '[chat-ia] File Manager: sin Postgres server ni PGLite (`NEXT_PUBLIC_CLIENT_DB=pglite`), ' +
        'el listado de archivos seguirá llamando a /trpc/lambda. ' +
        'Revisa docs/CHAT-IA-API2-Y-ARCHIVOS-KB.md',
    );
  }

  return lambdaFileManage;
}
