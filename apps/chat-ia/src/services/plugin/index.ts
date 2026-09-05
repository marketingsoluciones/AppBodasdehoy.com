import { ApiIaPluginService } from './apiIa';

// CAPA 2 PASO C 2026-06-05 opción (c) — deprecar persistencia de plugins.
// El registry instalado vive en userConfig.enabledPlugins (string[]).
// Settings/customParams por plugin NO se persisten (los manifests se resuelven
// en runtime vía /webapi/plugin/gateway).
// Eliminado ternary tRPC/pglite — server.ts, client.ts, _deprecated.ts borrados.

export const pluginService = new ApiIaPluginService();
