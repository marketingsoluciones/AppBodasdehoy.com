import { ApiIaUserService } from './apiIa';

// CAPA 2 PASO C 2026-06-05: user 100% vía api-ia REST.
// Eliminado ternary tRPC/drizzle/pglite — server.ts, client.ts, _deprecated.ts borrados.
// Métodos SSO/registration sin endpoint api-ia equivalente devuelven stubs neutros
// (ver apiIa.ts). Pregunta 3.2 abierta a backend para decidir endpoint vs deprecar.

export const userService = new ApiIaUserService();
export const userClientService = userService;
