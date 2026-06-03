import { isDesktop } from '@/const/version';

import { ClientService as DeprecatedService } from './_deprecated';
import { ServerService } from './server';
import { IUserService } from './type';

// PERF 2026-06-03: el ClientService de pglite (./client) arrastra drizzle-orm + pglite
// (~159 módulos medidos en el bundle de /chat). En este entorno NEXT_PUBLIC_CLIENT_DB
// NO es 'pglite' (usamos SERVICE_MODE=server → ServerService, o DeprecatedService como
// fallback), así que ese ClientService es CÓDIGO MUERTO pero se compilaba por el import
// estático. Lo cargamos diferido SOLO si realmente se pide pglite, para que webpack
// pueda tree-shakear toda la rama drizzle/pglite del árbol cuando no aplica.
// Comportamiento idéntico: si CLIENT_DB==='pglite' se instancia igual (require sync).
function buildClientService(): IUserService {
  if (process.env.NEXT_PUBLIC_CLIENT_DB === 'pglite') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, unicorn/prefer-module
    const { ClientService } = require('./client');
    return new ClientService();
  }
  return new DeprecatedService();
}

const clientService = buildClientService();

export const userService =
  process.env.NEXT_PUBLIC_SERVICE_MODE === 'server' || isDesktop
    ? new ServerService()
    : clientService;

export const userClientService = clientService;
