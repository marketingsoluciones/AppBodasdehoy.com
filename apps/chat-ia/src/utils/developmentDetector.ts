/**
 * Sistema Dinámico de Detección de Development
 * 
 * Detecta el development desde:
 * 1. Subdomain: bodasdehoy.eventosorganizador.com
 * 2. Path parameter: /bodasdehoy/chat
 * 3. Query parameter: ?development=bodasdehoy
 * 4. LocalStorage (persistido)
 * 5. Default: bodasdehoy
 */

import React from 'react';

import { developments as sharedDevelopments } from '@bodasdehoy/shared/types';

export interface DevelopmentConfig {
  api: {
    backendUrl: string;
    graphqlEndpoint: string;
  };
  colors: {
    accent: string;
    background: string;
    primary: string;
    secondary: string;
    text: string;
  };
  corsOrigin: string[];
  development: string;
  domain: string;
  name: string;
}

/**
 * Overrides de colores específicos por tenant (resto usa shared theme).
 * bodasdehoy tiene branding chat-ia distinto del theme general (web).
 */
const COLOR_OVERRIDES: Record<string, Partial<DevelopmentConfig['colors']>> = {
  bodasdehoy: { accent: '#ff69b4', primary: '#667eea', secondary: '#764ba2' },
};

const DEFAULT_API_BACKEND = process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8030';
const DEFAULT_GRAPHQL = 'https://api-mcp.eventosorganizador.com';

/**
 * Configuraciones de developments disponibles — generado dinámicamente
 * desde @bodasdehoy/shared/types developments (fuente única de verdad, 11 tenants).
 * Shape adaptado a las necesidades chat-ia (api + colors + corsOrigin).
 */
export const DEVELOPMENTS_CONFIG: Record<string, DevelopmentConfig> = Object.fromEntries(
  sharedDevelopments.map((dev) => {
    const root = dev.domain.replace(/^\./, ''); // ".bodasdehoy.com" → "bodasdehoy.com"
    const httpsRoot = `https://${root}`;
    const override = COLOR_OVERRIDES[dev.development] ?? {};
    return [
      dev.development,
      {
        api: {
          backendUrl: DEFAULT_API_BACKEND,
          graphqlEndpoint: DEFAULT_GRAPHQL,
        },
        colors: {
          accent: override.accent ?? dev.theme?.tertiaryColor ?? '#06b6d4',
          background: override.background ?? dev.theme?.baseColor ?? '#ffffff',
          primary: override.primary ?? dev.theme?.primaryColor ?? '#667eea',
          secondary: override.secondary ?? dev.theme?.secondaryColor ?? '#764ba2',
          text: override.text ?? '#1a202c',
        },
        corsOrigin: [httpsRoot, `https://www.${root}`],
        development: dev.development,
        domain: httpsRoot,
        name: dev.headTitle ?? dev.name,
      },
    ];
  }),
);

/**
 * Mapping de dominios a developments
 * Cada development tiene su propio dominio completo
 */
const DOMAIN_TO_DEVELOPMENT: Record<string, string> = {
  // Localhost y IPs
  '127.0.0.1': 'bodasdehoy',
  // Dominios principales
'annloevents.com': 'annloevents',

  
  

// bodasdehoy.com — dev
'app-dev.bodasdehoy.com': 'bodasdehoy',
  



// bodasdehoy.com — test
'app-test.bodasdehoy.com': 'bodasdehoy',
  


// bodasdehoy.com — producción
'app.bodasdehoy.com': 'bodasdehoy',
  


'bodasdehoy.com': 'bodasdehoy',
  


'champagneevents.com': 'champagneevents',
  


'chat-dev.bodasdehoy.com': 'bodasdehoy',
  


'chat-test.bodasdehoy.com': 'bodasdehoy',
  


'chat.bodasdehoy.com': 'bodasdehoy',

  
  

'editor-dev.bodasdehoy.com': 'bodasdehoy',
  

'editor-test.bodasdehoy.com': 'bodasdehoy',
  

'editor.bodasdehoy.com': 'bodasdehoy',
  

'eventosorganizador.com': 'eventosorganizador',

// Legacy
'iachat.bodasdehoy.com': 'bodasdehoy',

  
  

'localhost': 'bodasdehoy',
  

'memories-dev.bodasdehoy.com': 'bodasdehoy',
  

'memories-test.bodasdehoy.com': 'bodasdehoy',
  

'memories.bodasdehoy.com': 'bodasdehoy',

  
  
'organizador.bodasdehoy.com': 'bodasdehoy',
  
'wedding-creator.bodasdehoy.com': 'bodasdehoy',
  
'www.annloevents.com': 'annloevents',
  
'www.bodasdehoy.com': 'bodasdehoy',

  
  'www.champagneevents.com': 'champagneevents',
  'www.eventosorganizador.com': 'eventosorganizador',
};

/**
 * Detecta el development desde la URL actual
 */
