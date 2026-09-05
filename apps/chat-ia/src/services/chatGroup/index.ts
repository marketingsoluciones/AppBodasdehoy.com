import { ApiIaChatGroupService } from './apiIa';

// CAPA 2 PASO C 2026-06-05 — opción (c) según api-ia (msg 07:50, 08:47, 09:40):
// chatGroup híbrido: sessions del grupo en api-mcp via /chat/session-groups,
// order/role agentes en userConfig.chatGroups[].
// Eliminado ternary tRPC/pglite — server.ts/client.ts borrados.
export const chatGroupService = new ApiIaChatGroupService();
