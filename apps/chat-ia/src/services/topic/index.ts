import { ApiIaTopicService } from './apiIa';

// CAPA 1 PASO C 2026-06-04: topics 100% vía api-ia (REST).
// Eliminado el ternary tRPC/drizzle/pglite — server.ts, client.ts, _deprecated.ts
// dejaron de importarse. Ver docs/PASO-C-BORRAR-DRIZZLE-PLAN.md.
export const topicService = new ApiIaTopicService();
