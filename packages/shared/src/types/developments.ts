/**
 * Configuracion de developments (multi-tenant)
 * Extraido de firebase.js de AppBodasdeHoy
 */

export interface DevelopmentConfig {
  development: string;
  cookie: string;
  domain: string;
  pathDirectory?: string;
  guestCookie?: string;
}

export const developments: DevelopmentConfig[] = [
  {
    development: 'bodasdehoy',
    cookie: 'sessionBodas',
    domain: '.bodasdehoy.com',
    guestCookie: 'guestbodas',
  },
  {
    development: 'eventosplanificador',
    cookie: 'sessionPlanificador',
    domain: '.eventosplanificador.com',
    guestCookie: 'guestplanificador',
  },
  {
    development: 'eventosorganizador',
    cookie: 'sessionOrganizador',
    domain: '.eventosorganizador.com',
    guestCookie: 'guestorganizador',
  },
  {
    development: 'vivetuboda',
    cookie: 'sessionVivetuboda',
    domain: '.vivetuboda.com',
    guestCookie: 'guestvivetuboda',
  },
  {
    development: 'champagne-events',
    cookie: 'sessionChampagne-events',
    domain: '.champagne-events.com.mx',
    guestCookie: 'guestchampagne-events',
  },
  {
    development: 'annloevents',
    cookie: 'sessionAnnloevents',
    domain: '.annloevents.com',
    guestCookie: 'guestannloevents',
  },
  {
    development: 'miamorcitocorazon',
    cookie: 'sessionMiamorcitocorazon',
    domain: '.miamorcitocorazon.mx',
    guestCookie: 'guestmiamorcitocorazon',
  },
  {
    development: 'eventosintegrados',
    cookie: 'sessionEventosintegrados',
    domain: '.eventosintegrados.com',
    guestCookie: 'guesteventosintegrados',
  },
  {
    development: 'ohmaratilano',
    cookie: 'sessionOhmaratilano',
    domain: '.ohmaratilano.com',
    guestCookie: 'guestohmaratilano',
  },
  {
    development: 'corporativozr',
    cookie: 'sessionCorporativozr',
    domain: '.corporativozr.com',
    guestCookie: 'guestcorporativozr',
  },
  {
    development: 'theweddingplanner',
    cookie: 'sessionTheweddingplanner',
    domain: '.theweddingplanner.mx',
    guestCookie: 'guesttheweddingplanner',
  },
];

/**
 * Obtener configuracion de development por nombre
 */
export const getDevelopmentConfig = (name: string): DevelopmentConfig | undefined => {
  return developments.find(d => d.development === name);
};

/**
 * Obtener configuracion de development por hostname
 */
export const getDevelopmentByHostname = (hostname: string): DevelopmentConfig | undefined => {
  for (const dev of developments) {
    if (hostname.includes(dev.development)) {
      return dev;
    }
  }
  // Default a bodasdehoy
  return developments[0];
};

export default developments;
