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
 * Configuraciones de developments disponibles
 */
export const DEVELOPMENTS_CONFIG: Record<string, DevelopmentConfig> = {
  annloevents: {
    api: {
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030',
      graphqlEndpoint: 'https://api2.eventosorganizador.com/graphql',
    },
    colors: {
      accent: '#06b6d4',
      background: '#ffffff',
      primary: '#ec4899',
      secondary: '#8b5cf6',
      text: '#1a202c',
    },
    corsOrigin: ['https://annloevents.com', 'https://www.annloevents.com'],
    development: 'annloevents',
    domain: 'https://annloevents.com',
    name: 'Annlo Events',
  },
  bodasdehoy: {
    api: {
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030',
      graphqlEndpoint: 'https://api2.eventosorganizador.com/graphql',
    },
    colors: {
      accent: '#ff69b4',
      background: '#ffffff',
      primary: '#667eea',
      secondary: '#764ba2',
      text: '#1a202c',
    },
    corsOrigin: ['https://bodasdehoy.com', 'https://www.bodasdehoy.com'],
    development: 'bodasdehoy',
    domain: 'https://bodasdehoy.com',
    name: 'Bodas de Hoy',
  },
  champagneevents: {
    api: {
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030',
      graphqlEndpoint: 'https://api2.eventosorganizador.com/graphql',
    },
    colors: {
      accent: '#eab308',
      background: '#ffffff',
      primary: '#f59e0b',
      secondary: '#d97706',
      text: '#1a202c',
    },
    corsOrigin: ['https://champagneevents.com', 'https://www.champagneevents.com'],
    development: 'champagneevents',
    domain: 'https://champagneevents.com',
    name: 'Champagne Events',
  },
  eventosorganizador: {
    api: {
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030',
      graphqlEndpoint: 'https://api2.eventosorganizador.com/graphql',
    },
    colors: {
      accent: '#f59e0b',
      background: '#ffffff',
      primary: '#7c3aed',
      secondary: '#db2777',
      text: '#1a202c',
    },
    corsOrigin: ['https://eventosorganizador.com', 'https://www.eventosorganizador.com'],
    development: 'eventosorganizador',
    domain: 'https://eventosorganizador.com',
    name: 'Eventos Organizador',
  },
};

/**
 * Mapping de dominios a developments
 * Cada development tiene su propio dominio completo
 */
const DOMAIN_TO_DEVELOPMENT: Record<string, string> = {
  '127.0.0.1': 'bodasdehoy',
  'annloevents.com': 'annloevents',
  'bodasdehoy.com': 'bodasdehoy',
  'champagneevents.com': 'champagneevents',
  
'eventosorganizador.com': 'eventosorganizador',
  
// Para desarrollo local (default)
'localhost': 'bodasdehoy',
  
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

