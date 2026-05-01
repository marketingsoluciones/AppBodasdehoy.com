/**
 * Sistema Dinámico de Detección de Development
 *
 * Genera configs desde @bodasdehoy/shared (fuente de verdad, 11 tenants).
 * Detecta el development desde:
 * 1. Query parameter: ?developer=champagne-events
 * 2. Subdominio local: bodasdehoy.localhost:8000
 * 3. Dominio completo: champagne-events.com.mx
 * 4. Sufijo de dominio padre: chat-test.champagne-events.com.mx
 * 5. Path segment: /bodasdehoy/chat
 * 6. LocalStorage (persistido)
 * 7. Default: bodasdehoy
 */

import React from 'react';

import { developments } from '@bodasdehoy/shared/types';
import { resolvePublicMcpGraphqlUrl } from '@/const/mcpEndpoints';

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
  shortName: string;
}

// ── Overrides de colores para tenants que tenían config custom ────────────────
const COLOR_OVERRIDES: Record<string, DevelopmentConfig['colors']> = {
  annloevents: {
    accent: '#06b6d4',
    background: '#ffffff',
    primary: '#ec4899',
    secondary: '#8b5cf6',
    text: '#1a202c',
  },
  bodasdehoy: {
    accent: '#ff69b4',
    background: '#ffffff',
    primary: '#667eea',
    secondary: '#764ba2',
    text: '#1a202c',
  },
  eventosorganizador: {
    accent: '#f59e0b',
    background: '#ffffff',
    primary: '#7c3aed',
    secondary: '#db2777',
    text: '#1a202c',
  },
};

// ── DEVELOPMENTS_CONFIG generado desde shared (11 tenants) ───────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
const GRAPHQL_ENDPOINT = resolvePublicMcpGraphqlUrl();

export const DEVELOPMENTS_CONFIG: Record<string, DevelopmentConfig> = Object.fromEntries(
  developments.map((d) => {
    const rootDomain = d.domain.replace(/^\./, '');
    return [
      d.development, // clave exacta de shared: 'champagne-events', 'bodasdehoy', etc.
      {
        api: { backendUrl: BACKEND_URL, graphqlEndpoint: GRAPHQL_ENDPOINT },
        colors: COLOR_OVERRIDES[d.development] || {
          accent: d.theme?.primaryColor || '#667eea',
          background: d.theme?.baseColor || '#ffffff',
          primary: d.theme?.primaryColor || '#667eea',
          secondary: d.theme?.secondaryColor || '#764ba2',
          text: '#1a202c',
        },
        corsOrigin: [`https://${rootDomain}`, `https://www.${rootDomain}`],
        development: d.development,
        domain: `https://${rootDomain}`,
        name: d.headTitle || d.name,
        shortName: d.name,
      },
    ];
  }),
);

// ── Mapping de dominios → development (generado desde shared) ────────────────

const DOMAIN_TO_DEVELOPMENT: Record<string, string> = {
  '127.0.0.1': 'bodasdehoy',
  'localhost': 'bodasdehoy',
};

// Generar entradas para todos los 11 tenants
for (const d of developments) {
  const root = d.domain.replace(/^\./, '');
  DOMAIN_TO_DEVELOPMENT[root] = d.development;
  DOMAIN_TO_DEVELOPMENT[`www.${root}`] = d.development;
}

// Subdominios legacy/conocidos de bodasdehoy
const BODASDEHOY_SUBDOMAINS = [
  'app-dev', 'app-test', 'app',
  'chat-dev', 'chat-test', 'chat',
  'editor-dev', 'editor-test', 'editor',
  'memories-dev', 'memories-test', 'memories',
  'organizador', 'iachat', 'wedding-creator',
];
for (const sub of BODASDEHOY_SUBDOMAINS) {
  DOMAIN_TO_DEVELOPMENT[`${sub}.bodasdehoy.com`] = 'bodasdehoy';
}

// ── Parent domain map (generado desde shared) ────────────────────────────────

const PARENT_DOMAIN_MAP: Record<string, string> = {};
for (const d of developments) {
  PARENT_DOMAIN_MAP[d.domain.replace(/^\./, '')] = d.development;
}

// ── Detección ────────────────────────────────────────────────────────────────

/**
 * Detecta el development desde la URL actual
 */
export function detectDevelopmentFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);

  // ✅ PRIORIDAD 1: Query parameter (?developer=champagne-events o ?development=...)
  const queryDeveloper = url.searchParams.get('developer') || url.searchParams.get('development');
  if (queryDeveloper) {
    // Match directo
    if (DEVELOPMENTS_CONFIG[queryDeveloper]) return queryDeveloper;
    // Normalizado (backward compat: champagneevents → champagne-events)
    const normalized = queryDeveloper.toLowerCase().replaceAll('-', '');
    const found = Object.keys(DEVELOPMENTS_CONFIG).find(
      (k) => k.replaceAll('-', '') === normalized,
    );
    if (found) return found;
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

  // 3. Intentar desde dominio completo (ej: champagne-events.com.mx → champagne-events)
  const developmentFromDomain = DOMAIN_TO_DEVELOPMENT[hostname];
  if (developmentFromDomain) {
    return developmentFromDomain;
  }

  // 3b. Intentar por sufijo de dominio padre (ej: chat-test.champagne-events.com.mx → champagne-events)
  for (const [parentDomain, dev] of Object.entries(PARENT_DOMAIN_MAP)) {
    if (hostname.endsWith(`.${parentDomain}`) || hostname === parentDomain) {
      return dev;
    }
  }

  // 4. Intentar desde primer path segment (ej: /bodasdehoy/chat)
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

/** Nombre corto de marca para UI compacta (avatar, badges) */
export function getDeveloperShortName(developerKey: string): string {
  const k = (developerKey || 'bodasdehoy').toLowerCase();
  const cfg = DEVELOPMENTS_CONFIG[k];
  if (k === 'bodasdehoy') return 'Bodas de Hoy';
  if (k === 'eventosorganizador') return 'Eventos Organizador';

  const raw = cfg?.shortName?.trim();
  const isSlugLike = !!raw && raw.toLowerCase() === k;
  if (raw && !isSlugLike) return raw;

  return getDeveloperDisplayName(developerKey);
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
