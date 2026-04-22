/**
 * Resolución de branding por tenant — función pura + hook React.
 *
 * Usa la config estática de shared (no depende de API).
 * Patrón: función pura para SSR + hook para client-side.
 */

import { useState, useMemo } from 'react';

import {
  getDevelopmentByHostname,
  getDevelopmentConfig,
  getDevelopmentNameFromHostname,
} from '../types/developments';

export interface TenantBranding {
  /** Key del tenant (ej: 'champagne-events') */
  development: string;
  /** Nombre para mostrar (headTitle o name) */
  name: string;
  /** Color primario del tema */
  primaryColor: string;
  /** Color secundario del tema */
  secondaryColor: string;
  /** Color terciario (opcional) */
  tertiaryColor?: string;
  /** Color base de fondo */
  baseColor: string;
  /** Color de scrollbar (opcional) */
  colorScroll?: string;
  /** URL del favicon (si existe) */
  favicon?: string;
  /** Dominio raíz sin punto (ej: 'champagne-events.com.mx') */
  domain: string;
  /** Zona horaria del tenant */
  timeZone?: string;
  /** Si el copilot está habilitado para este tenant */
  copilotEnabled: boolean;
}

/**
 * Resuelve branding de un tenant por hostname.
 * Función pura — funciona en SSR y client.
 */
export function resolveTenantBranding(hostname: string): TenantBranding {
  const config = getDevelopmentByHostname(hostname);
  return configToTenantBranding(config);
}

/**
 * Resuelve branding de un tenant por su development key.
 * Función pura — funciona en SSR y client.
 */
export function resolveTenantBrandingByKey(developmentKey: string): TenantBranding {
  const config = getDevelopmentConfig(developmentKey);
  if (!config) return resolveTenantBranding('bodasdehoy.com');
  return configToTenantBranding(config);
}

/**
 * Hook React para client-side.
 * Si se pasa `overrideDevelopment` (ej: de un query param), lo usa.
 * Si no, detecta desde `window.location.hostname`.
 */
export function useTenantBranding(overrideDevelopment?: string): TenantBranding {
  const [hostname] = useState(() =>
    typeof window !== 'undefined' ? window.location.hostname : 'bodasdehoy.com',
  );

  return useMemo(() => {
    if (overrideDevelopment) {
      return resolveTenantBrandingByKey(overrideDevelopment);
    }
    return resolveTenantBranding(hostname);
  }, [overrideDevelopment, hostname]);
}

// ── Internal ─────────────────────────────────────────────────────────────────

function configToTenantBranding(
  config: ReturnType<typeof getDevelopmentByHostname>,
): TenantBranding {
  const root = config.domain.replace(/^\./, '');
  return {
    baseColor: config.theme?.baseColor || '#F2F2F2',
    colorScroll: config.theme?.colorScroll,
    copilotEnabled: config.copilotEnabled ?? false,
    development: config.development,
    domain: root,
    favicon: config.favicon,
    name: config.headTitle || config.name,
    primaryColor: config.theme?.primaryColor || '#ec4899',
    secondaryColor: config.theme?.secondaryColor || '#f472b6',
    tertiaryColor: config.theme?.tertiaryColor,
    timeZone: config.timeZone,
  };
}
