/**
 * Sincronización dinámica de dominios desde API2 (whitelabels collection)
 * 
 * Este módulo permite obtener la configuración de whitelabel
 * directamente desde MongoDB vía API2 si es necesario.
 */

interface WhitelabelConfig {
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
  slug: string;
}

/**
 * Obtiene la configuración de whitelabel desde API2
 * basándose en el dominio actual
 */
export async function fetchWhitelabelByDomain(domain: string): Promise<WhitelabelConfig | null> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
    
    // Llamar al endpoint del backend que consulta MongoDB
    const response = await fetch(`${backendUrl}/api/whitelabel/by-domain`, {
      body: JSON.stringify({ domain }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      console.warn(`⚠️ No se pudo obtener whitelabel para dominio: ${domain}`);
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.whitelabel) {
      console.log(`✅ Whitelabel obtenido desde API2:`, data.whitelabel.slug);
      return {
        colors: data.whitelabel.colors || {
          accent: '#ff69b4',
          background: '#ffffff',
          primary: '#667eea',
          secondary: '#764ba2',
          text: '#1a202c',
        },
        corsOrigin: data.whitelabel.corsOrigin || [data.whitelabel.domain],
        development: data.whitelabel.development,
        domain: data.whitelabel.domain,
        name: data.whitelabel.name,
        slug: data.whitelabel.slug,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error obteniendo whitelabel desde API2:', error);
    return null;
  }
}

/**
 * Obtiene el development desde el dominio actual
 * consultando primero la API2 si es necesario
 */
export async function getDevelopmentFromDomain(domain: string): Promise<string | null> {
  const whitelabel = await fetchWhitelabelByDomain(domain);
  return whitelabel?.development || null;
}

