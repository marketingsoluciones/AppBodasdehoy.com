/**
 * Configuracion de developments (multi-tenant)
 *
 * FUENTE DE VERDAD para campos de identidad de cada whitelabel.
 * apps/appEventos/firebase.js extiende esto con: fileConfig (Firebase), logoDirectory (React), navbarDirectory (React)
 * apps/chat-ia, apps/appEventos y cualquier app del monorepo importan desde aquí.
 */

export interface DevelopmentTheme {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  baseColor?: string;
  colorScroll?: string;
}

export interface DevelopmentConfig {
  /** Nombre identificador del tenant (igual que development) */
  name: string;
  /** Key de tenant usada en APIs y cookies */
  development: string;
  /** Nombre de la cookie de sesión (sessionBodas, sessionOrganizador...) */
  cookie: string;
  /** Nombre de la cookie de guest */
  cookieGuest?: string;
  /** Dominio raíz con punto inicial para cookies cross-subdomain (.bodasdehoy.com) */
  domain: string;
  /** URL base del sitio (https://bodasdehoy.com) */
  pathDomain?: string;
  /** URL de la página de login */
  pathLogin?: string;
  /** URL de la página de signout */
  pathSignout?: string;
  /** URL del perfil del usuario */
  pathPerfil?: string;
  /** URL base para redirecciones post-login */
  pathDirectory?: string;
  /** Título de la pestaña del navegador */
  headTitle?: string;
  /** URL del favicon personalizado */
  favicon?: string;
  /** Colores del tema */
  theme?: DevelopmentTheme;
  /** ID de Meta Pixel (Facebook/Instagram Ads) — propio de cada white-label */
  metaPixel_id?: string;
  /** ID de Google Tag Manager — propio de cada white-label (ej: GTM-XXXXXXX) */
  gtm_id?: string;
  /** Zona horaria principal de la empresa */
  timeZone?: string;
}

