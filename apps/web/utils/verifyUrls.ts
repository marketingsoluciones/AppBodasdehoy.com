/**
 * Utilidad para verificar que las URLs y dominios configurados funcionen correctamente
 */

export interface UrlCheckResult {
  url: string;
  status: 'ok' | 'error' | 'timeout';
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

/**
 * Verifica si una URL responde correctamente
 */
export async function checkUrl(url: string, timeout = 5000): Promise<UrlCheckResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD', // Solo HEAD para verificar sin descargar contenido
      signal: controller.signal,
      // Agregar headers para evitar bloqueos
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URL-Checker/1.0)',
      },
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      url,
      status: response.ok ? 'ok' : 'error',
      statusCode: response.status,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      return {
        url,
        status: 'timeout',
        error: `Timeout después de ${timeout}ms`,
        responseTime,
      };
    }
    
    return {
      url,
      status: 'error',
      error: error.message || 'Error desconocido',
      responseTime,
    };
  }
}

/**
 * Verifica todas las URLs configuradas en el entorno
 */
export async function verifyAllUrls(): Promise<UrlCheckResult[]> {
  const urlsToCheck: string[] = [];
  
  // URLs de producción desde .env.production
  if (typeof window === 'undefined') {
    // Server-side: usar variables de entorno
    const envUrls = [
      process.env.NEXT_PUBLIC_BASE_URL,
      process.env.NEXT_PUBLIC_BASE_API_BODAS,
      process.env.NEXT_PUBLIC_DIRECTORY,
      process.env.NEXT_PUBLIC_CMS,
      process.env.NEXT_PUBLIC_CUSTOMWEB,
      process.env.NEXT_PUBLIC_EVENTSAPP,
      process.env.NEXT_PUBLIC_CHAT,
      // Backend IA
      process.env.PYTHON_BACKEND_URL || 'https://api-ia.bodasdehoy.com',
      process.env.NEXT_PUBLIC_BACKEND_URL,
    ].filter(Boolean) as string[];
    
    urlsToCheck.push(...envUrls);
  } else {
    // Client-side: construir desde window.location
    const baseUrl = window.location.origin;
    urlsToCheck.push(baseUrl);

    // Verificar también el dominio base
    const hostname = window.location.hostname;
    const isTestDomain = hostname.includes('-test.') || hostname === 'localhost' || hostname === '127.0.0.1';

    if (hostname.includes('bodasdehoy.com') && !isTestDomain) {
      // Solo verificar APIs externas en producción (evitar CORS en test)
      urlsToCheck.push('https://bodasdehoy.com');
      urlsToCheck.push('https://api.bodasdehoy.com');
      urlsToCheck.push('https://apiapp.bodasdehoy.com');
      urlsToCheck.push('https://chat.bodasdehoy.com');
      // Backend IA
      urlsToCheck.push('https://api-ia.bodasdehoy.com');
    } else if (isTestDomain) {
      // En test, solo verificar URLs locales/proxy
      urlsToCheck.push(`${baseUrl}/api/proxy-bodas/graphql`);
      urlsToCheck.push('https://chat-test.bodasdehoy.com');
    }
  }
  
  // Verificar todas las URLs en paralelo
  const results = await Promise.all(
    urlsToCheck.map(url => checkUrl(url))
  );
  
  return results;
}

/**
 * Verifica el dominio actual y su configuración
 */
export function verifyDomain(): {
  hostname: string;
  origin: string;
  isLocalhost: boolean;
  isTestDomain: boolean;
  domain: string;
  subdomain: string | null;
} {
  if (typeof window === 'undefined') {
    return {
      hostname: 'server',
      origin: 'server',
      isLocalhost: false,
      isTestDomain: false,
      domain: '',
      subdomain: null,
    };
  }
  
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Detectar si es un dominio de test
  const isTestDomain = hostname.includes('test') || 
                       hostname.includes('chat-test') || 
                       hostname.includes('dev') ||
                       hostname.includes('staging');
  
  // Extraer dominio y subdominio
  const parts = hostname.split('.');
  let domain = '';
  let subdomain: string | null = null;
  
  if (parts.length >= 2) {
    domain = parts.slice(-2).join('.');
    if (parts.length > 2) {
      subdomain = parts.slice(0, -2).join('.');
    }
  } else {
    domain = hostname;
  }
  
  return {
    hostname,
    origin,
    isLocalhost,
    isTestDomain,
    domain,
    subdomain,
  };
}

/**
 * Log de verificación para debugging
 */
export function logUrlVerification(results: UrlCheckResult[]) {
  console.group('🔍 Verificación de URLs y Dominios');
  
  results.forEach(result => {
    if (result.status === 'ok') {
      console.log(`✅ ${result.url} - ${result.statusCode} (${result.responseTime}ms)`);
    } else {
      console.error(`❌ ${result.url} - ${result.status}`, result.error || `Status: ${result.statusCode}`);
    }
  });
  
  const domainInfo = verifyDomain();
  console.log('\n📋 Información del Dominio:');
  console.log('  Hostname:', domainInfo.hostname);
  console.log('  Origin:', domainInfo.origin);
  console.log('  Domain:', domainInfo.domain);
  console.log('  Subdomain:', domainInfo.subdomain || 'ninguno');
  console.log('  Is Localhost:', domainInfo.isLocalhost);
  console.log('  Is Test Domain:', domainInfo.isTestDomain);
  
  console.groupEnd();
}
