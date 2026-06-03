import { isDesktop } from '@/const/version';
import { USE_API_IA_ENDPOINTS } from '@/services/api-ia';

import { ClientService as DeprecatedService } from './_deprecated';
import { ApiIaMessageService } from './apiIa';
import { ServerService } from './server';
import { IMessageService } from './type';

// PERF 2026-06-03: ./client (pglite) arrastra drizzle-orm + pglite al árbol de /chat.
// Es código muerto salvo NEXT_PUBLIC_CLIENT_DB==='pglite' → carga diferida para tree-shake.
function buildClientService(): IMessageService {
  if (process.env.NEXT_PUBLIC_CLIENT_DB === 'pglite') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, unicorn/prefer-module
    const { ClientService } = require('./client');
    return new ClientService();
  }
  return new DeprecatedService();
}

const clientService = buildClientService();

// Migración Opción A: con USE_API_IA_ENDPOINTS, la persistencia de mensajes va por api-ia
// (ApiIaMessageService → /chat/messages), eliminando tRPC/drizzle del flujo. Mientras flag=false
// → comportamiento actual intacto (ServerService tRPC o clientService).
export const messageService = USE_API_IA_ENDPOINTS
  ? new ApiIaMessageService()
  : process.env.NEXT_PUBLIC_SERVICE_MODE === 'server' || isDesktop
    ? new ServerService()
    : clientService;
