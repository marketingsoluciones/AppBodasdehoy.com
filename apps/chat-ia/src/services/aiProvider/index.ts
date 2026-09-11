import { ApiIaAiProviderService } from './apiIa';

// CAPA 2 PASO C 2026-06-05 — opción (c) según api-ia (msg 07:50, 08:47, 09:40):
// aiProvider 100% en userConfig.aiProviders[] + api_keys[providerId].key cifrado.
// Eliminado ternary tRPC/pglite — server.ts/client.ts borrados.
export const aiProviderService = new ApiIaAiProviderService();
