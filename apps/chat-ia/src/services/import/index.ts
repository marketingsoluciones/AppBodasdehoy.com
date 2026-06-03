import { ClientService as DeprecatedService } from './_deprecated';
import { ServerService } from './server';
import { IImportService } from './type';

// PERF 2026-06-03: ./client (pglite) arrastra drizzle-orm + pglite al árbol de /chat.
// Es código muerto salvo NEXT_PUBLIC_CLIENT_DB==='pglite' → carga diferida para tree-shake.
function buildClientService(): IImportService {
  if (process.env.NEXT_PUBLIC_CLIENT_DB === 'pglite') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, unicorn/prefer-module
    const { ClientService } = require('./client');
    return new ClientService();
  }
  return new DeprecatedService();
}

const clientService = buildClientService();

export const importService =
  process.env.NEXT_PUBLIC_SERVICE_MODE === 'server' ? new ServerService() : clientService;
