import { getDevelopmentNameFromHostname } from '@bodasdehoy/shared/types';

/** Header `Development` para GraphQL en SSR, alineado con el hostname (multi-tenant en un solo deploy). */
export function developmentFromRequestHost(host: string | string[] | undefined): string {
  const raw = Array.isArray(host) ? host[0] : host;
  const h = typeof raw === 'string' ? raw.split(':')[0] : '';
  return h ? getDevelopmentNameFromHostname(h) : (process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy');
}
