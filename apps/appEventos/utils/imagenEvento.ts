/**
 * Imagen alusiva por tipo de evento.
 *
 * Vivía dentro de `components/Home/Card.tsx`, que 11 ficheros importaban solo
 * para leer esta constante — arrastrando con ella todo el componente y
 * styled-jsx. Aquí es dato puro: se puede importar y testear sin montar React.
 * `Card` la sigue reexportando para no romper los imports existentes.
 */

import { normalizeTipoEvento } from './tipoEvento';

export const defaultImagenes = {
  boda: '/cards/boda.webp',
  comunión: '/cards/comunion.webp',
  cumpleaños: '/cards/cumpleanos.webp',
  bautizo: '/cards/bautizo.webp',
  babyshower: '/cards/baby.webp',
  'despedida de soltero': '/cards/despedida.webp',
  graduación: '/cards/graduacion.webp',
  // Sirve de imagen para el tipo 'otro' y de red de seguridad para el resto.
  otro: '/cards/pexels-pixabay-50675.jpg',
  // Tipos del enum EventoTipo que no tienen foto propia todavía.
  corporativo: '/cards/pexels-pixabay-50675.jpg',
  religioso: '/cards/pexels-pixabay-50675.jpg',
  social: '/cards/pexels-pixabay-50675.jpg',
};

/**
 * Imagen del tipo de evento. SIEMPRE devuelve una ruta válida.
 *
 * Usar esto en vez de `defaultImagenes[tipo?.toLowerCase()]` (QA 17-09): las
 * claves del mapa son las del select ('cumpleaños', 'graduación'), pero
 * `event.tipo` llega de api-mcp como enum ('CUMPLEANOS', 'GRADUACION'), así que
 * un `toLowerCase()` a secas solo acertaba con boda, bautizo y otro. Los demás
 * caían en la imagen genérica y, donde no había `|| defaultImagenes['otro']`,
 * se quedaban en `undefined` → imagen rota (tarjeta pública, itinerario
 * público, PDF del itinerario).
 */
export const getEventImage = (tipo?: string | null): string =>
  defaultImagenes[normalizeTipoEvento(tipo)] ?? defaultImagenes.otro;