export const developments: DevelopmentConfig[] = [
  {
    name: 'bodasdehoy',
    development: 'bodasdehoy',
    cookie: 'sessionBodas',
    cookieGuest: 'guestbodas',
    domain: '.bodasdehoy.com',
    pathDomain: 'https://bodasdehoy.com',
    pathLogin: 'https://bodasdehoy.com/login',
    pathSignout: 'https://bodasdehoy.com/signout',
    pathPerfil: 'https://bodasdehoy.com/configuracion',
    pathDirectory: 'https://bodasdehoy.com',
    headTitle: 'Bodas de hoy - Organizador de Bodas',
    theme: {
      primaryColor: '#F7628C',
      secondaryColor: '#87F3B5',
      tertiaryColor: '#FBFF4E',
      baseColor: '#F2F2F2',
      colorScroll: '#ffc0cb',
    },
    metaPixel_id: '1019487254775689',
    gtm_id: 'GTM-P6R3S584',
    timeZone: 'Europe/Madrid',
  },
  {
    name: 'eventosplanificador',
    development: 'eventosplanificador',
    cookie: 'sessionPlanificador',
    cookieGuest: 'guestplanicador',
    domain: '.eventosplanificador.com',
    pathDomain: 'https://eventosplanificador.com',
    pathLogin: 'https://eventosplanificador.com/login',
    headTitle: 'Planificador de Eventos',
    theme: {
      primaryColor: '#6771ae',
      secondaryColor: '#c589a9',
      tertiaryColor: '#b3dbb4',
      baseColor: '#F2F2F2',
      colorScroll: '#adb6ed',
    },
    timeZone: 'Europe/Madrid',
  },
  {
    name: 'eventosorganizador',
    development: 'eventosorganizador',
    cookie: 'sessionOrganizador',
    cookieGuest: 'guestorganizador',
    domain: '.eventosorganizador.com',
    pathDomain: 'https://eventosorganizador.com',
    pathLogin: 'https://eventosorganizador.com/login',
    headTitle: 'Organizador de Eventos',
    theme: {
      primaryColor: '#6096B9',
      secondaryColor: '#284C77',
      tertiaryColor: '#F4C02F',
      baseColor: '#F2F2F2',
      colorScroll: '#adb6ed',
    },
    timeZone: 'Europe/Madrid',
  },
  {
    name: 'vivetuboda',
    development: 'vivetuboda',
    cookie: 'sessionVivetuboda',
    cookieGuest: 'guestvivetuboda',
    domain: '.vivetuboda.com',
    pathDomain: 'https://vivetuboda.com',
    pathLogin: 'https://vivetuboda.com/login',
    pathDirectory: 'https://vivetuboda.com',
    headTitle: 'Organizador de Eventos',
    theme: {
      primaryColor: '#F4A4A4',
      secondaryColor: '#284C77',
      tertiaryColor: '#F4C02F',
      baseColor: '#F2F2F2',
      colorScroll: '#adb6ed',
    },
    metaPixel_id: '1104927187970356',
    timeZone: 'America/Mexico_City',
  },
  {
    name: 'champagne-events',
    development: 'champagne-events',
    cookie: 'sessionChampagne-events',
    cookieGuest: 'guestchampagne-events',
    domain: '.champagne-events.com.mx',
    pathDomain: 'https://www.champagne-events.com.mx/',
    pathLogin: 'https://www.champagne-events.com.mx/login',
    pathDirectory: 'https://champagne-events.com.mx',
    headTitle: 'App Champagne Event Planner',
    favicon: 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://champagne-events.com.mx/en/destination-weddings&size=16',
    theme: {
      primaryColor: '#ecb290',
      secondaryColor: '#d07a49',
      tertiaryColor: '#dadbdb',
      baseColor: '#fafae4',
    },
    timeZone: 'America/Mexico_City',
  },
  {
    name: 'annloevents',
    development: 'annloevents',
    cookie: 'sessionAnnloevents',
    cookieGuest: 'guestannloevents',
    domain: '.annloevents.com',
    pathDomain: 'https://annloevents.com',
    pathLogin: 'https://annloevents.com/login',
    headTitle: 'Annlo Events',
    theme: {
      primaryColor: '#b8a9c9',
      secondaryColor: '#622569',
      baseColor: '#F2F2F2',
    },
    timeZone: 'America/Mexico_City',
  },
  {
    name: 'miamorcitocorazon',
    development: 'miamorcitocorazon',
    cookie: 'sessionMiamorcitocorazon',
    cookieGuest: 'guestmiamorcitocorazon',
    domain: '.miamorcitocorazon.mx',
    pathDomain: 'https://miamorcitocorazon.mx',
    pathLogin: 'https://miamorcitocorazon.mx/login',
    headTitle: 'Mi Amorcito Corazón',
    theme: {
      primaryColor: '#e8a0bf',
      secondaryColor: '#ba90c6',
      tertiaryColor: '#c0dbdd',
      baseColor: '#F2F2F2',
    },
    timeZone: 'America/Mexico_City',
  },
  {
    name: 'eventosintegrados',
    development: 'eventosintegrados',
    cookie: 'sessionEventosintegrados',
    cookieGuest: 'guesteventosintegrados',
    domain: '.eventosintegrados.com',
    pathDomain: 'https://eventosintegrados.com',
    pathLogin: 'https://eventosintegrados.com/login',
    headTitle: 'Eventos Integrados',
    theme: {
      primaryColor: '#6771ae',
      secondaryColor: '#c589a9',
      tertiaryColor: '#b3dbb4',
      baseColor: '#F2F2F2',
      colorScroll: '#adb6ed',
    },
    timeZone: 'Europe/Madrid',
  },
  {
    name: 'ohmaratilano',
    development: 'ohmaratilano',
    cookie: 'sessionOhmaratilano',
    cookieGuest: 'guestohmaratilano',
    domain: '.ohmaratilano.com',
    pathDomain: 'https://ohmaratilano.com',
    pathLogin: 'https://ohmaratilano.com/login',
    headTitle: 'Oh Mara Tilano',
    theme: {
      primaryColor: '#c9a96e',
      secondaryColor: '#7a5c3a',
      baseColor: '#F2F2F2',
    },
    timeZone: 'America/Mexico_City',
  },
  {
    name: 'corporativozr',
    development: 'corporativozr',
    cookie: 'sessionCorporativozr',
    cookieGuest: 'guestcorporativozr',
    domain: '.corporativozr.com',
    pathDomain: 'https://corporativozr.com',
    pathLogin: 'https://corporativozr.com/login',
    headTitle: 'Corporativo ZR',
    theme: {
      primaryColor: '#2c3e50',
      secondaryColor: '#e74c3c',
      baseColor: '#F2F2F2',
    },
    timeZone: 'America/Mexico_City',
  },
  {
    name: 'theweddingplanner',
    development: 'theweddingplanner',
    cookie: 'sessionTheweddingplanner',
    cookieGuest: 'guesttheweddingplanner',
    domain: '.theweddingplanner.mx',
    pathDomain: 'https://theweddingplanner.mx',
    pathLogin: 'https://theweddingplanner.mx/login',
    headTitle: 'The Wedding Planner',
    theme: {
      primaryColor: '#d4a5a5',
      secondaryColor: '#9e7777',
      baseColor: '#F2F2F2',
    },
    timeZone: 'America/Mexico_City',
  },
];

