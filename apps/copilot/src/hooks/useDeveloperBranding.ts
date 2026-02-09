/**
 * Hook para obtener configuración de branding del developer actual
 * Consulta el endpoint /api/config/{developer} y cachea el resultado
 */

import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat';

export interface DeveloperBrandingColors {
  accent: string;
  background: string;
  primary: string;
  secondary: string;
  text: string;
}

export interface DeveloperBrandingIcons {
  budget?: string;
  campaigns?: string;
  chat?: string;
  events?: string;
  guests?: string;
  settings?: string;
  user?: string;
}

export interface DeveloperBranding {
  apple_touch_icon?: string;
  background_image?: string;
  color_primary: string;
  color_secondary: string;
  colors: DeveloperBrandingColors;
  description: string;
  developer: string;
  enabled: boolean;
  favicon?: string;
  icons: DeveloperBrandingIcons;
  logo?: string;
  name: string;
  og_image?: string;
  twitter_image?: string;
}

interface UseDeveloperBrandingResult {
  branding: DeveloperBranding | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

// Cache global para evitar múltiples llamadas
const brandingCache = new Map<string, DeveloperBranding>();

/**
 * Hook para obtener branding del developer
 * 
 * @example
 * ```tsx
 * const { branding, loading } = useDeveloperBranding();
 * 
 * if (loading) return <Spinner />;
 * 
 * return (
 *   <div>
 *     <img src={branding?.logo} alt={branding?.name} />
 *     <h1>{branding?.name}</h1>
 *   </div>
 * );
 * ```
 */
export const useDeveloperBranding = (): UseDeveloperBrandingResult => {
  const { development } = useChatStore((s) => ({
    development: s.development,
  }));

  const [branding, setBranding] = useState<DeveloperBranding | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBranding = async () => {
    const developer = development || 'bodasdehoy';

    // Verificar cache
    if (brandingCache.has(developer)) {
      setBranding(brandingCache.get(developer)!);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/config/${developer}`);

      if (!response.ok) {
        throw new Error(`Error fetching branding: ${response.statusText}`);
      }

      const data: DeveloperBranding = await response.json();

      // Guardar en cache
      brandingCache.set(developer, data);

      setBranding(data);
    } catch (err) {
      console.error('Error fetching developer branding:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));

      // Fallback a branding por defecto
      const fallbackBranding: DeveloperBranding = {
        color_primary: '#667eea',
        color_secondary: '#764ba2',
        colors: {
          accent: '#667eea',
          background: '#ffffff',
          primary: '#667eea',
          secondary: '#764ba2',
          text: '#1a202c',
        },
        description: `Asistente de eventos para ${developer}`,
        developer: developer,
        enabled: true,
        icons: {},
        name: developer.charAt(0).toUpperCase() + developer.slice(1),
      };

      setBranding(fallbackBranding);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [development]);

  return {
    branding,
    error,
    loading,
    refetch: fetchBranding,
  };
};

/**
 * Hook simplificado que solo devuelve el nombre del developer
 */
export const useDeveloperName = (): string => {
  const { branding } = useDeveloperBranding();
  return branding?.name || 'Lobe Chat';
};

/**
 * Hook simplificado que solo devuelve el logo del developer
 */
export const useDeveloperLogo = (): string | undefined => {
  const { branding } = useDeveloperBranding();
  return branding?.logo;
};

/**
 * Hook simplificado que devuelve los colores del developer
 */
export const useDeveloperColors = (): DeveloperBrandingColors | null => {
  const { branding } = useDeveloperBranding();
  return branding?.colors || null;
};

/**
 * Hook simplificado que devuelve los iconos del developer
 */
export const useDeveloperIcons = (): DeveloperBrandingIcons => {
  const { branding } = useDeveloperBranding();
  return branding?.icons || {};
};

/**
 * Limpiar cache de branding (útil para desarrollo/testing)
 */
export const clearBrandingCache = () => {
  brandingCache.clear();
};


