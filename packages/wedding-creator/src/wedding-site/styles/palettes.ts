/**
 * Wedding Site Palettes
 * =====================
 * 6 paletas predefinidas para webs de boda
 */

import type { Palette, PaletteType } from '../types';

export const PALETTES: Record<PaletteType, Palette> = {
  beach: {
    colors: {
      // Coral
accent: '#FFD166',      
      
// Arena dorada
background: '#FFFCF7',    
      

// Blanco arena
backgroundAlt: '#FFF8EE',       
      

primary: '#219EBC',   
      // Azul oceano
secondary: '#FF6B6B',
      text: '#264653',         // Azul oscuro
      textLight: '#5C7A86',
      textOnPrimary: '#FFFFFF'
    },
    fonts: {
      body: "'Open Sans', sans-serif",
      heading: "'Pacifico', cursive"
    },
    id: 'beach',
    name: 'Playa'
  },

  classic: {
    colors: {
      // Oro
accent: '#FFFFF0',      
      
// Marfil
background: '#FFFEF9',    
      

// Blanco marfil
backgroundAlt: '#FAF8F3',       
      

primary: '#1B365D',   
      // Azul marino
secondary: '#C5A572',
      text: '#1B365D',         // Azul marino
      textLight: '#5A6A7A',
      textOnPrimary: '#FFFFFF'
    },
    fonts: {
      body: "'Lora', serif",
      heading: "'Cinzel', serif"
    },
    id: 'classic',
    name: 'Clasico'
  },

  elegant: {
    colors: {
      // Dorado
accent: '#F5F0E6',      
      
// Crema
background: '#FEFDFB',    
      

// Blanco crema
backgroundAlt: '#F8F5EF',       
      

primary: '#2C2C2C',   
      // Negro elegante
secondary: '#C9A962',
      text: '#2C2C2C',         // Negro
      textLight: '#6B6B6B',
      textOnPrimary: '#FFFFFF'
    },
    fonts: {
      body: "'Montserrat', sans-serif",
      heading: "'Cormorant Garamond', serif"
    },
    id: 'elegant',
    name: 'Elegante'
  },

  modern: {
    colors: {
      // Rojo acento
accent: '#F1FAEE',      
      
// Verde muy claro
background: '#FFFFFF',    
      

// Blanco puro
backgroundAlt: '#F8F9FA',       
      

primary: '#1A1A1A',   
      // Negro moderno
secondary: '#E63946',
      text: '#1A1A1A',         // Negro
      textLight: '#6C757D',
      textOnPrimary: '#FFFFFF'
    },
    fonts: {
      body: "'Inter', sans-serif",
      heading: "'Bebas Neue', sans-serif"
    },
    id: 'modern',
    name: 'Moderno'
  },

  romantic: {
    colors: {
      // Rosa mas oscuro
accent: '#F5E6E8',      
      
// Rosa muy claro
background: '#FFFAFA',    
      

// Blanco rosado
backgroundAlt: '#FFF5F5',       
      

primary: '#E8B4BC',   
      // Rosa empolvado
secondary: '#D4A5AD',
      text: '#5D4E5D',         // Gris calido
      textLight: '#8B7B8B',
      textOnPrimary: '#FFFFFF'
    },
    fonts: {
      body: "'Lato', sans-serif",
      heading: "'Playfair Display', serif"
    },
    id: 'romantic',
    name: 'Romantico'
  },

  rustic: {
    colors: {
      // Marron
accent: '#FEFAE0',      
      
// Beige claro
background: '#FAF8F5',    
      

// Blanco calido
backgroundAlt: '#F5F0E8',       
      

primary: '#5F6F52',   
      // Verde oliva
secondary: '#8B7355',
      text: '#3D3D3D',         // Gris oscuro
      textLight: '#6B6B6B',
      textOnPrimary: '#FFFFFF'
    },
    fonts: {
      body: "'Source Sans Pro', sans-serif",
      heading: "'Amatic SC', cursive"
    },
    id: 'rustic',
    name: 'Rustico'
  }
};

/**
 * Obtener paleta por ID
 */
export function getPalette(id: PaletteType): Palette {
  return PALETTES[id] || PALETTES.romantic;
}

/**
 * Obtener todas las paletas como array
 */
export function getAllPalettes(): Palette[] {
  return Object.values(PALETTES);
}

/**
 * Generar CSS Variables desde una paleta
 */
export function paletteToCSS(palette: Palette, customColors?: Partial<Palette['colors']>): string {
  const colors = { ...palette.colors, ...customColors };

  return `
    --wedding-primary: ${colors.primary};
    --wedding-secondary: ${colors.secondary};
    --wedding-accent: ${colors.accent};
    --wedding-background: ${colors.background};
    --wedding-background-alt: ${colors.backgroundAlt};
    --wedding-text: ${colors.text};
    --wedding-text-light: ${colors.textLight};
    --wedding-text-on-primary: ${colors.textOnPrimary};
    --wedding-font-heading: ${palette.fonts.heading};
    --wedding-font-body: ${palette.fonts.body};
  `;
}