/** Obtener config por nombre de development */
export const getDevelopmentConfig = (name: string): DevelopmentConfig | undefined =>
  developments.find(d => d.development === name);

/**
 * Devuelve true si el hostname es un dominio de producción "raíz" de algún tenant.
 * Producción = exactamente el dominio registrado o su variante www.
 * Cualquier otro subdominio (ch1.bodasdehoy.com, dev-pedro.vivetuboda.com...) es dev/test.
 */
function isProductionRootHostname(hostname: string): boolean {
  for (const d of developments) {
    const root = d.domain.replace(/^\./, ''); // ".bodasdehoy.com" → "bodasdehoy.com"
    if (hostname === root || hostname === `www.${root}`) return true;
  }
  return false;
}

/**
 * Detectar el development a partir del hostname.
 * Prioridad de override (de mayor a menor):
 *   1. NEXT_PUBLIC_DEV_WHITELABEL — env var en .env.local. Tiene prioridad absoluta
 *      cuando está definida. .env.local nunca se despliega a Vercel, así que es seguro
 *      sin gate de hostname. Funciona en localhost, chat-test, ch1, dev-pedro, etc.
 *   2. localStorage '__dev_domain' — override manual desde consola del navegador.
 *      Solo activo en entornos no-producción (subdominio o localhost).
 *   3. Detección automática por hostname.
 */
export const getDevelopmentNameFromHostname = (hostname: string): string => {
  const knownDevelopments = developments.map(d => d.development);

  // 1. Variable de entorno — prioridad absoluta si está definida.
  //    Funciona en SSR (getInitialProps) y cliente.
  //    Nunca llega a producción salvo que el desarrollador la defina explícitamente en Vercel.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envOverride: string = (globalThis as any).process?.env?.NEXT_PUBLIC_DEV_WHITELABEL ?? '';
  if (envOverride && knownDevelopments.includes(envOverride)) {
    return envOverride;
  }

  // 2. localStorage — solo si NO es un dominio raíz de producción.
  //    Cubre: localhost, chat-test.*, app-test.*, ch1.*, dev-pedro.*, cualquier subdominio.
  const isNonProductionHost =
    !hostname.includes('.') ||
    hostname.startsWith('localhost') ||
    !isProductionRootHostname(hostname);

  if (isNonProductionHost && typeof localStorage !== 'undefined') {
    const lsOverride = localStorage.getItem('__dev_domain');
    if (lsOverride && knownDevelopments.includes(lsOverride)) {
      return lsOverride;
    }
  }

  // 3. Detección automática por hostname
  const parts = hostname.split('.');
  const idx = parts.findIndex(p => p === 'com' || p === 'mx');
  if (idx > 0 && knownDevelopments.includes(parts[idx - 1])) {
    return parts[idx - 1];
  }

  // Detección por inclusión en el hostname (champagne-events.com.mx, subdominio custom)
  for (const dev of knownDevelopments) {
    if (hostname.includes(dev)) return dev;
  }

  return 'bodasdehoy'; // default
};

/** Obtener config completa a partir del hostname */
export const getDevelopmentByHostname = (hostname: string): DevelopmentConfig => {
  const name = getDevelopmentNameFromHostname(hostname);
  return getDevelopmentConfig(name) ?? developments[0];
};

export default developments;