export function detectDevelopmentFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);

  // ✅ PRIORIDAD 1: Query parameter (ej: ?developer=bodasdehoy o ?development=bodasdehoy)
  // Útil para localhost:8000?developer=bodasdehoy
  const queryDeveloper = url.searchParams.get('developer') || url.searchParams.get('development');
  if (queryDeveloper && DEVELOPMENTS_CONFIG[queryDeveloper]) {
    return queryDeveloper;
  }

  // ✅ PRIORIDAD 2: Subdominio local (ej: bodasdehoy.localhost:8000 → bodasdehoy)
  const hostname = url.hostname;
  if (hostname.includes('.localhost') || hostname === 'localhost' || hostname === '127.0.0.1') {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') {
      const subdomain = parts[0];
      if (DEVELOPMENTS_CONFIG[subdomain]) {
        return subdomain;
      }
    }
  }

  // 3. Intentar desde dominio completo (ej: bodasdehoy.com → bodasdehoy)
  const developmentFromDomain = DOMAIN_TO_DEVELOPMENT[hostname];
  if (developmentFromDomain) {
    return developmentFromDomain;
  }

  // 3b. Intentar por sufijo de dominio padre (ej: chat-test.bodasdehoy.com → bodasdehoy)
  // Soporta cualquier subdominio de las marcas conocidas
  const PARENT_DOMAIN_MAP: Record<string, string> = {
    'annloevents.com': 'annloevents',
    'bodasdehoy.com': 'bodasdehoy',
    'champagneevents.com': 'champagneevents',
    'eventosorganizador.com': 'eventosorganizador',
  };
  for (const [parentDomain, dev] of Object.entries(PARENT_DOMAIN_MAP)) {
    if (hostname.endsWith(`.${parentDomain}`) || hostname === parentDomain) {
      return dev;
    }
  }

  // 4. Intentar desde primer path segment (ej: /bodasdehoy/chat)
  // Caso especial si se usa routing por path
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    const firstSegment = pathParts[0];
    if (DEVELOPMENTS_CONFIG[firstSegment]) {
      return firstSegment;
    }
  }

  return null;
}

/**
 * Developer efectivo para branding / visitante:
 * 1) URL (query, dominio, path) — mismo criterio que un usuario sin sesión
 * 2) Valor del store (tras EventosAutoAuth, etc.)
 * 3) getCurrentDevelopment() (localStorage + default)
 */
export function resolveActiveDeveloperForBranding(storeDevelopment?: string | null): string {
  const fromUrl = typeof window !== 'undefined' ? detectDevelopmentFromURL() : null;
  if (fromUrl) return fromUrl.toLowerCase();

  const sd = (storeDevelopment || '').toLowerCase();
  if (sd && DEVELOPMENTS_CONFIG[sd]) return sd;

  if (typeof window !== 'undefined') return getCurrentDevelopment();

  return sd || 'bodasdehoy';
}

/** Nombre corto de marca (tabla local) o slug humanizado */
export function getDeveloperDisplayName(developerKey: string): string {
  const k = (developerKey || 'bodasdehoy').toLowerCase();
  const cfg = DEVELOPMENTS_CONFIG[k];
  if (cfg?.name) return cfg.name;
  if (!developerKey) return DEVELOPMENTS_CONFIG.bodasdehoy.name;
  return (
    developerKey.charAt(0).toUpperCase() +
    developerKey.slice(1).replaceAll(/[_-]/g, ' ')
  );
}

/**
 * Obtiene el development actual con fallback
 */
export function getCurrentDevelopment(): string {
  // 1. Intentar desde URL
  const urlDevelopment = detectDevelopmentFromURL();
  if (urlDevelopment) {
    // Guardar en localStorage para persistencia
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_development', urlDevelopment);
    }
    return urlDevelopment;
  }

  // 2. Intentar desde localStorage
  if (typeof window !== 'undefined') {
    const storedDevelopment = localStorage.getItem('current_development');
    if (storedDevelopment && DEVELOPMENTS_CONFIG[storedDevelopment]) {
      return storedDevelopment;
    }
  }

  // 3. Default
  return 'bodasdehoy';
}

/**
 * Obtiene la configuración completa del development actual
 */
export function getCurrentDevelopmentConfig(): DevelopmentConfig {
  const development = getCurrentDevelopment();
  return DEVELOPMENTS_CONFIG[development] || DEVELOPMENTS_CONFIG.bodasdehoy;
}

/**
 * Obtiene el header Origin correcto para API2 basado en el development actual
 */
export function getAPIOriginHeader(): string {
  const config = getCurrentDevelopmentConfig();
  return config.corsOrigin[0]; // Usar el primer origin de la lista
}

/**
 * Obtiene el GraphQL endpoint correcto para el development actual
 */
export function getGraphQLEndpoint(): string {
  const config = getCurrentDevelopmentConfig();
  return config.api.graphqlEndpoint;
}

/**
 * Hook de React para obtener el development actual (reactivo)
 */
export function useDevelopment() {
  const [development, setDevelopment] = React.useState<string>(getCurrentDevelopment());
  const [config, setConfig] = React.useState<DevelopmentConfig>(getCurrentDevelopmentConfig());

  React.useEffect(() => {
    // Detectar cambios en la URL
    const handleUrlChange = () => {
      const newDevelopment = getCurrentDevelopment();
      if (newDevelopment !== development) {
        setDevelopment(newDevelopment);
        setConfig(getCurrentDevelopmentConfig());
      }
    };

    // Escuchar cambios de navegación
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('pushstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('pushstate', handleUrlChange);
    };
  }, [development]);

  return { config, development };
}

