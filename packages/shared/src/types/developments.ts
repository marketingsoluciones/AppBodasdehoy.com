/**
 * Configuracion de developments (multi-tenant)
 *
 * FUENTE DE VERDAD para campos de identidad de cada whitelabel.
 * apps/web/firebase.js extiende esto con: fileConfig (Firebase), logoDirectory (React), navbarDirectory (React)
 * apps/copilot, apps/web y cualquier app del monorepo importan desde aquí.
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
  /** ID de Meta Pixel para analytics */
  metaPixel_id?: string;
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
 * Detectar el development a partir del hostname.
 * Soporta override via localStorage '__dev_domain' en localhost y subdominios de test.
 */
export const getDevelopmentNameFromHostname = (hostname: string): string => {
  const knownDevelopments = developments.map(d => d.development);

  // Override para localhost y test subdomains
  const isLocal = !hostname.includes('.') || hostname.startsWith('localhost');
  const isTest = hostname.includes('chat-test') || hostname.includes('app-test') || hostname.includes('test.');
  if ((isLocal || isTest) && typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('__dev_domain');
    if (override && knownDevelopments.includes(override)) {
      return override;
    }
  }

  // Detectar por posición en el dominio (ej: bodasdehoy.com → bodasdehoy)
  const parts = hostname.split('.');
  const idx = parts.findIndex(p => p === 'com' || p === 'mx');
  if (idx > 0 && knownDevelopments.includes(parts[idx - 1])) {
    return parts[idx - 1];
  }

  // Detectar por inclusion en el hostname (champagne-events.com.mx)
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
