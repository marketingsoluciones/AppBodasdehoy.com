/**
 * Wedding Site Fonts Configuration
 * =================================
 * Google Fonts para cada paleta
 */

import type { PaletteType } from '../types';

// Mapeo de fuentes a URLs de Google Fonts
export const GOOGLE_FONTS: Record<string, string> = {
  'Amatic SC': 'Amatic+SC:wght@400;700',
  'Bebas Neue': 'Bebas+Neue',
  'Cinzel': 'Cinzel:wght@400;500;600;700',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@400;500;600;700',
  'Inter': 'Inter:wght@300;400;500;600;700',
  'Lato': 'Lato:wght@300;400;700',
  'Lora': 'Lora:wght@400;500;600;700',
  'Montserrat': 'Montserrat:wght@300;400;500;600',
  'Open Sans': 'Open+Sans:wght@300;400;600;700',
  'Pacifico': 'Pacifico',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
  'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600',
};

// Fuentes requeridas por cada paleta
export const PALETTE_FONTS: Record<PaletteType, string[]> = {
  beach: ['Pacifico', 'Open Sans'],
  classic: ['Cinzel', 'Lora'],
  elegant: ['Cormorant Garamond', 'Montserrat'],
  modern: ['Bebas Neue', 'Inter'],
  romantic: ['Playfair Display', 'Lato'],
  rustic: ['Amatic SC', 'Source Sans Pro'],
};

/**
 * Genera la URL de Google Fonts para una paleta
 */
export function getGoogleFontsUrl(palette: PaletteType, customFonts?: { body?: string, heading?: string; }): string {
  const fonts: string[] = [];

  if (customFonts?.heading && GOOGLE_FONTS[customFonts.heading]) {
    fonts.push(GOOGLE_FONTS[customFonts.heading]);
  }
  if (customFonts?.body && GOOGLE_FONTS[customFonts.body]) {
    fonts.push(GOOGLE_FONTS[customFonts.body]);
  }

  // Agregar fuentes de la paleta si no hay custom
  if (fonts.length === 0) {
    const paletteFonts = PALETTE_FONTS[palette] || [];
    for (const font of paletteFonts) {
      if (GOOGLE_FONTS[font]) {
        fonts.push(GOOGLE_FONTS[font]);
      }
    }
  }

  if (fonts.length === 0) return '';

  const familyParam = fonts.join('&family=');
  return `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`;
}

/**
 * Genera el tag <link> para precargar fuentes
 */
export function getFontPreloadLinks(palette: PaletteType): string {
  const url = getGoogleFontsUrl(palette);
  if (!url) return '';

  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${url}" rel="stylesheet">`;
}
