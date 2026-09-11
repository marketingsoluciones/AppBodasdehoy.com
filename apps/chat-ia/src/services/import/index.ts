import { ClientService as DeprecatedService } from './_deprecated';
import { ServerService } from './server';
import { IImportService } from './type';

// C9 2026-07-20: NEXT_PUBLIC_SERVICE_MODE=server en todos los .env → prod usa
// siempre ServerService. El path pglite (client.ts + require condicional
// NEXT_PUBLIC_CLIENT_DB==='pglite') nunca se activó, se eliminó.
// Se mantiene DeprecatedService como fallback para modo no-server (tests locales).
export const importService: IImportService =
  process.env.NEXT_PUBLIC_SERVICE_MODE === 'server' ? new ServerService() : new DeprecatedService();
