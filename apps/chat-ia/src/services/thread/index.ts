import { ApiIaThreadService } from './apiIa';

// CAPA 3 PASO C fase 3a (2026-06-05): thread 100% vía api-ia REST.
// Los 6 endpoints están LIVE en api-ia (commit api-ia 628d758 + naming
// uppercase/lowercase transparente).
//
// Eliminado el ternary con flag NEXT_PUBLIC_USE_API_IA_THREAD — ahora siempre
// ApiIaThreadService. Borrados server.ts (tRPC) y client.ts (pglite).

export const threadService = new ApiIaThreadService();
