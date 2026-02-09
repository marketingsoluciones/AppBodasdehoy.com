import { headers } from 'next/headers';

// ✅ Solo loguear en desarrollo
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);

/**
 * Mapeo de dominios/subdominios a developers
 */
const DOMAIN_TO_DEVELOPER: Record<string, string> = {
  '127.0.0.1': 'bodasdehoy',

  '[::1]': 'bodasdehoy',

  'annloevents.com': 'annloevents',

  'bodasdehoy.com': 'bodasdehoy',

  'champagne-events.com.mx': 'champagne-events',

  'chat-test.bodasdehoy.com': 'bodasdehoy',

  // Subdominios de testing
  'chat-test.eventosorganizador.com': 'eventosorganizador',

  // Dominios principales
  'eventosorganizador.com': 'eventosorganizador',

  'iachat.bodasdehoy.com': 'bodasdehoy',
  // Localhost y IPs (default)
  'localhost': 'bodasdehoy',

  'marcablanca.com': 'marcablanca',

  'staging.eventosorganizador.com': 'eventosorganizador',

  'test.bodasdehoy.com': 'bodasdehoy',

  'wildliberty.com': 'wildliberty',
};

/**
 * Detectar developer desde el hostname de la request
 *
 * Prioridad:
 * 1. Query parameter ?developer=xxx (para localhost/testing)
 * 2. Subdominio local (ej: bodasdehoy.localhost → bodasdehoy)
 * 3. Match exacto (hostname completo)
 * 4. Match por dominio raíz (para subdominios no mapeados)
 * 5. null si no se puede detectar
 */
export async function detectDeveloperFromHostname(): Promise<string | null> {
  try {
    let headersList;
    try {
      headersList = await headers();
    } catch (headersError) {
      console.warn('⚠️ Error obteniendo headers en detectDeveloperFromHostname:', headersError);
      return null; // Si no podemos obtener headers, retornar null
    }

    // ✅ PRIORIDAD 1: Query parameter (útil para localhost:8000?developer=bodasdehoy)
    const referer = headersList.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const queryDeveloper = refererUrl.searchParams.get('developer');
        if (queryDeveloper && DOMAIN_TO_DEVELOPER[queryDeveloper]) {
          devLog(`✅ Developer detectado desde query parameter: ${queryDeveloper}`);
          return queryDeveloper;
        }
      } catch {
        // Ignorar error de parsing de URL
      }
    }

    // Obtener hostname (con prioridad a x-forwarded-host para túneles/proxies)
    const forwardedHost = headersList.get('x-forwarded-host');
    const host = headersList.get('host');
    const hostname = forwardedHost || host;

    if (!hostname) {
      return null;
    }

    // Extraer dominio base (sin puerto)
    const domainWithoutPort = hostname.split(':')[0].toLowerCase().trim();

    // ✅ PRIORIDAD 2: Subdominio local (ej: bodasdehoy.localhost → bodasdehoy)
    if (domainWithoutPort.includes('.localhost') || domainWithoutPort.startsWith('localhost')) {
      const parts = domainWithoutPort.split('.');
      if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') {
        const subdomain = parts[0];
        // Verificar si el subdominio es un developer válido
        const validDevelopers = Object.values(DOMAIN_TO_DEVELOPER);
        if (validDevelopers.includes(subdomain)) {
          devLog(
            `✅ Developer detectado desde subdominio local: ${domainWithoutPort} → ${subdomain}`,
          );
          return subdomain;
        }
      }
    }

    // 3. Buscar match exacto
    if (DOMAIN_TO_DEVELOPER[domainWithoutPort]) {
      devLog(
        `✅ Developer detectado desde hostname exacto: ${domainWithoutPort} → ${DOMAIN_TO_DEVELOPER[domainWithoutPort]}`,
      );
      return DOMAIN_TO_DEVELOPER[domainWithoutPort];
    }

    // 4. Buscar por dominio raíz (para subdominios no mapeados)
    // Ej: "cualquier.eventosorganizador.com" → "eventosorganizador.com"
    const parts = domainWithoutPort.split('.');
    if (parts.length >= 2) {
      const rootDomain = parts.slice(-2).join('.');
      if (DOMAIN_TO_DEVELOPER[rootDomain]) {
        devLog(
          `✅ Developer detectado desde dominio raíz: ${domainWithoutPort} → ${rootDomain} → ${DOMAIN_TO_DEVELOPER[rootDomain]}`,
        );
        return DOMAIN_TO_DEVELOPER[rootDomain];
      }
    }

    devLog(`⚠️ No se pudo detectar developer para hostname: ${domainWithoutPort}`);
    return null;
  } catch (error) {
    console.error('❌ Error detecting developer from hostname:', error);
    return null;
  }
}

/**
 * Obtener el mapeo completo de dominios (útil para debugging)
 */
export function getDomainMapping(): Record<string, string> {
  return { ...DOMAIN_TO_DEVELOPER };
}
