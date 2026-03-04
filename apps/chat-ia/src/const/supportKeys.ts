/**
 * SupportKeys de API2 por developer
 * 
 * Estos tokens son necesarios para acceder a API2 sin autenticación
 * y obtener configuración pública (branding, modelos IA, storage).
 * 
 * Cada developer tiene su propio token único.
 * 
 * @see https://api2.eventosorganizador.com/graphql
 */

export const SUPPORT_KEYS: Record<string, string> = {
  'annloevents': 'SK-annloevents-bc71e2d9',
  'bodasdehoy': 'SK-bodasdehoy-a71f5b3c',
  'champagne-events': 'SK-champagne-events-d4c92a10',
  'corporativozr': 'SK-corporativozr-0f1e8c72',
  'eventosintegrados': 'SK-eventosintegrados-9184f2c0',
  'eventosorganizador': 'SK-eventosorganizador-6e38d7f4',
  'eventosplanificador': 'SK-eventosplanificador-ae273c81',
  'miamorcitocorazon': 'SK-miamorcitocorazon-4a7e1c9d',
  'ohmaratilano': 'SK-ohmaratilano-df63a0b5',
  'theweddingplanner': 'SK-theweddingplanner-5c9e41ad',
  'vivetuboda': 'SK-vivetuboda-5f92c1ab',
};

/**
 * Obtiene el supportKey para un development específico
 * @param development - Slug del developer (ej: "bodasdehoy")
 * @returns SupportKey correspondiente o el de bodasdehoy por defecto
 */
export const getSupportKey = (development: string): string => {
  return SUPPORT_KEYS[development] || SUPPORT_KEYS['bodasdehoy'];
};

