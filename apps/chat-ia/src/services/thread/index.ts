import { isDesktop } from '@/const/version';

import { ApiIaThreadService } from './apiIa';
import { ClientService } from './client';
import { ServerService } from './server';

// CAPA 2 PASO C 2026-06-05 — thread es ÚNICO servicio que vuelve a backend
// (no se deprecó, AppBodas/CRM/otros tenants usan threads como Slack).
//
// Patrón rollout idéntico a CAPA 1 (message/session/topic):
//   NEXT_PUBLIC_USE_API_IA_THREAD=true → usa ApiIaThreadService (REST a api-ia)
//   sin flag → comportamiento actual intacto (tRPC ServerService o pglite ClientService)
//
// Cuando api-ia notifique los 6 endpoints REST listos:
//   1. Activar flag en .env.local (NEXT_PUBLIC_USE_API_IA_THREAD=true)
//   2. Smoke local: crear thread, listar, update, delete
//   3. Si OK → eliminar server.ts/client.ts y este ternary (igual que CAPA 1)
//   4. Push y deploy

const USE_API_IA_THREAD = process.env.NEXT_PUBLIC_USE_API_IA_THREAD === 'true';

export const threadService = USE_API_IA_THREAD
  ? new ApiIaThreadService()
  : process.env.NEXT_PUBLIC_SERVICE_MODE === 'server' || isDesktop
    ? new ServerService()
    : new ClientService();
