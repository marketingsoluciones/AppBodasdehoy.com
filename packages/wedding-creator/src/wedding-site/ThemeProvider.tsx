'use client';

/**
 * Wedding Site ThemeProvider
 * ==========================
 * Aplica CSS Variables y carga fuentes dinamicamente
 */

import React, { useEffect, useMemo } from 'react';
import type { ThemeProviderProps, PaletteColors } from './types';
import { getPalette, paletteToCSS } from './styles/palettes';
import { getGoogleFontsUrl } from './styles/fonts';

export function ThemeProvider({
  palette,
  customColors,
  fonts,
  children,
}: ThemeProviderProps) {
  const paletteData = useMemo(() => getPalette(palette), [palette]);

  // CSS Variables
  const cssVariables = useMemo(() => {
    const merged: Partial<PaletteColors> = { ...customColors };
    return paletteToCSS(paletteData, merged);
  }, [paletteData, customColors]);

  // Custom fonts override
  const fontStyles = useMemo(() => {
    if (!fonts) return '';
    let styles = '';
    if (fonts.heading) {
      styles += `--wedding-font-heading: '${fonts.heading}', serif;`;
    }
    if (fonts.body) {
      styles += `--wedding-font-body: '${fonts.body}', sans-serif;`;
    }
    return styles;
  }, [fonts]);

  // Cargar Google Fonts dinamicamente
  useEffect(() => {
    const url = getGoogleFontsUrl(palette, fonts);
    if (!url) return;

    // Verificar si ya existe
    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (existingLink) return;

    // Crear link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.append(link);

    return () => {
      // Cleanup: no removemos porque otras instancias pueden necesitarla
    };
  }, [palette, fonts]);

  return (
    <div
      className="wedding-theme-root"
      style={{
        // @ts-ignore - CSS Variables
        ...Object.fromEntries(
          (cssVariables + fontStyles)
            .split(';')
            .filter(Boolean)
            .map((rule) => {
              const [key, value] = rule.split(':').map((s) => s.trim());
              return [key, value];
            })
        ),
      }}
    >
      <style global jsx>{`
        .wedding-theme-root {
          font-family: var(--wedding-font-body);
          color: var(--wedding-text);
          background-color: var(--wedding-background);
        }

        .wedding-theme-root h1,
        .wedding-theme-root h2,
        .wedding-theme-root h3,
        .wedding-theme-root h4,
        .wedding-theme-root h5,
        .wedding-theme-root h6 {
          font-family: var(--wedding-font-heading);
          color: var(--wedding-text);
        }

        .wedding-theme-root a {
          color: var(--wedding-primary);
        }

        .wedding-theme-root .btn-primary {
          background-color: var(--wedding-primary);
          color: var(--wedding-text-on-primary);
        }

        .wedding-theme-root .btn-secondary {
          background-color: var(--wedding-secondary);
          color: var(--wedding-text-on-primary);
        }

        .wedding-theme-root .bg-primary {
          background-color: var(--wedding-primary);
        }

        .wedding-theme-root .bg-secondary {
          background-color: var(--wedding-secondary);
        }

        .wedding-theme-root .bg-accent {
          background-color: var(--wedding-accent);
        }

        .wedding-theme-root .bg-alt {
          background-color: var(--wedding-background-alt);
        }

        .wedding-theme-root .text-primary {
          color: var(--wedding-primary);
        }

        .wedding-theme-root .text-secondary {
          color: var(--wedding-secondary);
        }

        .wedding-theme-root .text-light {
          color: var(--wedding-text-light);
        }
      `}</style>
      {children}
    </div>
  );
}

export default ThemeProvider;
