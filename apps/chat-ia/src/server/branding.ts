/**
 * Funciones del servidor para obtener branding del developer
 *
 * ✅ OPTIMIZADO: Cache en memoria + timeout reducido para SSR rápido
 */

import { cookies } from 'next/headers';

// ✅ CACHE EN MEMORIA para evitar múltiples fetch durante SSR
const brandingCache: Map<string, { data: ServerBranding; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const FETCH_TIMEOUT = 2000; // 2 segundos (aumentado de 1s para evitar timeouts)

// ✅ CACHE ESTÁTICO: Cargar branding desde archivo local primero
let staticBrandingCache: Record<string, ServerBranding> | null = null;

async function loadStaticBranding(): Promise<Record<string, ServerBranding>> {
  if (staticBrandingCache) return staticBrandingCache;

  // Deshabilitado para evitar problemas de webpack en build de producción
  // TODO: Mover a server action o API route que solo se ejecute en servidor
  return {};
}

export interface ServerBranding {
  apple_touch_icon?: string;
  color_primary: string;
  color_secondary: string;
  description: string;
  developer: string;
  favicon?: string;
  logo?: string;
  name: string;
  og_image?: string;
  twitter_image?: string;
}

/**
 * Obtener developer actual con detección automática desde hostname
 *
 * Prioridad:
 * 1. Cookie 'developer' (override manual para testing)
 * 2. Cookie 'dev-user-config' (localStorage serializado)
 * 3. Detección automática desde hostname
 * 4. Default: 'bodasdehoy'
 */
export async function getCurrentDeveloper(): Promise<string> {
  try {
    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (cookieError) {
      console.warn('⚠️ Error obteniendo cookies, usando default:', cookieError);
      return 'bodasdehoy';
    }

    // PRIORIDAD 1: Cookie explícita (para override manual en testing)
    try {
      const developerCookie = cookieStore.get('developer');
      if (developerCookie?.value) {
        console.log(`🔧 Developer desde cookie: ${developerCookie.value}`);
        return developerCookie.value;
      }
    } catch (error) {
      console.warn('⚠️ Error leyendo cookie developer:', error);
    }

    // PRIORIDAD 2: Desde dev-user-config (localStorage serializado)
    try {
      const configCookie = cookieStore.get('dev-user-config');
      if (configCookie?.value) {
        try {
          // ✅ FIX: Limpiar y validar el valor antes de parsear
          let cookieValue = configCookie.value.trim();
          
          // ✅ FIX: Si está URL-encoded, decodificar primero
          if (cookieValue.startsWith('%')) {
            try {
              cookieValue = decodeURIComponent(cookieValue);
            } catch (decodeError) {
              console.warn('⚠️ Error decodificando cookie dev-user-config:', decodeError);
              // Continuar con el valor original si falla la decodificación
            }
          }
          
          // ✅ FIX: Validar que sea JSON válido antes de parsear
          if (!cookieValue.startsWith('{') && !cookieValue.startsWith('[')) {
            console.warn('⚠️ Cookie dev-user-config no parece ser JSON válido');
            // Continuar con siguiente prioridad
          } else {
            const config = JSON.parse(cookieValue);
            if (config && typeof config === 'object' && config.development) {
              console.log(`💾 Developer desde localStorage: ${config.development}`);
              return config.development;
            }
          }
        } catch (parseError) {
          // ✅ FIX: Log más detallado del error
          console.warn('⚠️ Error parseando dev-user-config:', {
            cookieLength: configCookie.value?.length,
            cookiePreview: configCookie.value?.slice(0, 100),
            error: parseError instanceof Error ? parseError.message : String(parseError)
          });
          // Continuar con siguiente prioridad (no lanzar error)
        }
      }
    } catch (error) {
      console.warn('⚠️ Error leyendo cookie dev-user-config:', error);
    }

    // PRIORIDAD 3: 🆕 Detectar automáticamente desde hostname
    try {
      const { detectDeveloperFromHostname } = await import('./utils/detectDeveloperFromHostname');
      const developerFromHostname = await detectDeveloperFromHostname();
      if (developerFromHostname) {
        console.log(`🌐 Developer detectado desde hostname: ${developerFromHostname}`);
        return developerFromHostname;
      }
    } catch (hostnameError) {
      console.warn('⚠️ Error detectando developer desde hostname:', hostnameError);
      // Continuar con default
    }
  } catch (e) {
    console.warn('⚠️ Error getting developer:', e);
  }

  // PRIORIDAD 4: Default - SIEMPRE retornar un valor válido
  console.log('📌 Usando developer default: bodasdehoy');
  return 'bodasdehoy';
}

/**
 * Obtener branding del developer desde el backend
 *
 * ✅ OPTIMIZADO: Cache en memoria + timeout de 1s para SSR rápido
 * Esta función NUNCA debe lanzar errores, siempre retorna un fallback válido
 */
export async function getDeveloperBranding(developer?: string): Promise<ServerBranding> {
  let dev: string;

  // Obtener developer de forma segura
  try {
    dev = developer || (await getCurrentDeveloper());
  } catch (error) {
    console.warn('⚠️ Error obteniendo developer, usando default:', error);
    dev = 'bodasdehoy';
  }

  // ✅ PRIORIDAD 1: Verificar cache en memoria (instantáneo)
  const cached = brandingCache.get(dev);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // ✅ PRIORIDAD 2: Cargar desde cache estático (archivo local, 0ms latencia)
  try {
    const staticBranding = await loadStaticBranding();
    if (staticBranding[dev]) {
      // Guardar en cache en memoria
      brandingCache.set(dev, { data: staticBranding[dev], timestamp: Date.now() });
      return staticBranding[dev];
    }
  } catch (error) {
    console.warn('⚠️ Error cargando static branding:', error);
  }

  // Fallback por defecto
  const defaultBranding: ServerBranding = {
    color_primary: '#667eea',
    color_secondary: '#764ba2',
    description: `Asistente de eventos para ${dev}`,
    developer: dev,
    name: dev.charAt(0).toUpperCase() + dev.slice(1),
  };

  try {
    // Construir URL del backend
    const backendUrl =
      process.env.API_IA_URL || process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8030';

    // Validar que la URL sea válida
    if (!backendUrl || (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://'))) {
      console.warn(`⚠️ Invalid backend URL: ${backendUrl}, usando fallback`);
      brandingCache.set(dev, { data: defaultBranding, timestamp: Date.now() });
      return defaultBranding;
    }

    const url = `${backendUrl}/api/config/${dev}`;

    // ✅ Timeout de 2 segundos (aumentado para evitar timeouts con backend lento)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const response = await fetch(url, {
        cache: 'force-cache',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ Backend responded with ${response.status}, usando fallback`);
        brandingCache.set(dev, { data: defaultBranding, timestamp: Date.now() });
        return defaultBranding;
      }

      const data: ServerBranding = await response.json();

      // Validar datos
      if (!data || typeof data !== 'object') {
        console.warn('⚠️ Invalid branding data, usando fallback');
        brandingCache.set(dev, { data: defaultBranding, timestamp: Date.now() });
        return defaultBranding;
      }

      // ✅ GUARDAR EN CACHE
      brandingCache.set(dev, { data, timestamp: Date.now() });
      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.warn('⚠️ Timeout (2s) al obtener branding, usando fallback');
      } else {
        console.warn('⚠️ Error en fetch de branding:', fetchError?.message || fetchError);
      }

      // Guardar fallback en cache para evitar reintentos
      brandingCache.set(dev, { data: defaultBranding, timestamp: Date.now() });
      return defaultBranding;
    }
  } catch (error: any) {
    console.warn('⚠️ Error fetching developer branding:', error?.message || error);
    brandingCache.set(dev, { data: defaultBranding, timestamp: Date.now() });
    return defaultBranding;
  }
}

/**
 * Obtener nombre del developer para metadata
 */
export async function getDeveloperName(developer?: string): Promise<string> {
  const branding = await getDeveloperBranding(developer);
  return branding.name;
}

/**
 * Obtener logo del developer para metadata
 */
export async function getDeveloperLogo(developer?: string): Promise<string | undefined> {
  const branding = await getDeveloperBranding(developer);
  return branding.logo;
}

/**
 * Obtener OG image del developer para metadata
 */
export async function getDeveloperOGImage(developer?: string): Promise<string | undefined> {
  const branding = await getDeveloperBranding(developer);
  return branding.og_image;
}

